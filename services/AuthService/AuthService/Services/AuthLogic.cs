using AuthService.Data;
using AuthService.Models;
using Grpc.Core;
using Microsoft.EntityFrameworkCore;
using System.Net.Mail;

namespace AuthService.Services;

public class AuthLogic(AuthDbContext database)
{
    public async Task<User> GetUser(int id, CancellationToken cancellationToken)
    {
        return await database.Users.FirstOrDefaultAsync(user => user.Id == id, cancellationToken)
            ?? throw new RpcException(new Status(StatusCode.NotFound, "User not found"));
    }

    public async Task<List<User>> ListUsers(int pageSize, int pageToken, CancellationToken cancellationToken)
    {
        var take = pageSize is > 0 and <= 100 ? pageSize : 100;
        var skip = Math.Max(0, pageToken);

        return await database.Users
            .OrderBy(user => user.Username)
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public async Task<User> AssignRole(int userId, UserRole role, CancellationToken cancellationToken)
    {
        if (role is not UserRole.Admin and not UserRole.Manager and not UserRole.Executor and not UserRole.Observer)
            throw InvalidArgument("User role is invalid");

        var user = await GetUser(userId, cancellationToken);
        user.Role = role;
        await database.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<User> Register(
        string username,
        string email,
        string password,
        UserRole role,
        CancellationToken cancellationToken)
    {
        username = username.Trim();
        email = email.Trim();

        ValidateRegistration(username, email, password, role);

        var normalizedUsername = username.ToUpperInvariant();
        var normalizedEmail = email.ToUpperInvariant();

        if (await database.Users.AnyAsync(
                user => user.NormalizedEmail == normalizedEmail ||
                        user.NormalizedUsername == normalizedUsername,
                cancellationToken))
        {
            throw new RpcException(new Status(
                StatusCode.AlreadyExists,
                "Email or username already exists"));
        }

        var user = new User
        {
            Username = username,
            NormalizedUsername = normalizedUsername,
            Email = email.ToLowerInvariant(),
            NormalizedEmail = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = role
        };

        database.Users.Add(user);
        await database.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<User> Login(string login, string password, CancellationToken cancellationToken)
    {
        var normalized = login.Trim().ToUpperInvariant();
        var isEmail = login.Contains('@');
        var user = await database.Users.FirstOrDefaultAsync(
            candidate => isEmail ? candidate.NormalizedEmail == normalized : candidate.NormalizedUsername == normalized,
            cancellationToken);

        if (user is null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            throw new RpcException(new Status(StatusCode.Unauthenticated, "Invalid credentials"));
        }

        return user;
    }

    private static void ValidateRegistration(string username, string email, string password, UserRole role)
    {
        if (username.Length is < 3 or > 100)
            throw InvalidArgument("Username must contain from 3 to 100 characters");

        if (!MailAddress.TryCreate(email, out _) || email.Length > 320)
            throw InvalidArgument("Email is invalid");

        if (password.Length < 6)
            throw InvalidArgument("Password must contain at least 6 characters");

        if (role is not UserRole.Executor and not UserRole.Observer)
            throw new RpcException(new Status(
                StatusCode.PermissionDenied,
                "Only Executor or Observer can be selected during registration"));
    }

    private static RpcException InvalidArgument(string message) =>
        new(new Status(StatusCode.InvalidArgument, message));
}
