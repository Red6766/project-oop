using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using TaskService.Data;
using TaskService.Grpc;
using TaskService.Services;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
    options.ConfigureEndpointDefaults(listenOptions =>
        listenOptions.Protocols = HttpProtocols.Http2));

builder.Services.AddGrpc();
builder.Services.AddDbContext<TaskDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<TaskLogic>();

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var database = scope.ServiceProvider.GetRequiredService<TaskDbContext>();
    await database.Database.MigrateAsync();
}

app.MapGrpcService<TaskHandler>();
app.Run();
