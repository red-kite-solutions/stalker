# ---- ROOT CA
ROOT_CA=$(base64 ./root_ca.crt -w0)

echo "  ROOT_RKS_CA_CRT: $ROOT_CA" >> devspace.prod.yaml

# ---- ORCHESTRATOR: Creating k8s secret file
KAFKA_CA_CRT=$(base64 ./packages/backend/orchestrator/service/kafka-ca.crt -w0)
KAFKA_CLIENT_SIGNED_CRT=$(base64 ./packages/backend/orchestrator/service/kafka-client-signed.crt -w0) 
KAFKA_CLIENT_KEY=$(base64 ./packages/backend/orchestrator/service/kafka-client.key -w0)

echo "  ORCHESTRATOR_CERTIFICATES_KAFKA_CA_CRT: $KAFKA_CA_CRT" >> devspace.prod.yaml
echo "  ORCHESTRATOR_CERTIFICATES_KAFKA_CLIENT_SIGNED_CRT: $KAFKA_CLIENT_SIGNED_CRT" >> devspace.prod.yaml
echo "  ORCHESTRATOR_CERTIFICATES_KAFKA_CLIENT_KEY: $KAFKA_CLIENT_KEY" >> devspace.prod.yaml
echo "  ORCHESTRATOR_CERTIFICATES_RKS_CA_CRT: $ROOT_CA" >> devspace.prod.yaml

# ---- JOBS MANAGER: Creating k8s secret file
KAFKA_CA_CRT=$(base64 ./packages/backend/jobs-manager/service/kafka-ca.crt -w0)
KAFKA_CLIENT_SIGNED_CRT=$(base64 ./packages/backend/jobs-manager/service/kafka-client-signed.crt -w0) 
KAFKA_CLIENT_KEY=$(base64 ./packages/backend/jobs-manager/service/kafka-client.key -w0)
CA_PEM=$(base64 ./packages/backend/jobs-manager/service/ca.pem -w0)
CLIENT_SIGNED_CRT=$(base64 ./packages/backend/jobs-manager/service/client-signed.crt -w0) 
CLIENT_KEY=$(base64 ./packages/backend/jobs-manager/service/client.key -w0)
SSL_PRIVATE_KEY=$(base64 ./packages/backend/jobs-manager/service/ssl-private.key -w0) 
SSL_CERTIFICATE_CHAIN_PEM=$(base64 ./packages/backend/jobs-manager/service/ssl-certificate-chain.pem -w0)

echo "  JM_CERTIFICATES_CA_PEM: $CA_PEM" >> devspace.prod.yaml
echo "  JM_CERTIFICATES_CLIENT_SIGNED_CRT: $CLIENT_SIGNED_CRT" >> devspace.prod.yaml
echo "  JM_CERTIFICATES_CLIENT_KEY: $CLIENT_KEY" >> devspace.prod.yaml
echo "  JM_CERTIFICATES_KAFKA_CA_CRT: $KAFKA_CA_CRT" >> devspace.prod.yaml
echo "  JM_CERTIFICATES_KAFKA_CLIENT_SIGNED_CRT: $KAFKA_CLIENT_SIGNED_CRT" >> devspace.prod.yaml
echo "  JM_CERTIFICATES_KAFKA_CLIENT_KEY: $KAFKA_CLIENT_KEY" >> devspace.prod.yaml
echo "  JM_CERTIFICATES_SSL_PRIVATE_KEY: $SSL_PRIVATE_KEY" >> devspace.prod.yaml
echo "  JM_CERTIFICATES_SSL_CERTIFICATE_CHAIN_PEM: $SSL_CERTIFICATE_CHAIN_PEM" >> devspace.prod.yaml

# ---- CRON: Creating k8s secret file
CA_PEM=$(base64 ./packages/backend/cron/service/ca.pem -w0)
CLIENT_SIGNED_CRT=$(base64 ./packages/backend/cron/service/client-signed.crt -w0) 
CLIENT_KEY=$(base64 ./packages/backend/cron/service/client.key -w0)

echo "  CRON_CERTIFICATES_CA_PEM: $CA_PEM" >> devspace.prod.yaml
echo "  CRON_CERTIFICATES_CLIENT_SIGNED_CRT: $CLIENT_SIGNED_CRT" >> devspace.prod.yaml
echo "  CRON_CERTIFICATES_CLIENT_KEY: $CLIENT_KEY" >> devspace.prod.yaml
echo "  CRON_CERTIFICATES_RKS_CA_CRT: $ROOT_CA" >> devspace.prod.yaml

# ---- APP: Creating k8s secret file
NGINX_CHAIN_PEM=$(base64 ./packages/frontend/stalker-app/nginx-chain.pem -w0)
NGINX_KEY=$(base64 ./packages/frontend/stalker-app/nginx.key -w0) 

echo "  UI_CERTIFICATES_NGINX_CHAIN_PEM: $NGINX_CHAIN_PEM" >> devspace.prod.yaml
echo "  UI_CERTIFICATES_NGINX_KEY: $NGINX_KEY" >> devspace.prod.yaml
