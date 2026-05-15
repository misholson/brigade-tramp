namespace BrigadeTramp.Api.Models;

public class ContestQuartet
{
    public int Id { get; set; }
    public int ContestId { get; set; }
    public Contest Contest { get; set; } = null!;
    public string Name { get; set; } = "";
    public decimal? Score { get; set; }
    public decimal? Score2 { get; set; }
    public string? SongTitle { get; set; }
    public List<ContestQuartetSinger> SingerLinks { get; set; } = [];
}
