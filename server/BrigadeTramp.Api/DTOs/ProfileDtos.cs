namespace BrigadeTramp.Api.DTOs;

public record SingerProfileDto(string? PhotoUrl, bool ShowEmail);
public record UpdateProfileDto(bool ShowEmail);
