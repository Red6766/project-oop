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
        public string Role { get; set; } = string.Empty; // Admin, Manager, Executor, Observer
        public ICollection<ProjectUser> Projects { get; set; } = new List<ProjectUser>();
    }
}