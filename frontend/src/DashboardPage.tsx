import { useEffect, useState } from "react";
import { getAllTasks, taskApi } from "./api";
import type { TaskWithProject } from "./api";

interface Props {
  userId: number;
  onSelectProject: (projectId: number) => void;
  onProjects: () => void;
  onProfile: () => void;
  onLogout: () => void;
}

const columns = [
  { key: 1, title: "To Do" },
  { key: 2, title: "In Progress" },
  { key: 3, title: "Review" },
  { key: 4, title: "Done" },
];

const priorityLabels: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High", 4: "Critical" };
const priorityColors: Record<number, string> = { 1: "#d4d4d4", 2: "#c0c0c0", 3: "#a8a8a8", 4: "#888888" };

const projectPalette = [
  { bg: "#f5ecec", border: "#dbb5b5", text: "#a07070" },   // muted pink
  { bg: "#ecf0f5", border: "#b5c8db", text: "#7088a0" },   // muted blue
  { bg: "#f5f0ec", border: "#dbc9b5", text: "#a08870" },   // muted tan
  { bg: "#eef5ec", border: "#bcdbb5", text: "#78a070" },   // muted green
  { bg: "#f5ecf3", border: "#dbb5cf", text: "#a07090" },   // muted purple
  { bg: "#ecf5f5", border: "#b5d4db", text: "#7098a0" },   // muted teal
  { bg: "#f5f0ec", border: "#dbceb5", text: "#a09070" },   // muted gold
  { bg: "#f2ecf5", border: "#c8b5db", text: "#8070a0" },   // muted violet
  { bg: "#f5ecec", border: "#dbbfc5", text: "#a07880" },   // muted rose
  { bg: "#ecf5f0", border: "#b5dbc8", text: "#70a088" },   // muted sage
];

export function DashboardPage({ userId, onSelectProject, onProjects, onProfile, onLogout }: Props) {
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  const toggleTask = (id: number) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const [statusError, setStatusError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const all = await getAllTasks();
      setTasks(all);
    } catch (e: unknown) {
      setStatusError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const changeStatus = async (taskId: number, status: number) => {
    try {
      setStatusError("");
      await taskApi.changeStatus(taskId, { status, actorId: userId });
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
    <div>
      {/* Navigation — full width */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => {}} className="keycap-btn keycap-btn-solid">Home</button>
            <button onClick={onProjects} className="keycap-btn keycap-btn-outline">My Projects</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onProfile} className="keycap-btn keycap-btn-outline">Profile</button>
            <button onClick={onLogout} className="keycap-btn keycap-btn-ghost">Logout</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: "0 0 4px" }}>Dashboard</h2>
        <p style={{ margin: "0 0 16px", color: "#999", fontSize: 14 }}>All tasks across all projects</p>

        {statusError && <p style={{ color: "red", fontSize: 14, marginBottom: 12 }}>{statusError}</p>}

        {loading ? (
          <p style={{ color: "#999", textAlign: "center", marginTop: 40 }}>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p style={{ color: "#999", textAlign: "center", marginTop: 40 }}>No tasks yet. Create one in a project.</p>
        ) : (
          <div style={{ display: "flex", gap: 16, overflowX: "auto" }}>
            {(() => {
              const allProjectNames = [...new Set(tasks.map(t => t.projectName))];
              const projectColorMap = new Map<string, (typeof projectPalette)[number]>();
              allProjectNames.forEach((name, i) => {
                projectColorMap.set(name, projectPalette[i % projectPalette.length]);
              });

              return columns.map(col => {
                const colTasks = tasks.filter(t => t.status === col.key);
                const groups = new Map<string, TaskWithProject[]>();
                colTasks.forEach(t => {
                  const g = groups.get(t.projectName) || [];
                  g.push(t);
                  groups.set(t.projectName, g);
                });
                const projectNames = [...groups.keys()];
                return (
                  <div key={col.key} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, col.key)} style={{ minWidth: 280, flex: 1, background: "#f5f5f5", padding: 12 }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#111" }}>{col.title} ({colTasks.length})</h3>
                    {projectNames.map(pname => {
                      const color = projectColorMap.get(pname)!;
                      return (
                        <div key={pname} style={{ marginBottom: 12, background: color.bg, borderLeft: `4px solid ${color.border}`, padding: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: "bold", color: color.text, marginBottom: 6, padding: "0 4px" }}>{pname}</div>
                          {groups.get(pname)!.map(t => {
                            const isExpanded = expandedTasks.has(t.id);
                            return (
                              <div key={t.id}>
                                <div
                                  draggable
                                  onDragStart={e => onDragStart(e, t.id)}
                                  onClick={() => toggleTask(t.id)}
                                  className="keycap-card"
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <strong style={{ fontSize: 14 }}>{t.title}</strong>
                                    <span style={{ fontSize: 11, padding: "2px 6px", background: priorityColors[t.priority] || "#999", color: "#fff" }}>{priorityLabels[t.priority] || "?"}</span>
                                  </div>

                                  {t.description && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>{t.description}</p>}

                                  <div className={`expand-wrap ${isExpanded ? "open" : ""}`}>
                                    <div>
                                      <div style={{ marginTop: 8, fontSize: 13, color: "#555" }}>
                                        <div style={{ display: "flex", gap: 16, color: "#888", marginBottom: 6 }}>
                                          <span>Priority: <strong>{priorityLabels[t.priority] || "?"}</strong></span>
                                          <span>Status: <strong>{columns.find(c => c.key === t.status)?.title || "?"}</strong></span>
                                        </div>
                                        <div style={{ marginBottom: 8 }}>
                                          Project:{" "}
                                          <a
                                            href="#"
                                            onClick={e => { e.preventDefault(); onSelectProject(t.projectId); }}
                                            style={{ color: "#222", textDecoration: "underline", textUnderlineOffset: 2 }}
                                          >
                                            {t.projectName}
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                    {projectNames.length === 0 && <p style={{ color: "#ccc", textAlign: "center", fontSize: 13 }}>—</p>}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
