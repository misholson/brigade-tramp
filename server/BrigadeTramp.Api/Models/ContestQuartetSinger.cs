namespace BrigadeTramp.Api.Models;

public class ContestQuartetSinger
{
    public int QuartetId { get; set; }
    public ContestQuartet Quartet { get; set; } = null!;
    public int SingerId { get; set; }
    public Singer Singer { get; set; } = null!;
}
