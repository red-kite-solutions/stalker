FROM node:19.6.1-alpine3.16
WORKDIR /app

RUN apk update
RUN apk add bash
RUN apk add g++ make py3-pip

COPY package.json package.json

RUN npm ci

COPY . .
RUN mkdir -p /certs/

# Mongo certs
COPY ca.pem /certs/
COPY client-signed.crt /certs/
COPY client.key /certs/

# Kafka certs
COPY kafka-ca.crt /certs/
COPY kafka-client-signed.crt /certs/
COPY kafka-client.key /certs/

# API https
COPY ssl-private.key /certs/
COPY ssl-certificate-chain.pem /certs/

RUN npm run build --omit=dev

CMD ["npm", "run", "start:prod"]
