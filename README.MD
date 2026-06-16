# Task Management System

gRPC-сервер на .NET 9, PostgreSQL, Entity Framework Core.

## Быстрый старт

```bash
# 1. Запустить PostgreSQL
docker run -d -e POSTGRES_USER=taskuser -e POSTGRES_PASSWORD=taskpwd \
  -e POSTGRES_DB=taskdb -p 5432:5432 postgres:15

# 2. Применить миграции
dotnet ef database update

# 3. Запустить сервер (http://localhost:5000)
dotnet run
```

## Проверка работоспособности (grpcurl)

```bash
# Установка grpcurl
brew install grpcurl

# Список сервисов
grpcurl -plaintext -proto Proto/TaskManagement/TaskManagement.proto \
  localhost:5000 list

# Регистрация пользователя
grpcurl -plaintext -proto Proto/TaskManagement/TaskManagement.proto \
  -d '{"username":"user","email":"user@test.com","password":"pass123","role":3}' \
  localhost:5000 taskmanagement.AuthService/Register

# Логин
grpcurl -plaintext -proto Proto/TaskManagement/TaskManagement.proto \
  -d '{"email":"user@test.com","password":"pass123"}' \
  localhost:5000 taskmanagement.AuthService/Login
```

> Флаг `-plaintext` обязателен, т.к. сервер работает без TLS.

## Сервисы gRPC

| Сервис | Методы | Назначение |
|--------|--------|------------|
| `AuthService` | `Register`, `Login` | Регистрация и аутентификация |
| `UserService` | `GetUser`, `ListUsers` | Пользователи |
| `ProjectService` | `CreateProject`, `GetProject`, `ListProjects`, `AddMember`, `RemoveMember` | Проекты и участники |
| `TaskService` | `CreateTask`, `GetTask`, `ListTasks`, `AssignTask`, `ChangeStatus` | Задачи |
| `CommentService` | `CreateComment`, `ListComments` | Комментарии к задачам |
| `HistoryService` | `GetHistory` | История изменений статуса задачи |

## Структура проекта

```
Proto/              # gRPC-контракты (.proto)
Models/             # EF Core сущности (User, Project, TaskItem, Comment, TaskHistory)
Application/
├── Interfaces/     # Cервисные интерфейсы (IAuthService, IUserService, ...)
└── Services/       # Реализация бизнес-логики
Infrastructure/
├── Program.cs      # Точка входа, DI, конфигурация
└── Services/       # gRPC-обработчики (AuthServiceHandler, ...)
```

## Технологии

- **.NET 9** — ASP.NET Core + gRPC
- **PostgreSQL** + **Npgsql** — база данных
- **Entity Framework Core 9** — ORM
- **Protobuf** — контракты
- **BCrypt** — хеширование паролей
