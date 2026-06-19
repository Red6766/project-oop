# Task Management System

gRPC-сервер + React-фронтенд. .NET 9, PostgreSQL, gRPC-Web.

## Быстрый старт

```bash
# 1. PostgreSQL
docker run -d -e POSTGRES_USER=taskuser -e POSTGRES_PASSWORD=taskpwd \
  -e POSTGRES_DB=taskdb -p 5432:5432 postgres:15

# 2. Миграции
dotnet ef database update

# 3. Бэкенд (порт 5000)
dotnet run

# 4. Фронтенд (новый терминал, порт 5173)
cd frontend
npm install
npm run dev
```

**Фронтенд:** http://localhost:5173  
**gRPC сервер:** http://localhost:5000

## Проверка через grpcurl

```bash
brew install grpcurl

grpcurl -plaintext -proto Proto/TaskManagement/TaskManagement.proto \
  localhost:5000 list

grpcurl -plaintext -proto Proto/TaskManagement/TaskManagement.proto \
  -d '{"username":"user","email":"user@test.com","password":"123456","role":3}' \
  localhost:5000 taskmanagement.AuthService/Register
```

## Сервисы

| Сервис | Методы |
|--------|--------|
| `AuthService` | Register, Login |
| `UserService` | GetUser, ListUsers |
| `ProjectService` | CreateProject, GetProject, ListProjects, AddMember, RemoveMember |
| `TaskService` | CreateTask, GetTask, ListTasks, AssignTask, ChangeStatus |
| `CommentService` | CreateComment, ListComments |
| `HistoryService` | GetHistory |

## Структура

```
Proto/              # gRPC-контракты
Models/             # EF Core сущности
Application/        # Бизнес-логика (Interfaces + Services)
Infrastructure/     # Program.cs + gRPC-обработчики
frontend/           # React + TypeScript (Vite)
```
