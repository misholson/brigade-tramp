namespace BrigadeTramp.Api.Models;

public class Event
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public DateOnly Date { get; set; }
    public bool AllowBusyBee { get; set; }
    public ICollection<Singer> Singers { get; set; } = [];
}
