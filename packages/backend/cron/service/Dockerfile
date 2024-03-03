FROM stalker-base:latest

WORKDIR /app
RUN yarn workspace @red-kite/cron build -- --omit=dev

FROM node:19.6.1-alpine3.16

WORKDIR /app
COPY --from=stalker-base /app/packages/backend/cron/service/dist /app/packages/backend/cron/service/dist

# TODO: Create new stage here to minimize image size
RUN mkdir -p /certs/
COPY --from=stalker-base packages/backend/cron/service/ca.pem /certs/
COPY --from=stalker-base packages/backend/cron/service/client-signed.crt /certs/
COPY --from=stalker-base packages/backend/cron/service/client.key /certs/
COPY --from=stalker-base packages/backend/cron/service/root_ca.crt /usr/local/share/ca-certificates/red-kite-solutions.crt
COPY --from=stalker-base packages/backend/cron/service/root_ca.crt /certs/rks-ca.crt
RUN cat /usr/local/share/ca-certificates/red-kite-solutions.crt >> /etc/ssl/certs/ca-certificates.crt

CMD ["yarn", "workspace", "@red-kite/cron", "start:prod"]

