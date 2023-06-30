FROM node:latest as node
WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci

COPY . . 

# TODO: Implement production Dockerfile
CMD ["npm", "run", "start"]
