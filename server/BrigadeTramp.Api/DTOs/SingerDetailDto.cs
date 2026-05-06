namespace BrigadeTramp.Api.DTOs;

public record SingerDetailDto(SingerDto Singer, List<SingerDto> AllSingers, List<int> SungWithIds);
