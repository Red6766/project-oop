using System;
using System.Collections.Generic;

namespace TaskManagement.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public UserRole Role { get; set; }
        public ICollection<ProjectUser> Projects { get; set; } = new List<ProjectUser>();
        public ICollection<Project> OwnedProjects { get; set; } = new List<Project>();
        public ICollection<TaskItem> AssignedTasks { get; set; } = new List<TaskItem>();
        public ICollection<TaskItem> CreatedTasks { get; set; } = new List<TaskItem>();
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public ICollection<TaskHistory> TaskHistoryEntries { get; set; } = new List<TaskHistory>();
    }
}
