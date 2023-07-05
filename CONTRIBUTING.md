# Contributing to Stalker

To contribute to Stalker or to simply launch the application locally, follow this guide.

## Prerequisites

1. Install Docker
2. Install minikube
3. Install devspace

## Run Stalker

### 1. Start your local K8s cluster

If you're starting minikube on a computer for the first time, it's recommended to allocate more memory and CPUs to avoid any inconsistent behavior. This will create the minikube container that can be utilized in the future. In case you already have minikube running, you may consider deleting it using the command "minikube delete".

```bash
minikube start --driver docker --cpus 4 --memory 8192
```

If the minikube container has been previously created, simply initiate it by executing:

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

By default, Stalker uses the variables from _[devspace.base.yaml](./devspace.base.yaml)_. To ensure smooth functioning, you must first create a copy of the _[devspace.dev.yaml.template](./devspace.dev.yaml.template)_ and rename it as _devspace.dev.yaml_. This file will hold your personal configurations. Any variables defined in this file will override the ones found in _devspace.base.yaml_.

For instance, overwriting the `FM_ENVIRONMENT` variable with the value `dev` instead of the default `prod` will create a default account with the following credentials at startup.

### 2. Run stalker

From the repository root, run

```bash
devspace dev -n stalker
```

### 3. Logging in

Once all the containers have started, you're all set to access the application by visiting [http://localhost:4200](http://localhost:4200). 

If you launched Stalker with the default configuration, Stalker will prompt you to create your first admin user.

If you have launched Stalker with the `FM_ENVIRONMENT` variable set to `dev`, then you can use the following credentials:

```text
Username: admin@stalker.is
Password: admin
```

This account is only to be used locally in development or tests for quality-of-life purposes. When the value is `prod`, you will be prompted to create the first admin account on your first visit to the web application.

You should now be good to go! 🎉 If you happen to change a file in any microservice or in the front end, the app will be automatically updated with your changes.
