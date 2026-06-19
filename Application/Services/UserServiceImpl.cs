using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Application.Interfaces;
using TaskManagement.Data;
using TaskManagement.Models;

namespace TaskManagement.Application.Services
{
    public class UserServiceImpl : IUserService
    {
        private readonly ApplicationDbContext _db;

        public UserServiceImpl(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _db.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        }

        public async Task<IReadOnlyList<User>> ListAsync(CancellationToken cancellationToken = default)
        {
            return await _db.Users.ToListAsync(cancellationToken);
        }
    }
}
