using System;
using System.Collections.Generic;

namespace TaskManagement.Models
{
    public class Project
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int CreatedById { get; set; }
        public User CreatedBy { get; set; } = default!;
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime? EndDate { get; set; }
        public ProjectStatus Status { get; set; } = ProjectStatus.Active;
        public ICollection<ProjectUser> Members { get; set; } = new List<ProjectUser>();
        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    }
}
