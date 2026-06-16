using Grpc.Core;
using TaskManagement.Application.Interfaces;
using TaskManagement.Grpc;
using Google.Protobuf.WellKnownTypes;

namespace TaskManagement.Infrastructure.Services;

public class ProjectServiceHandler : ProjectService.ProjectServiceBase
{
    private readonly IProjectService _projectService;

    public ProjectServiceHandler(IProjectService projectService)
    {
        _projectService = projectService;
    }

    public override async Task<ProjectResponse> CreateProject(CreateProjectRequest request, ServerCallContext context)
    {
        var project = await _projectService.CreateAsync(request.Name, request.Description, request.CreatedById, context.CancellationToken);
        return new ProjectResponse
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            CreatedById = project.CreatedById
        };
    }

    public override async Task<ProjectResponse> GetProject(GetProjectRequest request, ServerCallContext context)
    {
        var project = await _projectService.GetByIdAsync(request.Id, context.CancellationToken);
        if (project is null)
            throw new RpcException(new Status(StatusCode.NotFound, "Project not found"));

        return new ProjectResponse
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            CreatedById = project.CreatedById
        };
    }

    public override async Task<ListProjectsResponse> ListProjects(ListProjectsRequest request, ServerCallContext context)
    {
        var projects = await _projectService.ListAsync(context.CancellationToken);
        var response = new ListProjectsResponse();
        foreach (var p in projects)
        {
            response.Projects.Add(new ProjectResponse
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                CreatedById = p.CreatedById
            });
        }
        return response;
    }

    public override async Task<ProjectResponse> AddMember(AddProjectMemberRequest request, ServerCallContext context)
    {
        var project = await _projectService.AddMemberAsync(request.ProjectId, request.UserId, context.CancellationToken);
        return new ProjectResponse
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            CreatedById = project.CreatedById
        };
    }

    public override async Task<Empty> RemoveMember(RemoveProjectMemberRequest request, ServerCallContext context)
    {
        await _projectService.RemoveMemberAsync(request.ProjectId, request.UserId, context.CancellationToken);
        return new Empty();
    }
}