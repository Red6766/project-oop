using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using ProjectService.Data;
using ProjectService.Grpc;
using ProjectService.Services;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
    options.ConfigureEndpointDefaults(listenOptions =>
        listenOptions.Protocols = HttpProtocols.Http2));

builder.Services.AddGrpc();
builder.Services.AddDbContext<ProjectDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<ProjectLogic>();

var app = builder.Build();

await ProjectDatabaseInitializer.InitializeAsync(app.Services);

app.MapGrpcService<ProjectHandler>();
app.Run();
