#!/bin/bash
PASSWORD_LENGTH=35

mongo_root="$(tr -dc A-Za-z0-9 </dev/urandom | head -c $PASSWORD_LENGTH)"
mongo_fm="$(tr -dc A-Za-z0-9 </dev/urandom | head -c $PASSWORD_LENGTH)"
mongo_cs="$(tr -dc A-Za-z0-9 </dev/urandom | head -c $PASSWORD_LENGTH)"
cron_api_token="$(tr -dc A-Za-z0-9 </dev/urandom | head -c $PASSWORD_LENGTH)"
fm_jwt="$(tr -dc A-Za-z0-9 </dev/urandom | head -c $PASSWORD_LENGTH)"
fm_refresh="$(tr -dc A-Za-z0-9 </dev/urandom | head -c $PASSWORD_LENGTH)"
fm_kafka_password="$(tr -dc A-Za-z0-9 </dev/urandom | head -c $PASSWORD_LENGTH)"

# Generating the keys for the secrets
openssl genrsa -out secrets_private.pem 2048
secrets_private_key="$(cat secrets_private.pem | base64 -w 0)"
openssl rsa -in secrets_private.pem -outform PEM -pubout -out secrets_public.pem
secrets_public_key="$(cat secrets_public.pem | base64 -w 0)"
rm secrets_private.pem
rm secrets_public.pem

cat > "devspace.prod.yaml" << EOF
version: v2beta1
name: stalker-vars-prod

vars:
  NETWORK_POLICY: "network-policy.yml"
  RESOURCE_QUOTA: "resource-quota.yml"
  MONGO_REPLICA_SET_COUNT:
    value: 3
  FM_ENVIRONMENT: "prod"
  MONGO_ROOT_PASSWORD: $mongo_root
  MONGO_FM_PASSWORD: $mongo_fm
  MONGO_CRON_SERVICE_PASSWORD: $mongo_cs
  STALKER_CRON_API_TOKEN: $cron_api_token
  FM_JWT_SECRET: $fm_jwt
  FM_REFRESH_SECRET: $fm_refresh
  FM_MONGO_ADDRESS: mongodb://\${MONGO_FM_USER}:\${MONGO_FM_PASSWORD}@mongo-mongodb-headless:27017/
  CRON_SERVICE_MONGO_ADDRESS: mongodb://\${MONGO_CRON_SERVICE_USER}:\${MONGO_CRON_SERVICE_PASSWORD}@mongo-mongodb-headless:27017/
  SECRET_PRIVATE_RSA_KEY: $secrets_private_key
  SECRET_PUBLIC_RSA_KEY: $secrets_public_key
  STALKER_URL: "http://localhost:4200"
  DOCKERFILE_NAME: Dockerfile
EOF


bash ./setup_mongo.sh
bash ./setup_kafka.sh
