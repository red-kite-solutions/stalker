#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 7135

FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build

COPY packages/backend/orchestrator/service /app/packages/backend/orchestrator/service
WORKDIR /app/packages/backend/orchestrator/service

RUN ls -lr
RUN dotnet restore "./Orchestrator.sln"
RUN dotnet build "Orchestrator.sln" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Kafka certs
RUN mkdir -p /certs/
COPY --from=build /app/packages/backend/orchestrator/service/kafka-ca.crt /certs/
COPY --from=build /app/packages/backend/orchestrator/service/kafka-client-signed.crt /certs/
COPY --from=build /app/packages/backend/orchestrator/service/kafka-client.key /certs/

ENTRYPOINT ["dotnet", "Orchestrator.dll"]