FROM node:latest as node
WORKDIR /app
RUN yarn set version 4.1.0

COPY package.json package.json
COPY yarn.lock yarn.lock
COPY .yarnrc.yml .yarnrc.yml

RUN yarn install --immutable

COPY packages packages

RUN yarn workspace @red-kite/stalker-app build --omit=dev --localize --configuration=production


FROM nginx:alpine

COPY --from=node /package/frontend/stalker-app/dist/stalker-app /var/www/stalker
COPY src/assets /var/www/stalker/assets
COPY nginx.conf /etc/nginx/nginx.conf
RUN mkdir -p /etc/nginx/certs/
COPY nginx-chain.pem /etc/nginx/certs/
COPY nginx.key /etc/nginx/certs/
RUN chmod 400 /etc/nginx/certs/nginx.key; chown root:root /etc/nginx/certs/nginx.key
COPY root_ca.crt /usr/local/share/ca-certificates/red-kite-solutions.crt
RUN update-ca-certificates