FROM ghcr.io/red-kite-solutions/stalker-base:latest as build
WORKDIR /app

RUN yarn workspace @red-kite/stalker-app build:prod

FROM nginx:alpine

RUN apk update && apk add ca-certificates;

COPY --from=build /app/packages/frontend/stalker-app/dist/stalker-app /var/www/stalker
COPY --from=build /app/packages/frontend/stalker-app/src/assets /var/www/stalker/assets
COPY --from=build /app/packages/frontend/stalker-app/nginx.conf /etc/nginx/nginx.conf

