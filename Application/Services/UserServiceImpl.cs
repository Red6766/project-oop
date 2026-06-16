using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TaskManagement.Application.Interfaces;
using TaskManagement.Models;

namespace TaskManagement.Application.Services
{
    public class UserServiceImpl : IUserService
    {
        public async Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult<User?>(null);
        }

        public async Task<IReadOnlyList<User>> ListAsync(CancellationToken cancellationToken = default)
        {
            return await Task.FromResult<IReadOnlyList<User>>(new List<User>());
        }
    }
}