using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TaskManagement.Models;

namespace TaskManagement.Application.Interfaces
{
    public interface IUserService
    {
        Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<User>> ListAsync(CancellationToken cancellationToken = default);
    }
}