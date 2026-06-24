using Grpc.Core;
using Microsoft.EntityFrameworkCore;
using TaskService.Data;
using TaskService.Models;

namespace TaskService.Services;

public class TaskLogic(TaskDbContext database)
{
    private const int StatusTodo = 1;

    public async Task<TaskItem> Create(
        string title,
        string description,
        int projectId,
        int priority,
        int userId,
        int assigneeId,
        CancellationToken cancellationToken)
    {
        title = title.Trim();
        if (string.IsNullOrWhiteSpace(title))
            throw InvalidArgument("Task title is required");

        if (assigneeId <= 0)
            throw InvalidArgument("Assignee id is required");

        var task = new TaskItem
        {
            Title = title,
            Description = description?.Trim() ?? string.Empty,
            ProjectId = projectId,
            Priority = priority,
            CreatedById = userId,
            AssigneeId = assigneeId,
            Status = StatusTodo,
            CreatedAt = DateTime.UtcNow
        };

        database.Tasks.Add(task);
        await database.SaveChangesAsync(cancellationToken);
        return task;
    }

    public async Task<TaskItem> Get(int id, CancellationToken cancellationToken)
    {
        return await database.Tasks.FirstOrDefaultAsync(
            task => task.Id == id,
            cancellationToken)
            ?? throw new RpcException(new Status(StatusCode.NotFound, "Task not found"));
    }

    public async Task<List<TaskItem>> List(
        int projectId,
        CancellationToken cancellationToken)
    {
        return await database.Tasks
            .Where(task => task.ProjectId == projectId)
            .OrderByDescending(task => task.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<TaskItem> Assign(
        int taskId,
        int assigneeId,
        CancellationToken cancellationToken)
    {
        if (assigneeId <= 0)
            throw InvalidArgument("Assignee id is required");

        var task = await Get(taskId, cancellationToken);
        task.AssigneeId = assigneeId;
        await database.SaveChangesAsync(cancellationToken);
        return task;
    }

    public async Task<TaskItem> ChangeStatus(
        int taskId,
        int status,
        CancellationToken cancellationToken)
    {
        var task = await Get(taskId, cancellationToken);
        if (status != task.Status + 1)
            throw InvalidArgument("Task can only move to the next status");

        task.Status = status;
        await database.SaveChangesAsync(cancellationToken);
        return task;
    }

    public async Task Delete(int id, CancellationToken cancellationToken)
    {
        var task = await Get(id, cancellationToken);
        database.Tasks.Remove(task);
        await database.SaveChangesAsync(cancellationToken);
    }

    private static RpcException InvalidArgument(string message) =>
        new(new Status(StatusCode.InvalidArgument, message));
}
