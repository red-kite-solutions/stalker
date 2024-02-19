FROM node:latest as node
WORKDIR /app
RUN yarn set version berry

COPY package.json package.json
COPY yarn.lock yarn.lock
COPY .yarnrc.yml .yarnrc.yml

RUN yarn install --frozen-lockfile

COPY packages packages

RUN yarn workspace @red-kite/stalker-app build --omit=dev --localize --configuration=production


FROM nginx:alpine

COPY --from=node /package/frontend/stalker-app/dist/stalker-app /var/www/stalker
COPY nginx.conf /etc/nginx/nginx.conf