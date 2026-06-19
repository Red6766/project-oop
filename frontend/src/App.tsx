import { useState } from "react";
import { LoginPage } from "./LoginPage";
import { ProjectsPage } from "./ProjectsPage";
import { TasksPage } from "./TasksPage";

type Page =
  | { name: "login" }
  | { name: "projects"; userId: number; username: string }
  | { name: "tasks"; projectId: number; userId: number };

function App() {
  const [page, setPage] = useState<Page>({ name: "login" });

  if (page.name === "login") {
    return (
      <LoginPage
        onLogin={(userId, username) =>
          setPage({ name: "projects", userId, username })
        }
      />
    );
  }

  if (page.name === "tasks") {
    return (
      <TasksPage
        projectId={page.projectId}
        userId={page.userId}
        onBack={() =>
          setPage({
            name: "projects",
            userId: page.userId,
            username: "",
          })
        }
      />
    );
  }

  return (
    <ProjectsPage
      userId={page.userId}
      onSelectProject={(projectId) =>
        setPage({ name: "tasks", projectId, userId: page.userId })
      }
      onLogout={() => setPage({ name: "login" })}
    />
  );
}

export default App;
