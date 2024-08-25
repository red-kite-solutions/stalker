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

### 2. Create personal configuration

By default, Stalker uses the variables from _[devspace.base.yaml](./devspace.base.yaml)_. To ensure a smooth experience, you must first create a copy of _[devspace.dev.yaml.template](./devspace.dev.yaml.template)_ and rename it as _devspace.dev.yaml_. This file will hold your personal configurations. Any variables defined in this file will override the ones found in _devspace.base.yaml_.

For instance, overwriting the `JM_ENVIRONMENT` variable with the value `dev` instead of the default `prod` will create a default account with the following credentials at startup.

Some of these environment variables are certificates and keys for the different connections in the cluster.

You can create the certificates, keys and variables for MongoDB by running the following script while being in the repository's root on a unix-like system.

```bash
bash ./setup_mongo_dev.sh
```

You can create the certificates, keys and variables for Kafka by running the followingn script while being in the repository's root on a unix-like system.

```bash
bash ./setup_kafka_dev.sh
```

The scripts will generate the certificates and keys and append the environment variables and keys to your `devspace.dev.yaml` file. Some of the generated file files will be your own connection key (`user-client.key`) and certificate (`user-client-signed.crt`) to MongoDB for your local client. They will be written to the root of the repository and your key's **password will be printed in the terminal**.

> Every password, certificate and keys should be custom to your own environment. Do not use the provided certificates, keys and passwords. They are only provided as examples and to run the tests.

Then, generate secrets

```bash
bash ./setup_secrets_dev.sh
```

### 3. Run stalker

From the repository root, run

```bash
devspace dev -n stalker
```

## Using Stalker

### Logging in

Once all the containers have started, you're all set to access the application by visiting [http://localhost:4200](http://localhost:4200).

If you launched Stalker with the default configuration, Stalker will prompt you to create your first admin user.

If you have launched Stalker with the `JM_ENVIRONMENT` variable set to `dev`, then you can use the following credentials:

```text
Username: admin@stalker.is
Password: admin
```

This account is only to be used locally in development or tests for quality-of-life purposes. When the value is `prod`, you will be prompted to create the first admin account on your first visit to the web application.

You should now be good to go! 🎉 If you happen to change a file in any microservice or in the front end, the app will be automatically updated with your changes.

### Connecting to the database with a local client

Here, `MongoDB Compass` is used to connect to the local database.

To connect to the database with a local client, for development purposes, you will need a certificate authority file, a client certificate and its private key.

> If your certificates and keys do not exist, try to run the initialization script `setup_mongo_dev.sh`.

1. Create a new connection via `Connect > New connection`
2. Paste the following string as a connection string to initialize some parameters.

```text
mongodb://root:123456@localhost:27017/?authSource=admin&replicaSet=rs0&readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=true
```

3. Click on `Fill in connection fields individually`
4. Change root's password with yours.
5. Click on `More Options`
6. Set `SSL` to `Server and Client Validation` to configure mutual TLS
7. Set `Certificate Authority` to the generated `ca.pem` file.
8. Set `Client Certificate` to the generated `user-client-signed.crt` file.
9. Set `Client Private Key` to the generated `user-client.key` file.
10. Set `Client Key Password` to the password that was given to you when you ran `setup_mongo_dev.sh`.
11. Click `Connect`

# Releasing a new version

Releasing a new version of a micro-service is as simple as running the [Release Workflow](https://github.com/red-kite-solutions/stalker/actions/workflows/release.yml) and selecting the desired branch and release type for each micro-service.
