---
sidebar_position: 1
title: Network Architecture
description: An overview of Red Kite's network architecture
---

# Network Architecture

The Red Kite application is deployed in a Kubernetes cluster on a one instance per cluster basis.
[Kubernetes network policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/) are used to segment the different
pods. The Red Kite jobs, which are [Kubernetes Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/), are run in their own
namespace called `stalker-jobs` to isolate them.

> A **default deny all** network policy is in place for the `stalker`, `stalker-jobs` and `default` namespaces. Any pod in these namespaces
> require a custom network policy to allow any connectivity.

## Production

Microsegmentation is implemented throughout the cluster in the production environment following this graph:

![Production Red Kite Network Architecture](/img/prod_network_architecture.png)

The following table goes over the main aspects of the graph :

| Pod               | Ingress          | Egress                                                                                         |
| ----------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| Nginx (UI)        | 80, 443          | 53 (DNS), 3000 (FM)                                                                            |
| Jobs Manager (FM) | 3000             | 53 (DNS), 9092 (Kafka), 27017 (Mongo)                                                          |
| Cron Service      | Deny All         | 53 (DNS), 3000 (FM), 27017 (Mongo)                                                             |
| Mongo             | 27017            | 27017 (Mongo)                                                                                  |
| Kafka             | 9092, 9093, 9094 | 53 (DNS), 9092 (Kafka), 9093 (Kafka), 9094 (Kafka)                                             |
| Orchestrator      | 80               | 53 (DNS), 443 (K8s API), 9092 (Kafka)                                                          |
| Jobs              | Deny All         | 80 (Orchestrator), 0.0.0.0/0 except 169.254.169.254, 172.16.0.0/12, 192.168.0.0/16, 10.0.0.0/8 |

> You can access your local production Red Kite instance through https://127.0.0.1:8443/

## Development

Microsegmentation is implemented throughout the cluster in the dev environment following this graph:

![Development v Network Architecture](/img/red_kite_dev_arch.drawio.png)

The following table goes over the main aspects of the graph :

| Pod               | Ingress          | Egress                                                                                         |
| ----------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| UI                | 4200             | Deny All                                                                                       |
| Jobs Manager (FM) | 3000             | 53 (DNS), 9092 (Kafka), 27017 (Mongo)                                                          |
| Cron Service      | 3000             | 53 (DNS), 3000 (FM), 27017 (Mongo)                                                             |
| Mongo             | 27017            | 27017 (Mongo)                                                                                  |
| Kafka             | 9092, 9093, 9094 | 53 (DNS), 9092 (Kafka), 9093 (Kafka), 9094 (Kafka)                                             |
| Orchestrator      | 80               | 53 (DNS), 443 (K8s API), 9092 (Kafka)                                                          |
| Jobs              | Deny All         | 80 (Orchestrator), 0.0.0.0/0 except 169.254.169.254, 172.16.0.0/12, 192.168.0.0/16, 10.0.0.0/8 |

> The database is accessible from outside the cluster for debugging and development purposes. A production deployment **should not** allow
> connectivity. The same goes for the cron service on ingress 3000.

> To avoid a conflict with the jobs manager, in dev, the cron service is exposed on `127.0.0.1:3001`.