namespace BrigadeTramp.Api.DTOs;

public record EventDto(int Id, string Name, DateOnly Date);
public record EventWithSingersDto(int Id, string Name, DateOnly Date, List<SingerDto> Singers);
public record CreateEventDto(string Name, DateOnly Date);
public record UpdateEventDto(string Name, DateOnly Date);
public record AddSingerDto(string BadgeName, string FirstName, string LastName, string Part, string Email = "", string Status = "Active");
public record UpdateSingerDto(string BadgeName, string FirstName, string LastName, string Part, string Email, string Status);
public record UpdateSingerStatusDto(string Status);
public record SetSongsDto(List<string> Titles);
