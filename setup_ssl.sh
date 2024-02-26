#!/bin/bash

if [[ $# -ne 1 ]] ; then
    echo 'Incorrect syntax:'
    echo 'setup_ssl.sh <stalker_hostname>'
    exit 1
fi

cat > "./stalker_ui/nginx-ca-openssl.cnf" << EOF
# SHA-1 is deprecated, so use SHA-2 instead.
default_md        = sha256

name_opt          = ca_default
cert_opt          = ca_default
default_days      = 375
preserve          = no
policy            = policy_loose

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
emailAddress                    = Email Address

# Optionally, specify some defaults.
countryName_default             = 
stateOrProvinceName_default     = 
localityName_default            =
0.organizationName_default      = Red Kite Solutions
organizationalUnitName_default  =
emailAddress_default            =

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

# Generate intermediate ca key
openssl genrsa -out ./stalker_ui/nginx-ca.key 4096

# Generate the intermediate ca csr
openssl req -config ./stalker_ui/nginx-ca-openssl.cnf -new -sha256 -key ./stalker_ui/nginx-ca.key -out ./stalker_ui/nginx-ca.csr -subj="/CN=Nginx CA/OU=Stalker Nginx CA/O=Red Kite Solutions/L=/ST=/C="

# Signing the intermediate CA csr with the root CA
openssl ca -batch -config root_ca.cnf -extensions v3_intermediate_ca -days 3650 -notext -md sha256 -in ./stalker_ui/nginx-ca.csr -out ./stalker_ui/nginx-ca.crt

# Creating conf file for CSR
cat > "./stalker_ui/nginx-csr.cnf" << EOF
# OpenSSL node configuration file
[ req ]
prompt=no
distinguished_name = distinguished_name
req_extensions = extensions

[ distinguished_name ]
organizationName = Red Kite Solutions
organizationalUnitName = Stalker Nginx
commonName = Stalker

[ extensions ]
subjectAltName = @alt_names

[alt_names]
DNS.1 = $1
DNS.2 = localhost
EOF

# Create CSR for nginx
openssl req -new -nodes -newkey rsa:2048 -keyout ./stalker_ui/nginx.key -out ./stalker_ui/nginx.csr -config ./stalker_ui/nginx-csr.cnf

# Signing nginx csr with intermediate ca
openssl x509 -req -in ./stalker_ui/nginx.csr -CA ./stalker_ui/nginx-ca.crt -CAkey ./stalker_ui/nginx-ca.key -CAcreateserial -out ./stalker_ui/nginx.crt -days 365 -extfile ./stalker_ui/nginx-csr.cnf -extensions extensions

# Making a full certificate chain for nginx
cat ./stalker_ui/nginx.crt ./stalker_ui/nginx-ca.crt root_ca.crt > ./stalker_ui/nginx-chain.pem

# Adding root ca to the proper folders for trust
cp root_ca.crt ./cron_service/root_ca.crt
cp root_ca.crt ./stalker_ui/root_ca.crt

### Creating FM's certificate and key
# Creating conf file for CSR
cat > "./flow_manager/ssl-csr.cnf" << EOF
# OpenSSL node configuration file
[ req ]
prompt=no
distinguished_name = distinguished_name
req_extensions = extensions

[ distinguished_name ]
organizationName = Red Kite Solutions
organizationalUnitName = Stalker Flow Manager
commonName = Flow Manager API

[ extensions ]
subjectAltName = @alt_names

[alt_names]
DNS.1 = flow-manager
DNS.2 = flow-manager.stalker.svc.cluster.local
EOF

# Create CSR for flow manager
openssl req -new -nodes -newkey rsa:2048 -keyout ./flow_manager/ssl-private.key -out ./flow_manager/ssl-certificate.csr -config ./flow_manager/ssl-csr.cnf

# Signing FM's csr with intermediate ca
openssl x509 -req -in ./flow_manager/ssl-certificate.csr -CA ./stalker_ui/nginx-ca.crt -CAkey ./stalker_ui/nginx-ca.key -CAcreateserial -out ./flow_manager/ssl-certificate.crt -days 365 -extfile ./flow_manager/ssl-csr.cnf -extensions extensions

# Creating FM's certificate chain
cat ./flow_manager/ssl-certificate.crt ./stalker_ui/nginx-ca.crt root_ca.crt > ./flow_manager/ssl-certificate-chain.pem


rm ./stalker_ui/nginx-ca-openssl.cnf 
rm ./stalker_ui/nginx-csr.cnf
rm ./flow_manager/ssl-csr.cnf
rm ./stalker_ui/nginx-ca.csr
rm ./stalker_ui/nginx.csr
rm ./flow_manager/ssl-certificate.csr
