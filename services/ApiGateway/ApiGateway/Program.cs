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

app.MapGet("/api/users", async (ClaimsPrincipal principal) =>
    {
        EnsureRole(principal, "Admin", "Manager");
        return Results.Ok((await users.ListUsersAsync(new ListUsersRequest())).Users);
    })
    .RequireAuthorization();
app.MapPost("/api/users/{userId}/role", async (int userId, AssignRoleRequest request, ClaimsPrincipal principal) =>
    {
        EnsureRole(principal, "Admin");
        request.UserId = userId;
        return Results.Ok(await users.AssignRoleAsync(request));
    })
    .RequireAuthorization();

app.MapGet("/api/projects", async (ClaimsPrincipal principal) =>
    {
        var userId = IsRole(principal, "Admin") ? 0 : CurrentUserId(principal);
        return Results.Ok((await projects.ListProjectsAsync(new ListProjectsRequest { UserId = userId })).Projects);
    })
    .RequireAuthorization();
app.MapPost("/api/projects", async (CreateProjectRequest request, ClaimsPrincipal principal) =>
    {
        EnsureRole(principal, "Admin", "Manager");
        request.CreatedById = CurrentUserId(principal);
        return Results.Ok(await projects.CreateProjectAsync(request));
    })
    .RequireAuthorization();
app.MapPost("/api/projects/{projectId}/members/{userId}", async (int projectId, int userId, ClaimsPrincipal principal) =>
    {
        EnsureRole(principal, "Admin", "Manager");
        await EnsureProjectAccess(projectId, principal);
        await users.GetUserAsync(new GetUserRequest { Id = userId });
        return Results.Ok(await projects.AddMemberAsync(new AddProjectMemberRequest { ProjectId = projectId, UserId = userId }));
    })
    .RequireAuthorization();
app.MapDelete("/api/projects/{projectId}/members/{userId}", async (int projectId, int userId, ClaimsPrincipal principal) =>
    {
        EnsureRole(principal, "Admin", "Manager");
        await EnsureProjectAccess(projectId, principal);
        await projects.RemoveMemberAsync(new RemoveProjectMemberRequest { ProjectId = projectId, UserId = userId });
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
        EnsureRole(principal, "Admin", "Manager", "Executor");
        var currentUserId = CurrentUserId(principal);
        var project = await EnsureProjectAccess(request.ProjectId, principal);

        request.CreatedById = currentUserId;
        if (IsRole(principal, "Executor"))
        {
            request.AssigneeId = currentUserId;
        }

        if (request.AssigneeId > 0 && !project.MemberIds.Contains(request.AssigneeId))
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Assignee must be a project member"));

        return Results.Ok(await tasks.CreateTaskAsync(request));
    })
    .RequireAuthorization();
app.MapPost("/api/tasks/{taskId}/assignee", async (int taskId, AssignTaskRequest request, ClaimsPrincipal principal) =>
    {
        EnsureRole(principal, "Admin", "Manager");
        var task = await tasks.GetTaskAsync(new GetTaskRequest { Id = taskId });
        var project = await EnsureProjectAccess(task.ProjectId, principal);
        if (!project.MemberIds.Contains(request.AssigneeId))
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Assignee must be a project member"));

        request.TaskId = taskId;
        return Results.Ok(await tasks.AssignTaskAsync(request));
    })
    .RequireAuthorization();
app.MapPost("/api/tasks/{taskId}/status", async (int taskId, ChangeTaskStatusRequest request, ClaimsPrincipal principal) =>
    {
        EnsureRole(principal, "Admin", "Manager", "Executor");
        var currentUserId = CurrentUserId(principal);
        var task = await tasks.GetTaskAsync(new GetTaskRequest { Id = taskId });
        await EnsureProjectAccess(task.ProjectId, principal);
        if (IsRole(principal, "Executor") && task.AssigneeId != currentUserId)
            throw new RpcException(new Status(StatusCode.PermissionDenied, "Executor can change only assigned tasks"));

        request.TaskId = taskId;
        request.ActorId = currentUserId;
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

bool IsRole(ClaimsPrincipal principal, string role) => principal.IsInRole(role);

void EnsureRole(ClaimsPrincipal principal, params string[] roles)
{
    if (roles.Any(role => principal.IsInRole(role)))
        return;

    throw new RpcException(new Status(StatusCode.PermissionDenied, "Insufficient permissions"));
}

async Task<ProjectResponse> EnsureProjectAccess(int projectId, ClaimsPrincipal principal)
{
    var project = await projects.GetProjectAsync(new GetProjectRequest { Id = projectId });
    if (IsRole(principal, "Admin") || project.MemberIds.Contains(CurrentUserId(principal)))
        return project;

    throw new RpcException(new Status(StatusCode.PermissionDenied, "Project access denied"));
}
