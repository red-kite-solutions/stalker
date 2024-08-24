# ---- ROOT CA
echo "  ROOT_RKS_CA_CRT: \"\"" >> devspace.dev.yaml

# ---- ORCHESTRATOR: Creating k8s secret file
KAFKA_CA_CRT=$(base64 ./packages/backend/orchestrator/service/kafka-ca.crt -w0)
KAFKA_CLIENT_SIGNED_CRT=$(base64 ./packages/backend/orchestrator/service/kafka-client-signed.crt -w0) 
KAFKA_CLIENT_KEY=$(base64 ./packages/backend/orchestrator/service/kafka-client.key -w0)

echo "  ORCHESTRATOR_CERTIFICATES_KAFKA_CA_CRT: $KAFKA_CA_CRT" >> devspace.dev.yaml
echo "  ORCHESTRATOR_CERTIFICATES_KAFKA_CLIENT_SIGNED_CRT: $KAFKA_CLIENT_SIGNED_CRT" >> devspace.dev.yaml
echo "  ORCHESTRATOR_CERTIFICATES_KAFKA_CLIENT_KEY: $KAFKA_CLIENT_KEY" >> devspace.dev.yaml
echo "  ORCHESTRATOR_CERTIFICATES_RKS_CA_CRT: \"\"" >> devspace.dev.yaml

# ---- JOBS MANAGER: Creating k8s secret file
KAFKA_CA_CRT=$(base64 ./packages/backend/jobs-manager/service/kafka-ca.crt -w0)
KAFKA_CLIENT_SIGNED_CRT=$(base64 ./packages/backend/jobs-manager/service/kafka-client-signed.crt -w0) 
KAFKA_CLIENT_KEY=$(base64 ./packages/backend/jobs-manager/service/kafka-client.key -w0)
CA_PEM=$(base64 ./packages/backend/jobs-manager/service/ca.pem -w0)
CLIENT_SIGNED_CRT=$(base64 ./packages/backend/jobs-manager/service/client-signed.crt -w0) 
CLIENT_KEY=$(base64 ./packages/backend/jobs-manager/service/client.key -w0)

echo "  JM_CERTIFICATES_CA_PEM: $CA_PEM" >> devspace.dev.yaml
echo "  JM_CERTIFICATES_CLIENT_SIGNED_CRT: $CLIENT_SIGNED_CRT" >> devspace.dev.yaml
echo "  JM_CERTIFICATES_CLIENT_KEY: $CLIENT_KEY" >> devspace.dev.yaml
echo "  JM_CERTIFICATES_KAFKA_CA_CRT: $KAFKA_CA_CRT" >> devspace.dev.yaml
echo "  JM_CERTIFICATES_KAFKA_CLIENT_SIGNED_CRT: $KAFKA_CLIENT_SIGNED_CRT" >> devspace.dev.yaml
echo "  JM_CERTIFICATES_KAFKA_CLIENT_KEY: $KAFKA_CLIENT_KEY" >> devspace.dev.yaml
echo "  JM_CERTIFICATES_SSL_PRIVATE_KEY: \"\"" >> devspace.dev.yaml
echo "  JM_CERTIFICATES_SSL_CERTIFICATE_CHAIN_PEM: \"\"" >> devspace.dev.yaml

# ---- CRON: Creating k8s secret file
CA_PEM=$(base64 ./packages/backend/cron/service/ca.pem -w0)
CLIENT_SIGNED_CRT=$(base64 ./packages/backend/cron/service/client-signed.crt -w0) 
CLIENT_KEY=$(base64 ./packages/backend/cron/service/client.key -w0)

echo "  CRON_CERTIFICATES_CA_PEM: $CA_PEM" >> devspace.dev.yaml
echo "  CRON_CERTIFICATES_CLIENT_SIGNED_CRT: $CLIENT_SIGNED_CRT" >> devspace.dev.yaml
echo "  CRON_CERTIFICATES_CLIENT_KEY: $CLIENT_KEY" >> devspace.dev.yaml
echo "  CRON_CERTIFICATES_RKS_CA_CRT: \"\"" >> devspace.dev.yaml

# ---- APP: Creating k8s secret file
echo "  UI_CERTIFICATES_NGINX_CHAIN_PEM: \"\"" >> devspace.dev.yaml
echo "  UI_CERTIFICATES_NGINX_KEY: \"\"" >> devspace.dev.yaml