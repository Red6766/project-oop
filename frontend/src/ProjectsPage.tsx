import { useEffect, useState } from "react";
import { projectApi } from "./api";
import { ProjectResponse } from "./gen/TaskManagement";

interface Props {
  userId: number;
  onSelectProject: (projectId: number) => void;
  onLogout: () => void;
}

export function ProjectsPage({ userId, onSelectProject, onLogout }: Props) {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    const { response } = await projectApi.listProjects({
      userId,
      pageSize: 100,
      pageToken: 0,
    });
    setProjects(response.projects);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name) return;
    await projectApi.createProject({
      name,
      description,
      createdById: userId,
    });
    setName("");
    setDescription("");
    load();
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Projects</h2>
        <button onClick={onLogout} style={logoutBtnStyle}>Logout</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={create} style={btnStyle}>
          Create
        </button>
      </div>

      {projects.map((p) => (
        <div
          key={p.id}
          onClick={() => onSelectProject(p.id)}
          style={cardStyle}
        >
          <strong>{p.name}</strong>
          {p.description && (
            <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>
              {p.description}
            </p>
          )}
        </div>
      ))}

      {projects.length === 0 && (
        <p style={{ color: "#999", textAlign: "center", marginTop: 40 }}>
          No projects yet. Create one above.
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

const logoutBtnStyle: React.CSSProperties = {
  padding: "6px 16px",
  background: "transparent",
  color: "#999",
  border: "1px solid #ddd",
  borderRadius: 6,
  fontSize: 14,
  cursor: "pointer",
};

const cardStyle: React.CSSProperties = {
  padding: 16,
  marginBottom: 8,
  border: "1px solid #eee",
  borderRadius: 8,
  cursor: "pointer",
  background: "#fafafa",
};
