FROM node:19.6.1-alpine3.16
WORKDIR /app

RUN apk update
RUN apk add bash

COPY package.json package.json

RUN npm ci

COPY . . 
RUN mkdir -p /certs/
COPY ca.pem /certs/
COPY client-signed.crt /certs/
COPY client.key /certs/
COPY root_ca.crt /usr/local/share/ca-certificates/red-kite-solutions.crt
COPY root_ca.crt /certs/rks-ca.crt
RUN cat /usr/local/share/ca-certificates/red-kite-solutions.crt >> /etc/ssl/certs/ca-certificates.crt

RUN npm run build --omit=dev

CMD ["npm", "run", "start:prod"]
