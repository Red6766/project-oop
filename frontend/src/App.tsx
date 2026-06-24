import { useState } from "react";
import { LoginPage } from "./LoginPage";
import { DashboardPage } from "./DashboardPage";
import { ProjectsPage } from "./ProjectsPage";
import { TasksPage } from "./TasksPage";
import { ProfilePage } from "./ProfilePage";

type Page =
  | { name: "login" }
  | { name: "dashboard"; userId: number; username: string }
  | { name: "projects"; userId: number; username: string }
  | { name: "tasks"; projectId: number; userId: number }
  | { name: "profile"; userId: number; username: string; email: string };

function getSession(): { userId: number; username: string; email: string } | null {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const p = JSON.parse(atob(token.split(".")[1]));
    return {
      userId: Number(p.nameid || p.sub || 0),
      username: p.unique_name || p.name || "",
      email: p.email || "",
    };
  } catch { localStorage.removeItem("accessToken"); return null; }
}

function initPage(): Page {
  const s = getSession();
  if (!s) return { name: "login" };
  const saved = localStorage.getItem("page");
  if (saved === "tasks") { const pid = localStorage.getItem("projectId"); if (pid) return { name: "tasks", projectId: Number(pid), userId: s.userId }; }
  return { name: "dashboard", userId: s.userId, username: s.username };
}

const nav = (setPage: React.Dispatch<React.SetStateAction<Page>>, p: Page) => {
  setPage(p);
  if (p.name === "tasks") { localStorage.setItem("page", "tasks"); localStorage.setItem("projectId", String(p.projectId)); }
  else if (p.name === "projects") localStorage.setItem("page", "projects");
  else localStorage.removeItem("page");
};

function App() {
  const [page, setPage] = useState<Page>(initPage);

  const s = (): NonNullable<ReturnType<typeof getSession>> => {
    const session = getSession();
    if (!session) { localStorage.clear(); setPage({ name: "login" }); throw new Error("Session expired"); }
    return session;
  };

  if (page.name === "login") return <LoginPage onLogin={() => { const session = s(); nav(setPage, { name: "dashboard", userId: session.userId, username: session.username }); }} />;
  if (page.name === "tasks") return <TasksPage projectId={page.projectId} userId={page.userId} onBack={() => nav(setPage, { name: "projects", userId: s().userId, username: s().username })} onDashboard={() => nav(setPage, { name: "dashboard", userId: s().userId, username: s().username })} onProjects={() => nav(setPage, { name: "projects", userId: s().userId, username: s().username })} onProfile={() => nav(setPage, { name: "profile", userId: s().userId, username: s().username, email: s().email })} onLogout={() => { localStorage.clear(); setPage({ name: "login" }); }} />;
  if (page.name === "profile") return <ProfilePage username={page.username} email={page.email} onBack={() => nav(setPage, { name: "dashboard", userId: s().userId, username: s().username })} onLogout={() => { localStorage.clear(); setPage({ name: "login" }); }} onDashboard={() => nav(setPage, { name: "dashboard", userId: s().userId, username: s().username })} onProjects={() => nav(setPage, { name: "projects", userId: s().userId, username: s().username })} />;
  if (page.name === "projects") return <ProjectsPage userId={page.userId} onSelectProject={pid => nav(setPage, { name: "tasks", projectId: pid, userId: page.userId })} onLogout={() => { localStorage.clear(); setPage({ name: "login" }); }} onProfile={() => nav(setPage, { name: "profile", userId: s().userId, username: s().username, email: s().email })} onDashboard={() => nav(setPage, { name: "dashboard", userId: s().userId, username: s().username })} />;
  return <DashboardPage userId={page.userId} onSelectProject={pid => nav(setPage, { name: "tasks", projectId: pid, userId: page.userId })} onProjects={() => nav(setPage, { name: "projects", userId: s().userId, username: s().username })} onProfile={() => nav(setPage, { name: "profile", userId: s().userId, username: s().username, email: s().email })} onLogout={() => { localStorage.clear(); setPage({ name: "login" }); }} />;
}

export default App;
