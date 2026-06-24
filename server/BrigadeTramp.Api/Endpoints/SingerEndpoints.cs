using BrigadeTramp.Api.Auth;
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
                .Where(s => s.EventId == singer.EventId && s.DanceCardStatus != DanceCardStatus.Hidden)
                .ToListAsync();

            allSingers = [.. allSingers
                .OrderBy(s => Array.IndexOf(PartOrder, s.Part.ToString()))
                .ThenBy(s => s.BadgeName)
                .ThenBy(s => s.LastName)];

            var sungWithRows = await db.SingerSungWiths
                .Where(sw => sw.SingerId == singer.Id)
                .ToListAsync();

            var sungWithIds = sungWithRows.Select(sw => sw.SungWithSingerId).ToList();
            var sungWithTwiceIds = sungWithRows.Where(sw => sw.Count >= 2).Select(sw => sw.SungWithSingerId).ToList();

            var ev = await db.Events.FindAsync(singer.EventId);

            return Results.Ok(new SingerDetailDto(
                ToDto(singer),
                allSingers.Select(ToDto).ToList(),
                sungWithIds,
                ev?.AllowBusyBee ?? false,
                sungWithTwiceIds,
                singer.EventId
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

        app.MapPost("/api/singer/{singerId:int}/sung-with-twice/{otherId:int}", async (int singerId, int otherId, AppDbContext db) =>
        {
            var row = await db.SingerSungWiths.FindAsync(singerId, otherId);
            if (row is null)
            {
                db.SingerSungWiths.Add(new SingerSungWith { SingerId = singerId, SungWithSingerId = otherId, Count = 2 });
            }
            else
            {
                row.Count = 2;
            }
            await db.SaveChangesAsync();
            return Results.Ok();
        });

        app.MapDelete("/api/singer/{singerId:int}/sung-with-twice/{otherId:int}", async (int singerId, int otherId, AppDbContext db) =>
        {
            var row = await db.SingerSungWiths.FindAsync(singerId, otherId);
            if (row is not null && row.Count >= 2)
            {
                row.Count = 1;
                await db.SaveChangesAsync();
            }
            return Results.Ok();
        });

        app.MapPut("/api/singers/{id:int}", async (int id, UpdateSingerDto dto, AppDbContext db, HttpContext ctx) =>
        {
            var singer = await db.Singers.FindAsync(id);
            if (singer is null) return Results.NotFound();
            if (!AuthHelpers.CanManageEvent(ctx.User, singer.EventId)) return Results.Forbid();
            if (!Enum.TryParse<Part>(dto.Part, ignoreCase: true, out var part))
                return Results.BadRequest("Invalid part. Use Tenor, Lead, Baritone, or Bass.");
            if (!Enum.TryParse<DanceCardStatus>(dto.DanceCardStatus, ignoreCase: true, out var danceCardStatus))
                return Results.BadRequest("Invalid dance card status. Use Required, Optional, or Hidden.");
            if (!Enum.TryParse<ContestStatus>(dto.ContestStatus, ignoreCase: true, out var contestStatus))
                return Results.BadRequest("Invalid contest status. Use Included, Once, or None.");
            singer.BadgeName = dto.BadgeName;
            singer.FirstName = dto.FirstName;
            singer.LastName = dto.LastName;
            singer.Part = part;
            singer.Email = dto.Email;
            singer.DanceCardStatus = danceCardStatus;
            singer.ContestStatus = contestStatus;
            await db.SaveChangesAsync();
            return Results.Ok(ToDto(singer));
        }).RequireAuthorization();

        app.MapPatch("/api/singers/{id:int}/status", async (int id, UpdateSingerStatusDto dto, AppDbContext db, HttpContext ctx) =>
        {
            var singer = await db.Singers.FindAsync(id);
            if (singer is null) return Results.NotFound();
            if (!AuthHelpers.CanManageEvent(ctx.User, singer.EventId)) return Results.Forbid();
            if (!Enum.TryParse<SingerStatus>(dto.Status, ignoreCase: true, out var status))
                return Results.BadRequest("Invalid status. Use Active, Inactive, or Optional.");
            singer.Status = status;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();
    }

    public static SingerDto ToDto(Singer s) =>
        new(s.Id, s.BadgeName, s.FirstName, s.LastName, s.Part.ToString(), s.Code, s.Email, s.DanceCardStatus.ToString(), s.ContestStatus.ToString());
}
