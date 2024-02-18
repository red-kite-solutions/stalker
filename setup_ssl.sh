#!/bin/bash

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

# Create CSR for nginx
openssl req -new -nodes -days 365 -newkey rsa:2048 -keyout ./stalker_ui/nginx.key -out ./stalker_ui/nginx.csr -subj="/CN=Stalker/OU=Stalker Nginx/O=Red Kite Solutions/L=/ST=/C="

# Signing nginx csr with intermediate ca
openssl x509 -sha256 -req -days 365 -in ./stalker_ui/nginx.csr -CA ./stalker_ui/nginx-ca.crt -CAkey ./stalker_ui/nginx-ca.key -CAcreateserial -out ./stalker_ui/nginx.crt

cat ./stalker_ui/nginx.crt ./stalker_ui/nginx-ca.crt root_ca.crt > ./stalker_ui/nginx-chain.pem

rm ./stalker_ui/nginx-ca-openssl.cnf 
rm ./stalker_ui/nginx-ca.csr
rm ./stalker_ui/nginx.csr
