using Grpc.Core;
using Microsoft.EntityFrameworkCore;
using ProjectService.Data;
using ProjectService.Models;

namespace ProjectService.Services;

public class ProjectLogic(ProjectDbContext database)
{
    public async Task<Project> Create(
        string name,
        string description,
        int userId,
        CancellationToken cancellationToken)
    {
        name = name.Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw InvalidArgument("Project name is required");
        if (userId <= 0)
            throw InvalidArgument("Project creator is required");

        var project = new Project
        {
            Name = name,
            Description = description.Trim(),
            CreatedById = userId
        };
        project.Members.Add(new ProjectMember { UserId = userId, Role = "admin" });

        database.Projects.Add(project);
        await database.SaveChangesAsync(cancellationToken);
        return project;
    }

    public async Task<Project> Get(int id, CancellationToken cancellationToken)
    {
        return await database.Projects
            .Include(project => project.Members)
            .FirstOrDefaultAsync(project => project.Id == id, cancellationToken)
            ?? throw new RpcException(new Status(StatusCode.NotFound, "Project not found"));
    }

    public async Task<List<Project>> List(int userId, CancellationToken cancellationToken)
    {
        var query = database.Projects
            .Include(project => project.Members)
            .AsQueryable();

        if (userId > 0)
        {
            query = query.Where(project =>
                project.CreatedById == userId ||
                project.Members.Any(member => member.UserId == userId));
        }

        return await query
            .OrderByDescending(project => project.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<Project> AddMember(
        int projectId,
        int userId,
        CancellationToken cancellationToken)
    {
        if (userId <= 0)
            throw InvalidArgument("User id is required");

        var project = await Get(projectId, cancellationToken);

        if (project.Members.All(member => member.UserId != userId))
        {
            project.Members.Add(new ProjectMember { ProjectId = projectId, UserId = userId });
            await database.SaveChangesAsync(cancellationToken);
        }

        return project;
    }

    public async Task RemoveMember(
        int projectId,
        int userId,
        CancellationToken cancellationToken)
    {
        var member = await database.ProjectMembers.FirstOrDefaultAsync(
            candidate => candidate.ProjectId == projectId && candidate.UserId == userId,
            cancellationToken)
            ?? throw new RpcException(new Status(StatusCode.NotFound, "Project member not found"));

        database.ProjectMembers.Remove(member);
        await database.SaveChangesAsync(cancellationToken);
    }

    public async Task Delete(int id, CancellationToken cancellationToken)
    {
        var project = await database.Projects
            .Include(candidate => candidate.Members)
            .FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken)
            ?? throw new RpcException(new Status(StatusCode.NotFound, "Project not found"));

        database.Projects.Remove(project);
        await database.SaveChangesAsync(cancellationToken);
    }

    private static RpcException InvalidArgument(string message) =>
        new(new Status(StatusCode.InvalidArgument, message));
}
