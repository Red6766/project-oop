import { useEffect, useState } from "react";
import { generateAIDescription, projectApi, taskApi, userApi } from "./api";
import type { ProjectRes, TaskRes, UserRes } from "./api";
import { columns, priorityLabels, priorityColors, userName } from "./taskConstants";
import { TaskDetailModal } from "./TaskDetailPanel";

interface Props { projectId: number; userId: number; onBack: () => void; onDashboard?: () => void; onProjects?: () => void; onProfile?: () => void; onLogout?: () => void }

function CreateTaskModal({
  users,
  project,
  canAssign,
  currentUserId,
  onClose,
  onCreate,
}: {
  users: UserRes[];
  project: ProjectRes | null;
  canAssign: boolean;
  currentUserId: number;
  onClose: () => void;
  onCreate: (title: string, description: string, priority: number, assigneeId: number) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(2);
  const [assigneeId, setAssigneeId] = useState(currentUserId);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const memberUsers = users.filter(user => project?.memberIds.includes(user.id));

  const handleCreate = async () => {
    if (!title) { setError("Title is required"); return; }
    try { setError(""); await onCreate(title, description, priority, assigneeId); onClose(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to create task"); }
  };

  const handleAiGenerate = async () => {
    if (!title.trim()) { setError("Enter a title first"); return; }
    setAiLoading(true);
    setError("");
    try {
      const desc = await generateAIDescription(title);
      setDescription(desc);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: 32, maxWidth: 450, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>New Task</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#999" }}>x</button>
        </div>
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} autoFocus style={{ width: "100%", padding: "10px 12px", marginBottom: 12, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} style={{ flex: 1, padding: "10px 12px", border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }} />
          <button onClick={handleAiGenerate} disabled={aiLoading} className="keycap-btn keycap-btn-outline" style={{ whiteSpace: "nowrap", fontSize: 13 }}>
            {aiLoading ? "..." : "Generate"}
          </button>
        </div>
        <select value={priority} onChange={e => setPriority(Number(e.target.value))} style={{ width: "100%", padding: "10px 12px", marginBottom: 12, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }}>
          <option value={1}>Low</option><option value={2}>Medium</option><option value={3}>High</option><option value={4}>Critical</option>
        </select>
        {canAssign && (
          <select value={assigneeId} onChange={e => setAssigneeId(Number(e.target.value))} style={{ width: "100%", padding: "10px 12px", marginBottom: 12, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }}>
            {memberUsers.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
          </select>
        )}
        {error && <p style={{ color: "red", fontSize: 14, marginBottom: 8 }}>{error}</p>}
        <button onClick={handleCreate} className="keycap-btn keycap-btn-solid" style={{ width: "100%", padding: 10, fontSize: 15 }}>Create</button>
      </div>
    </div>
  );
}

export function TasksPage({ projectId, userId, onBack, onDashboard, onProjects, onProfile, onLogout }: Props) {
  const [tasks, setTasks] = useState<TaskRes[]>([]);
  const [project, setProject] = useState<ProjectRes | null>(null);
  const [users, setUsers] = useState<UserRes[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskRes | null>(null);
  const [statusError, setStatusError] = useState("");
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; task: TaskRes } | null>(null);
  const [membersProject, setMembersProject] = useState<ProjectRes | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const isProjectAdmin = project?.adminIds.includes(userId) ?? false;

  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [ctxMenu]);

  const load = () => taskApi.list(projectId).then(setTasks);
  const loadProject = async () => {
    const loadedProject = await projectApi.get(projectId);
    setProject(loadedProject);
    return loadedProject;
  };
  useEffect(() => { load(); loadProject().catch(() => null); }, [projectId]);
  useEffect(() => {
    userApi.list().then(setUsers).catch(e => setStatusError(e instanceof Error ? e.message : "Failed to load users"));
  }, []);

  const handleCreate = async (title: string, description: string, priority: number, assigneeId: number) => {
    await taskApi.create({ title, description, projectId, createdById: userId, priority, assigneeId });
    await load();
  };

  const assignTask = async (taskId: number, assigneeId: number) => {
    try {
      setStatusError("");
      await taskApi.assign(taskId, assigneeId);
      await load();
    } catch (error: unknown) {
      setStatusError(error instanceof Error ? error.message : "Failed to assign task");
    }
  };

  const changeStatus = async (taskId: number, status: number) => {
    try {
      setStatusError("");
      await taskApi.changeStatus(taskId, { status });
      await load();
    } catch (error: unknown) {
      setStatusError(error instanceof Error ? error.message : "Failed to change status");
    }
  };

  const onDragStart = (e: React.DragEvent, taskId: number) => { e.dataTransfer.setData("text/plain", String(taskId)); };
  const onDrop = (e: React.DragEvent, newStatus: number) => {
    e.preventDefault();
    const taskId = Number(e.dataTransfer.getData("text/plain"));
    const task = tasks.find(item => item.id === taskId);
    if (!task || newStatus !== task.status + 1) {
      setStatusError("Tasks can only move to the next status");
      return;
    }
    changeStatus(taskId, newStatus);
  };

  return (
    <div style={{ height: "100vh", overflow: "hidden" }}>
      {/* Content wrapper */}
      <div style={{
        height: "100vh",
        overflow: "clip",
        display: "flex",
        flexDirection: "column",
      }}>
      {showCreate && (
        <CreateTaskModal
          users={users}
          project={project}
          canAssign={isProjectAdmin}
          currentUserId={userId}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {/* Navigation */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #eee", paddingRight: detailTask ? 444 : 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {onDashboard && <button onClick={onDashboard} className="keycap-btn keycap-btn-outline">Home</button>}
            {onProjects && <button onClick={onProjects} className="keycap-btn keycap-btn-outline">My Projects</button>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {onProfile && <button onClick={onProfile} className="keycap-btn keycap-btn-outline">Profile</button>}
            {onLogout && <button onClick={onLogout} className="keycap-btn keycap-btn-ghost">Logout</button>}
          </div>
        </div>
      </div>

      {/* Members modal */}
      {membersProject && (
        <div onClick={() => setMembersProject(null)} className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} className="modal-content" style={{ background: "#fff", padding: 32, maxWidth: 500, width: "92%", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0 }}>Invite members</h3>
              <button onClick={() => setMembersProject(null)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#999" }}>x</button>
            </div>
            <p style={{ margin: "0 0 12px", color: "#666", fontSize: 14 }}>{membersProject.name}</p>

            <input placeholder="Search by username or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />

            <div>
              <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#666" }}>Members</h4>
              {users.filter(u => membersProject.memberIds.includes(u.id)).map(user => (
                <div key={user.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{user.username}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#777" }}>
                      {membersProject.adminIds.includes(user.id) ? "Admin" : "Executor"}
                    </span>
                    <button onClick={async () => {
                      try {
                        await projectApi.removeMember(membersProject.id, user.id);
                        const updated = await projectApi.get(membersProject.id);
                        setMembersProject(updated);
                        setProject(updated);
                        await load();
                      } catch (err) {
                        alert(err instanceof Error ? err.message : "Failed");
                      }
                    }} className="keycap-btn keycap-btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }}>Remove</button>
                  </div>
                </div>
              ))}
              {users.filter(u => membersProject.memberIds.includes(u.id)).length === 0 && <p style={{ color: "#999", fontSize: 13 }}>No members yet.</p>}
            </div>

            {searchQuery.trim() && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#666" }}>Search results</h4>
                {users.filter(u => !membersProject.memberIds.includes(u.id) && (u.username.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))).map(user => (
                  <div key={user.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{user.username}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>{user.email}</div>
                    </div>
                    <button onClick={async () => {
                      try {
                        const updated = await projectApi.addMember(membersProject.id, user.id);
                        setMembersProject(updated);
                        setProject(updated);
                        setSearchQuery("");
                      } catch (err) {
                        alert(err instanceof Error ? err.message : "Failed");
                      }
                    }} className="keycap-btn keycap-btn-outline" style={{ padding: "4px 10px", fontSize: 12 }}>Add</button>
                  </div>
                ))}
                {users.filter(u => !membersProject.memberIds.includes(u.id) && (u.username.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && <p style={{ color: "#999", fontSize: 13 }}>No users found.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Context menu */}
      {ctxMenu && (
        <div style={{ position: "fixed", left: ctxMenu.x, top: ctxMenu.y, zIndex: 2000, background: "#fff", border: "1px solid #222", boxShadow: "0 3px 0 #000, 0 4px 12px rgba(0,0,0,0.12)", minWidth: 160 }}>
          <button
            onClick={async () => {
              const t = ctxMenu.task;
              setCtxMenu(null);
              try { await taskApi.delete(t.id); load(); }
              catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
            }}
            className="keycap-btn keycap-btn-outline"
            style={{ width: "100%", padding: "8px 16px", fontSize: 13, textAlign: "left" }}
          >
            Delete task
          </button>
        </div>
      )}

      {/* Back / Invite / New Task — static, slide left */}
      <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: detailTask ? 444 : 24 }}>
        <button onClick={onBack} className="back-btn keycap-btn keycap-btn-ghost" style={{ padding: "6px 12px", fontSize: 14 }}>Back to Projects</button>
        <div style={{ display: "flex", gap: 8 }}>
          {project?.adminIds.includes(userId) && (
            <button onClick={() => setMembersProject(project)} className="keycap-btn keycap-btn-outline" style={{ fontSize: 13 }}>
              Invite
            </button>
          )}
          <button onClick={() => setShowCreate(true)} className="keycap-btn keycap-btn-solid">+ New Task</button>
        </div>
      </div>

      {statusError && <p style={{ color: "red", fontSize: 14, marginBottom: 12, padding: "0 24px" }}>{statusError}</p>}

      {/* Columns area — scales when panel opens */}
      <div style={{ flex: 1, minHeight: 0, overflow: detailTask ? "hidden" : "", padding: "0 24px 32px" }}>
      <div style={{
        height: detailTask ? "calc(100% / 0.72)" : "100%",
        display: "flex",
        flexDirection: "column",
        maxWidth: detailTask ? "calc((100vw - 420px) / 0.755)" : "100%",
        transform: detailTask ? "scale(0.72)" : "scale(1)",
        transformOrigin: "left top",
        transition: "transform 0.15s ease, max-width 0.15s ease",
      }}>
        <div style={{ display: "flex", gap: 16, overflowX: "auto", flex: 1, minHeight: 0 }}>
          {columns.map(col => (
            <div key={col.key} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, col.key)} style={{ flex: "1 1 0%", minWidth: 180, background: "#f5f5f5", padding: "12px 12px 32px", overflowY: "auto" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#555" }}>{col.title}</h3>
              {tasks.filter(t => t.status === col.key).map(t => (
                <div key={t.id} draggable onDragStart={e => onDragStart(e, t.id)} onClick={() => setDetailTask(detailTask?.id === t.id ? null : t)} onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY, task: t }); }} style={{ padding: 12, marginBottom: 8, background: "#fff", border: "1px solid #e0e0e0", cursor: "pointer", boxShadow: "0 2px 0 #d0d0d0, 0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: 14 }}>{t.title}</strong>
                    <span style={{ fontSize: 11, padding: "2px 6px", background: priorityColors[t.priority] || "#999", color: "#fff" }}>{priorityLabels[t.priority] || "?"}</span>
                  </div>
                  {t.description && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>{t.description}</p>}
                  <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>Assignee: <strong>{userName(users, t.assigneeId)}</strong></div>
                  {isProjectAdmin && (
                    <select
                      value={t.assigneeId}
                      onClick={e => e.stopPropagation()}
                      onChange={e => assignTask(t.id, Number(e.target.value))}
                      style={{ width: "100%", marginTop: 8, padding: "6px 8px", border: "1px solid #ddd", fontSize: 13 }}
                    >
                      {users.filter(user => project?.memberIds.includes(user.id)).map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
                    </select>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      </div>
      </div>

      {/* Side panel for task details */}
      {detailTask && (
        <div style={{ position: "fixed", top: 0, right: 0, width: 420, height: "100vh", borderLeft: "1px solid #e0e0e0", overflowY: "auto", background: "#fff", zIndex: 100, boxShadow: "-4px 0 12px rgba(0,0,0,0.06)" }}>
          <TaskDetailModal task={detailTask} users={users} projectId={projectId} userId={userId} onClose={() => setDetailTask(null)} />
        </div>
      )}
      </div>
  );
}
