namespace TaskManagement.Models
{
    public class ProjectUser
    {
        public int ProjectId { get; set; }
        public Project Project { get; set; } = default!;
        public int UserId { get; set; }
        public User User { get; set; } = default!;
    }
}
