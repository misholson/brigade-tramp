using BrigadeTramp.Api.Data;
using BrigadeTramp.Api.DTOs;
using BrigadeTramp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BrigadeTramp.Api.Endpoints;

public static class ContestEndpoints
{
    static readonly string[] PartOrder = ["Tenor", "Lead", "Baritone", "Bass"];

    public static void MapContestEndpoints(this WebApplication app)
    {
        app.MapGet("/api/events/{id:int}/contests", async (int id, AppDbContext db) =>
        {
            var ev = await db.Events.FindAsync(id);
            if (ev is null) return Results.NotFound();

            var contests = await db.Contests
                .Where(c => c.EventId == id)
                .Include(c => c.Quartets)
                    .ThenInclude(q => q.SingerLinks)
                        .ThenInclude(sl => sl.Singer)
                .OrderBy(c => c.Id)
                .ToListAsync();

            return Results.Ok(new ContestsPageDto(ev.Name, contests.Select(ToDto).ToList()));
        }).RequireAuthorization();

        app.MapPost("/api/events/{id:int}/contests", async (int id, CreateContestDto dto, AppDbContext db) =>
        {
            var ev = await db.Events.FindAsync(id);
            if (ev is null) return Results.NotFound();

            var contest = new Contest { Name = dto.Name, EventId = id };
            db.Contests.Add(contest);
            await db.SaveChangesAsync();
            return Results.Created($"/api/contests/{contest.Id}", ToDto(contest));
        }).RequireAuthorization();

        app.MapPut("/api/contests/{id:int}", async (int id, UpdateContestDto dto, AppDbContext db) =>
        {
            var contest = await db.Contests.FindAsync(id);
            if (contest is null) return Results.NotFound();
            contest.Name = dto.Name;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();

        app.MapDelete("/api/contests/{id:int}", async (int id, AppDbContext db) =>
        {
            var contest = await db.Contests.FindAsync(id);
            if (contest is null) return Results.NotFound();
            db.Contests.Remove(contest);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization();

        app.MapPost("/api/contests/{id:int}/generate", async (int id, AppDbContext db) =>
        {
            var contest = await db.Contests
                .Include(c => c.Quartets).ThenInclude(q => q.SingerLinks)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (contest is null) return Results.NotFound();

            var singers = await db.Singers
                .Where(s => s.EventId == contest.EventId && s.Status != SingerStatus.Inactive && s.Status != SingerStatus.Optional)
                .ToListAsync();

            var byPart = Enum.GetValues<Part>()
                .ToDictionary(p => p, p => singers.Where(s => s.Part == p).OrderBy(_ => Random.Shared.Next()).ToList());

            var missingParts = byPart.Where(kv => kv.Value.Count == 0).Select(kv => kv.Key.ToString()).ToList();
            if (missingParts.Count > 0)
                return Results.BadRequest($"No singers for part(s): {string.Join(", ", missingParts)}.");

            int numQuartets = byPart.Values.Max(l => l.Count);

            db.ContestQuartets.RemoveRange(contest.Quartets);
            await db.SaveChangesAsync();

            var quartets = Enumerable.Range(0, numQuartets)
                .Select(_ => new ContestQuartet { ContestId = id })
                .ToList();
            db.ContestQuartets.AddRange(quartets);
            await db.SaveChangesAsync();

            var songTitles = await db.Songs
                .Where(s => s.EventId == contest.EventId)
                .OrderBy(s => s.SortOrder)
                .Select(s => s.Title)
                .ToListAsync();

            List<string> shuffled = [];
            for (int i = 0; i < quartets.Count; i++)
            {
                quartets[i].Name = $"Quartet {i + 1}";
                if (songTitles.Count > 0)
                {
                    if (i % songTitles.Count == 0)
                        shuffled = [.. songTitles.OrderBy(_ => Random.Shared.Next())];
                    quartets[i].SongTitle = shuffled[i % songTitles.Count];
                }
            }
            await db.SaveChangesAsync();

            var assignments = byPart.SelectMany(kv =>
                Enumerable.Range(0, numQuartets).Select(i => new ContestQuartetSinger
                {
                    QuartetId = quartets[i].Id,
                    SingerId = kv.Value[i % kv.Value.Count].Id,
                }));
            db.ContestQuartetSingers.AddRange(assignments);
            await db.SaveChangesAsync();

            var updated = await db.Contests
                .Include(c => c.Quartets).ThenInclude(q => q.SingerLinks).ThenInclude(sl => sl.Singer)
                .FirstAsync(c => c.Id == id);
            return Results.Ok(ToDto(updated));
        }).RequireAuthorization();

        app.MapPatch("/api/quartets/{id:int}/name", async (int id, SetQuartetNameDto dto, AppDbContext db) =>
        {
            var quartet = await db.ContestQuartets.FindAsync(id);
            if (quartet is null) return Results.NotFound();
            quartet.Name = dto.Name;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();

        app.MapPatch("/api/quartets/{id:int}/score", async (int id, SetQuartetScoreDto dto, AppDbContext db) =>
        {
            var quartet = await db.ContestQuartets.FindAsync(id);
            if (quartet is null) return Results.NotFound();
            quartet.Score = dto.Score;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();

        app.MapPatch("/api/quartets/{id:int}/score2", async (int id, SetQuartetScore2Dto dto, AppDbContext db) =>
        {
            var quartet = await db.ContestQuartets.FindAsync(id);
            if (quartet is null) return Results.NotFound();
            quartet.Score2 = dto.Score2;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();
    }

    static ContestDto ToDto(Contest c) => new(
        c.Id, c.Name, c.EventId,
        c.Quartets
            .Select(q => new ContestQuartetDto(
                q.Id, q.Name, q.Score, q.Score2, q.SongTitle,
                q.SingerLinks
                    .Select(sl => new ContestSingerDto(
                        sl.Singer.Id, sl.Singer.BadgeName, sl.Singer.FirstName, sl.Singer.LastName, sl.Singer.Part.ToString()))
                    .OrderBy(s => Array.IndexOf(PartOrder, s.Part))
                    .ToList()))
            .ToList()
    );
}
