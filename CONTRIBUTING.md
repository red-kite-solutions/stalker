# Prerequisites

1. Install Docker
2. Install minikube
3. Install devspace

# Run Stalker

### 1. Start your local K8s cluster

If it is the first time that you start minikube on a computer, give it additional memory and cpus to avoid inconsistant behavior. It will create the minikube container, and this container will be used in the future. 

```
minikube start --driver=docker --cpus=4 --memory=8192
```

Otherwise, if the minikube container was created before, you can just launch it with :

```
minikube start --driver=docker
```

<details>
<summary>
The output should look something like this.
</summary>

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

</details>

<br>

### Create personal configuration

By default, stalker uses the variables from _[devspace.base.yaml](./devspace.base.yaml)_. For Stalker to work properly though, you must first create a copy of the _[devspace.dev.yaml.template](./devspace.dev.yaml.template)_ and name it _devspace.dev.yaml_. This file will hold your personal configurations. Any variables defined in this file will override the ones found in _devspace.base.yaml_.

#### Worker (jobs handler)

Create a file called `jobs_handler.config` in the same directory as `jobs_handler.py`

```
job_queue_handler_address=jqh
job_queue_handler_port=5000
flow_manager_address=fm
flow_manager_port=3000
env=DEV
amass_config=/bin/amass/amass.config
amass_bin_path=/bin/amass/
amass_wordlists=/wordlist/path/
```

### 3. Run stalker

From the repo root, run

```
devspace dev -n stalker
```

You should now be good to go! 🎉 If you change a file in any microservice, the microservice will be automatically live-reloaded.
