FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /build
COPY Proto/TaskManagement/TaskManagement.proto Proto/TaskManagement/
COPY services/ProjectService/ProjectService/ProjectService.csproj services/ProjectService/ProjectService/
RUN dotnet restore services/ProjectService/ProjectService/ProjectService.csproj
COPY services/ProjectService/ProjectService/ services/ProjectService/ProjectService/
RUN dotnet publish services/ProjectService/ProjectService/ProjectService.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 5002
ENV ASPNETCORE_URLS=http://+:5002
ENTRYPOINT ["dotnet", "ProjectService.dll"]
