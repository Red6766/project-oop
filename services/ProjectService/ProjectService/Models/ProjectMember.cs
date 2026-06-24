namespace ProjectService.Models;

public class ProjectMember
{
    public int ProjectId { get; set; }
    public int UserId { get; set; }
    public string Role { get; set; } = "member";
    public Project Project { get; set; } = null!;
}
