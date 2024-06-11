FROM ghcr.io/red-kite-solutions/stalker-base:latest as build

WORKDIR /app
RUN yarn workspace @red-kite/cron build:prod

FROM node:19.6.1-alpine3.16


WORKDIR /app
COPY --from=build /app/packages/backend/cron/service/dist /server/dist
COPY --from=build /app/packages/backend/cron/service/node_modules /server/node_modules

ENTRYPOINT ["node", "/server/dist/src/main"]
