# Task Management — Microservices

Микросервисы на gRPC + React + PostgreSQL в Docker.

## Архитектура

```
Frontend → REST → Gateway (:5010) → gRPC → AuthService (:5001)
                                            → ProjectService (:5002)
                                            → TaskService (:5003)
                   PostgreSQL — authdb, projectdb, taskdb
```

## Быстрый старт

```bash
# 1. Полная очистка
docker compose down -v 2>/dev/null
docker stop taskpg taskpostgres 2>/dev/null; docker rm taskpg taskpostgres 2>/dev/null
pkill -f "dotnet" 2>/dev/null
pkill -f "vite" 2>/dev/null

# 2. Запуск
docker compose up -d --build

# 3. Фронтенд
cd frontend && npm run dev
```

**Фронтенд:** http://localhost:5173

## Остановка

```bash
docker compose down
pkill -f "vite" 2>/dev/null
```

## Почему gRPC не работал раньше?

**Проблема:** gRPC требует HTTP/2. На macOS Kestrel не поддерживает HTTP/2 без TLS (шифрования). В Docker (Linux-контейнеры) HTTP/2 без TLS работает.

**Решение:** Все сервисы запускаются в Docker-контейнерах Linux с `ConfigureEndpointDefaults(HttpProtocols.Http2)`. Gateway общается с ними по чистому gRPC (не gRPC-Web).

**Локально на macOS** gRPC будет работать только через `https://` с dev-сертификатом.

## Сервисы

| Сервис | Внутренний порт | Внешний порт | База |
|--------|----------------|-------------|------|
| **AuthService** | 5001 | 5001 | authdb |
| **ProjectService** | 5002 | 5002 | projectdb |
| **TaskService** | 5003 | 5003 | taskdb |
| **ApiGateway** | 5000 | 5010 | — |

## Проверка

```bash
curl -X POST http://localhost:5010/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"123456","role":3}'
```
