FROM node:latest as node
WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci

COPY angular.json angular.json
COPY tsconfig.app.json tsconfig.app.json
COPY tsconfig.json tsconfig.json
COPY src src/
RUN npm run build --omit=dev --localize --configuration=production


FROM nginx:alpine

COPY --from=node /app/dist/stalker_ui /var/www/stalker
COPY nginx.conf /etc/nginx/nginx.conf