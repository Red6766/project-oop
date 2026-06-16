using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TaskManagement.Application.Interfaces;
using TaskManagement.Models;
using TaskStatus = TaskManagement.Models.TaskStatus;

namespace TaskManagement.Application.Services
{
    public class TaskServiceImpl : ITaskService
    {
        public async Task<TaskItem> CreateAsync(string title, string description, int projectId, int? assigneeId, TaskPriority priority, int createdById, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult(new TaskItem
            {
                Title = title,
                Description = description,
                ProjectId = projectId,
                AssigneeId = assigneeId,
                Priority = priority,
                CreatedById = createdById
            });
        }

        public async Task<TaskItem?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult<TaskItem?>(null);
        }

        public async Task<IReadOnlyList<TaskItem>> ListAsync(int projectId, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult<IReadOnlyList<TaskItem>>(new List<TaskItem>());
        }

        public async Task<TaskItem> AssignAsync(int taskId, int assigneeId, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult(new TaskItem());
        }

        public async Task<TaskItem> ChangeStatusAsync(int taskId, TaskStatus status, string comment, int actorId, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult(new TaskItem());
        }
    }
}