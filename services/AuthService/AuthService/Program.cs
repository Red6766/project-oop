using AuthService.Data;
using AuthService.Grpc;
using AuthService.Options;
using AuthService.Services;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
    options.ConfigureEndpointDefaults(endpoint => endpoint.Protocols = HttpProtocols.Http2));

builder.Services.AddGrpc();
builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services
    .AddOptions<JwtOptions>()
    .Bind(builder.Configuration.GetSection(JwtOptions.SectionName))
    .Validate(options => options.Key.Length >= 32, "JWT key must contain at least 32 characters")
    .Validate(options => !string.IsNullOrWhiteSpace(options.Issuer), "JWT issuer is required")
    .Validate(options => !string.IsNullOrWhiteSpace(options.Audience), "JWT audience is required")
    .ValidateOnStart();

builder.Services.AddScoped<AuthLogic>();
builder.Services.AddSingleton<TokenService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    await database.Database.MigrateAsync();
}

app.MapGrpcService<AuthHandler>();
app.MapGrpcService<UserHandler>();
app.Run();
