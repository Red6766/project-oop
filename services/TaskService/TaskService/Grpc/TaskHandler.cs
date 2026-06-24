using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using TaskManagement.Grpc;
using TaskService.Models;
using TaskService.Services;

namespace TaskService.Grpc;

public class TaskHandler(TaskLogic tasks) : TaskManagement.Grpc.TaskService.TaskServiceBase
{
    public override async Task<TaskResponse> CreateTask(
        CreateTaskRequest request,
        ServerCallContext context)
    {
        var task = await tasks.Create(
            request.Title,
            request.Description,
            request.ProjectId,
            (int)request.Priority,
            request.CreatedById,
            request.AssigneeId,
            context.CancellationToken);

        return ToProto(task);
    }

    public override async Task<TaskResponse> GetTask(
        GetTaskRequest request,
        ServerCallContext context)
    {
        var task = await tasks.Get(request.Id, context.CancellationToken);
        return ToProto(task);
    }

    public override async Task<ListTasksResponse> ListTasks(
        ListTasksRequest request,
        ServerCallContext context)
    {
        var taskList = await tasks.List(request.ProjectId, context.CancellationToken);
        var response = new ListTasksResponse();

        foreach (var task in taskList)
            response.Tasks.Add(ToProto(task));

        return response;
    }

    public override async Task<TaskResponse> AssignTask(
        AssignTaskRequest request,
        ServerCallContext context)
    {
        var task = await tasks.Assign(
            request.TaskId,
            request.AssigneeId,
            context.CancellationToken);

        return ToProto(task);
    }

    public override async Task<TaskResponse> ChangeStatus(
        ChangeTaskStatusRequest request,
        ServerCallContext context)
    {
        var task = await tasks.ChangeStatus(
            request.TaskId,
            (int)request.Status,
            context.CancellationToken);

        return ToProto(task);
    }

    public override async Task<Empty> DeleteTask(
        DeleteTaskRequest request,
        ServerCallContext context)
    {
        await tasks.Delete(request.Id, context.CancellationToken);
        return new Empty();
    }

    private static TaskResponse ToProto(TaskItem task) => new()
    {
        Id = task.Id,
        Title = task.Title,
        Description = task.Description,
        ProjectId = task.ProjectId,
        AssigneeId = task.AssigneeId,
        Status = (TaskManagement.Grpc.TaskStatus)task.Status,
        Priority = (TaskPriority)task.Priority,
        CreatedById = task.CreatedById,
        CreatedAt = Timestamp.FromDateTime(DateTime.SpecifyKind(task.CreatedAt, DateTimeKind.Utc))
    };
}
