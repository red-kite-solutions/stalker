FROM stalker-base:latest

WORKDIR /app
RUN yarn workspace @red-kite/jobs-manager build --omit=dev


# TODO: Create stage here
# FROM node:19.6.1-alpine3.16

RUN mkdir -p /certs/

# Mongo certs
COPY packages/backend/jobs-manager/service/ca.pem /certs/
COPY packages/backend/jobs-manager/service/client-signed.crt /certs/
COPY packages/backend/jobs-manager/service/client.key /certs/

# Kafka certs
COPY packages/backend/jobs-manager/service/kafka-ca.crt /certs/
COPY packages/backend/jobs-manager/service/kafka-client-signed.crt /certs/
COPY packages/backend/jobs-manager/service/kafka-client.key /certs/

# API https
COPY packages/backend/jobs-manager/service/ssl-private.key /certs/
COPY packages/backend/jobs-manager/service/ssl-certificate-chain.pem /certs/


CMD ["yarn", "workspace", "@red-kite/jobs-manager", "start:prod"]
