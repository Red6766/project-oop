import { useEffect, useState } from "react";
import { projectApi, userApi } from "./api";
import type { ProjectRes, UserRes } from "./api";

interface Props { userId: number; onSelectProject: (projectId: number) => void; onLogout: () => void; onProfile: () => void; onDashboard: () => void }

function MembersModal({
  project,
  users,
  onClose,
  onAdd,
  onRemove,
}: {
  project: ProjectRes;
  users: UserRes[];
  onClose: () => void;
  onAdd: (userId: number) => Promise<void>;
  onRemove: (userId: number) => Promise<void>;
}) {
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const members = users.filter(user => project.memberIds.includes(user.id));
  const available = users.filter(user => !project.memberIds.includes(user.id));

  const run = async (userId: number, action: (userId: number) => Promise<void>) => {
    setBusyUserId(userId);
    try { await action(userId); }
    finally { setBusyUserId(null); }
  };

  return (
    <div onClick={onClose} className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} className="modal-content" style={{ background: "#fff", padding: 32, maxWidth: 620, width: "92%", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>Project members</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#999" }}>x</button>
        </div>
        <p style={{ margin: "0 0 16px", color: "#666", fontSize: 14 }}>{project.name}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#666" }}>Members</h4>
            {members.map(user => (
              <div key={user.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{user.username}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{user.email}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "#777" }}>
                    {project.adminIds.includes(user.id) ? "Admin" : "Executor"}
                  </span>
                  <button disabled={busyUserId === user.id} onClick={() => run(user.id, onRemove)} className="keycap-btn keycap-btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }}>Remove</button>
                </div>
              </div>
            ))}
            {members.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>No members yet.</p>}
          </div>

          <div>
            <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#666" }}>Available users</h4>
            {available.map(user => (
              <div key={user.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{user.username}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{user.email}</div>
                </div>
                <button disabled={busyUserId === user.id} onClick={() => run(user.id, onAdd)} className="keycap-btn keycap-btn-outline" style={{ padding: "4px 10px", fontSize: 12 }}>Add</button>
              </div>
            ))}
            {available.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>Everyone is already added.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectsPage({ userId, onSelectProject, onLogout, onProfile, onDashboard }: Props) {
  const [projects, setProjects] = useState<ProjectRes[]>([]);
  const [users, setUsers] = useState<UserRes[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [membersProject, setMembersProject] = useState<ProjectRes | null>(null);
  const [viewMembersProject, setViewMembersProject] = useState<ProjectRes | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; project: ProjectRes } | null>(null);

  // Close context menu on click outside
  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [ctxMenu]);

  const load = async () => {
    const loadedProjects = await projectApi.list();
    setProjects(loadedProjects);
    if (membersProject) {
      setMembersProject(loadedProjects.find(project => project.id === membersProject.id) || null);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    userApi.list().then(setUsers).catch(e => setError(e instanceof Error ? e.message : "Failed to load users"));
  }, []);

  const create = async () => {
    if (!name) return;
    await projectApi.create({ name, description, createdById: userId });
    setName(""); setDescription(""); setShowModal(false); load();
  };

  const addMember = async (projectId: number, memberId: number) => {
    const updated = await projectApi.addMember(projectId, memberId);
    setProjects(prev => prev.map(project => project.id === updated.id ? updated : project));
    setMembersProject(updated);
  };

  const removeMember = async (projectId: number, memberId: number) => {
    await projectApi.removeMember(projectId, memberId);
    const updated = await projectApi.get(projectId);
    setProjects(prev => prev.map(project => project.id === updated.id ? updated : project));
    setMembersProject(updated);
  };

  return (
    <div>
      {/* Read-only members view */}
      {viewMembersProject && (
        <div onClick={() => setViewMembersProject(null)} className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} className="modal-content" style={{ background: "#fff", padding: 32, maxWidth: 400, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0 }}>{viewMembersProject.name}</h3>
              <button onClick={() => setViewMembersProject(null)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#999" }}>x</button>
            </div>
            <p style={{ margin: "0 0 12px", color: "#666", fontSize: 14 }}>Members ({viewMembersProject.memberIds.length})</p>
            {users.filter(u => viewMembersProject.memberIds.includes(u.id)).map(user => (
              <div key={user.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #eee" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#222", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "bold" }}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{user.username}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{user.email}</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#777" }}>
                  {viewMembersProject.adminIds.includes(user.id) ? "Admin" : "Executor"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {membersProject && (
        <MembersModal
          project={membersProject}
          users={users}
          onClose={() => setMembersProject(null)}
          onAdd={memberId => addMember(membersProject.id, memberId)}
          onRemove={memberId => removeMember(membersProject.id, memberId)}
        />
      )}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: 32, maxWidth: 450, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 16px" }}>New Project</h3>
            <input placeholder="Project name" value={name} onChange={e => setName(e.target.value)} autoFocus style={{ width: "100%", padding: "10px 12px", marginBottom: 12, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box" }} />
            <textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} className="keycap-btn keycap-btn-ghost">Cancel</button>
              <button onClick={create} className="keycap-btn keycap-btn-solid">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Full-width navigation */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onDashboard} className="keycap-btn keycap-btn-outline">Home</button>
            <button className="keycap-btn keycap-btn-solid" style={{ cursor: "default" }}>My Projects</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onProfile} className="keycap-btn keycap-btn-outline">Profile</button>
            <button onClick={onLogout} className="keycap-btn keycap-btn-ghost">Logout</button>
          </div>
        </div>
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <div style={{ position: "fixed", left: ctxMenu.x, top: ctxMenu.y, zIndex: 2000, background: "#fff", border: "1px solid #222", boxShadow: "0 3px 0 #000, 0 4px 12px rgba(0,0,0,0.12)", minWidth: 160 }}>
          <button
            onClick={async () => {
              const p = ctxMenu.project;
              setCtxMenu(null);
              try { await projectApi.delete(p.id); load(); }
              catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
            }}
            className="keycap-btn keycap-btn-outline"
            style={{ width: "100%", padding: "8px 16px", fontSize: 13, textAlign: "left" }}
          >
            Delete project
          </button>
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 24px 24px" }}>
        <button onClick={() => setShowModal(true)} className="keycap-btn keycap-btn-solid" style={{ marginBottom: 16 }}>+ New Project</button>
        {error && <p style={{ color: "red", fontSize: 14, marginBottom: 12 }}>{error}</p>}

        {projects.map(p => {
          const memberUsers = users.filter(u => p.memberIds.includes(u.id));
          const displayMembers = memberUsers.slice(0, 3);
          const overflow = memberUsers.length - 3;
          return (
          <div key={p.id} onClick={() => onSelectProject(p.id)} onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY, project: p }); }} className="keycap-card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <strong>{p.name}</strong>
                {p.description && <p style={{ margin: "2px 0 0", color: "#666", fontSize: 13 }}>{p.description}</p>}
              </div>
              <div onClick={e => { e.stopPropagation(); setViewMembersProject(p); }} style={{ display: "flex", alignItems: "center", gap: 2, cursor: "pointer" }}>
                {displayMembers.map((u, i) => (
                  <div key={u.id} style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? "#222" : i === 1 ? "#555" : "#888", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: "bold", marginLeft: i > 0 ? -8 : 0, border: "1px solid #fff" }}>
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                ))}
                {overflow > 0 && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#ccc", color: "#333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: "bold", marginLeft: -8, border: "1px solid #fff" }}>
                    +{overflow}
                  </div>
                )}
                {memberUsers.length === 0 && <div style={{ fontSize: 12, color: "#999" }}>0 members</div>}
              </div>
            </div>
          </div>
          );
        })}
        {projects.length === 0 && <p style={{ color: "#999", textAlign: "center", marginTop: 40 }}>No projects yet.</p>}
      </div>
    </div>
  );
}
