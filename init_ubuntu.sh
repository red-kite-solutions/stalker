#!/usr/bin/bash 

STALKER_REPO="https://github.com/red-kite-solutions/stalker"
DOCKER_USER=$USER
DOCKER_USER_HOME=${HOME}

sudo apt update >/dev/null
sudo apt install -y ca-certificates curl gnupg npm git openssl default-jdk >/dev/null
echo "Installed necessities"

# Setup keyring
sudo install -m 0755 -d /etc/apt/keyrings >/dev/null

# Add docker gpg key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg >/dev/null
sudo chmod a+r /etc/apt/keyrings/docker.gpg >/dev/null
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install docker
sudo apt update >/dev/null
sudo apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin >/dev/null
echo "Installed docker"

# Install minikube & kubectl
curl -sLO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 >/dev/null
curl -sLO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install kubectl /usr/local/bin/kubectl
sudo install minikube-linux-amd64 /usr/local/bin/minikube
rm minikube-linux-amd64
rm kubectl
echo "Installed minikube and kubectl"

# Setup npm for global install
mkdir "${DOCKER_USER_HOME}/.npm-packages"
echo 'NPM_PACKAGES="${HOME}/.npm-packages"' >> ${DOCKER_USER_HOME}/.bashrc
NPM_PACKAGES="${DOCKER_USER_HOME}/.npm-packages"
echo 'prefix=${HOME}/.npm-packages' >> ${DOCKER_USER_HOME}/.npmrc
echo 'NODE_PATH="$NPM_PACKAGES/lib/node_modules:$NODE_PATH"' >> ${DOCKER_USER_HOME}/.bashrc
NODE_PATH="$NPM_PACKAGES/lib/node_modules:$NODE_PATH"
echo 'PATH="$NPM_PACKAGES/bin:$PATH"' >> ${DOCKER_USER_HOME}/.bashrc
PATH="$NPM_PACKAGES/bin:$PATH"

# Install devspace
npm install -g devspace > /dev/null
echo "Installed devspace"

# Cloning Stalker repository
git clone ${STALKER_REPO} >/dev/null

# Adding the current user to the docker group
sudo groupadd docker
sudo usermod -a -G docker $DOCKER_USER

chmod +x ./stalker/stalker
echo "Installation successfull. Log off and log back in for all the changes to take effect."
