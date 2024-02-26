FROM node:latest as node
WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

# FIXME: When we get rid of flex-layout and update the color picker, then we can remove legacy peer-deps.
RUN npm ci --legacy-peer-deps

COPY angular.json angular.json
COPY tsconfig.app.json tsconfig.app.json
COPY tsconfig.json tsconfig.json
COPY src src/
COPY tailwind.config.js tailwind.config.js
RUN npm run build --omit=dev --localize --configuration=production


FROM nginx:alpine

COPY --from=node /app/dist/stalker_ui /var/www/stalker

COPY src/assets /var/www/stalker/assets
COPY nginx.conf /etc/nginx/nginx.conf
RUN mkdir -p /etc/nginx/certs/
COPY nginx-chain.pem /etc/nginx/certs/
COPY nginx.key /etc/nginx/certs/
RUN chmod 400 /etc/nginx/certs/nginx.key; chown root:root /etc/nginx/certs/nginx.key
COPY root_ca.crt /usr/local/share/ca-certificates/red-kite-solutions.crt
RUN update-ca-certificates