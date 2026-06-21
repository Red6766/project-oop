using Grpc.Core;
using Grpc.Net.Client;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
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
var projects = new ProjectService.ProjectServiceClient(
    GrpcChannel.ForAddress("http://project-service:5002"));
var tasks = new TaskService.TaskServiceClient(
    GrpcChannel.ForAddress("http://task-service:5003"));

app.MapPost("/api/auth/register", async (RegisterRequest request) =>
    Results.Ok(await auth.RegisterAsync(request)));
app.MapPost("/api/auth/login", async (LoginRequest request) =>
    Results.Ok(await auth.LoginAsync(request)));

app.MapGet("/api/projects", async () =>
    Results.Ok((await projects.ListProjectsAsync(new ListProjectsRequest())).Projects))
    .RequireAuthorization();
app.MapPost("/api/projects", async (CreateProjectRequest request) =>
    Results.Ok(await projects.CreateProjectAsync(request)))
    .RequireAuthorization();
app.MapGet("/api/projects/{projectId}/tasks", async (int projectId) =>
    Results.Ok((await tasks.ListTasksAsync(new ListTasksRequest { ProjectId = projectId })).Tasks))
    .RequireAuthorization();
app.MapPost("/api/tasks", async (CreateTaskRequest request) =>
    Results.Ok(await tasks.CreateTaskAsync(request)))
    .RequireAuthorization();
app.MapPost("/api/tasks/{taskId}/status", async (int taskId, ChangeTaskStatusRequest request) =>
    {
        request.TaskId = taskId;
        return Results.Ok(await tasks.ChangeStatusAsync(request));
    })
    .RequireAuthorization();


app.MapGet("/health", () => "OK");
app.Run();
