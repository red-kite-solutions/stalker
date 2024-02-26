#!/bin/bash

# This variable is used in the generation of the SSL certificate
# Having "stalker.lan" here with port 8443 means that you will connect to Stalker using
# https://stalker.lan:8443/
STALKER_HOSTNAME=stalker.lan
STALKER_PORT=8443

# Max database size and replication. Having 3 replicas with 32Gi would mean that 
# (32 * 3) Gi of space on disk is needed
MONGODB_MAX_SIZE="32Gi"
MONGO_REPLICA_SET_COUNT=1

PASSWORD_LENGTH=35

# Checking dependencies
if ! command -v minikube &> /dev/null; then
  echo "Install minikube before proceeding";
  exit 1;
fi
if ! command -v devspace &> /dev/null; then
  echo "Install devspace before proceeding";
  exit 1;
fi
if ! command -v openssl &> /dev/null; then
  echo "Install openssl before proceeding";
  exit 1;
fi
if ! command -v keytool &> /dev/null; then
  echo "Install keytool before proceeding";
  exit 1;
fi
if ! command -v docker &> /dev/null; then
  echo "Install docker before proceeding";
  exit 1;
fi


mongo_root="$(tr -dc A-Za-z0-9 </dev/urandom | head -c $PASSWORD_LENGTH)"
mongo_fm="$(tr -dc A-Za-z0-9 </dev/urandom | head -c $PASSWORD_LENGTH)"
mongo_cs="$(tr -dc A-Za-z0-9 </dev/urandom | head -c $PASSWORD_LENGTH)"
cron_api_token="$(tr -dc A-Za-z0-9 </dev/urandom | head -c $PASSWORD_LENGTH)"
jm_jwt="$(tr -dc A-Za-z0-9 </dev/urandom | head -c $PASSWORD_LENGTH)"
jm_refresh="$(tr -dc A-Za-z0-9 </dev/urandom | head -c $PASSWORD_LENGTH)"
jm_kafka_password="$(tr -dc A-Za-z0-9 </dev/urandom | head -c $PASSWORD_LENGTH)"

echo "##############################"
echo "# You will be prompted several times for your root CA key's password."
echo "# The CA will sign all of Stalker's certificates."
echo "#" 
echo "# After deployment, Stalker is configured to listen on:"
echo "# https://$STALKER_HOSTNAME:$STALKER_PORT/"
echo "##############################"

read -n 1 -p "Press any key to continue..."

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
    value: $MONGO_REPLICA_SET_COUNT
  JM_ENVIRONMENT: "prod"
  MONGO_ROOT_PASSWORD: $mongo_root
  MONGO_JM_PASSWORD: $mongo_fm
  MONGO_CRON_PASSWORD: $mongo_cs
  STALKER_CRON_API_TOKEN: $cron_api_token
  JM_JWT_SECRET: $jm_jwt
  JM_REFRESH_SECRET: $jm_refresh
  JM_MONGO_ADDRESS: mongodb://\${MONGO_JM_USER}:\${MONGO_JM_PASSWORD}@mongo-mongodb-headless:27017/
  CRON_MONGO_ADDRESS: mongodb://\${MONGO_CRON_USER}:\${MONGO_CRON_PASSWORD}@mongo-mongodb-headless:27017/
  SECRET_PRIVATE_RSA_KEY: $secrets_private_key
  SECRET_PUBLIC_RSA_KEY: $secrets_public_key
  STALKER_PORT: $STALKER_PORT
  STALKER_URL: "https://$STALKER_HOSTNAME:\${STALKER_PORT}"
  DOCKERFILE_NAME: Dockerfile
  JM_URL: "https://jobs-manager:3000"
  MONGODB_MAX_SIZE: $MONGODB_MAX_SIZE
EOF

cat > "root_ca.cnf" << EOF
[ ca ]
default_ca = CA_default

[ CA_default ]
# The root key and root certificate.
new_certs_dir     = .
private_key       = root_ca.key
certificate       = root_ca.crt
database          = index.txt
serial            = serial

# SHA-1 is deprecated, so use SHA-2 instead.
default_md        = sha256

name_opt          = ca_default
cert_opt          = ca_default
default_days      = 375
preserve          = no
policy            = policy_strict

[ policy_strict ]
# The root CA should only sign intermediate certificates that match.
countryName             = optional
stateOrProvinceName     = optional
organizationName        = optional
organizationalUnitName  = optional
commonName              = supplied
emailAddress            = optional

[ policy_loose ]
# Allow the intermediate CA to sign a more diverse range of certificates.
countryName             = optional
stateOrProvinceName     = optional
localityName            = optional
organizationName        = optional
organizationalUnitName  = optional
commonName              = supplied
emailAddress            = optional

[ req ]
default_bits        = 2048
distinguished_name  = req_distinguished_name
string_mask         = utf8only

# SHA-1 is deprecated, so use SHA-2 instead.
default_md          = sha256

# Extension to add when the -x509 option is used.
x509_extensions     = v3_ca

[ req_distinguished_name ]
# See <https://en.wikipedia.org/wiki/Certificate_signing_request>.
countryName                     = Country Name (2 letter code)
stateOrProvinceName             = State or Province Name
localityName                    = Locality Name
0.organizationName              = Organization Name
organizationalUnitName          = Organizational Unit Name
commonName                      = Common Name

# Optionally, specify some defaults.
countryName_default             = 
stateOrProvinceName_default     = 
localityName_default            =
0.organizationName_default      = Red Kite Solutions

[ v3_ca ]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical, CA:true
keyUsage = critical, digitalSignature, cRLSign, keyCertSign

[ v3_intermediate_ca ]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical, CA:true, pathlen:0
keyUsage = critical, digitalSignature, cRLSign, keyCertSign

[ usr_cert ]
basicConstraints = CA:FALSE
nsCertType = client, email
nsComment = "OpenSSL Generated Client Certificate"
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
keyUsage = critical, nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth, emailProtection

[ server_cert ]
basicConstraints = CA:FALSE
nsCertType = server
nsComment = "OpenSSL Generated Server Certificate"
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer:always
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[ crl_ext ]
authorityKeyIdentifier=keyid:always

[ ocsp ]
basicConstraints = CA:FALSE
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
keyUsage = critical, digitalSignature
extendedKeyUsage = critical, OCSPSigning
EOF

echo 1000 > serial
touch index.txt
openssl genrsa -aes256 -out ./root_ca.key 4096
openssl req -config ./root_ca.cnf -key ./root_ca.key -new -x509 -days 7300 -sha256 -extensions v3_ca -out ./root_ca.crt -subj="/CN=Stalker CA/OU=Stalker CA/O=Red Kite Solutions/L=/ST=/C="

bash ./setup_ssl.sh $STALKER_HOSTNAME
bash ./setup_mongo.sh
bash ./setup_kafka.sh

rm root_ca.cnf
rm index.txt*