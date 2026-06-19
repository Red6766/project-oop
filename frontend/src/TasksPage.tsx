import { useEffect, useState } from "react";
import { taskApi } from "./api";
import {
  TaskResponse,
  TaskPriority,
  TaskStatus,
} from "./gen/TaskManagement";

interface Props {
  projectId: number;
  userId: number;
  onBack: () => void;
}

const priorityLabels: Record<number, string> = {
  [TaskPriority.LOW]: "Low",
  [TaskPriority.MEDIUM]: "Medium",
  [TaskPriority.HIGH]: "High",
  [TaskPriority.CRITICAL]: "Critical",
};

const statusLabels: Record<number, string> = {
  [TaskStatus.TODO]: "To Do",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.REVIEW]: "Review",
  [TaskStatus.DONE]: "Done",
};

export function TasksPage({ projectId, userId, onBack }: Props) {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(TaskPriority.MEDIUM);

  const load = async () => {
    const { response } = await taskApi.listTasks({
      projectId,
      pageSize: 100,
      pageToken: 0,
    });
    setTasks(response.tasks);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!title) return;
    await taskApi.createTask({
      title,
      description,
      projectId,
      createdById: userId,
      priority,
    });
    setTitle("");
    setDescription("");
    load();
  };

  const changeStatus = async (taskId: number, status: TaskStatus) => {
    await taskApi.changeStatus({
      taskId,
      status,
      actorId: userId,
      comment: "",
    });
    load();
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={backBtnStyle}>
          ← Back
        </button>
        <h2 style={{ margin: 0 }}>Tasks</h2>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
        />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
          style={inputStyle}
        >
          <option value={TaskPriority.LOW}>Low</option>
          <option value={TaskPriority.MEDIUM}>Medium</option>
          <option value={TaskPriority.HIGH}>High</option>
          <option value={TaskPriority.CRITICAL}>Critical</option>
        </select>
        <button onClick={create} style={btnStyle}>
          Create
        </button>
      </div>

      {tasks.map((t) => (
        <div key={t.id} style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{t.title}</strong>
            <span
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 4,
                background:
                  t.priority === TaskPriority.CRITICAL
                    ? "#ff4d4f"
                    : t.priority === TaskPriority.HIGH
                    ? "#ffa940"
                    : t.priority === TaskPriority.MEDIUM
                    ? "#1677ff"
                    : "#999",
                color: "#fff",
              }}
            >
              {priorityLabels[t.priority] || "Unknown"}
            </span>
          </div>
          {t.description && (
            <p style={{ margin: "4px 0", color: "#666", fontSize: 14 }}>
              {t.description}
            </p>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 13, color: "#888" }}>
              {statusLabels[t.status] || "Unknown"}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              {t.status < TaskStatus.IN_PROGRESS && (
                <button
                  style={statusBtnStyle}
                  onClick={() => changeStatus(t.id, TaskStatus.IN_PROGRESS)}
                >
                  Start
                </button>
              )}
              {t.status === TaskStatus.IN_PROGRESS && (
                <button
                  style={statusBtnStyle}
                  onClick={() => changeStatus(t.id, TaskStatus.REVIEW)}
                >
                  To Review
                </button>
              )}
              {t.status === TaskStatus.REVIEW && (
                <button
                  style={statusBtnStyle}
                  onClick={() => changeStatus(t.id, TaskStatus.DONE)}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {tasks.length === 0 && (
        <p style={{ color: "#999", textAlign: "center", marginTop: 40 }}>
          No tasks yet. Create one above.
        </p>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  fontSize: 15,
};

const btnStyle: React.CSSProperties = {
  padding: "8px 20px",
  background: "#1677ff",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 15,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const backBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  background: "transparent",
  color: "#1677ff",
  border: "1px solid #1677ff",
  borderRadius: 6,
  fontSize: 14,
  cursor: "pointer",
};

const statusBtnStyle: React.CSSProperties = {
  padding: "4px 12px",
  background: "#f0f0f0",
  border: "1px solid #ddd",
  borderRadius: 4,
  fontSize: 13,
  cursor: "pointer",
};

const cardStyle: React.CSSProperties = {
  padding: 16,
  marginBottom: 8,
  border: "1px solid #eee",
  borderRadius: 8,
  background: "#fafafa",
};
