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
    public string? Song2Title { get; set; }
    public int SortOrder { get; set; }
    public int SortOrder2 { get; set; }
    public List<ContestQuartetSinger> SingerLinks { get; set; } = [];
}
