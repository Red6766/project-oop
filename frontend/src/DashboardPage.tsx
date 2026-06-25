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
  { bg: "#f5ecec", border: "#dbb5b5" },
  { bg: "#ecf0f5", border: "#b5c8db" },
  { bg: "#f5f0ec", border: "#dbc9b5" },
  { bg: "#eef5ec", border: "#bcdbb5" },
  { bg: "#f5ecf3", border: "#dbb5cf" },
  { bg: "#ecf5f5", border: "#b5d4db" },
  { bg: "#f5f0ec", border: "#dbceb5" },
  { bg: "#f2ecf5", border: "#c8b5db" },
  { bg: "#f5ecec", border: "#dbbfc5" },
  { bg: "#ecf5f0", border: "#b5dbc8" },
];

export function DashboardPage({ userId, onSelectProject, onProjects, onProfile, onLogout }: Props) {
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [statusError, setStatusError] = useState("");

  const toggleTask = (id: number) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleProject = (name: string) => {
    setCollapsedProjects(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const load = async () => {
    setLoading(true);
    try {
      const all = await getAllTasks();
      setTasks(all.filter(t => t.assigneeId === userId));
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
    <div>
      {/* Navigation */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="keycap-btn keycap-btn-solid" style={{ cursor: "default" }}>Home</button>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 4 }}>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          {!loading && tasks.length > 0 && (
            <button onClick={() => setCollapsedProjects(collapsedProjects.size > 0 ? new Set() : new Set([...new Set(tasks.map(t => t.projectName))]))} className="keycap-btn keycap-btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}>
              {collapsedProjects.size > 0 ? "Expand all" : "Collapse all"}
            </button>
          )}
        </div>
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
                      const isCollapsed = collapsedProjects.has(pname);
                      const color = projectColorMap.get(pname)!;
                      return (
                        <div key={pname} style={{ marginBottom: 12, background: color.bg, borderLeft: `4px solid ${color.border}`, padding: 8 }}>
                          <div
                            onClick={() => toggleProject(pname)}
                            style={{ fontSize: 12, fontWeight: "bold", color: "#111", marginBottom: isCollapsed ? 0 : 6, padding: "0 4px", cursor: "pointer", userSelect: "none" }}
                          >
                            {isCollapsed ? "+ " : "- "}{pname} ({groups.get(pname)!.length})
                          </div>
                          {!isCollapsed && groups.get(pname)!.map(t => {
                            const isExpanded = expandedTasks.has(t.id);
                            return (
                              <div key={t.id} style={{ animation: "fadeSlideIn 0.2s ease" }}>
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
                    {projectNames.length === 0 && <p style={{ color: "#ccc", textAlign: "center", fontSize: 13 }}>-</p>}
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
