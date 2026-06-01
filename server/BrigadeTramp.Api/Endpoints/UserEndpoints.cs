using System.Security.Claims;
using BrigadeTramp.Api.Auth;
using BrigadeTramp.Api.Data;
using BrigadeTramp.Api.DTOs;
using BrigadeTramp.Api.Models;
using BrigadeTramp.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace BrigadeTramp.Api.Endpoints;

public static class UserEndpoints
{
    public static void MapUserEndpoints(this WebApplication app)
    {
        app.MapGet("/api/users", async (AppDbContext db, HttpContext ctx) =>
        {
            if (!AuthHelpers.IsSiteAdmin(ctx.User)) return Results.Forbid();

            var users = await db.Users
                .Include(u => u.EventRoles)
                .OrderBy(u => u.Name)
                .ToListAsync();

            return Results.Ok(users.Select(u => new UserListItemDto(
                u.Id, u.Email, u.Name, u.IsSiteAdmin,
                u.EventRoles.Select(r => new EventRoleDto(r.EventId, r.Role.ToString())).ToList()
            )));
        }).RequireAuthorization();

        app.MapGet("/api/users/search", async (string? email, AppDbContext db, HttpContext ctx) =>
        {
            if (!AuthHelpers.IsSiteAdmin(ctx.User) && !HasAnyEventAdminRole(ctx.User))
                return Results.Forbid();

            if (string.IsNullOrEmpty(email)) return Results.Ok(Array.Empty<UserSearchResultDto>());

            var users = await db.Users
                .Where(u => u.Email.Contains(email))
                .Take(10)
                .Select(u => new UserSearchResultDto(u.Id, u.Email, u.Name))
                .ToListAsync();

            return Results.Ok(users);
        }).RequireAuthorization();

        app.MapPut("/api/users/{id:int}/site-admin", async (int id, SetSiteAdminDto dto, AppDbContext db, HttpContext ctx) =>
        {
            if (!AuthHelpers.IsSiteAdmin(ctx.User)) return Results.Forbid();

            var user = await db.Users.FindAsync(id);
            if (user is null) return Results.NotFound();

            user.IsSiteAdmin = dto.IsSiteAdmin;
            await db.SaveChangesAsync();
            return Results.Ok();
        }).RequireAuthorization();

        app.MapPost("/api/users/event-roles", async (UpsertEventRoleDto dto, AppDbContext db, HttpContext ctx) =>
        {
            if (!AuthHelpers.CanManageEventRoles(ctx.User, dto.EventId)) return Results.Forbid();

            if (!Enum.TryParse<EventRole>(dto.Role, ignoreCase: true, out var role))
                return Results.BadRequest("Invalid role.");

            var exists = await db.UserEventRoles
                .AnyAsync(r => r.UserId == dto.UserId && r.EventId == dto.EventId && r.Role == role);
            if (!exists)
            {
                db.UserEventRoles.Add(new UserEventRole
                {
                    UserId = dto.UserId,
                    EventId = dto.EventId,
                    Role = role,
                });
                await db.SaveChangesAsync();
            }
            return Results.Ok();
        }).RequireAuthorization();

        app.MapGet("/api/events/{id:int}/users", async (int id, AppDbContext db, HttpContext ctx) =>
        {
            if (!AuthHelpers.CanManageEventRoles(ctx.User, id)) return Results.Forbid();

            var roles = await db.UserEventRoles
                .Where(r => r.EventId == id)
                .Include(r => r.User)
                .Select(r => new EventUserRoleItemDto(r.UserId, r.User.Email, r.User.Name, r.Role.ToString()))
                .ToListAsync();

            return Results.Ok(roles);
        }).RequireAuthorization();

        app.MapPost("/api/events/{id:int}/send-role-email", async (int id, SendRoleEmailDto dto, AppDbContext db, HttpContext ctx, EmailService email, IConfiguration config) =>
        {
            if (!AuthHelpers.CanManageEventRoles(ctx.User, id)) return Results.Forbid();

            var ev = await db.Events.FindAsync(id);
            if (ev is null) return Results.NotFound();

            var baseUrl = config["BaseUrl"] ?? "https://brigadetramp.com";
            var isExistingUser = await db.Users.AnyAsync(u => u.Email == dto.Email);

            string subject, body;
            if (isExistingUser)
            {
                subject = $"You've been added to {ev.Name} on Brigade Tramp";
                body = $"You've been granted the {dto.Role} role for {ev.Name}.\n\nLog in at {baseUrl}/login to access the event.";
            }
            else
            {
                subject = $"Invitation to {ev.Name} on Brigade Tramp";
                body = $"You've been invited to join {ev.Name} on Brigade Tramp.\n\nSign in with your Google account at {baseUrl}/login to get started.";
            }

            try
            {
                await email.SendAsync([dto.Email], subject, body);
            }
            catch
            {
                return Results.Problem("Failed to send email. Check that ACS is configured on the server.");
            }

            return Results.Ok();
        }).RequireAuthorization();

        app.MapDelete("/api/users/event-roles", async ([Microsoft.AspNetCore.Mvc.FromBody] UpsertEventRoleDto dto, AppDbContext db, HttpContext ctx) =>
        {
            if (!AuthHelpers.CanManageEventRoles(ctx.User, dto.EventId)) return Results.Forbid();

            if (!Enum.TryParse<EventRole>(dto.Role, ignoreCase: true, out var role))
                return Results.BadRequest("Invalid role.");

            var row = await db.UserEventRoles
                .FirstOrDefaultAsync(r => r.UserId == dto.UserId && r.EventId == dto.EventId && r.Role == role);
            if (row is not null)
            {
                db.UserEventRoles.Remove(row);
                await db.SaveChangesAsync();
            }
            return Results.Ok();
        }).RequireAuthorization();
    }

    static bool HasAnyEventAdminRole(System.Security.Claims.ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue("event_roles");
        if (string.IsNullOrEmpty(raw)) return false;
        return raw.Contains("EventAdmin");
    }
}
