using System;

namespace TaskManagement.Models
{
    public class TaskHistory
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public TaskItem Task { get; set; } = default!;
        public TaskStatus OldStatus { get; set; }
        public TaskStatus NewStatus { get; set; }
        public int ChangedById { get; set; }
        public User ChangedBy { get; set; } = default!;
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
