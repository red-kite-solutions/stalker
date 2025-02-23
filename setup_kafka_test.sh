#!/usr/bin/env bash

# Parameters
PASSWORD="$(tr -dc A-Za-z0-9 </dev/urandom | head -c 25)"
VALIDITY=730
JOBS_MANAGER_USERNAME="jobs-manager"
ORCHESTRATOR_USERNAME="orchestrator"

cat > "kafka-ca-openssl.cnf" << EOF
[req]
default_bits = 4096
encrypt_key  = no
default_md   = sha256
prompt       = no
utf8         = yes

distinguished_name = req_distinguished_name

req_extensions = v3_req
[req_distinguished_name]
O  = Red Kite Solutions
OU = Stalker Kafka
CN = Kakfa CA

[v3_req]
basicConstraints     = CA:TRUE
subjectKeyIdentifier = hash
keyUsage             = digitalSignature, keyEncipherment
extendedKeyUsage     = clientAuth, serverAuth
EOF

# Creating CA with config
openssl req -new -x509 -keyout kafka-ca.key -out kafka-ca.crt -days 3650 -config kafka-ca-openssl.cnf
 
# Create certificate and store in keystore
keytool -keystore kafka-0.keystore.jks -alias kafka-0 -validity $VALIDITY -genkey -keyalg RSA -ext SAN=dns:kafka-controller-0.kafka-controller-headless.stalker.svc.cluster.local,dns:kafka-controller-1.kafka-controller-headless.stalker.svc.cluster.local,dns:kafka-controller-2.kafka-controller-headless.stalker.svc.cluster.local,dns:kafka-controller-headless.stalker.svc.cluster.local,dns:kafka-controller-headless,dns:kafka.stalker.svc.cluster.local,dns:kafka -storepass ${PASSWORD} -noprompt -dname "CN=kafka, OU=Stalker Kafka, O=Red Kite Solutions, L=, S=, C="
 
# Create certificate signing request(CSR)
keytool -keystore kafka-0.keystore.jks -alias kafka-0 -certreq -file ca-request-kafka-0 -storepass ${PASSWORD} -noprompt
 
# Create ssl config file with DNS names and other params
cat > ext0.cnf << EOF
basicConstraints = CA:FALSE
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth, serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = kafka-controller-0.kafka-controller-headless.stalker.svc.cluster.local
DNS.2 = kafka-controller-1.kafka-controller-headless.stalker.svc.cluster.local
DNS.3 = kafka-controller-2.kafka-controller-headless.stalker.svc.cluster.local
DNS.4 = kafka-controller-headless.stalker.svc.cluster.local
DNS.5 = kafka-controller-headless
DNS.6 = kafka.stalker.svc.cluster.local
DNS.7 = kafka
EOF
 
# Sign CSR with CA
openssl x509 -req -CA kafka-ca.crt -CAkey kafka-ca.key -in ca-request-kafka-0 -out ca-signed-kafka-0 -days $VALIDITY -CAcreateserial -extfile ext0.cnf
 
# Import CA certificate in keystore
keytool -keystore kafka-0.keystore.jks -alias CARoot -importcert -file kafka-ca.crt -storepass ${PASSWORD} -noprompt
 
# Import Signed certificate in keystore
keytool -keystore kafka-0.keystore.jks -alias kafka-0 -importcert -file ca-signed-kafka-0 -storepass ${PASSWORD} -noprompt

# Import CA certificate in truststore
keytool -keystore kafka.server.truststore.jks -alias CARoot -importcert -file kafka-ca.crt -storepass $PASSWORD -keypass $PASSWORD -noprompt


##### Created files :
### ---- CA ----
# kafka-ca-openssl.cnf
# kafka-ca.crt
# kafka-ca.key
### ---- Kafka broker ----
# kafka.server.truststore.jks
# kafka-0.keystore.jks
# ca-request-kafka-0
# ca-signed-kafka-0
# ext0.cnf

cat > extclient.cnf << EOF
basicConstraints = CA:FALSE
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth, serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = jobs-manager
DNS.2 = jobs-manager.stalker.svc.cluster.local
EOF


# A client's username, in the current Kafka configuration, is the CN value for the OU "Stalker Kafka Clients"
# ---- Client Jobs Manager
PASS_FM="$(tr -dc A-Za-z0-9 </dev/urandom | head -c 25)"
openssl req -newkey rsa:4096 -passout pass:$PASS_FM -out client1.csr -keyout client1.key -subj="/CN=$JOBS_MANAGER_USERNAME/OU=Stalker Kafka Clients/O=Red Kite Solutions/L=/ST=/C="
openssl x509 -sha256 -req -days 365 -in client1.csr -CA kafka-ca.crt -CAkey kafka-ca.key -CAcreateserial -out ./packages/backend/jobs-manager/service/kafka-client-signed.crt -extfile extclient.cnf
cp client1.key ./packages/backend/jobs-manager/service/kafka-client.key
cp kafka-ca.crt ./packages/backend/jobs-manager/service/kafka-ca.crt

cat > extclient.cnf << EOF
basicConstraints = CA:FALSE
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth, serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = orchestrator
DNS.2 = orchestrator.stalker.svc.cluster.local
EOF

# ---- Client Orchestrator
PASS_ORCHESTRATOR="$(tr -dc A-Za-z0-9 </dev/urandom | head -c 25)"
openssl req -newkey rsa:4096 -passout pass:$PASS_ORCHESTRATOR -out client2.csr -keyout client2.key -subj="/CN=$ORCHESTRATOR_USERNAME/OU=Stalker Kafka Clients/O=Red Kite Solutions/L=/ST=/C="
openssl x509 -sha256 -req -days 365 -in client2.csr -CA kafka-ca.crt -CAkey kafka-ca.key -CAcreateserial -out ./packages/backend/orchestrator/service/kafka-client-signed.crt -extfile extclient.cnf
cp client2.key ./packages/backend/orchestrator/service/kafka-client.key
cp kafka-ca.crt ./packages/backend/orchestrator/service/kafka-ca.crt

# Moving the keys for safe keeping
mv kafka-0.keystore.jks ./queue/kafka-0.keystore.jks
mv kafka.server.truststore.jks ./queue/kafka.server.truststore.jks

# Cleanup
rm kafka-ca-openssl.cnf
rm kafka-ca.crt
rm kafka-ca.key
rm ext0.cnf
rm ca-signed-kafka-0
rm ca-request-kafka-0
rm client1.csr
rm client2.csr
rm extclient.cnf

echo "  KAFKA_KEYSTORE_PASSWORD: $PASSWORD" >> devspace.tests.yaml
echo "  JM_KAFKA_KEY_PASSWORD: $PASS_FM" >> devspace.tests.yaml
echo "  ORCHESTRATOR_KAFKA_KEY_PASSWORD: $PASS_ORCHESTRATOR" >> devspace.tests.yaml
