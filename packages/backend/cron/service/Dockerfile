FROM stalker-base:latest

WORKDIR /app
RUN yarn workspace @red-kite/cron build --omit=dev

# TODO: Create new stage here to minimize image size
RUN mkdir -p /certs/
COPY packages/backend/cron/service/ca.pem /certs/
COPY packages/backend/cron/service/client-signed.crt /certs/
COPY packages/backend/cron/service/client.key /certs/
COPY packages/backend/cron/service/root_ca.crt /usr/local/share/ca-certificates/red-kite-solutions.crt
COPY packages/backend/cron/service/root_ca.crt /certs/rks-ca.crt
RUN cat /usr/local/share/ca-certificates/red-kite-solutions.crt >> /etc/ssl/certs/ca-certificates.crt


CMD ["yarn", "workspace", "@red-kite/cron", "start:prod"]

