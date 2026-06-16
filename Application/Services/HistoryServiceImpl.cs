using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TaskManagement.Application.Interfaces;
using TaskManagement.Models;

namespace TaskManagement.Application.Services
{
    public class HistoryServiceImpl : IHistoryService
    {
        public async Task<IReadOnlyList<TaskHistory>> GetHistoryAsync(int taskId, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult<IReadOnlyList<TaskHistory>>(new List<TaskHistory>());
        }
    }
}