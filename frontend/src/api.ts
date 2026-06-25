const BASE = "http://localhost:5010/api";

export function setAccessToken(token: string | null) {
  if (token) localStorage.setItem("accessToken", token);
  else localStorage.removeItem("accessToken");
}

async function req<T>(url: string, body?: unknown, method?: string): Promise<T> {
  const requestMethod = method || (body ? "POST" : "GET");
  const r = await fetch(BASE + url, {
    method: requestMethod,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(localStorage.getItem("accessToken")
        ? { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const response = await r.json().catch(() => null) as { error?: string } | null;
    throw new Error(response?.error || r.statusText);
  }
  if (r.status === 204) return undefined as T;
  return r.json();
}

export type UserRes = { id: number; username: string; email: string }
export type ProjectRes = {
  id: number;
  name: string;
  description: string;
  createdById: number;
  memberIds: number[];
  adminIds: number[];
}
export type TaskRes = { id: number; title: string; description: string; projectId: number; assigneeId: number; status: number; priority: number; createdById: number }

export type TaskWithProject = TaskRes & { projectName: string }

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    req<UserRes>("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    req<{ token: string; user: UserRes }>("/auth/login", data),
};

export const userApi = {
  list: () => req<UserRes[]>("/users"),
};

export const projectApi = {
  list: () => req<ProjectRes[]>("/projects"),
  create: (data: { name: string; description: string; createdById: number }) =>
    req<ProjectRes>("/projects", data),
  get: async (projectId: number) => {
    const projects = await req<ProjectRes[]>("/projects");
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error("Project not found");
    return project;
  },
  addMember: (projectId: number, userId: number) =>
    req<ProjectRes>(`/projects/${projectId}/members/${userId}`, {}),
  removeMember: (projectId: number, userId: number) =>
    req<void>(`/projects/${projectId}/members/${userId}`, undefined, "DELETE"),
  delete: (projectId: number) =>
    req<void>(`/projects/${projectId}`, undefined, "DELETE"),
};

export const taskApi = {
  list: (projectId: number) => req<TaskRes[]>(`/projects/${projectId}/tasks`),
  create: (data: { title: string; description: string; projectId: number; createdById: number; priority: number; assigneeId?: number }) =>
    req<TaskRes>("/tasks", data),
  assign: (taskId: number, assigneeId: number) =>
    req<TaskRes>(`/tasks/${taskId}/assignee`, { assigneeId }),
  changeStatus: (taskId: number, data: { status: number }) =>
    req<TaskRes>(`/tasks/${taskId}/status`, data),
  delete: (taskId: number) =>
    req<void>(`/tasks/${taskId}`, undefined, "DELETE"),
};

export async function getAllTasks(): Promise<TaskWithProject[]> {
  const projects = await projectApi.list();
  const all = await Promise.all(
    projects.map(async p => {
      const tasks = await taskApi.list(p.id);
      return tasks.map(t => ({ ...t, projectName: p.name }));
    })
  );
  return all.flat();
}
