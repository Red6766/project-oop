FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /build
COPY Proto/TaskManagement/TaskManagement.proto Proto/TaskManagement/
COPY services/AuthService/AuthService/AuthService.csproj services/AuthService/AuthService/
RUN dotnet restore services/AuthService/AuthService/AuthService.csproj
COPY services/AuthService/AuthService/ services/AuthService/AuthService/
RUN dotnet publish services/AuthService/AuthService/AuthService.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 5001
ENV ASPNETCORE_URLS=http://+:5001
ENTRYPOINT ["dotnet", "AuthService.dll"]
