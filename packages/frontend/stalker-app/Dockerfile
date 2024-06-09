FROM ghcr.io/red-kite-solutions/stalker-base:latest as build
WORKDIR /app

RUN yarn workspace @red-kite/stalker-app build:prod

FROM nginx:alpine

RUN apk update && apk add ca-certificates;

COPY --from=build /app/packages/frontend/stalker-app/dist/stalker-app /var/www/stalker
COPY --from=build /app/packages/frontend/stalker-app/src/assets /var/www/stalker/assets
COPY --from=build /app/packages/frontend/stalker-app/nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /etc/nginx/certs/
COPY --from=build /app/packages/frontend/stalker-app/nginx-chain.pem /etc/nginx/certs/
COPY --from=build /app/packages/frontend/stalker-app/nginx.key /etc/nginx/certs/
COPY --from=build /app/packages/frontend/stalker-app/root_ca.crt /usr/local/share/ca-certificates/red-kite-solutions.crt

RUN chmod 400 /etc/nginx/certs/nginx.key; chown root:root /etc/nginx/certs/nginx.key


RUN update-ca-certificates
