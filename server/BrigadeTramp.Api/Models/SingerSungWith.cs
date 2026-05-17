namespace BrigadeTramp.Api.Models;

public class SingerSungWith
{
    public int SingerId { get; set; }
    public int SungWithSingerId { get; set; }
    public int Count { get; set; } = 1;
}
