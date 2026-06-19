using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Application.Interfaces;
using TaskManagement.Data;
using TaskManagement.Models;
using BCrypt.Net;

namespace TaskManagement.Application.Services
{
    public class AuthServiceImpl : IAuthService
    {
        private readonly ApplicationDbContext _db;

        public AuthServiceImpl(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<User> RegisterAsync(string username, string email, string password, UserRole role, CancellationToken cancellationToken = default)
        {
            var existing = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
            if (existing is not null)
                throw new System.Exception("User with this email already exists");

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);
            var user = new User
            {
                Username = username,
                Email = email,
                PasswordHash = hashedPassword,
                Role = role
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync(cancellationToken);
            return user;
        }

        public async Task<User> LoginAsync(string email, string password, CancellationToken cancellationToken = default)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
            if (user is null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                throw new System.Exception("Invalid email or password");

            return user;
        }
    }
}
