using Microsoft.EntityFrameworkCore;
using TaskManagement.Application.Interfaces;
using TaskManagement.Application.Services;
using TaskManagement.Data;
using TaskManagement.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddGrpc();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register application services
builder.Services.AddScoped<IAuthService, AuthServiceImpl>();
builder.Services.AddScoped<IUserService, UserServiceImpl>();
builder.Services.AddScoped<IProjectService, ProjectServiceImpl>();
builder.Services.AddScoped<ITaskService, TaskServiceImpl>();
builder.Services.AddScoped<ICommentService, CommentServiceImpl>();
builder.Services.AddScoped<IHistoryService, HistoryServiceImpl>();

// CORS для React dev server
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors();
app.UseGrpcWeb();

// Configure the HTTP request pipeline
app.MapGrpcService<AuthServiceHandler>().EnableGrpcWeb();
app.MapGrpcService<UserServiceHandler>().EnableGrpcWeb();
app.MapGrpcService<ProjectServiceHandler>().EnableGrpcWeb();
app.MapGrpcService<TaskServiceHandler>().EnableGrpcWeb();

app.MapGet("/", () => "Task Management gRPC Server is running.");

app.Run();
