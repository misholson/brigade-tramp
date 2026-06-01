namespace BrigadeTramp.Api.DTOs;

public record GoogleLoginDto(string IdToken);
public record AuthResultDto(string Token, UserInfoDto User);
public record UserInfoDto(int Id, string Email, string Name, bool IsSiteAdmin, List<EventRoleDto> EventRoles);
public record EventRoleDto(int EventId, string Role);
public record MyEventDto(int EventId, string EventName, string Date, string? EndDate, string SingerCode);
