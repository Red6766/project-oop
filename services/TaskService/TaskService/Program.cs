using Grpc.Core;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using TaskManagement.Grpc;
var b=WebApplication.CreateBuilder(args);
b.WebHost.ConfigureKestrel(o=>o.ConfigureEndpointDefaults(lo=>lo.Protocols=HttpProtocols.Http2));
b.Services.AddGrpc();
b.Services.AddDbContext<TaskDb>(o=>o.UseNpgsql(b.Configuration.GetConnectionString("DefaultConnection")));
b.Services.AddScoped<TaskLogic>();
var app=b.Build();
using(var s=app.Services.CreateScope()){await s.ServiceProvider.GetRequiredService<TaskDb>().Database.MigrateAsync();}
app.MapGrpcService<TaskHandler>();
app.Run();

public class TaskDb:DbContext{public TaskDb(DbContextOptions<TaskDb>o):base(o){}public DbSet<TaskItem> Tasks=>Set<TaskItem>();}
public class TaskItem{public int Id{get;set;}public string Title{get;set;}="";public string Description{get;set;}="";public int ProjectId{get;set;}public int AssigneeId{get;set;}public int Status{get;set;}public int Priority{get;set;}public int CreatedById{get;set;}public DateTime CreatedAt{get;set;}=DateTime.UtcNow;public DateTime UpdatedAt{get;set;}=DateTime.UtcNow;}
public class TaskLogic{
    readonly TaskDb _db;public TaskLogic(TaskDb db)=>_db=db;
    public async Task<TaskItem> Create(string t,string d,int pid,int prio,int uid,int assigneeId,CancellationToken ct){t=t.Trim();if(string.IsNullOrWhiteSpace(t))throw InvalidArgument("Task title is required");var now=DateTime.UtcNow;var ti=new TaskItem{Title=t,Description=d.Trim(),ProjectId=pid,Priority=prio,CreatedById=uid,AssigneeId=assigneeId,Status=1,CreatedAt=now,UpdatedAt=now};_db.Tasks.Add(ti);await _db.SaveChangesAsync(ct);return ti;}
    public async Task<TaskItem> Get(int id,CancellationToken ct)=>await _db.Tasks.FirstOrDefaultAsync(x=>x.Id==id,ct)??throw new RpcException(new Status(StatusCode.NotFound,"Task not found"));
    public async Task<List<TaskItem>> List(int pid,CancellationToken ct)=>await _db.Tasks.Where(t=>t.ProjectId==pid).OrderByDescending(t=>t.CreatedAt).ToListAsync(ct);
    public async Task<TaskItem> Assign(int tid,int assigneeId,CancellationToken ct){if(assigneeId<=0)throw InvalidArgument("Assignee id is required");var t=await Get(tid,ct);t.AssigneeId=assigneeId;t.UpdatedAt=DateTime.UtcNow;await _db.SaveChangesAsync(ct);return t;}
    public async Task<TaskItem> ChangeStatus(int tid,int st,int aid,CancellationToken ct){var t=await Get(tid,ct);if(st!=t.Status+1)throw new RpcException(new Status(StatusCode.InvalidArgument,"Task can only move to the next status"));t.Status=st;t.UpdatedAt=DateTime.UtcNow;await _db.SaveChangesAsync(ct);return t;}
    static RpcException InvalidArgument(string message)=>new(new Status(StatusCode.InvalidArgument,message));
}
public class TaskHandler:TaskManagement.Grpc.TaskService.TaskServiceBase{
    readonly TaskLogic _svc;public TaskHandler(TaskLogic svc)=>_svc=svc;
    public override async Task<TaskResponse> CreateTask(CreateTaskRequest r,ServerCallContext ctx){var t=await _svc.Create(r.Title,r.Description,r.ProjectId,(int)r.Priority,r.CreatedById,r.AssigneeId,ctx.CancellationToken);return ToProto(t);}
    public override async Task<TaskResponse> GetTask(GetTaskRequest r,ServerCallContext ctx){var t=await _svc.Get(r.Id,ctx.CancellationToken);return ToProto(t);}
    public override async Task<ListTasksResponse> ListTasks(ListTasksRequest r,ServerCallContext ctx){var l=await _svc.List(r.ProjectId,ctx.CancellationToken);var resp=new ListTasksResponse();foreach(var t in l)resp.Tasks.Add(ToProto(t));return resp;}
    public override async Task<TaskResponse> AssignTask(AssignTaskRequest r,ServerCallContext ctx){var t=await _svc.Assign(r.TaskId,r.AssigneeId,ctx.CancellationToken);return ToProto(t);}
    public override async Task<TaskResponse> ChangeStatus(ChangeTaskStatusRequest r,ServerCallContext ctx){var t=await _svc.ChangeStatus(r.TaskId,(int)r.Status,r.ActorId,ctx.CancellationToken);return ToProto(t);}
    static TaskResponse ToProto(TaskItem t)=>new(){Id=t.Id,Title=t.Title,Description=t.Description,ProjectId=t.ProjectId,AssigneeId=t.AssigneeId,Status=(TaskManagement.Grpc.TaskStatus)t.Status,Priority=(TaskManagement.Grpc.TaskPriority)t.Priority,CreatedById=t.CreatedById,CreatedAt=Google.Protobuf.WellKnownTypes.Timestamp.FromDateTime(DateTime.SpecifyKind(t.CreatedAt,DateTimeKind.Utc)),UpdatedAt=Google.Protobuf.WellKnownTypes.Timestamp.FromDateTime(DateTime.SpecifyKind(t.UpdatedAt,DateTimeKind.Utc))};}
