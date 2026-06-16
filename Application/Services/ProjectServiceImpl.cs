using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TaskManagement.Application.Interfaces;
using TaskManagement.Models;

namespace TaskManagement.Application.Services
{
    public class ProjectServiceImpl : IProjectService
    {
        public async Task<Project> CreateAsync(string name, string description, int createdById, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult(new Project
            {
                Name = name,
                Description = description,
                CreatedById = createdById
            });
        }

        public async Task<Project?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult<Project?>(null);
        }

        public async Task<IReadOnlyList<Project>> ListAsync(CancellationToken cancellationToken = default)
        {
            return await Task.FromResult<IReadOnlyList<Project>>(new List<Project>());
        }

        public async Task<Project> AddMemberAsync(int projectId, int userId, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult(new Project());
        }

        public async Task<Project> RemoveMemberAsync(int projectId, int userId, CancellationToken cancellationToken = default)
        {
            return await Task.FromResult(new Project());
        }
    }
}