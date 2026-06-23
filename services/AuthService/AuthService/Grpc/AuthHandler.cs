using AuthService.Models;
using AuthService.Services;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;
using TaskManagement.Grpc;
using DomainUserRole = AuthService.Models.UserRole;
using ProtoUserRole = TaskManagement.Grpc.UserRole;

namespace AuthService.Grpc;

public class AuthHandler(AuthLogic auth, TokenService tokens) : TaskManagement.Grpc.AuthService.AuthServiceBase
{
    public override async Task<LoginResponse> Login(LoginRequest request, ServerCallContext context)
    {
        var user = await auth.Login(request.Email, request.Password, context.CancellationToken);
        var (token, expiresAt) = tokens.Create(user);

        return new LoginResponse
        {
            Token = token,
            User = ToProto(user),
            ExpiresAt = Timestamp.FromDateTime(expiresAt)
        };
    }

    public override async Task<UserResponse> Register(RegisterRequest request, ServerCallContext context)
    {
        var user = await auth.Register(
            request.Username,
            request.Email,
            request.Password,
            (DomainUserRole)(int)request.Role,
            request.SpecialKey,
            context.CancellationToken);

        return ToProto(user);
    }

    private static UserResponse ToProto(User user) => new()
    {
        Id = user.Id,
        Username = user.Username,
        Email = user.Email,
        Role = (ProtoUserRole)(int)user.Role
    };
}
