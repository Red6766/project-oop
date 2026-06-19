using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Application.Interfaces;
using TaskManagement.Data;
using TaskManagement.Models;

namespace TaskManagement.Application.Services
{
    public class ProjectServiceImpl : IProjectService
    {
        private readonly ApplicationDbContext _db;

        public ProjectServiceImpl(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<Project> CreateAsync(string name, string description, int createdById, CancellationToken cancellationToken = default)
        {
            var project = new Project
            {
                Name = name,
                Description = description,
                CreatedById = createdById
            };

            _db.Projects.Add(project);
            await _db.SaveChangesAsync(cancellationToken);
            return project;
        }

        public async Task<Project?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await _db.Projects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        }

        public async Task<IReadOnlyList<Project>> ListAsync(CancellationToken cancellationToken = default)
        {
            return await _db.Projects
                .OrderByDescending(p => p.Id)
                .ToListAsync(cancellationToken);
        }

        public async Task<Project> AddMemberAsync(int projectId, int userId, CancellationToken cancellationToken = default)
        {
            var project = await GetByIdAsync(projectId, cancellationToken);
            if (project is null)
                throw new System.Exception("Project not found");

            if (!project.Members.Any(m => m.UserId == userId))
            {
                project.Members.Add(new ProjectUser { ProjectId = projectId, UserId = userId });
                await _db.SaveChangesAsync(cancellationToken);
            }

            return project;
        }

        public async Task<Project> RemoveMemberAsync(int projectId, int userId, CancellationToken cancellationToken = default)
        {
            var pu = await _db.ProjectUsers
                .FirstOrDefaultAsync(p => p.ProjectId == projectId && p.UserId == userId, cancellationToken);

            if (pu is not null)
            {
                _db.ProjectUsers.Remove(pu);
                await _db.SaveChangesAsync(cancellationToken);
            }

            return (await GetByIdAsync(projectId, cancellationToken))!;
        }
    }
}
