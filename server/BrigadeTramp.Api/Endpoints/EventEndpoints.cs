using System.Security.Cryptography;
using BrigadeTramp.Api.Data;
using BrigadeTramp.Api.DTOs;
using BrigadeTramp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BrigadeTramp.Api.Endpoints;

public static class EventEndpoints
{
    public static void MapEventEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/events").RequireAuthorization();

        group.MapGet("/", async (AppDbContext db) =>
        {
            var events = await db.Events
                .Include(e => e.Singers)
                .OrderByDescending(e => e.Date)
                .ToListAsync();

            return events.Select(e => new EventWithSingersDto(
                e.Id, e.Name, e.Date, e.AllowBusyBee,
                e.Singers
                    .OrderBy(s => s.BadgeName).ThenBy(s => s.LastName)
                    .Select(SingerEndpoints.ToDto)
                    .ToList()
            ));
        });

        group.MapPost("/", async (CreateEventDto dto, AppDbContext db) =>
        {
            var ev = new Event { Name = dto.Name, Date = dto.Date, AllowBusyBee = dto.AllowBusyBee };
            db.Events.Add(ev);
            await db.SaveChangesAsync();
            return Results.Created($"/api/events/{ev.Id}", new EventDto(ev.Id, ev.Name, ev.Date, ev.AllowBusyBee));
        });

        group.MapPut("/{id:int}", async (int id, UpdateEventDto dto, AppDbContext db) =>
        {
            var ev = await db.Events.FindAsync(id);
            if (ev is null) return Results.NotFound();
            ev.Name = dto.Name;
            ev.Date = dto.Date;
            ev.AllowBusyBee = dto.AllowBusyBee;
            await db.SaveChangesAsync();
            return Results.Ok(new EventDto(ev.Id, ev.Name, ev.Date, ev.AllowBusyBee));
        });

        group.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var ev = await db.Events.FindAsync(id);
            if (ev is null) return Results.NotFound();
            db.Events.Remove(ev);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        group.MapPost("/{id:int}/singers", async (int id, AddSingerDto dto, AppDbContext db) =>
        {
            var ev = await db.Events.FindAsync(id);
            if (ev is null) return Results.NotFound();

            if (!Enum.TryParse<Part>(dto.Part, ignoreCase: true, out var part))
                return Results.BadRequest("Invalid part. Use Tenor, Lead, Baritone, or Bass.");

            var status = Enum.TryParse<SingerStatus>(dto.Status, ignoreCase: true, out var parsedStatus)
                ? parsedStatus : SingerStatus.Active;

            var singer = new Singer
            {
                BadgeName = dto.BadgeName,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Part = part,
                Email = dto.Email,
                EventId = id,
                Status = status,
                Code = await GenerateUniqueCodeAsync(db),
            };

            db.Singers.Add(singer);
            await db.SaveChangesAsync();
            return Results.Created($"/api/singer/{singer.Code}", SingerEndpoints.ToDto(singer));
        });
    }

    static async Task<string> GenerateUniqueCodeAsync(AppDbContext db)
    {
        while (true)
        {
            var code = new string(RandomNumberGenerator.GetItems("abcdefghijklmnopqrstuvwxyz0123456789".AsSpan(), 8));
            if (!await db.Singers.AnyAsync(s => s.Code == code))
                return code;
        }
    }
}
