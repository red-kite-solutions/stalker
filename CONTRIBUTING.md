# Contributing to Stalker

To ccontribute to Stalker, or to simply launch the application locally, follow this guide.

## Prerequisites

1. Install Docker
2. Install minikube
3. Install devspace

## Run Stalker

### 1. Start your local K8s cluster

If it is the first time that you start minikube on a computer, give it additional memory and cpus to avoid inconsistant behavior. It will create the minikube container, and this container will be used in the future. If you already have minikube running, you might want to `minikube delete`.

```bash
minikube start --driver docker --cpus 4 --memory 8192
```

Otherwise, if the minikube container was created before, you can just launch it with :

```bash
minikube start --driver=docker
```

<details>
<summary>
The output should look something like this.
</summary>

```text
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

</details>

<br>

### Create personal configuration

By default, stalker uses the variables from _[devspace.base.yaml](./devspace.base.yaml)_. For Stalker to work properly though, you must first create a copy of the _[devspace.dev.yaml.template](./devspace.dev.yaml.template)_ and name it _devspace.dev.yaml_. This file will hold your personal configurations. Any variables defined in this file will override the ones found in _devspace.base.yaml_.

For instance , overwriting the `FM_ENVIRONMENT` variable with the value `dev` instead of the default `prod` will create a default account with the following credentials at startup.

### 2. Run stalker

From the repository root, run

```bash
devspace dev -n stalker
```

### 3. Logging in

If everything is done starting, you can now connect to the application at [http://localhost:4200](http://localhost:4200).

If you launched Stalker with the default configuration, you will be prompted by the web application to create your first admin user.

If you launched Stalker with the `FM_ENVIRONMENT` variable as `dev`, then you can use the following credentials for quality of life:

```text
Username: admin@stalker.is
Password: admin
```

This account is only to be used locally in development or tests for quality of life purposes. When the value is `prod`, you will be prompted to create the first admin account on your first visit to the web application.

You should now be good to go! 🎉 If you change a file in any microservice, the microservice will be automatically live-reloaded.
