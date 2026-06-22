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
public class TaskItem{public int Id{get;set;}public string Title{get;set;}="";public string Description{get;set;}="";public int ProjectId{get;set;}public int Status{get;set;}public int Priority{get;set;}public int CreatedById{get;set;}public DateTime CreatedAt{get;set;}=DateTime.UtcNow;}
public class TaskLogic{
    readonly TaskDb _db;public TaskLogic(TaskDb db)=>_db=db;
    public async Task<TaskItem> Create(string t,string d,int pid,int prio,int uid,CancellationToken ct){var ti=new TaskItem{Title=t,Description=d,ProjectId=pid,Priority=prio,CreatedById=uid,Status=1};_db.Tasks.Add(ti);await _db.SaveChangesAsync(ct);return ti;}
    public async Task<List<TaskItem>> List(int pid,CancellationToken ct)=>await _db.Tasks.Where(t=>t.ProjectId==pid).OrderByDescending(t=>t.CreatedAt).ToListAsync(ct);
    public async Task<TaskItem> ChangeStatus(int tid,int st,int aid,CancellationToken ct){var t=await _db.Tasks.FirstOrDefaultAsync(x=>x.Id==tid,ct)??throw new RpcException(new Status(StatusCode.NotFound,"Task not found"));if(st!=t.Status+1)throw new RpcException(new Status(StatusCode.InvalidArgument,"Task can only move to the next status"));t.Status=st;await _db.SaveChangesAsync(ct);return t;}
}
public class TaskHandler:TaskManagement.Grpc.TaskService.TaskServiceBase{
    readonly TaskLogic _svc;public TaskHandler(TaskLogic svc)=>_svc=svc;
    public override async Task<TaskResponse> CreateTask(CreateTaskRequest r,ServerCallContext ctx){var t=await _svc.Create(r.Title,r.Description,r.ProjectId,(int)r.Priority,r.CreatedById,ctx.CancellationToken);return ToProto(t);}
    public override async Task<ListTasksResponse> ListTasks(ListTasksRequest r,ServerCallContext ctx){var l=await _svc.List(r.ProjectId,ctx.CancellationToken);var resp=new ListTasksResponse();foreach(var t in l)resp.Tasks.Add(ToProto(t));return resp;}
    public override async Task<TaskResponse> ChangeStatus(ChangeTaskStatusRequest r,ServerCallContext ctx){var t=await _svc.ChangeStatus(r.TaskId,(int)r.Status,r.ActorId,ctx.CancellationToken);return ToProto(t);}
    static TaskResponse ToProto(TaskItem t)=>new(){Id=t.Id,Title=t.Title,Description=t.Description,ProjectId=t.ProjectId,Status=(TaskManagement.Grpc.TaskStatus)t.Status,Priority=(TaskManagement.Grpc.TaskPriority)t.Priority,CreatedById=t.CreatedById};}
