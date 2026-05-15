namespace BrigadeTramp.Api.DTOs;

public record ContestSingerDto(int Id, string BadgeName, string FirstName, string LastName, string Part);
public record ContestQuartetDto(int Id, string Name, decimal? Score, List<ContestSingerDto> Singers);
public record SetQuartetNameDto(string Name);
public record ContestDto(int Id, string Name, int EventId, List<ContestQuartetDto> Quartets);
public record ContestsPageDto(string EventName, List<ContestDto> Contests);
public record CreateContestDto(string Name);
public record UpdateContestDto(string Name);
public record SetQuartetScoreDto(decimal? Score);
