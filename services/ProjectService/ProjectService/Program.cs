using Grpc.Core;
using Google.Protobuf.WellKnownTypes;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Grpc;

var b=WebApplication.CreateBuilder(args);
b.WebHost.ConfigureKestrel(o=>o.ConfigureEndpointDefaults(lo=>lo.Protocols=HttpProtocols.Http2));
b.Services.AddGrpc();
b.Services.AddDbContext<ProjectDb>(o=>o.UseNpgsql(b.Configuration.GetConnectionString("DefaultConnection")));
b.Services.AddScoped<ProjectLogic>();
var app=b.Build();
using(var s=app.Services.CreateScope())
{
    var db=s.ServiceProvider.GetRequiredService<ProjectDb>();
    db.Database.EnsureCreated();
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS "ProjectMembers" (
            "ProjectId" integer NOT NULL,
            "UserId" integer NOT NULL,
            CONSTRAINT "PK_ProjectMembers" PRIMARY KEY ("ProjectId", "UserId"),
            CONSTRAINT "FK_ProjectMembers_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id") ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS "IX_ProjectMembers_UserId" ON "ProjectMembers" ("UserId");
        INSERT INTO "ProjectMembers" ("ProjectId", "UserId")
        SELECT "Id", "CreatedById" FROM "Projects"
        WHERE "CreatedById" > 0
        ON CONFLICT DO NOTHING;
        """);
}
app.MapGrpcService<ProjectHandler>();
app.Run();

public class ProjectDb:DbContext
{
    public ProjectDb(DbContextOptions<ProjectDb>o):base(o){}
    public DbSet<Project> Projects=>Set<Project>();
    public DbSet<ProjectMember> ProjectMembers=>Set<ProjectMember>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>(entity =>
        {
            entity.Property(project => project.Name).HasMaxLength(200).IsRequired();
            entity.Property(project => project.Description).HasMaxLength(2000);
            entity.HasMany(project => project.Members)
                .WithOne(member => member.Project)
                .HasForeignKey(member => member.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProjectMember>(entity =>
        {
            entity.HasKey(member => new { member.ProjectId, member.UserId });
            entity.HasIndex(member => member.UserId);
        });
    }
}

public class Project
{
    public int Id{get;set;}
    public string Name{get;set;}="";
    public string Description{get;set;}="";
    public int CreatedById{get;set;}
    public List<ProjectMember> Members{get;set;}=[];
}

public class ProjectMember
{
    public int ProjectId{get;set;}
    public int UserId{get;set;}
    public Project Project{get;set;}=null!;
}

public class ProjectLogic
{
    readonly ProjectDb _db;
    public ProjectLogic(ProjectDb db)=>_db=db;

    public async Task<Project> Create(string name,string description,int userId,CancellationToken ct)
    {
        name=name.Trim();
        if(string.IsNullOrWhiteSpace(name))throw InvalidArgument("Project name is required");
        if(userId<=0)throw InvalidArgument("Project creator is required");

        var project=new Project{Name=name,Description=description.Trim(),CreatedById=userId};
        project.Members.Add(new ProjectMember{UserId=userId});
        _db.Projects.Add(project);
        await _db.SaveChangesAsync(ct);
        return project;
    }

    public async Task<Project> Get(int id,CancellationToken ct)=>await _db.Projects
        .Include(project=>project.Members)
        .FirstOrDefaultAsync(project=>project.Id==id,ct)
        ?? throw new RpcException(new Status(StatusCode.NotFound,"Project not found"));

    public async Task<List<Project>> List(int userId,CancellationToken ct)
    {
        var query=_db.Projects.Include(project=>project.Members).AsQueryable();
        if(userId>0)
            query=query.Where(project=>project.CreatedById==userId||project.Members.Any(member=>member.UserId==userId));

        return await query.OrderByDescending(project=>project.Id).ToListAsync(ct);
    }

    public async Task<Project> AddMember(int projectId,int userId,CancellationToken ct)
    {
        if(userId<=0)throw InvalidArgument("User id is required");
        var project=await Get(projectId,ct);

        if(project.Members.All(member=>member.UserId!=userId))
        {
            project.Members.Add(new ProjectMember{ProjectId=projectId,UserId=userId});
            await _db.SaveChangesAsync(ct);
        }

        return project;
    }

    public async Task RemoveMember(int projectId,int userId,CancellationToken ct)
    {
        var member=await _db.ProjectMembers.FirstOrDefaultAsync(
            candidate=>candidate.ProjectId==projectId&&candidate.UserId==userId,ct)
            ?? throw new RpcException(new Status(StatusCode.NotFound,"Project member not found"));

        _db.ProjectMembers.Remove(member);
        await _db.SaveChangesAsync(ct);
    }

    static RpcException InvalidArgument(string message)=>new(new Status(StatusCode.InvalidArgument,message));
}

public class ProjectHandler:ProjectService.ProjectServiceBase
{
    readonly ProjectLogic _svc;
    public ProjectHandler(ProjectLogic svc)=>_svc=svc;

    public override async Task<ProjectResponse> CreateProject(CreateProjectRequest r,ServerCallContext ctx)
    {
        var project=await _svc.Create(r.Name,r.Description,r.CreatedById,ctx.CancellationToken);
        return ToProto(project);
    }

    public override async Task<ProjectResponse> GetProject(GetProjectRequest r,ServerCallContext ctx)
    {
        var project=await _svc.Get(r.Id,ctx.CancellationToken);
        return ToProto(project);
    }

    public override async Task<ListProjectsResponse> ListProjects(ListProjectsRequest r,ServerCallContext ctx)
    {
        var projects=await _svc.List(r.UserId,ctx.CancellationToken);
        var response=new ListProjectsResponse();
        foreach(var project in projects)response.Projects.Add(ToProto(project));
        return response;
    }

    public override async Task<ProjectResponse> AddMember(AddProjectMemberRequest r,ServerCallContext ctx)
    {
        var project=await _svc.AddMember(r.ProjectId,r.UserId,ctx.CancellationToken);
        return ToProto(project);
    }

    public override async Task<Empty> RemoveMember(RemoveProjectMemberRequest r,ServerCallContext ctx)
    {
        await _svc.RemoveMember(r.ProjectId,r.UserId,ctx.CancellationToken);
        return new Empty();
    }

    static ProjectResponse ToProto(Project project)
    {
        var response=new ProjectResponse{Id=project.Id,Name=project.Name,Description=project.Description,CreatedById=project.CreatedById};
        response.MemberIds.AddRange(project.Members.Select(member=>member.UserId));
        return response;
    }
}
