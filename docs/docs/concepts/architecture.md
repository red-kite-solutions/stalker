# Network Architecture

The Stalker application is deployed in a Kubernetes cluster on a one instance per cluster basis. [Kubernetes network policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/) are used to segment the different pods. The Stalker jobs, which are [Kubernetes Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/), are run in their own namespace called `stalker-jobs` to isolate them.

> A **default deny all** network policy is in place for the `stalker`, `stalker-jobs` and `default` namespaces. Any pod in these namespaces require a custom network policy to allow any connectivity.

## Development

Microsegmentation is implemented throughout the cluster in the dev environment following this graph:

![Development Stalker Network Architecture](/img/stalker_dev_arch.drawio.png)

The following table goes over the main aspects of the graph :

| Pod               | Ingress          | Egress                                                                      |
| ----------------- | ---------------- | --------------------------------------------------------------------------- |
| UI                | 4200             | Deny All                                                                    |
| Flow Manager (FM) | 3000             | 53 (DNS), 9092 (Kafka), 27017 (Mongo)                                       |
| Cron Service      | 3000             | 53 (DNS), 3000 (FM), 27017 (Mongo)                                          |
| Mongo             | 27017            | Deny All                                                                    |
| Kafka             | 9092, 9093       | 53 (DNS), 2181 (ZK), 2888 (ZK), 3888 (ZK)                                   |
| Zookeeper (ZK)    | 2181, 2888, 3888 | 53 (DNS), 9092 (Kafka), 9093 (Kafka)                                        |
| Orchestrator      | 5135             | 53 (DNS), 443 (K8s API), 9092 (Kafka)                                       |
| Jobs              | Deny All         | 0.0.0.0/0 except 169.254.169.254, 172.16.0.0/12, 192.168.0.0/16, 10.0.0.0/8 |

> The database is accessible from outside the cluster for debugging and development purposes. A production deployment **should not** allow connectivity. The same goes for the cron service on ingress 3000.

> To avoid a conflict with the flow manager, in dev, the cron service is exposed on `127.0.0.1:3001`.
