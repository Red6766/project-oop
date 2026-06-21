import { useEffect, useState } from "react";
import { taskApi } from "./api";
import type { TaskRes } from "./api";

interface Props { projectId: number; userId: number; onBack: () => void }

const columns = [
  { key: 1, title: "To Do" },
  { key: 2, title: "In Progress" },
  { key: 3, title: "Review" },
  { key: 4, title: "Done" },
];

const priorityLabels: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High", 4: "Critical" };
const priorityColors: Record<number, string> = { 1: "#999", 2: "#1677ff", 3: "#ffa940", 4: "#ff4d4f" };

function TaskModal({ task, onClose }: { task: TaskRes; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: 32, maxWidth: 500, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>{task.title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#999" }}>✕</button>
        </div>
        <p style={{ color: "#666", marginBottom: 16, lineHeight: 1.5 }}>{task.description || "— no description —"}</p>
        <div style={{ display: "flex", gap: 12, fontSize: 14, color: "#888" }}>
          <span>Priority: <strong>{priorityLabels[task.priority] || "?"}</strong></span>
          <span>Status: <strong>{columns.find(c => c.key === task.status)?.title || "?"}</strong></span>
        </div>
      </div>
    </div>
  );
}

export function TasksPage({ projectId, userId, onBack }: Props) {
  const [tasks, setTasks] = useState<TaskRes[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(2);
  const [modalTask, setModalTask] = useState<TaskRes | null>(null);
  const [createError, setCreateError] = useState("");

  const load = () => taskApi.list(projectId).then(setTasks);
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!title) return;
    try { setCreateError(""); await taskApi.create({ title, description, projectId, createdById: userId, priority }); setTitle(""); setDescription(""); load(); }
    catch (e: unknown) { setCreateError(e instanceof Error ? e.message : "Failed"); }
  };

  const changeStatus = (taskId: number, status: number) => taskApi.changeStatus(taskId, { status, actorId: userId }).then(load);

  const onDragStart = (e: React.DragEvent, taskId: number) => { e.dataTransfer.setData("text/plain", String(taskId)); };
  const onDrop = (e: React.DragEvent, newStatus: number) => { e.preventDefault(); changeStatus(Number(e.dataTransfer.getData("text/plain")), newStatus); };

  return (
    <div style={{ padding: 24 }}>
      {modalTask && <TaskModal task={modalTask} onClose={() => setModalTask(null)} />}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ padding: "6px 12px", background: "transparent", color: "#1677ff", border: "1px solid #1677ff", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>← Back</button>
        <h2 style={{ margin: 0 }}>Tasks</h2>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} style={{ ...inp, flex: 1, minWidth: 200 }} />
        <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} style={{ ...inp, flex: 1, minWidth: 200 }} />
        <select value={priority} onChange={e => setPriority(Number(e.target.value))} style={inp}>
          <option value={1}>Low</option><option value={2}>Medium</option><option value={3}>High</option><option value={4}>Critical</option>
        </select>
        <button onClick={create} style={btn}>Create</button>
      </div>
      {createError && <p style={{ color: "red", fontSize: 14, marginBottom: 12 }}>{createError}</p>}

      <div style={{ display: "flex", gap: 16, overflowX: "auto" }}>
        {columns.map(col => (
          <div key={col.key} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, col.key)} style={{ minWidth: 250, flex: 1, background: "#f5f5f5", borderRadius: 8, padding: 12 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#555" }}>{col.title}</h3>
            {tasks.filter(t => t.status === col.key).map(t => (
              <div key={t.id} draggable onDragStart={e => onDragStart(e, t.id)} onClick={() => setModalTask(t)} style={{ padding: 12, marginBottom: 8, background: "#fff", borderRadius: 8, border: "1px solid #eee", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: 14 }}>{t.title}</strong>
                  <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 3, background: priorityColors[t.priority] || "#999", color: "#fff" }}>{priorityLabels[t.priority] || "?"}</span>
                </div>
                {t.description && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>{t.description}</p>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 15 };
const btn: React.CSSProperties = { padding: "8px 20px", background: "#1677ff", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, cursor: "pointer", whiteSpace: "nowrap" };
