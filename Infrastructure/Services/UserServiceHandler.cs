using Grpc.Core;
using TaskManagement.Application.Interfaces;
using TaskManagement.Grpc;

namespace TaskManagement.Infrastructure.Services;

public class UserServiceHandler : UserService.UserServiceBase
{
    private readonly IUserService _userService;

    public UserServiceHandler(IUserService userService)
    {
        _userService = userService;
    }

    public override async Task<UserResponse> GetUser(GetUserRequest request, ServerCallContext context)
    {
        var user = await _userService.GetByIdAsync(request.Id, context.CancellationToken);
        if (user is null)
            throw new RpcException(new Status(StatusCode.NotFound, "User not found"));

        return new UserResponse
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = (UserRole)(int)user.Role
        };
    }

    public override async Task<ListUsersResponse> ListUsers(ListUsersRequest request, ServerCallContext context)
    {
        var users = await _userService.ListAsync(context.CancellationToken);
        var response = new ListUsersResponse();
        foreach (var u in users)
        {
            response.Users.Add(new UserResponse
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                Role = (UserRole)(int)u.Role
            });
        }
        return response;
    }
}
