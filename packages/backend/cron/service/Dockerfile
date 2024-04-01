FROM stalker-base:latest as build

WORKDIR /app
RUN yarn workspace @red-kite/cron build:prod

FROM node:19.6.1-alpine3.16

WORKDIR /app
COPY --from=build /app/packages/backend/cron/service/dist /server/dist
COPY --from=build /app/packages/backend/cron/service/node_modules /server/node_modules

# TODO: Create new stage here to minimize image size
RUN mkdir -p /certs/
COPY --from=build /app/packages/backend/cron/service/ca.pem /certs/
COPY --from=build /app/packages/backend/cron/service/client-signed.crt /certs/
COPY --from=build /app/packages/backend/cron/service/client.key /certs/
COPY --from=build /app/packages/backend/cron/service/root_ca.crt /usr/local/share/ca-certificates/red-kite-solutions.crt
COPY --from=build /app/packages/backend/cron/service/root_ca.crt /certs/rks-ca.crt
RUN cat /usr/local/share/ca-certificates/red-kite-solutions.crt >> /etc/ssl/certs/ca-certificates.crt

ENTRYPOINT ["node", "/server/dist/src/main"]
