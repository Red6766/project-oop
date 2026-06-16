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

var app = builder.Build();

// Configure the HTTP request pipeline
app.MapGrpcService<AuthServiceHandler>();
app.MapGrpcService<UserServiceHandler>();
app.MapGrpcService<ProjectServiceHandler>();

app.MapGet("/", () => "Task Management gRPC Server is running.");

app.Run();
