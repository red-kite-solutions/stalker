FROM node:19.6.1-alpine3.16
WORKDIR /app

RUN apk update
RUN apk add bash
# RUN apk add keybase-client
RUN apk add keybase-client --allow-untrusted --repository=http://dl-cdn.alpinelinux.org/alpine/edge/testing/
RUN apk add g++ make py3-pip

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install keybase-bot
RUN npm ci

COPY . . 

CMD ["npm", "start"]
