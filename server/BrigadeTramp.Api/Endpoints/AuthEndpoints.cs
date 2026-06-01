using BrigadeTramp.Api.Auth;
using BrigadeTramp.Api.Data;
using BrigadeTramp.Api.DTOs;
using BrigadeTramp.Api.Models;
using BrigadeTramp.Api.Services;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;

namespace BrigadeTramp.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        app.MapPost("/api/auth/google", async (GoogleLoginDto dto, AppDbContext db, JwtService jwtService, IConfiguration config) =>
        {
            GoogleJsonWebSignature.Payload payload;
            try
            {
                var clientId = config["GoogleClientId"];
                var settings = string.IsNullOrEmpty(clientId)
                    ? new GoogleJsonWebSignature.ValidationSettings()
                    : new GoogleJsonWebSignature.ValidationSettings { Audience = [clientId] };
                payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, settings);
            }
            catch
            {
                return Results.Unauthorized();
            }

            var user = await db.Users
                .Include(u => u.EventRoles)
                .FirstOrDefaultAsync(u => u.Email == payload.Email);

            if (user is null)
            {
                user = new User { Email = payload.Email, Name = payload.Name ?? payload.Email };
                db.Users.Add(user);
                await db.SaveChangesAsync();
                await db.Entry(user).Collection(u => u.EventRoles).LoadAsync();
            }
            else if (user.Name != (payload.Name ?? payload.Email))
            {
                user.Name = payload.Name ?? payload.Email;
                await db.SaveChangesAsync();
            }

            var token = jwtService.GenerateToken(user);
            return Results.Ok(new AuthResultDto(token, jwtService.ToUserInfo(user)));
        });

        app.MapGet("/api/auth/me", async (HttpContext ctx, AppDbContext db, JwtService jwtService) =>
        {
            var userId = AuthHelpers.GetUserId(ctx.User);
            if (userId is null) return Results.Unauthorized();

            var user = await db.Users
                .Include(u => u.EventRoles)
                .FirstOrDefaultAsync(u => u.Id == userId);

            return user is null ? Results.NotFound() : Results.Ok(jwtService.ToUserInfo(user));
        }).RequireAuthorization();

        app.MapGet("/api/auth/my-events", async (HttpContext ctx, AppDbContext db) =>
        {
            var email = AuthHelpers.GetEmail(ctx.User);
            if (string.IsNullOrEmpty(email)) return Results.Unauthorized();

            var singers = await db.Singers
                .Include(s => s.Event)
                .Where(s => s.Email == email && s.Status != SingerStatus.Inactive)
                .ToListAsync();

            var userId = AuthHelpers.GetUserId(ctx.User);
            var eventRoleEventIds = userId.HasValue
                ? await db.UserEventRoles
                    .Where(r => r.UserId == userId.Value)
                    .Select(r => r.EventId)
                    .Distinct()
                    .ToListAsync()
                : [];

            var singerEventIds = singers.Select(s => s.EventId).ToHashSet();
            var allEventIds = singerEventIds.Union(eventRoleEventIds).ToList();

            var events = await db.Events
                .Where(e => allEventIds.Contains(e.Id))
                .ToListAsync();

            var result = events.Select(ev =>
            {
                var singer = singers.FirstOrDefault(s => s.EventId == ev.Id);
                return new MyEventDto(ev.Id, ev.Name, ev.Date.ToString("yyyy-MM-dd"),
                    ev.EndDate?.ToString("yyyy-MM-dd"), singer?.Code ?? "");
            }).ToList();

            return Results.Ok(result);
        }).RequireAuthorization();
    }
}
