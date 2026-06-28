using Grpc.Core;
using Grpc.Net.Client;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using TaskManagement.Grpc;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://+:5000");
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                builder.Configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("Jwt:Key is missing")))
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (RpcException exception)
    {
        context.Response.StatusCode = exception.StatusCode switch
        {
            StatusCode.InvalidArgument => StatusCodes.Status400BadRequest,
            StatusCode.Unauthenticated => StatusCodes.Status401Unauthorized,
            StatusCode.PermissionDenied => StatusCodes.Status403Forbidden,
            StatusCode.NotFound => StatusCodes.Status404NotFound,
            StatusCode.AlreadyExists => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status502BadGateway
        };

        await context.Response.WriteAsJsonAsync(new { error = exception.Status.Detail });
    }
});

var auth = new AuthService.AuthServiceClient(
    GrpcChannel.ForAddress("http://auth-service:5001"));
var users = new UserService.UserServiceClient(
    GrpcChannel.ForAddress("http://auth-service:5001"));
var projects = new ProjectService.ProjectServiceClient(
    GrpcChannel.ForAddress("http://project-service:5002"));
var tasks = new TaskService.TaskServiceClient(
    GrpcChannel.ForAddress("http://task-service:5003"));

app.MapPost("/api/auth/register", async (RegisterRequest request) =>
    Results.Ok(await auth.RegisterAsync(request)));
app.MapPost("/api/auth/login", async (LoginRequest request) =>
    Results.Ok(await auth.LoginAsync(request)));

app.MapGet("/api/users", async () =>
    Results.Ok((await users.ListUsersAsync(new ListUsersRequest())).Users))
    .RequireAuthorization();

app.MapGet("/api/projects", async (ClaimsPrincipal principal) =>
    {
        var userId = CurrentUserId(principal);
        return Results.Ok((await projects.ListProjectsAsync(new ListProjectsRequest { UserId = userId })).Projects);
    })
    .RequireAuthorization();
app.MapPost("/api/projects", async (CreateProjectRequest request, ClaimsPrincipal principal) =>
    {
        var userId = CurrentUserId(principal);
        request.CreatedById = userId;

        var project = await projects.CreateProjectAsync(request);

        await projects.AddMemberAsync(new AddProjectMemberRequest { ProjectId = project.Id, UserId = userId });

        return Results.Ok(project);
    })
    .RequireAuthorization();
app.MapPost("/api/projects/{projectId}/members/{userId}", async (int projectId, int userId, ClaimsPrincipal principal) =>
    {
        await EnsureProjectAdmin(projectId, principal);
        await users.GetUserAsync(new GetUserRequest { Id = userId });
        return Results.Ok(await projects.AddMemberAsync(new AddProjectMemberRequest { ProjectId = projectId, UserId = userId }));
    })
    .RequireAuthorization();
app.MapDelete("/api/projects/{projectId}/members/{userId}", async (int projectId, int userId, ClaimsPrincipal principal) =>
    {
        var project = await EnsureProjectAdmin(projectId, principal);
        var projectTasks = await tasks.ListTasksAsync(new ListTasksRequest { ProjectId = projectId });

        foreach (var task in projectTasks.Tasks.Where(task => task.AssigneeId == userId))
        {
            await tasks.AssignTaskAsync(new AssignTaskRequest
            {
                TaskId = task.Id,
                AssigneeId = project.CreatedById
            });
        }

        await projects.RemoveMemberAsync(new RemoveProjectMemberRequest { ProjectId = projectId, UserId = userId });
        return Results.NoContent();
    })
    .RequireAuthorization();
app.MapDelete("/api/projects/{projectId}", async (int projectId, ClaimsPrincipal principal) =>
    {
        await EnsureProjectAdmin(projectId, principal);
        await tasks.DeleteTasksByProjectAsync(new DeleteTasksByProjectRequest { ProjectId = projectId });
        await projects.DeleteProjectAsync(new DeleteProjectRequest { Id = projectId });
        return Results.NoContent();
    })
    .RequireAuthorization();
app.MapGet("/api/projects/{projectId}/tasks", async (int projectId, ClaimsPrincipal principal) =>
    {
        await EnsureProjectAccess(projectId, principal);
        return Results.Ok((await tasks.ListTasksAsync(new ListTasksRequest { ProjectId = projectId })).Tasks);
    })
    .RequireAuthorization();
app.MapPost("/api/tasks", async (CreateTaskRequest request, ClaimsPrincipal principal) =>
    {
        var currentUserId = CurrentUserId(principal);
        var project = await EnsureProjectAccess(request.ProjectId, principal);

        request.CreatedById = currentUserId;
        if (!project.AdminIds.Contains(currentUserId))
            request.AssigneeId = currentUserId;

        if (!project.MemberIds.Contains(request.AssigneeId))
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Assignee must be a project member"));

        return Results.Ok(await tasks.CreateTaskAsync(request));
    })
    .RequireAuthorization();
app.MapPost("/api/tasks/{taskId}/assignee", async (int taskId, AssignTaskRequest request, ClaimsPrincipal principal) =>
    {
        await EnsureProjectAdminByTask(taskId, principal);
        var task = await tasks.GetTaskAsync(new GetTaskRequest { Id = taskId });
        var project = await EnsureProjectAccess(task.ProjectId, principal);
        if (!project.MemberIds.Contains(request.AssigneeId))
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Assignee must be a project member"));

        request.TaskId = taskId;
        return Results.Ok(await tasks.AssignTaskAsync(request));
    })
    .RequireAuthorization();
app.MapDelete("/api/tasks/{taskId}", async (int taskId, ClaimsPrincipal principal) =>
    {
        var currentUserId = CurrentUserId(principal);
        var task = await tasks.GetTaskAsync(new GetTaskRequest { Id = taskId });
        var project = await EnsureProjectAccess(task.ProjectId, principal);

        if (task.CreatedById != currentUserId && !project.AdminIds.Contains(currentUserId))
            throw new RpcException(new Status(
                StatusCode.PermissionDenied,
                "Only task creator or project admin can delete task"));

        await tasks.DeleteTaskAsync(new DeleteTaskRequest { Id = taskId });
        return Results.NoContent();
    })
    .RequireAuthorization();
app.MapPost("/api/tasks/{taskId}/description", async (int taskId, UpdateTaskDescriptionRequest request, ClaimsPrincipal principal) =>
    {
        var task = await tasks.GetTaskAsync(new GetTaskRequest { Id = taskId });
        await EnsureProjectAccess(task.ProjectId, principal);
        request.TaskId = taskId;
        return Results.Ok(await tasks.UpdateTaskDescriptionAsync(request));
    })
    .RequireAuthorization();
app.MapPost("/api/tasks/{taskId}/title", async (int taskId, UpdateTaskTitleRequest request, ClaimsPrincipal principal) =>
    {
        var task = await tasks.GetTaskAsync(new GetTaskRequest { Id = taskId });
        await EnsureProjectAccess(task.ProjectId, principal);
        request.TaskId = taskId;
        return Results.Ok(await tasks.UpdateTaskTitleAsync(request));
    })
    .RequireAuthorization();
app.MapPost("/api/tasks/{taskId}/status", async (int taskId, ChangeTaskStatusRequest request, ClaimsPrincipal principal) =>
    {
        var currentUserId = CurrentUserId(principal);
        var task = await tasks.GetTaskAsync(new GetTaskRequest { Id = taskId });
        var project = await EnsureProjectAccess(task.ProjectId, principal);

        if (task.AssigneeId != currentUserId && !project.AdminIds.Contains(currentUserId))
            throw new RpcException(new Status(StatusCode.PermissionDenied, "Only assignee or project admin can change status"));

        request.TaskId = taskId;
        return Results.Ok(await tasks.ChangeStatusAsync(request));
    })
    .RequireAuthorization();


app.MapGet("/health", () => "OK");
app.Run();

int CurrentUserId(ClaimsPrincipal principal)
{
    var raw = principal.FindFirstValue(ClaimTypes.NameIdentifier)
              ?? principal.FindFirstValue("sub");

    if (!int.TryParse(raw, out var userId))
        throw new RpcException(new Status(StatusCode.Unauthenticated, "User id claim is missing"));

    return userId;
}

async Task<ProjectResponse> EnsureProjectAccess(int projectId, ClaimsPrincipal principal)
{
    var project = await projects.GetProjectAsync(new GetProjectRequest { Id = projectId });
    if (project.MemberIds.Contains(CurrentUserId(principal)))
        return project;

    throw new RpcException(new Status(StatusCode.PermissionDenied, "Project access denied"));
}

async Task<ProjectResponse> EnsureProjectAdmin(int projectId, ClaimsPrincipal principal)
{
    var project = await projects.GetProjectAsync(new GetProjectRequest { Id = projectId });
    if (!project.AdminIds.Contains(CurrentUserId(principal)))
        throw new RpcException(new Status(StatusCode.PermissionDenied, "Insufficient permissions"));

    return project;
}

async Task EnsureProjectAdminByTask(int taskId, ClaimsPrincipal principal)
{
    var task = await tasks.GetTaskAsync(new GetTaskRequest { Id = taskId });
    await EnsureProjectAdmin(task.ProjectId, principal);
}
