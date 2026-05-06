using BrigadeTramp.Api.Data;
using BrigadeTramp.Api.DTOs;
using BrigadeTramp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BrigadeTramp.Api.Endpoints;

public static class SingerEndpoints
{
    static readonly string[] PartOrder = ["Tenor", "Lead", "Baritone", "Bass"];

    public static void MapSingerEndpoints(this WebApplication app)
    {
        app.MapGet("/api/singer/{code}", async (string code, AppDbContext db) =>
        {
            var singer = await db.Singers.FirstOrDefaultAsync(s => s.Code == code);
            if (singer is null) return Results.NotFound();

            var allSingers = await db.Singers
                .Where(s => s.EventId == singer.EventId && s.Status != SingerStatus.Inactive)
                .ToListAsync();

            allSingers = [.. allSingers
                .OrderBy(s => Array.IndexOf(PartOrder, s.Part.ToString()))
                .ThenBy(s => s.BadgeName)
                .ThenBy(s => s.LastName)];

            var sungWithIds = await db.SingerSungWiths
                .Where(sw => sw.SingerId == singer.Id)
                .Select(sw => sw.SungWithSingerId)
                .ToListAsync();

            return Results.Ok(new SingerDetailDto(
                ToDto(singer),
                allSingers.Select(ToDto).ToList(),
                sungWithIds
            ));
        });

        app.MapPost("/api/singer/{singerId:int}/sung-with/{otherId:int}", async (int singerId, int otherId, AppDbContext db) =>
        {
            var exists = await db.SingerSungWiths
                .AnyAsync(sw => sw.SingerId == singerId && sw.SungWithSingerId == otherId);
            if (!exists)
            {
                db.SingerSungWiths.Add(new SingerSungWith { SingerId = singerId, SungWithSingerId = otherId });
                await db.SaveChangesAsync();
            }
            return Results.Ok();
        });

        app.MapDelete("/api/singer/{singerId:int}/sung-with/{otherId:int}", async (int singerId, int otherId, AppDbContext db) =>
        {
            var row = await db.SingerSungWiths.FindAsync(singerId, otherId);
            if (row is not null)
            {
                db.SingerSungWiths.Remove(row);
                await db.SaveChangesAsync();
            }
            return Results.Ok();
        });

        app.MapPatch("/api/singers/{id:int}/status", async (int id, UpdateSingerStatusDto dto, AppDbContext db) =>
        {
            var singer = await db.Singers.FindAsync(id);
            if (singer is null) return Results.NotFound();
            if (!Enum.TryParse<SingerStatus>(dto.Status, ignoreCase: true, out var status))
                return Results.BadRequest("Invalid status. Use Active, Inactive, or Optional.");
            singer.Status = status;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();
    }

    public static SingerDto ToDto(Singer s) =>
        new(s.Id, s.BadgeName, s.FirstName, s.LastName, s.Part.ToString(), s.Code, s.Status.ToString());
}
