import { useState } from "react";
import { LoginPage } from "./LoginPage";
import { ProjectsPage } from "./ProjectsPage";
import { TasksPage } from "./TasksPage";

type Page =
  | { name: "login" }
  | { name: "projects"; userId: number; username: string }
  | { name: "tasks"; projectId: number; userId: number };

function getSession(): { userId: number; username: string } | null {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { userId: Number(payload.nameid || payload.sub || 0), username: payload.unique_name || payload.name || "" };
  } catch { localStorage.removeItem("accessToken"); return null; }
}

function initPage(): Page {
  const s = getSession();
  if (!s) return { name: "login" };
  const saved = localStorage.getItem("page");
  if (saved === "tasks") {
    const pid = localStorage.getItem("projectId");
    if (pid) return { name: "tasks", projectId: Number(pid), userId: s.userId };
  }
  return { name: "projects", userId: s.userId, username: s.username };
}

function App() {
  const [page, setPage] = useState<Page>(initPage);

  const nav = (p: Page) => {
    setPage(p);
    if (p.name === "tasks") {
      localStorage.setItem("page", "tasks");
      localStorage.setItem("projectId", String(p.projectId));
    } else if (p.name === "projects") {
      localStorage.setItem("page", "projects");
    } else {
      localStorage.removeItem("page");
    }
  };

  if (page.name === "login") return <LoginPage onLogin={(uid, un) => nav({ name: "projects", userId: uid, username: un })} />;
  if (page.name === "tasks") return <TasksPage projectId={page.projectId} userId={page.userId} onBack={() => { const s = getSession()!; nav({ name: "projects", userId: s.userId, username: s.username }); }} />;
  return <ProjectsPage userId={page.userId} onSelectProject={pid => nav({ name: "tasks", projectId: pid, userId: page.userId })} onLogout={() => { localStorage.clear(); setPage({ name: "login" }); }} />;
}

export default App;
