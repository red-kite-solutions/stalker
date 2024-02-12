#!/usr/bin/env bash

# Parameters
PASSWORD="$(tr -dc A-Za-z0-9 </dev/urandom | head -c 25)"
VALIDITY=730
KAFKA_BROKER_COUNT=1

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


# Generate certificates for each broker
for i in `seq 0 $(( $KAFKA_BROKER_COUNT-1))`; do
 
# Create certificate and store in keystore
keytool -keystore kafka-$i.keystore.jks -alias kafka-$i -validity $VALIDITY -genkey -keyalg RSA -ext SAN=dns:kafka-$i.kafka-headless.stalker.svc.cluster.local,dns:kafka.kafka-headless.stalker.svc.cluster.local,dns:kafka-$i.kafka-headless,dns:kafka-$i.kafka-headless.stalker,dns:kafka-$i.kafka-headless,dns:kafka -storepass ${PASSWORD} -noprompt -dname "CN=kafka, OU=Stalker Kafka, O=Red Kite Solutions, L=, S=, C="
 
# Create certificate signing request(CSR)
keytool -keystore kafka-$i.keystore.jks -alias kafka-$i -certreq -file ca-request-kafka-$i -storepass ${PASSWORD} -noprompt
 
# Create ssl config file with DNS names and other params
cat > ext$i.cnf << EOF
basicConstraints = CA:FALSE
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth, serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = kafka-$i.kafka-headless.stalker.svc.cluster.local
DNS.2 = kafka-$i.kafka-headless
DNS.3 = kafka-$i.kafka-headless.stalker
DNS.4 = kafka.kafka-headless
DNS.5 = kafka
EOF
 
# Sign CSR with CA
openssl x509 -req -CA kafka-ca.crt -CAkey kafka-ca.key -in ca-request-kafka-$i -out ca-signed-kafka-$i -days $VALIDITY -CAcreateserial -extfile ext$i.cnf
 
# Import CA certificate in keystore
keytool -keystore kafka-$i.keystore.jks -alias CARoot -importcert -file kafka-ca.crt -storepass ${PASSWORD} -noprompt
 
# Import Signed certificate in keystore
keytool -keystore kafka-$i.keystore.jks -alias kafka-$i -importcert -file ca-signed-kafka-$i -storepass ${PASSWORD} -noprompt
done

# Import CA certificate in truststore
keytool -keystore kafka.server.truststore.jks -alias CARoot -importcert -file kafka-ca.crt -storepass $PASSWORD -keypass $PASSWORD -noprompt


# ---- CA
# kafka-ca-openssl.cnf
# kafka-ca.crt
# kafka-ca.key


# ---- Kafka broker
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
DNS.1 = flow-manager
DNS.2 = flow-manager.stalker.svc.cluster.local
EOF


# A client's username, in the current Kafka configuration, is the CN value for the OU "Stalker Kafka Clients"
# ---- Client Flow Manager
PASS_FM="$(tr -dc A-Za-z0-9 </dev/urandom | head -c 25)"
openssl req -newkey rsa:4096 -passout pass:$PASS_FM -out client1.csr -keyout client1.key -subj="/CN=flow-manager/OU=Stalker Kafka Clients/O=Red Kite Solutions/L=/ST=/C="
openssl x509 -sha256 -req -days 365 -in client1.csr -CA kafka-ca.crt -CAkey kafka-ca.key -CAcreateserial -out ./flow_manager/kafka-client-signed.crt -extfile extclient.cnf
cp client1.key ./flow_manager/kafka-client.key
cp kafka-ca.crt ./flow_manager/kafka-ca.crt


# ---- Client Orchestrator
PASS_ORCHESTRATOR="$(tr -dc A-Za-z0-9 </dev/urandom | head -c 25)"
openssl req -newkey rsa:4096 -passout pass:$PASS_ORCHESTRATOR -out client2.csr -keyout client2.key -subj="/CN=orchestrator/OU=Stalker Kafka Clients/O=Red Kite Solutions/L=/ST=/C="
openssl x509 -sha256 -req -days 365 -in client2.csr -CA kafka-ca.crt -CAkey kafka-ca.key -CAcreateserial -out ./orchestrator/kafka-client-signed.crt
cp client2.key ./orchestrator/kafka-client.key
cp kafka-ca.crt ./orchestrator/kafka-ca.crt

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


echo "  KAFKA_KEYSTORE_PASSWORD: $PASSWORD" >> devspace.dev.yaml
echo "  FM_KAFKA_KEY_PASSWORD: $PASS_FM" >> devspace.dev.yaml
echo "  ORCHESTRATOR_KAFKA_KEY_PASSWORD: $PASS_ORCHESTRATOR" >> devspace.dev.yaml
