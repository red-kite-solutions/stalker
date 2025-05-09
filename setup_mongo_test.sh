#!/bin/bash

# Generating the Certificate Authority (CA)
openssl req -new -x509 -days 3650 -nodes -extensions v3_ca -keyout ca_private.pem -out ca.pem -subj "/CN=CA/OU=Stalker Mongo/O=Red Kite Solutions/L=/ST=/C="

# Generating passwords for the client keys
pass1="$(tr -dc A-Za-z0-9 </dev/urandom | head -c 25)"
pass2="$(tr -dc A-Za-z0-9 </dev/urandom | head -c 25)"
pass3="$(tr -dc A-Za-z0-9 </dev/urandom | head -c 25)"

# Generating the clients' keys and Certificate Signing Requests (CSR)
openssl req -newkey rsa:4096 -passout pass:$pass1 -out client1.csr -keyout client1.key -subj="/CN=jobs-manager/OU=Stalker Mongo Clients/O=Red Kite Solutions/L=/ST=/C="
openssl req -newkey rsa:4096 -passout pass:$pass2 -out client2.csr -keyout client2.key -subj="/CN=cron/OU=Stalker Mongo Clients/O=Red Kite Solutions/L=/ST=/C="
openssl req -newkey rsa:4096 -passout pass:$pass3 -out client3.csr -keyout client3.key -subj="/CN=user-client/OU=Stalker Mongo Clients/O=Red Kite Solutions/L=/ST=/C="

# Signing the clients' Certificate Signing Requests (CSR) with the Certificate Authority (CA)
openssl x509 -sha256 -req -days 365 -in client1.csr -CA ca.pem -CAkey ca_private.pem -CAcreateserial -out ./packages/backend/jobs-manager/service/client-signed.crt
openssl x509 -sha256 -req -days 365 -in client2.csr -CA ca.pem -CAkey ca_private.pem -CAcreateserial -out ./packages/backend/cron/service/client-signed.crt
openssl x509 -sha256 -req -days 365 -in client3.csr -CA ca.pem -CAkey ca_private.pem -CAcreateserial -out user-client-signed.crt

# Moving the keys in the right folder for the dockerfiles
cp client1.key ./packages/backend/jobs-manager/service/client.key
cp client2.key ./packages/backend/cron/service/client.key
mv client3.key user-client.key
cp ca.pem ./packages/backend/jobs-manager/service/ca.pem
cp ca.pem ./packages/backend/cron/service/ca.pem

# Adding the environment variables' in the dev file
ca="$(cat ca.pem | base64 -w 0)"
key="$(cat ca_private.pem | base64 -w 0)"
echo "  MONGO_CA_CRT: $ca" >> devspace.tests.yaml
echo "  MONGO_CA_KEY: $key" >> devspace.tests.yaml
echo "  JM_MONGO_KEY_PASSWORD: $pass1" >> devspace.tests.yaml
echo "  CRON_MONGO_KEY_PASSWORD: $pass2" >> devspace.tests.yaml

# Cleanup
rm client1.csr
rm client2.csr
rm client3.csr
rm client1.key
rm client2.key
rm ca_private.pem

# User information
echo "Password for your local mongo client's key: $pass3"
echo "You can login to the database with your mongo client using the following:"
echo "  * Your key's password"
echo "  * The key file 'user-client.key'"
echo "  * The client certificate 'user-client-signed.crt'"
echo "  * The CA file 'ca.pem'"