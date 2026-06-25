# Task Management

Микросервисное приложение для управления задачами.

**Стек:** .NET 9, gRPC, React 19, TypeScript, PostgreSQL, Docker

## Архитектура

```
                    ┌──────────────┐
                    │  Frontend    │
                    │  React + Vite│
                    └──────┬───────┘
                           │ REST (JSON)
                    ┌──────▼───────┐
                    │  ApiGateway  │
                    │    :5010     │
                    └──┬───┬───┬──┘
                       │   │   │
               gRPC ───┘   │   └─── gRPC
                   ┌───────▼───────┐
                   │  AuthService  │
                   │    :5001      │
                   │   (authdb)    │
                   └───────────────┘
                   ┌───────────────┐
                   │ProjectService │
                   │    :5002      │
                   │ (projectdb)   │
                   └───────────────┘
                   ┌───────────────┐
                   │  TaskService  │
                   │    :5003      │
                   │   (taskdb)    │
                   └───────────────┘
```

## Быстрый старт

```bash
docker compose up -d --build
cd frontend && npm install && npm run dev
```

**Фронтенд:** http://localhost:5173

## Сервисы

| Сервис | Порт | База | Описание |
|--------|------|------|----------|
| AuthService | 5001 | authdb | Регистрация, логин, JWT |
| ProjectService | 5002 | projectdb | Проекты и участники |
| TaskService | 5003 | taskdb | Задачи и статусы |
| ApiGateway | 5010 | — | REST API для фронтенда |

## API

### Auth
- `POST /api/auth/register` — регистрация
- `POST /api/auth/login` — вход

### Users
- `GET /api/users` — список пользователей

### Projects
- `GET /api/projects` — мои проекты
- `POST /api/projects` — создать проект
- `POST /api/projects/{id}/members/{userId}` — добавить участника (admin)
- `DELETE /api/projects/{id}/members/{userId}` — удалить участника (admin)
- `DELETE /api/projects/{id}` — удалить проект (admin)

### Tasks
- `GET /api/projects/{id}/tasks` — задачи проекта
- `POST /api/tasks` — создать задачу
- `POST /api/tasks/{id}/assignee` — назначить исполнителя (admin)
- `POST /api/tasks/{id}/status` — изменить статус
- `DELETE /api/tasks/{id}` — удалить задачу

## Роли

Внутри проекта: **Admin** (создатель) и **Member** (участник). Глобальных ролей нет.

- Admin: управляет участниками, назначает задачи, удаляет проект
- Member: создаёт задачи, меняет статус своих задач
