using BrigadeTramp.Api.Data;
using BrigadeTramp.Api.DTOs;
using BrigadeTramp.Api.Models;
using BrigadeTramp.Api.Services;
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

            // Create a second shuffled list of singers to accomodate the second quartet if someone needs to be in more
            // than one.
            var byPart2 = Enum.GetValues<Part>()
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
                quartets[i].SortOrder = i;
                if (songTitles.Count > 0)
                {
                    if (i % songTitles.Count == 0)
                        shuffled = [.. songTitles.OrderBy(_ => Random.Shared.Next())];
                    quartets[i].SongTitle = shuffled[i % songTitles.Count];
                }
            }
            await db.SaveChangesAsync();

            var assignments = byPart.SelectMany(kv =>
                Enumerable.Range(0, numQuartets).Select(i => {
                    List<Singer> partSingers = kv.Value;
                    if (i >= partSingers.Count)
                    {
                        // If there are more quartets than singers in this part,
                        // go to the second shuffled list of singers.
                        partSingers = byPart2[kv.Key];
                    }
                    return new ContestQuartetSinger
                    {
                        QuartetId = quartets[i].Id,
                        SingerId = partSingers[i % partSingers.Count].Id,
                    };
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

        app.MapPost("/api/contests/{id:int}/prepare-round2", async (int id, PrepareRound2Dto dto, AppDbContext db) =>
        {
            var contest = await db.Contests
                .Include(c => c.Quartets)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (contest is null) return Results.NotFound();

            contest.Round2Count = dto.Count;

            if (dto.AssignSongs)
            {
                var songTitles = await db.Songs
                    .Where(s => s.EventId == contest.EventId)
                    .OrderBy(s => s.SortOrder)
                    .Select(s => s.Title)
                    .ToListAsync();

                var topQuartets = contest.Quartets
                    .Where(q => q.Score.HasValue)
                    .OrderByDescending(q => q.Score)
                    .Take(dto.Count)
                    .ToList();

                if (songTitles.Count > 0)
                {
                    List<string> shuffled = [];
                    for (int i = 0; i < topQuartets.Count; i++)
                    {
                        if (i % songTitles.Count == 0)
                            shuffled = [.. songTitles.OrderBy(_ => Random.Shared.Next())];
                        topQuartets[i].Song2Title = shuffled[i % songTitles.Count];
                    }
                }
            }
            else
            {
                foreach (var q in contest.Quartets)
                    q.Song2Title = null;
            }

            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();

        app.MapPost("/api/contests/{id:int}/reorder", async (int id, ReorderContestDto dto, AppDbContext db) =>
        {
            var quartets = await db.ContestQuartets.Where(q => q.ContestId == id).ToListAsync();
            for (int i = 0; i < dto.Ids.Count; i++)
            {
                var quartet = quartets.FirstOrDefault(q => q.Id == dto.Ids[i]);
                if (quartet is not null) quartet.SortOrder = i;
            }
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();

        app.MapPost("/api/contests/{id:int}/reorder2", async (int id, ReorderContestDto dto, AppDbContext db) =>
        {
            var quartets = await db.ContestQuartets.Where(q => q.ContestId == id).ToListAsync();
            foreach (var quartet in quartets) quartet.SortOrder2 = 0;
            for (int i = 0; i < dto.Ids.Count; i++)
            {
                var quartet = quartets.FirstOrDefault(q => q.Id == dto.Ids[i]);
                if (quartet is not null) quartet.SortOrder2 = i + 1;
            }
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();

        app.MapPost("/api/contests/{id:int}/send-emails", async (int id, SendEmailsDto dto, AppDbContext db, EmailService emailService) =>
        {
            var contest = await db.Contests
                .Include(c => c.Quartets)
                    .ThenInclude(q => q.SingerLinks)
                        .ThenInclude(sl => sl.Singer)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (contest is null) return Results.NotFound();

            var ev = await db.Events.FindAsync(contest.EventId);
            if (ev is null) return Results.NotFound();

            foreach (var quartet in contest.Quartets)
            {
                var singersByPart = quartet.SingerLinks
                    .GroupBy(sl => sl.Singer.Part)
                    .ToDictionary(g => g.Key, g => g.First().Singer);

                string Interpolate(string template) => template
                    .Replace("{{event}}", ev.Name)
                    .Replace("{{contest}}", contest.Name)
                    .Replace("{{quartet}}", quartet.Name)
                    .Replace("{{tenor}}", singersByPart.TryGetValue(Part.Tenor, out var t) ? $"{t.BadgeName} {t.LastName}" : "")
                    .Replace("{{tenorEmail}}", singersByPart.TryGetValue(Part.Tenor, out var te) ? te.Email : "")
                    .Replace("{{lead}}", singersByPart.TryGetValue(Part.Lead, out var l) ? $"{l.BadgeName} {l.LastName}" : "")
                    .Replace("{{leadEmail}}", singersByPart.TryGetValue(Part.Lead, out var le) ? le.Email : "")
                    .Replace("{{baritone}}", singersByPart.TryGetValue(Part.Baritone, out var b) ? $"{b.BadgeName} {b.LastName}" : "")
                    .Replace("{{baritoneEmail}}", singersByPart.TryGetValue(Part.Baritone, out var be) ? be.Email : "")
                    .Replace("{{bass}}", singersByPart.TryGetValue(Part.Bass, out var bs) ? $"{bs.BadgeName} {bs.LastName}" : "")
                    .Replace("{{bassEmail}}", singersByPart.TryGetValue(Part.Bass, out var bse) ? bse.Email : "");

                var addresses = quartet.SingerLinks
                    .Select(sl => sl.Singer.Email)
                    .Where(e => !string.IsNullOrWhiteSpace(e))
                    .ToList();
                var body = string.IsNullOrWhiteSpace(ev.EmailFooter)
                    ? Interpolate(dto.Body)
                    : $"{Interpolate(dto.Body)}\n\n{ev.EmailFooter}";
                await emailService.SendAsync(addresses, Interpolate(dto.Subject), body);
            }

            return Results.Ok();
        }).RequireAuthorization();

        app.MapGet("/api/singer/{code}/contests", async (string code, AppDbContext db) =>
        {
            var singer = await db.Singers.FirstOrDefaultAsync(s => s.Code == code);
            if (singer is null) return Results.NotFound();

            var contests = await db.Contests
                .Where(c => c.EventId == singer.EventId)
                .Include(c => c.Quartets)
                    .ThenInclude(q => q.SingerLinks)
                        .ThenInclude(sl => sl.Singer)
                .OrderBy(c => c.Id)
                .ToListAsync();

            var result = contests
                .Select(c => new PublicContestDto(
                    c.Name,
                    c.Quartets
                        .Where(q => q.SingerLinks.Any(sl => sl.SingerId == singer.Id))
                        .Select(q => new PublicQuartetDto(
                            q.Name,
                            q.SingerLinks
                                .Select(sl => new PublicQuartetSingerDto(
                                    sl.Singer.BadgeName,
                                    sl.Singer.LastName,
                                    sl.Singer.Part.ToString(),
                                    sl.Singer.Email))
                                .OrderBy(s => Array.IndexOf(PartOrder, s.Part))
                                .ToList()))
                        .ToList()))
                .Where(c => c.Quartets.Count > 0)
                .ToList();

            return Results.Ok(result);
        });
    }

    static ContestDto ToDto(Contest c) => new(
        c.Id, c.Name, c.EventId, c.Round2Count,
        c.Quartets
            .OrderBy(q => q.SortOrder)
            .Select(q => new ContestQuartetDto(
                q.Id, q.Name, q.Score, q.Score2, q.SongTitle, q.Song2Title, q.SortOrder2,
                q.SingerLinks
                    .Select(sl => new ContestSingerDto(
                        sl.Singer.Id, sl.Singer.BadgeName, sl.Singer.FirstName, sl.Singer.LastName, sl.Singer.Part.ToString()))
                    .OrderBy(s => Array.IndexOf(PartOrder, s.Part))
                    .ToList()))
            .ToList()
    );
}
