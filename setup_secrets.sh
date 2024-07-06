# ---- ROOT CA
ROOT_CA=$(base64 ./root_ca.crt -w0)

export ROOT_CA
envsubst < ./certificates.yml.template > certificates.yml

# ---- ORCHESTRATOR: Creating k8s secret file
KAFKA_CA_CRT=$(base64 ./packages/backend/orchestrator/service/kafka-ca.crt -w0)
KAFKA_CLIENT_SIGNED_CRT=$(base64 ./packages/backend/orchestrator/service/kafka-client-signed.crt -w0) 
KAFKA_CLIENT_KEY=$(base64 ./packages/backend/orchestrator/service/kafka-client.key -w0)

export KAFKA_CA_CRT KAFKA_CLIENT_SIGNED_CRT KAFKA_CLIENT_KEY ROOT_CA
envsubst < ./packages/backend/orchestrator/service/certificates.yml.template > packages/backend/orchestrator/service/certificates.yml

# ---- JOBS MANAGER: Creating k8s secret file
KAFKA_CA_CRT=$(base64 ./packages/backend/jobs-manager/service/kafka-ca.crt -w0)
KAFKA_CLIENT_SIGNED_CRT=$(base64 ./packages/backend/jobs-manager/service/kafka-client-signed.crt -w0) 
KAFKA_CLIENT_KEY=$(base64 ./packages/backend/jobs-manager/service/kafka-client.key -w0)
CA_PEM=$(base64 ./packages/backend/jobs-manager/service/ca.pem -w0)
CLIENT_SIGNED_CRT=$(base64 ./packages/backend/jobs-manager/service/client-signed.crt -w0) 
CLIENT_KEY=$(base64 ./packages/backend/jobs-manager/service/client.key -w0)
SSL_PRIVATE_KEY=$(base64 ./packages/backend/jobs-manager/service/ssl-private.key -w0) 
SSL_CERTIFICATE_CHAIN_PEM=$(base64 ./packages/backend/jobs-manager/service/ssl-certificate-chain.pem -w0)

export KAFKA_CA_CRT KAFKA_CLIENT_SIGNED_CRT KAFKA_CLIENT_KEY CA_PEM CLIENT_SIGNED_CRT CLIENT_KEY SSL_PRIVATE_KEY SSL_CERTIFICATE_CHAIN_PEM  ROOT_CA
envsubst < ./packages/backend/jobs-manager/service/certificates.yml.template > packages/backend/jobs-manager/service/certificates.yml

# ---- CRON: Creating k8s secret file
CA_PEM=$(base64 ./packages/backend/cron/service/ca.pem -w0)
CLIENT_SIGNED_CRT=$(base64 ./packages/backend/cron/service/client-signed.crt -w0) 
CLIENT_KEY=$(base64 ./packages/backend/cron/service/client.key -w0)

export CA_PEM CLIENT_SIGNED_CRT CLIENT_KEY ROOT_CA
envsubst < packages/backend/cron/service/certificates.yml.template > packages/backend/cron/service/certificates.yml

# ---- APP: Creating k8s secret file
NGINX_CHAIN_PEM=$(base64 ./packages/frontend/stalker-app/nginx-chain.pem -w0)
NGINX_KEY=$(base64 ./packages/frontend/stalker-app/nginx.key -w0) 

export NGINX_CHAIN_PEM NGINX_KEY
envsubst < packages/frontend/stalker-app/certificates.yml.template > packages/frontend/stalker-app/certificates.yml