FROM node:19.6.1-alpine3.16
WORKDIR /app

RUN apk update
RUN apk add bash

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci

COPY . . 
RUN mkdir -p /certs/
COPY ca.pem /certs/
COPY client-signed.crt /certs/
COPY client.key /certs/

RUN npm run build --omit=dev

CMD ["npm", "run", "start:prod"]
