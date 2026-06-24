using AuthService.Models;
using AuthService.Services;
using Grpc.Core;
using TaskManagement.Grpc;

namespace AuthService.Grpc;

public class UserHandler(AuthLogic users) : UserService.UserServiceBase
{
    public override async Task<UserResponse> GetUser(GetUserRequest request, ServerCallContext context)
    {
        var user = await users.GetUser(request.Id, context.CancellationToken);
        return ToProto(user);
    }

    public override async Task<ListUsersResponse> ListUsers(ListUsersRequest request, ServerCallContext context)
    {
        var usersList = await users.ListUsers(request.PageSize, request.PageToken, context.CancellationToken);
        var response = new ListUsersResponse();

        foreach (var user in usersList)
            response.Users.Add(ToProto(user));

        return response;
    }

    private static UserResponse ToProto(User user) => new()
    {
        Id = user.Id,
        Username = user.Username,
        Email = user.Email
    };
}
