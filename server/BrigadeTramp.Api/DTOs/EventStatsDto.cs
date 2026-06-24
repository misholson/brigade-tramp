namespace BrigadeTramp.Api.DTOs;

public record AchieverDto(int SingerId, string BadgeName, string LastName, string Part);

public record PartProgressDto(string Part, double AverageProgress);

public record EventNumbersDto(
    int TotalSingers,
    int AppUsers,
    int TrampCount,
    List<PartProgressDto> PartProgress
);

public record EventStatsDto(
    string EventName,
    bool AllowBusyBee,
    List<AchieverDto> Tramps,
    List<AchieverDto> SuperTramps,
    List<AchieverDto> BusyBees,
    EventNumbersDto Numbers
);
