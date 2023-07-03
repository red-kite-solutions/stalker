# Stalker | Recon Automation

Stalker is an Attack Surface Management (ASM) tool with a big focus on customizability. It facilitates and automates reconnaissance operations, while allowing you to fully extend its capabilities. Its web interface allows for easier consumption of data, while also facilitating sharing with all stakeholders.

Stalker has a microservice architecture based in Kubernetes, allowing it for virtually infinite horizontal scaling. Combined with its flexibility, it makes it the ideal tool for hands-on security professionals wanting to stay in full control while getting a clear picture of their attack surface.

Stalker also exposes an API for automated consumption by third party tools.

> **Warning**
> Stalker is in Alpha stage and is not yet suitable for production use.

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

The easiest way to install Stalker is currently in developper mode. You can try it out by [following the guide here](./CONTRIBUTING.md).

## Contributing

To contribute to Stalker, you can [follow the guide here](./CONTRIBUTING.md) on how to get started.

## Core concepts

Several core concepts in Stalker are used to organize data and extend the workflow.

### Organize data

Organizing the data is a big part of the value of an Attack Surface Management tool, along with visualization. Stalker organizes that data for you and lets you

#### Companies

Stalker is built to target different companies for large scale organisations with subsidiaries, bug bounty hunters, or other use cases. Organizing data that way allows for easier filtering and referencing. A company will own the other data organization concepts of Stalker, such as [domains](#domains), [hosts](#hosts) and [ports](#ports).

> The companies' concept is to be switched to a concept of Projects, which is more generic. The details, however, should relatively stay the same.

#### Domains

The domains contain DNS information given by domain names. When a domain resolves to an IP, or a [Host](#hosts), in Stalker's terminology, they are linked.

#### Hosts

Hosts represent an IP address found by Stalker. Hosts can expose [ports](#ports), TCP or UDP. The hosts also link to the [domains](#domains) that point to them.

#### Ports

Ports can either be TCP or UDP. When open, they expose servers and services, which Stalker will try to identify, report and track.

### Extend workflow

#### Jobs

The jobs are small scripts that can be run independently to find information about a target. They are developped locally and, once they work, are uploaded to Stalker. The jobs are started by [Subscriptions](#subscriptions) and they emit [Findings](#findings).

Jobs are run in a [Kubernetes job](https://kubernetes.io/docs/concepts/workloads/controllers/job/) pod with configurable resources. A job can be as simple as resolving an IP address, and as complex as scraping a web server.

To implement a job, more in-depth information is [provided here](./docs/implementing-jobs.md).

#### Findings

Findings are found by [jobs](#jobs) and they represent an information that Stalker needs to process and organize. Findings can be built-in or custom. Findings, depending on their type and content, can trigger [Subscriptions](#subscriptions).

For more in-depth information about findings, [read here](./docs/implementing-jobs.md#making-contact-with-the-outside-world).

#### Subscriptions

Subscriptions tie the [findings](#findings) to the next [jobs](#jobs) to start. The subscriptions detail a finding for which to subscribe, the conditions on which a job is to be started, and the job and its parameters to start.

When a finding is found, the subscriptions are queried. If a subscription exists for the finding, and the conditions specified in the subscription are met, the detailed job is started. That job can then find new Findings, which may in turn trigger other subscriptions, in a tree-like manner.

For additional information on subscriptions, [read here](./docs/subscriptions.md).
