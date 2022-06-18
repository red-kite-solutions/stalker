# Prerequisites

1. Install Docker
2. Install minikube
3. Install devspace

# Run Stalker

### 1. Start your local K8s cluster

```
minikube start
```

The output should look something like this.

```
😄 minikube v1.25.2 on Microsoft Windows 11 Pro 10.0.22000 Build 22000
✨ Automatically selected the docker driver. Other choices: hyperv, ssh
👍 Starting control plane node minikube in cluster minikube
🚜 Pulling base image ...
🔥 Creating docker container (CPUs=2, Memory=8100MB) ...
🐳 Preparing Kubernetes v1.23.3 on Docker 20.10.12 ...
▪ kubelet.housekeeping-interval=5m
▪ Generating certificates and keys ...
▪ Booting up control plane ...
▪ Configuring RBAC rules ...
🔎 Verifying Kubernetes components...
▪ Using image gcr.io/k8s-minikube/storage-provisioner:v5
🌟 Enabled addons: storage-provisioner, default-storageclass
🏄 Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
```

### 2. Run stalker

From the repo root, run

```
devspace dev
```

You should now be good to go! 🎉 If you change a file in any microservice, the microservice will be automatically live-reloaded.
