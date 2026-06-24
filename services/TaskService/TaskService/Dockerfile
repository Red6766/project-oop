FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /build

# кеширование restore: пока csproj не меняется, layer не пересобирается
COPY services/TaskService/TaskService/TaskService.csproj services/TaskService/TaskService/
RUN dotnet restore services/TaskService/TaskService/TaskService.csproj

# только нужные директории для сборки
COPY Proto/TaskManagement/ Proto/TaskManagement/
COPY services/TaskService/ services/TaskService/
RUN dotnet publish services/TaskService/TaskService/TaskService.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 5003
ENV ASPNETCORE_URLS=http://+:5003
ENTRYPOINT ["dotnet", "TaskService.dll"]
