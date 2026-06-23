namespace BrigadeTramp.Api.DTOs;

public record ContestSingerDto(int Id, string BadgeName, string FirstName, string LastName, string Part);
public record ContestQuartetDto(int Id, string Name, decimal? Score, decimal? Score2, string? SongTitle, string? Song2Title, int SortOrder, int SortOrder2, List<ContestSingerDto> Singers);
public record ReorderContestDto(List<int> Ids);
public record SetQuartetNameDto(string Name);
public record ContestDto(int Id, string Name, int EventId, int? Round2Count, bool ShowToSingers, List<ContestQuartetDto> Quartets);
public record ContestsPageDto(string EventName, List<ContestDto> Contests, bool ShowScores);
public record CreateContestDto(string Name);
public record UpdateContestDto(string Name);
public record SetQuartetScoreDto(decimal? Score);
public record SetQuartetScore2Dto(decimal? Score2);
public record PrepareRound2Dto(int Count, bool AssignSongs);
public record SendEmailsDto(string Subject, string Body);
public record PublicQuartetSingerDto(string BadgeName, string LastName, string Part, string Email);
public record PublicQuartetDto(string Name, List<PublicQuartetSingerDto> Singers);
public record PublicContestDto(string Name, List<PublicQuartetDto> Quartets);
public record EmailMcDto(string? Email, int? SingerId, int Round = 1);
