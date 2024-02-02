
# Overview

Stalker is an Attack Surface Management (ASM) tool with a big focus on extendability. It streamlines and automates reconnaissance operations while giving you the flexibility to expand its functionalities. Its web interface enables easy data access and sharing with all stakeholders.

Stalker is powered by Kubernetes, enabling virtually infinite horizontal scaling. Combined with its flexibility, it makes it the ideal tool for hands-on security professionals committed to staying in full control while getting a clear picture of their attack surface.

Stalker's API can be used by third-party tools for automated consumption.

**Quick Links**

* [Architecture](./architecture.md)
* Jobs
  * [Built-in jobs](./jobs.md)
  * [Implementing jobs](./implementing-jobs.md)
* [Findings](./findings.md)
* [Subscriptions](./subscriptions.md)
* [Secrets](./secrets.md)
* [Releasing](./releasing.md)

---

**Table of content**

* [Core concepts](#core-concepts)
  * [Ressources](#ressources)
    * [Projects](#projects)
    * [Domains](#domains)
    * [Hosts](#hosts)
    * [Ports](#ports)
  * [Extendability](#extendability)
    * [Jobs](#jobs)
    * [Findings](#findings)
    * [Subscriptions](#subscriptions)
* [Acknowledgements](#acknowledgements)

## Core concepts

The Stalker platform revolves around several key concepts, including projects, domains, hosts and ports.

### Ressources

Efficiently organizing data and providing clear visualizations are key features of an Attack Surface Management tool. With Stalker, data organization is made simple and user-friendly, allowing you to focus on analysis and decision-making.

#### Projects

Stalker is designed to cater to the needs of large organizations with multiple subsidiaries, bug bounty hunters, and other use cases. A project  owns entities such as [domains](#domains), [hosts](#hosts) and [ports](#ports).

#### Domains

The domains contain DNS information given by domain names. When a domain resolves to an IP, or a [Host](#hosts), in Stalker's terminology, they are linked.

#### Hosts

Hosts represent IP addresses found by Stalker. Hosts can expose [ports](#ports), which can be TCP or UDP. The hosts also link to the [domains](#domains) that point to them.

#### Ports

Ports can either be TCP or UDP. When open, they expose servers and services that Stalker will attempt to detect, report, and monitor.

### Extendability

#### Jobs

Jobs refer to small scripts that operate independently to gather information about a target. These scripts are produced locally and, upon successful execution, may be uploaded onto Stalker. [Subscriptions](#subscriptions) trigger the start of these jobs, which in turn produce [findings](#findings).

Jobs run in a [Kubernetes job](https://kubernetes.io/docs/concepts/workloads/controllers/job/) pod with configurable resources. A job can be as simple as resolving an IP address, and as complex as scraping a web server.

A guide with detailed [instructions on how to implement a job](./implementing-jobs.md) is available.

#### Findings

Findings are produced by [jobs](#jobs) and they represent information that Stalker needs to process and organize data. Findings can be built-in or custom. Depending on their type and content, findings can trigger [Subscriptions](#subscriptions).

Read here for more in-depth [information about findings](./findings.md).

#### Subscriptions

There are two types of subscriptions.

The first type is the cron subscription. The cron subscription starts a [jobs](#jobs) based on a cron expression. When the cron expression is triggered, a [jobs](#jobs) is started.

The second type is the event subscription. The event subscriptions listen to [findings](#findings) to start new [jobs](#jobs).

When a finding is found, the event subscriptions are queried. If an event subscription exists for the given finding, and the conditions specified in the event subscription are met, the detailed job is started. That job can then find new Findings, which may, in turn, trigger other event subscriptions, in a tree-like manner.

Read here for additional [information on subscriptions](./subscriptions.md).

## Acknowledgements

Stalker leverages multiple free and open source softwares for some of its capabilities. We believe that it is important to recognize their hard work:

* [Nuclei](https://github.com/projectdiscovery/nuclei)
* [Masscan](https://github.com/robertdavidgraham/masscan)
