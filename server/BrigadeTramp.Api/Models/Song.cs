namespace BrigadeTramp.Api.Models;

public class Song
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public Event Event { get; set; } = null!;
    public string Title { get; set; } = "";
    public int SortOrder { get; set; }
}
