using Grpc.Core;
using TaskManagement.Application.Interfaces;
using TaskManagement.Grpc;

namespace TaskManagement.Infrastructure.Services;

public class AuthServiceHandler : AuthService.AuthServiceBase
{
    private readonly IAuthService _authService;

    public AuthServiceHandler(IAuthService authService)
    {
        _authService = authService;
    }

    public override async Task<LoginResponse> Login(LoginRequest request, ServerCallContext context)
    {
        var user = await _authService.LoginAsync(request.Email, request.Password, context.CancellationToken);
        return new LoginResponse
        {
            Token = "placeholder_token",
            User = new UserResponse
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = (UserRole)Enum.Parse(typeof(UserRole), user.Role)
            },
            ExpiresAt = Google.Protobuf.WellKnownTypes.Timestamp.FromDateTime(DateTime.UtcNow.AddHours(1))
        };
    }

    public override async Task<UserResponse> Register(RegisterRequest request, ServerCallContext context)
    {
        var user = await _authService.RegisterAsync(request.Username, request.Email, request.Password, (Models.UserRole)request.Role, context.CancellationToken);
        return new UserResponse
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = (UserRole)Enum.Parse(typeof(UserRole), user.Role)
        };
    }
}