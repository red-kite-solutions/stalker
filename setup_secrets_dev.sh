# ---- ROOT CA
ROOT_CA=$(base64 ./root_ca -w0)
envsubst < ./root-ca.yml.dev.template > root-ca.yml

# ---- ORCHESTRATOR: Creating k8s secret file
KAFKA_CA_CRT=$(base64 ./packages/backend/orchestrator/service/kafka-ca.crt -w0)
KAFKA_CLIENT_SIGNED_CRT=$(base64 ./packages/backend/orchestrator/service/kafka-client-signed.crt -w0) 
KAFKA_CLIENT_KEY=$(base64 ./packages/backend/orchestrator/service/kafka-client.key -w0)

export KAFKA_CA_CRT KAFKA_CLIENT_SIGNED_CRT KAFKA_CLIENT_KEY
envsubst < ./packages/backend/orchestrator/service/certificates.yml.dev.template > packages/backend/orchestrator/service/certificates.yml

# ---- JOBS MANAGER: Creating k8s secret file
KAFKA_CA_CRT=$(base64 ./packages/backend/jobs-manager/service/kafka-ca.crt -w0)
KAFKA_CLIENT_SIGNED_CRT=$(base64 ./packages/backend/jobs-manager/service/kafka-client-signed.crt -w0) 
KAFKA_CLIENT_KEY=$(base64 ./packages/backend/jobs-manager/service/kafka-client.key -w0)
CA_PEM=$(base64 ./packages/backend/jobs-manager/service/ca.pem -w0)
CLIENT_SIGNED_CRT=$(base64 ./packages/backend/jobs-manager/service/client-signed.crt -w0) 
CLIENT_KEY=$(base64 ./packages/backend/jobs-manager/service/client.key -w0)

export KAFKA_CA_CRT KAFKA_CLIENT_SIGNED_CRT KAFKA_CLIENT_KEY CA_PEM CLIENT_SIGNED_CRT CLIENT_KEY
envsubst < ./packages/backend/jobs-manager/service/certificates.yml.dev.template > packages/backend/jobs-manager/service/certificates.yml

# ---- CRON: Creating k8s secret file
CA_PEM=$(base64 ./packages/backend/cron/service/ca.pem -w0)
CLIENT_SIGNED_CRT=$(base64 ./packages/backend/cron/service/client-signed.crt -w0) 
CLIENT_KEY=$(base64 ./packages/backend/cron/service/client.key -w0)

export CA_PEM CLIENT_SIGNED_CRT CLIENT_KEY
envsubst < packages/backend/cron/service/certificates.yml.dev.template > packages/backend/cron/service/certificates.yml