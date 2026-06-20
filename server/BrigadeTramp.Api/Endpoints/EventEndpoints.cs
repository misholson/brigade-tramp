using System.Security.Cryptography;
using BrigadeTramp.Api.Auth;
using BrigadeTramp.Api.Data;
using BrigadeTramp.Api.DTOs;
using BrigadeTramp.Api.Models;
using BrigadeTramp.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace BrigadeTramp.Api.Endpoints;

public static class EventEndpoints
{
    public static void MapEventEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/events").RequireAuthorization();

        group.MapGet("/", async (AppDbContext db, HttpContext ctx) =>
        {
            var isSiteAdmin = AuthHelpers.IsSiteAdmin(ctx.User);
            var userId = AuthHelpers.GetUserId(ctx.User);

            List<int> allowedEventIds = [];
            if (!isSiteAdmin && userId.HasValue)
            {
                allowedEventIds = await db.UserEventRoles
                    .Where(r => r.UserId == userId.Value)
                    .Select(r => r.EventId)
                    .Distinct()
                    .ToListAsync();
            }

            var events = await db.Events
                .Include(e => e.Singers)
                .OrderByDescending(e => e.Date)
                .ToListAsync();

            if (!isSiteAdmin)
                events = events.Where(e => allowedEventIds.Contains(e.Id)).ToList();

            return events.Select(e => new EventWithSingersDto(
                e.Id, e.Name, e.Date, e.EndDate, e.AllowBusyBee, e.EmailFooter,
                e.Singers
                    .OrderBy(s => s.BadgeName).ThenBy(s => s.LastName)
                    .Select(SingerEndpoints.ToDto)
                    .ToList()
            ));
        });

        group.MapPost("/", async (CreateEventDto dto, AppDbContext db, HttpContext ctx) =>
        {
            if (!AuthHelpers.IsSiteAdmin(ctx.User)) return Results.Forbid();

            var ev = new Event { Name = dto.Name, Date = dto.Date, EndDate = dto.EndDate, AllowBusyBee = dto.AllowBusyBee, EmailFooter = dto.EmailFooter };
            db.Events.Add(ev);
            await db.SaveChangesAsync();
            return Results.Created($"/api/events/{ev.Id}", new EventDto(ev.Id, ev.Name, ev.Date, ev.EndDate, ev.AllowBusyBee, ev.EmailFooter));
        });

        group.MapGet("/{id:int}/singers", async (int id, AppDbContext db, HttpContext ctx) =>
        {
            if (!AuthHelpers.CanViewEvent(ctx.User, id)) return Results.Forbid();
            var singers = await db.Singers
                .Where(s => s.EventId == id && s.Status != SingerStatus.Inactive)
                .OrderBy(s => s.BadgeName).ThenBy(s => s.LastName)
                .Select(s => new { s.Id, s.BadgeName, s.LastName, s.Email })
                .ToListAsync();
            return Results.Ok(singers);
        });

        group.MapPut("/{id:int}", async (int id, UpdateEventDto dto, AppDbContext db, HttpContext ctx) =>
        {
            if (!AuthHelpers.CanManageEvent(ctx.User, id)) return Results.Forbid();

            var ev = await db.Events.FindAsync(id);
            if (ev is null) return Results.NotFound();
            ev.Name = dto.Name;
            ev.Date = dto.Date;
            ev.EndDate = dto.EndDate;
            ev.AllowBusyBee = dto.AllowBusyBee;
            ev.EmailFooter = dto.EmailFooter;
            await db.SaveChangesAsync();
            return Results.Ok(new EventDto(ev.Id, ev.Name, ev.Date, ev.EndDate, ev.AllowBusyBee, ev.EmailFooter));
        });

        group.MapDelete("/{id:int}", async (int id, AppDbContext db, HttpContext ctx) =>
        {
            if (!AuthHelpers.IsSiteAdmin(ctx.User)) return Results.Forbid();

            var ev = await db.Events.FindAsync(id);
            if (ev is null) return Results.NotFound();
            db.Events.Remove(ev);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        group.MapPost("/{id:int}/send-emails", async (int id, SendSingerEmailsDto dto, AppDbContext db, HttpContext ctx, EmailService emailService) =>
        {
            if (!AuthHelpers.CanManageEvent(ctx.User, id) && !AuthHelpers.HasEventRole(ctx.User, id, EventRole.EventUser))
                return Results.Forbid();

            var ev = await db.Events.Include(e => e.Singers).FirstOrDefaultAsync(e => e.Id == id);
            if (ev is null) return Results.NotFound();

            IEnumerable<Singer> singers = dto.Singers switch
            {
                "ActiveOnly" => ev.Singers.Where(s => s.Status == SingerStatus.Active),
                "NonOptional" => ev.Singers.Where(s => s.Status != SingerStatus.Optional),
                _ => ev.Singers,
            };

            var addresses = singers
                .Select(s => s.Email)
                .Where(e => !string.IsNullOrWhiteSpace(e))
                .Distinct()
                .ToList();

            var subject = $"[{ev.Name}] {dto.Subject}";
            var body = string.IsNullOrWhiteSpace(ev.EmailFooter) ? dto.Body : $"{dto.Body}\n\n{ev.EmailFooter}";
            await emailService.SendBccAsync(addresses, subject, body, AuthHelpers.GetEmail(ctx.User));

            return Results.Ok();
        });

        group.MapPost("/{id:int}/singers", async (int id, AddSingerDto dto, AppDbContext db, HttpContext ctx) =>
        {
            if (!AuthHelpers.CanManageEvent(ctx.User, id)) return Results.Forbid();

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
