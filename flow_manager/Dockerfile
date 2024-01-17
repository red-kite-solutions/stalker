FROM node:19.6.1-alpine3.16
WORKDIR /app

RUN apk update
RUN apk add bash
RUN apk add g++ make py3-pip

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci

COPY . . 

RUN npm run build --omit=dev

CMD ["npm", "run", "start:prod"]
