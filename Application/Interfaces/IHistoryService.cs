using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TaskManagement.Models;

namespace TaskManagement.Application.Interfaces
{
    public interface IHistoryService
    {
        Task<IReadOnlyList<TaskHistory>> GetHistoryAsync(int taskId, CancellationToken cancellationToken = default);
    }
}