namespace BrigadeTramp.Api.Models;

public class UserEventRole
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int EventId { get; set; }
    public Event Event { get; set; } = null!;
    public EventRole Role { get; set; }
}
