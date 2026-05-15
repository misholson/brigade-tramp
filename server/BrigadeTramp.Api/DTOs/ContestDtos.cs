namespace BrigadeTramp.Api.DTOs;

public record ContestSingerDto(int Id, string BadgeName, string FirstName, string LastName, string Part);
public record ContestQuartetDto(int Id, string Name, decimal? Score, decimal? Score2, List<ContestSingerDto> Singers);
public record SetQuartetNameDto(string Name);
public record ContestDto(int Id, string Name, int EventId, List<ContestQuartetDto> Quartets);
public record ContestsPageDto(string EventName, List<ContestDto> Contests);
public record CreateContestDto(string Name);
public record UpdateContestDto(string Name);
public record SetQuartetScoreDto(decimal? Score);
public record SetQuartetScore2Dto(decimal? Score2);
