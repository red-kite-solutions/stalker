FROM ghcr.io/red-kite-solutions/stalker-base:latest AS build

WORKDIR /app
RUN yarn workspace @red-kite/jobs-manager build:prod
RUN ls /app/packages/backend/jobs-manager/service/

FROM node:19.6.1-alpine3.16
COPY --from=build /app/packages/backend/jobs-manager/service/dist /server/dist
COPY --from=build /app/packages/backend/jobs-manager/service/node_modules /server/node_modules

ENTRYPOINT ["node", "/server/dist/src/main"]
