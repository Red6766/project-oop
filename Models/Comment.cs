using System;

namespace TaskManagement.Models
{
    public class Comment
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public TaskItem Task { get; set; } = default!;
        public int UserId { get; set; }
        public User User { get; set; } = default!;
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}