namespace BrigadeTramp.Api.Models;

public class Contest
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public int EventId { get; set; }
    public Event Event { get; set; } = null!;
    public List<ContestQuartet> Quartets { get; set; } = [];
    public int? Round2Count { get; set; }
    public bool ShowToSingers { get; set; } = true;
}
