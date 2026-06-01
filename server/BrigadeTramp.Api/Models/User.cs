namespace BrigadeTramp.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string Name { get; set; } = "";
    public bool IsSiteAdmin { get; set; }
    public ICollection<UserEventRole> EventRoles { get; set; } = [];
}
