using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Application.Interfaces;
using TaskManagement.Data;
using TaskManagement.Models;
using TaskStatus = TaskManagement.Models.TaskStatus;

namespace TaskManagement.Application.Services
{
    public class TaskServiceImpl : ITaskService
    {
        private readonly ApplicationDbContext _db;

        public TaskServiceImpl(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<TaskItem> CreateAsync(string title, string description, int projectId, int? assigneeId, TaskPriority priority, int createdById, CancellationToken cancellationToken = default)
        {
            var task = new TaskItem
            {
                Title = title,
                Description = description,
                ProjectId = projectId,
                AssigneeId = assigneeId,
                Priority = priority,
                CreatedById = createdById,
                Status = TaskStatus.ToDo,
                CreatedAt = System.DateTime.UtcNow
            };

            _db.Tasks.Add(task);
            await _db.SaveChangesAsync(cancellationToken);
            return task;
        }

        public async Task<TaskItem?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _db.Tasks.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        }

        public async Task<IReadOnlyList<TaskItem>> ListAsync(int projectId, CancellationToken cancellationToken = default)
        {
            return await _db.Tasks
                .Where(t => t.ProjectId == projectId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public async Task<TaskItem> AssignAsync(int taskId, int assigneeId, CancellationToken cancellationToken = default)
        {
            var task = await GetByIdAsync(taskId, cancellationToken);
            if (task is null)
                throw new System.Exception("Task not found");

            task.AssigneeId = assigneeId;
            await _db.SaveChangesAsync(cancellationToken);
            return task;
        }

        public async Task<TaskItem> ChangeStatusAsync(int taskId, TaskStatus status, string comment, int actorId, CancellationToken cancellationToken = default)
        {
            var task = await GetByIdAsync(taskId, cancellationToken);
            if (task is null)
                throw new System.Exception("Task not found");

            var oldStatus = task.Status;
            task.Status = status;
            task.UpdatedAt = System.DateTime.UtcNow;

            _db.TaskHistories.Add(new TaskHistory
            {
                TaskId = taskId,
                OldStatus = oldStatus,
                NewStatus = status,
                ChangedById = actorId,
                CreatedAt = System.DateTime.UtcNow
            });

            await _db.SaveChangesAsync(cancellationToken);
            return task;
        }
    }
}
