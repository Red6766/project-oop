using Grpc.Core;
using TaskManagement.Application.Interfaces;
using TaskManagement.Grpc;
using Google.Protobuf.WellKnownTypes;

namespace TaskManagement.Infrastructure.Services;

public class TaskServiceHandler : TaskService.TaskServiceBase
{
    private readonly ITaskService _taskService;

    public TaskServiceHandler(ITaskService taskService)
    {
        _taskService = taskService;
    }

    public override async Task<TaskResponse> CreateTask(CreateTaskRequest request, ServerCallContext context)
    {
        var task = await _taskService.CreateAsync(
            request.Title,
            request.Description,
            request.ProjectId,
            null,
            (Models.TaskPriority)request.Priority,
            request.CreatedById,
            context.CancellationToken);

        return ToResponse(task);
    }

    public override async Task<TaskResponse> GetTask(GetTaskRequest request, ServerCallContext context)
    {
        var task = await _taskService.GetByIdAsync(request.Id, context.CancellationToken);
        if (task is null)
            throw new RpcException(new Status(StatusCode.NotFound, "Task not found"));

        return ToResponse(task);
    }

    public override async Task<ListTasksResponse> ListTasks(ListTasksRequest request, ServerCallContext context)
    {
        var tasks = await _taskService.ListAsync(request.ProjectId, context.CancellationToken);
        var response = new ListTasksResponse();
        foreach (var t in tasks)
            response.Tasks.Add(ToResponse(t));
        return response;
    }

    public override async Task<TaskResponse> AssignTask(AssignTaskRequest request, ServerCallContext context)
    {
        var task = await _taskService.AssignAsync(request.TaskId, request.AssigneeId, context.CancellationToken);
        return ToResponse(task);
    }

    public override async Task<TaskResponse> ChangeStatus(ChangeTaskStatusRequest request, ServerCallContext context)
    {
        var task = await _taskService.ChangeStatusAsync(
            request.TaskId,
            (Models.TaskStatus)request.Status,
            request.Comment,
            request.ActorId,
            context.CancellationToken);
        return ToResponse(task);
    }

    private static TaskResponse ToResponse(Models.TaskItem t)
    {
        return new TaskResponse
        {
            Id = t.Id,
            Title = t.Title,
            Description = t.Description,
            ProjectId = t.ProjectId,
            AssigneeId = t.AssigneeId ?? 0,
            Status = (Grpc.TaskStatus)t.Status,
            Priority = (Grpc.TaskPriority)t.Priority,
            CreatedById = t.CreatedById,
            CreatedAt = Timestamp.FromDateTime(t.CreatedAt.ToUniversalTime()),
            UpdatedAt = t.UpdatedAt is not null
                ? Timestamp.FromDateTime(t.UpdatedAt.Value.ToUniversalTime())
                : null
        };
    }
}
