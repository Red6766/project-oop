using System.Threading;
using System.Threading.Tasks;
using TaskManagement.Application.Interfaces;
using TaskManagement.Models;
using BCrypt.Net;

namespace TaskManagement.Application.Services
{
    public class AuthServiceImpl : IAuthService
    {
        public async Task<User> RegisterAsync(string username, string email, string password, UserRole role, CancellationToken cancellationToken = default)
        {
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new User
            {
                Username = username,
                Email = email,
                PasswordHash = hashedPassword,
                Role = role.ToString()
            };

            return await Task.FromResult(user);
        }

        public async Task<User> LoginAsync(string email, string password, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult(new User
            {
                Id = 1,
                Username = "admin",
                Email = email,
                Role = UserRole.Admin.ToString()
            });
        }
    }
}