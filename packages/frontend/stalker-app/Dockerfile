FROM stalker-base:latest
WORKDIR /app

RUN yarn workspace @red-kite/stalker-app build -- --omit=dev --localize --configuration=production

FROM node:19.6.1-alpine3.16

COPY --from=stalker-base /app/packages/frontend/stalker-app/dist/stalker-app /var/www/stalker
COPY --from=stalker-base /app/packages/frontend/stalker-app/src/assets /var/www/stalker/assets
COPY --from=stalker-base /app/packages/frontend/stalker-app/nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /etc/nginx/certs/
COPY --from=stalker-base /app/packages/frontend/stalker-app/nginx-chain.pem /etc/nginx/certs/
COPY --from=stalker-base /app/packages/frontend/stalker-app/nginx.key /etc/nginx/certs/
COPY --from=stalker-base /app/packages/frontend/stalker-app/root_ca.crt /usr/local/share/ca-certificates/red-kite-solutions.crt

RUN chmod 400 /etc/nginx/certs/nginx.key; chown root:root /etc/nginx/certs/nginx.key; update-ca-certificates
