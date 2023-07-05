FROM node:latest as node
WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci

COPY . . 
RUN npm run build --prod


FROM nginx:alpine
COPY --from=node /app/dist/stalker_ui /usr/share/nginx/html