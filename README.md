# Stalker | Recon Automation

Stalker is an Attack Surface Management (ASM) tool with a big focus on extendability. It streamlines and automates reconnaissance operations while giving you the flexibility to expand its functionalities. Its web interface enables easy data access and sharing with all stakeholders.

Stalker is powered by Kubernetes, enabling virtually infinite horizontal scaling. Combined with its flexibility, it makes it the ideal tool for hands-on security professionals committed to staying in full control while getting a clear picture of their attack surface.

Stalker's API can be used by third-party tools for automated consumption.

> **Warning**
> Stalker is in the Alpha stage and is not yet suitable for production use.

**Table of content**

* [Install](#install)
* [Contributing](#contributing)
* [Core concepts](#core-concepts)
  * [Organize data](#organize-data)
    * [Companies](#companies)
    * [Domains](#domains)
    * [Hosts](#hosts)
    * [Ports](#ports)
  * [Extend workflow](#extend-workflow)
    * [Jobs](#jobs)
    * [Findings](#findings)
    * [Subscriptions](#subscriptions)

## Install

To install Stalker, the most convenient method currently available is in developer mode. To give it a shot, refer to the instructions provided [here](./CONTRIBUTING.md).

## Contributing

If you're ready to make a contribution to Stalker, be sure to check [this guide](./CONTRIBUTING.md) to get started.

## Core concepts

The Stalker platform revolves around several key concepts, including companies, domains, hosts and ports.

### Organize data

Efficiently organizing data and providing clear visualizations are key features of an Attack Surface Management tool. With Stalker, data organization is made simple and user-friendly, allowing you to focus on analysis and decision-making.

#### Companies

Stalker is designed to cater to the needs of large organizations with multiple subsidiaries, bug bounty hunters, and other use cases. A company  owns entities such as [domains](#domains), [hosts](#hosts) and [ports](#ports).

> The _Companies_' concept will soon become _Projects_ (#184), which is more generic. The details should remain relatively unchanged.

#### Domains

The domains contain DNS information given by domain names. When a domain resolves to an IP, or a [Host](#hosts), in Stalker's terminology, they are linked.

#### Hosts

Hosts represent IP addresses found by Stalker. Hosts can expose [ports](#ports), which can be TCP or UDP. The hosts also link to the [domains](#domains) that point to them.

#### Ports

Ports can either be TCP or UDP. When open, they expose servers and services that Stalker will attempt to detect, report, and monitor.

### Extensibility

#### Jobs

Jobs refer to small scripts that operate independently to gather information about a target. These scripts are produced locally and, upon successful execution, may be uploaded onto Stalker. [Subscriptions](#subscriptions) trigger the start of these jobs, which in turn produce [findings](#findings).

Jobs run in a [Kubernetes job](https://kubernetes.io/docs/concepts/workloads/controllers/job/) pod with configurable resources. A job can be as simple as resolving an IP address, and as complex as scraping a web server.

For detailed instructions on how to implement a job, please refer to [this guide](./docs/implementing-jobs.md).

#### Findings

Findings are produced by [jobs](#jobs) and they represent information that Stalker needs to process and organize data. Findings can be built-in or custom. Depending on their type and content, findings can trigger [Subscriptions](#subscriptions).

For more in-depth information about findings, [read here](./docs/implementing-jobs.md#making-contact-with-the-outside-world).

#### Subscriptions

Subscriptions listen to [findings](#findings) to start new [jobs](#jobs). 

When a finding is found, the subscriptions are queried. If a subscription exists for the given finding, and the conditions specified in the subscription are met, the detailed job is started. That job can then find new Findings, which may, in turn, trigger other subscriptions, in a tree-like manner.

For additional information on subscriptions, [read here](./docs/subscriptions.md).
