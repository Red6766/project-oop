using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TaskManagement.Application.Interfaces;
using TaskManagement.Models;

namespace TaskManagement.Application.Services
{
    public class CommentServiceImpl : ICommentService
    {
        public async Task<Comment> CreateAsync(int taskId, string text, int userId, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult(new Comment
            {
                TaskId = taskId,
                Text = text,
                UserId = userId
            });
        }

        public async Task<Comment?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult<Comment?>(null);
        }

        public async Task<IReadOnlyList<Comment>> ListAsync(int taskId, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult<IReadOnlyList<Comment>>(new List<Comment>());
        }

        public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult(true);
        }
    }
}