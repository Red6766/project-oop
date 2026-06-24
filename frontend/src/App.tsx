import { useState } from "react";
import { LoginPage } from "./LoginPage";
import { DashboardPage } from "./DashboardPage";
import { ProjectsPage } from "./ProjectsPage";
import { TasksPage } from "./TasksPage";
import { ProfilePage } from "./ProfilePage";

type Page =
  | { name: "login" }
  | { name: "dashboard"; userId: number; username: string; role: string }
  | { name: "projects"; userId: number; username: string; role: string }
  | { name: "tasks"; projectId: number; userId: number; role: string }
  | { name: "profile"; userId: number; username: string; email: string; role: string };

function getSession(): { userId: number; username: string; email: string; role: string } | null {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const p = JSON.parse(atob(token.split(".")[1]));
    return {
      userId: Number(p.nameid || p.sub || 0),
      username: p.unique_name || p.name || "",
      email: p.email || "",
      role: p.role || p["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "",
    };
  } catch { localStorage.removeItem("accessToken"); return null; }
}

function initPage(): Page {
  const s = getSession();
  if (!s) return { name: "login" };
  const saved = localStorage.getItem("page");
  if (saved === "tasks") { const pid = localStorage.getItem("projectId"); if (pid) return { name: "tasks", projectId: Number(pid), userId: s.userId, role: s.role }; }
  return { name: "dashboard", userId: s.userId, username: s.username, role: s.role };
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

  if (page.name === "login") return <LoginPage onLogin={() => { const session = s(); nav(setPage, { name: "dashboard", userId: session.userId, username: session.username, role: session.role }); }} />;
  if (page.name === "tasks") return <TasksPage projectId={page.projectId} userId={page.userId} userRole={page.role} onBack={() => nav(setPage, { name: "projects", userId: s().userId, username: s().username, role: s().role })} onDashboard={() => nav(setPage, { name: "dashboard", userId: s().userId, username: s().username, role: s().role })} onProjects={() => nav(setPage, { name: "projects", userId: s().userId, username: s().username, role: s().role })} onProfile={() => nav(setPage, { name: "profile", userId: s().userId, username: s().username, email: s().email, role: s().role })} onLogout={() => { localStorage.clear(); setPage({ name: "login" }); }} />;
  if (page.name === "profile") return <ProfilePage userId={page.userId} username={page.username} email={page.email} onBack={() => nav(setPage, { name: "dashboard", userId: s().userId, username: s().username, role: s().role })} onLogout={() => { localStorage.clear(); setPage({ name: "login" }); }} onDashboard={() => nav(setPage, { name: "dashboard", userId: s().userId, username: s().username, role: s().role })} onProjects={() => nav(setPage, { name: "projects", userId: s().userId, username: s().username, role: s().role })} />;
  if (page.name === "projects") return <ProjectsPage userId={page.userId} onSelectProject={pid => nav(setPage, { name: "tasks", projectId: pid, userId: page.userId, role: page.role })} onLogout={() => { localStorage.clear(); setPage({ name: "login" }); }} onProfile={() => nav(setPage, { name: "profile", userId: s().userId, username: s().username, email: s().email, role: s().role })} onDashboard={() => nav(setPage, { name: "dashboard", userId: s().userId, username: s().username, role: s().role })} />;
  return <DashboardPage userId={page.userId} onSelectProject={pid => nav(setPage, { name: "tasks", projectId: pid, userId: page.userId, role: page.role })} onProjects={() => nav(setPage, { name: "projects", userId: s().userId, username: s().username, role: s().role })} onProfile={() => nav(setPage, { name: "profile", userId: s().userId, username: s().username, email: s().email, role: s().role })} onLogout={() => { localStorage.clear(); setPage({ name: "login" }); }} />;
}

export default App;
