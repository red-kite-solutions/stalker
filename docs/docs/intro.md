---
sidebar_position: 1
title: Overview
description: An overview of Red Kite
---

# Overview

Red Kite is an Attack Surface Management (ASM) tool with a big focus on extendability. It streamlines and automates reconnaissance operations
while giving you the flexibility to expand its functionalities. Its web interface enables easy data access and sharing with all
stakeholders.

Red Kite is powered by Kubernetes, enabling virtually infinite horizontal scaling. Combined with its flexibility, it makes it the ideal tool
for hands-on security professionals committed to staying in full control while getting a clear picture of their attack surface.

Red Kite's API can be used by third-party tools for automated consumption.

**Quick Links**

- [Resources](/docs/concepts/resources)
- [Jobs](/docs/concepts/jobs)
- [Findings](/docs/concepts/findings)
- [Subscriptions](/docs/concepts/subscriptions)

## Installing Red Kite

You can use Red Kite with your own production ready deployment. Simply follow the few following steps.

### 1. Install the dependencies

- minikube
- docker
- devspace
- keytool
- openssl

If you use a `Ubuntu Server`, you can use the provided initialization script. Simply run:

```bash
curl https://raw.githubusercontent.com/red-kite-solutions/stalker/main/init_ubuntu.sh | bash
```

If you ran the script successfully, you can log out and log back in, and then directly go to [start stalker](#5-start-stalker).

### 2. Clone the repository

```bash
git clone https://github.com/red-kite-solutions/Stalker && cd stalker
```

### 3. Setup your preferences

Optionally edit your url and port in `setup.sh` to the URL and port that you will use to reach Red Kite. The defaults are the following:

```bash
RK_HOSTNAME=stalker.lan
RK_PORT=8443
```

You can also set a custom size for your mongodb storage in `setup.sh`. The default size is 32 Gb. You may need more, depending on usage.

```bash
MONGO_MAX_SIZE="32Gi"
```

### 4. Make sure your user is in the "docker" group

```sh
sudo groupadd docker
sudo usermod -aG docker $USER
```

### 5. Start Red Kite

> When initializing for the first time, Red Kite will prompt you several times for your root CA key's password.

```bash
chmod +x ./stalker && ./stalker
```

### 6. Add stalker to your host file

Add your `RK_HOSTNAME` to your `/etc/hosts` file.

```text
# RK_HOSTNAME in /etc/hosts
127.0.0.1       stalker.lan
```

> Specify your server's IP if you want to access it from somewhere else than localhost.

### 7. Install the root ca

Add the `root_ca.crt` to your browser's accepted certificate authorities.

### 8. Open up Red Kite!

You are now ready to connect to Red Kite at the following URL:

https://stalker.lan:8443

### Notes

Any time you want to start Red Kite again in the future, simply run the start up script again:

```bash
./stalker
```

> If something went wrong during the install, or you simply want to rerun the setup, you can run Red Kite with the `--force-setup` flag.

## Core concepts

The Red Kite platform revolves around several key concepts, including projects, domains, hosts and ports.

### Ressources

Efficiently organizing data and providing clear visualizations are key features of an Attack Surface Management tool. With Red Kite, data
organization is made simple and user-friendly, allowing you to focus on analysis and decision-making.

#### Projects

Red Kite is designed to cater to the needs of large organizations with multiple subsidiaries, bug bounty hunters, and other use cases. A
project owns entities such as [domains](#domains), [hosts](#hosts) and [ports](#ports).

#### Domains

The domains contain DNS information given by domain names. When a domain resolves to an IP, or a [Host](#hosts), in Red Kite's terminology,
they are linked.

#### Hosts

Hosts represent IP addresses found by Red Kite. Hosts can expose [ports](#ports), which can be TCP or UDP. The hosts also link to the
[domains](#domains) that point to them.

#### Ports

Ports can either be TCP or UDP. When open, they expose servers and services that Red Kite will attempt to detect, report, and monitor.

### Extendability

#### Jobs

Jobs refer to small scripts that operate independently to gather information about a target. These scripts are produced locally and, upon
successful execution, may be uploaded onto Red Kite. [Subscriptions](#subscriptions) trigger the start of these jobs, which in turn produce
[findings](#findings).

Jobs run in a [Kubernetes job](https://kubernetes.io/docs/concepts/workloads/controllers/job/) pod with configurable resources. A job can be
as simple as resolving an IP address, and as complex as scraping a web server.

A guide with detailed [instructions on how to implement a job](/docs/tutorials/implementing-jobs) is available.

#### Findings

Findings are produced by [jobs](#jobs) and they represent information that Red Kite needs to process and organize data. Findings can be
built-in or custom. Depending on their type and content, findings can trigger [Subscriptions](#subscriptions).

Read here for more in-depth [information about findings](/docs/concepts/findings).

#### Subscriptions

There are two types of subscriptions.

The first type is the cron subscription. The cron subscription starts a [jobs](#jobs) based on a cron expression. When the cron expression
is triggered, a [jobs](#jobs) is started.

The second type is the event subscription. The event subscriptions listen to [findings](#findings) to start new [jobs](#jobs).

When a finding is found, the event subscriptions are queried. If an event subscription exists for the given finding, and the conditions
specified in the event subscription are met, the detailed job is started. That job can then find new Findings, which may, in turn, trigger
other event subscriptions, in a tree-like manner.

Read here for additional [information on subscriptions](/docs/concepts/subscriptions).

## Acknowledgements

Red Kite leverages multiple free and open source softwares for some of its capabilities. We believe that it is important to recognize their
hard work:

- [Nuclei](https://github.com/projectdiscovery/nuclei)
- [Masscan](https://github.com/robertdavidgraham/masscan)
