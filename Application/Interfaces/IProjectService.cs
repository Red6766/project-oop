using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TaskManagement.Models;

namespace TaskManagement.Application.Interfaces
{
    public interface IProjectService
    {
        Task<Project> CreateAsync(string name, string description, int createdById, CancellationToken cancellationToken = default);
        Task<Project?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<Project>> ListAsync(CancellationToken cancellationToken = default);
        Task<Project> AddMemberAsync(int projectId, int userId, CancellationToken cancellationToken = default);
        Task<Project> RemoveMemberAsync(int projectId, int userId, CancellationToken cancellationToken = default);
    }
}