import type { UserRes } from "./api";

export const columns = [
  { key: 1, title: "To Do" },
  { key: 2, title: "In Progress" },
  { key: 3, title: "Review" },
  { key: 4, title: "Done" },
];

export const priorityLabels: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High", 4: "Critical" };
export const priorityColors: Record<number, string> = { 1: "#d4d4d4", 2: "#c0c0c0", 3: "#a8a8a8", 4: "#888888" };

export const projectPalette = [
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

export function userName(users: UserRes[], userId: number) {
  if (!userId) return "Unassigned";
  return users.find(user => user.id === userId)?.username || `User #${userId}`;
}
