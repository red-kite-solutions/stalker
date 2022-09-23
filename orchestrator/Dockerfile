#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS base
WORKDIR /app
EXPOSE 5135
EXPOSE 7135

FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src
COPY ["Orchestrator.csproj", "."]
RUN dotnet restore "./Orchestrator.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "Orchestrator.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Orchestrator.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Orchestrator.dll"]