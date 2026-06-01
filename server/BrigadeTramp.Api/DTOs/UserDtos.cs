namespace BrigadeTramp.Api.DTOs;

public record UserListItemDto(int Id, string Email, string Name, bool IsSiteAdmin, List<EventRoleDto> EventRoles);
public record SetSiteAdminDto(bool IsSiteAdmin);
public record UpsertEventRoleDto(int UserId, int EventId, string Role);
public record UserSearchResultDto(int Id, string Email, string Name);
public record EventUserRoleItemDto(int UserId, string Email, string Name, string Role);
