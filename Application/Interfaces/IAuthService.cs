using System.Threading;
using System.Threading.Tasks;
using TaskManagement.Models;

namespace TaskManagement.Application.Interfaces
{
    public interface IAuthService
    {
        Task<User> RegisterAsync(string username, string email, string password, UserRole role, CancellationToken cancellationToken = default);
        Task<User> LoginAsync(string email, string password, CancellationToken cancellationToken = default);
    }
}