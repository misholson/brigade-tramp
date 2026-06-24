namespace BrigadeTramp.Api.Models;

public class Singer
{
    public int Id { get; set; }
    public string BadgeName { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public Part Part { get; set; }
    public int EventId { get; set; }
    public Event Event { get; set; } = null!;
    public string Code { get; set; } = "";
    public string Email { get; set; } = "";
    public SingerStatus Status { get; set; } = SingerStatus.Active;
    public DanceCardStatus DanceCardStatus { get; set; } = DanceCardStatus.Required;
    public ContestStatus ContestStatus { get; set; } = ContestStatus.Included;
}
