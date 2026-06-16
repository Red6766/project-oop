using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TaskManagement.Models;
using TaskStatus = TaskManagement.Models.TaskStatus;

namespace TaskManagement.Application.Interfaces
{
    public interface ITaskService
    {
        Task<TaskItem> CreateAsync(string title, string description, int projectId, int? assigneeId, TaskPriority priority, int createdById, CancellationToken cancellationToken = default);
        Task<TaskItem?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<TaskItem>> ListAsync(int projectId, CancellationToken cancellationToken = default);
        Task<TaskItem> AssignAsync(int taskId, int assigneeId, CancellationToken cancellationToken = default);
        Task<TaskItem> ChangeStatusAsync(int taskId, TaskStatus status, string comment, int actorId, CancellationToken cancellationToken = default);
    }
}