using System.Security.Claims;
using System.Text.Json;
using BrigadeTramp.Api.DTOs;
using BrigadeTramp.Api.Models;

namespace BrigadeTramp.Api.Auth;

public static class AuthHelpers
{
    public static int? GetUserId(ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub");
        return int.TryParse(sub, out var id) ? id : null;
    }

    public static string? GetEmail(ClaimsPrincipal user) =>
        user.FindFirstValue("email");

    public static bool IsSiteAdmin(ClaimsPrincipal user) =>
        user.FindFirstValue("is_site_admin") == "true";

    static List<EventRoleDto> GetEventRoles(ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue("event_roles");
        if (string.IsNullOrEmpty(raw)) return [];
        try { return JsonSerializer.Deserialize<List<EventRoleDto>>(raw) ?? []; }
        catch { return []; }
    }

    public static bool HasEventRole(ClaimsPrincipal user, int eventId, EventRole role) =>
        GetEventRoles(user).Any(r => r.EventId == eventId && r.Role == role.ToString());

    public static bool CanManageEvent(ClaimsPrincipal user, int eventId) =>
        IsSiteAdmin(user) || HasEventRole(user, eventId, EventRole.EventAdmin);

    public static bool CanViewEvent(ClaimsPrincipal user, int eventId) =>
        IsSiteAdmin(user)
        || HasEventRole(user, eventId, EventRole.EventAdmin)
        || HasEventRole(user, eventId, EventRole.EventUser)
        || HasEventRole(user, eventId, EventRole.ContestAdmin);

    public static bool CanManageContest(ClaimsPrincipal user, int eventId) =>
        IsSiteAdmin(user) || HasEventRole(user, eventId, EventRole.ContestAdmin);

    public static bool CanManageEventRoles(ClaimsPrincipal user, int eventId) =>
        IsSiteAdmin(user) || HasEventRole(user, eventId, EventRole.EventAdmin);
}
