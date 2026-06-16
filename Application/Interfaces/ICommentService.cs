using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TaskManagement.Models;

namespace TaskManagement.Application.Interfaces
{
    public interface ICommentService
    {
        Task<Comment> CreateAsync(int taskId, string text, int userId, CancellationToken cancellationToken = default);
        Task<Comment?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<Comment>> ListAsync(int taskId, CancellationToken cancellationToken = default);
        Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
    }
}