---
sidebar_position: 3
title: Findings
description: What are findings and how to use them
---

# Findings

Findings are pieces of information attached to a project and a core entity like a domain, a host or a port. They are reported by the jobs to the Orchestrator using Stalker's software development kit (SDK).

Findings come in different shapes and forms. Some findings will create new core entities, others may simply add data to existing ones.

To produce a finding, the job must create an object containing the necessary information and serialize it as JSON.

The finding object must contain the `type` field. Here is a list of available types.

| Type                                      | Description                                        |
| ----------------------------------------- | -------------------------------------------------- |
| [HostnameFinding](#hostnamefinding)       | Creates a new domain.                              |
| [IpFinding](#ipfinding)                   | Creates a new host.                                |
| [IpRangeFinding](#iprangefinding)         | Creates a new IP range.                            |
| [HostnameIpFinding](#hostnameipfinding)   | Creates a new host, attaches it to a given domain. |
| [PortFinding](#portfinding)               | Creates a new port, attaches it to the given host. |
| [CustomFinding](#customfinding)           | Attaches custom finding data to a given entity.    |
| [PortServiceFinding](#portservicefinding) | Fills the `service` field of a port.               |

## HostnameFinding

A `HostnameFinding` is an hostname found for a project. Hostname here is used as a short for _fully qualified domain name_, or _FQDN_. A
hostname finding creates or updates a domain.

| Field        | Type   | Description           |
| ------------ | ------ | --------------------- |
| `domainName` | string | The domain name found |

Example:

```json
{
  "type": "HostnameFinding",
  "key": "HostnameFinding",
  "domainName": "stalker.is"
}
```

Using the python SDK, you can emit this finding with the following code:

```python
from stalker_job_sdk import DomainFinding, log_finding
hostname = "example.com"
log_finding(
    DomainFinding(
        "HostnameFinding", hostname, None, "New domain", [], "HostnameFinding"
    )
)
```

## IpFinding

An ip finding creates a new host. IP addresses are in the IPv4 format.

| Field | Type   | Description                         |
| ----- | ------ | ----------------------------------- |
| `ip`  | string | The IPv4 for which to create a host |

Example:

```json
{
  "type": "IpFinding",
  "key": "IpFinding",
  "ip": "0.0.0.0"
}
```

Using the python SDK, you can emit this finding with the following code:

```python
from stalker_job_sdk import IpFinding, log_finding
ip = "0.0.0.0"
log_finding(
    IpFinding(
        "IpFinding", ip, "New ip", [], "IpFinding"
    )
)
```

## IpRangeFinding

An ip range finding creates a new ip range for a project. IP addresses are in the IPv4 format.

| Field  | Type   | Description                                                                                              |
| ------ | ------ | -------------------------------------------------------------------------------------------------------- |
| `ip`   | string | The IPv4 for which to create a host                                                                      |
| `mask` | number | An integer between 0 and 32, inclusively. It represents a network mask in the short notation like `/24`. |

Example:

```json
{
  "type": "IpRangeFinding",
  "key": "IpRangeFinding",
  "ip": "0.0.0.0",
  "mask": 16
}
```

Using the python SDK, you can emit this finding with the following code:

```python
from stalker_job_sdk import IpFinding, log_finding
ip = "0.0.0.0"
mask = 16
log_finding(
    IpRangeFinding(
        ip, mask
    )
)
```

> You can't attach fields to an IP range as they are different than other ressources.

Which is equivalent to the following python code, but with more metadata:

## HostnameIpFinding

The `HostnameIpFinding` is usually the result of resolving a hostname to an ip address. The hostname, `domainName`, must resolve to the IP
address, and it has to be already known to Stalker as a valid domain. The hostname ip finding will create or update a host and attaches it
to the given existing domain.

| Field        | Description                                |
| ------------ | ------------------------------------------ |
| `domainName` | The domain to which to attach the new host |
| `ip`         | The IPv4                                   |

Example:

```json
{
  "type": "HostnameIpFinding",
  "key": "HostnameIpFinding",
  "domainName": "stalker.is",
  "ip": "0.0.0.0"
}
```

Using the python SDK, you can emit this finding with the following code:

```python
from stalker_job_sdk import DomainFinding, log_finding
hostname = "example.com"
ip = "0.0.0.0"
log_finding(
    DomainFinding(
        "HostnameIpFinding", hostname, ip, "New ip", [], "HostnameIpFinding"
    )
)
```

## PortFinding

The `PortFinding` is usually the result of a port scanning job. It signals that an open port, either `tcp` or `udp`, has been found on the
host specified through the `ip` value. The `ip` must already be known to Stalker as a valid host. A port finding creates or updates a port
and attaches it to the given host.

| Field      | Description                         |
| ---------- | ----------------------------------- |
| `protocol` | The protocol, either 'tcp' or 'udp' |
| `ip`       | The ip                              |
| `port`     | The port number                     |

Example:

```json
{
  "type": "PortFinding",
  "key": "PortFinding",
  "protocol": "tcp",
  "ip": "1.2.3.4",
  "port": 80
}
```

Using the python SDK, you can emit this finding with the following code:

```python
from stalker_job_sdk import PortFinding, log_finding
port = 80
ip = "0.0.0.0"
log_finding(
    PortFinding(
        "PortFinding",
        ip,
        port,
        "tcp",
        "New port",
        [TextField("protocol", "This is a TCP port", "tcp")],
        "PortFinding",
    )
)
```

## CustomFinding

Dynamic findings allow jobs to attach custom data to core entities.

| Field        | Description                                                     |
| ------------ | --------------------------------------------------------------- |
| `domainName` | The domain to which to attach the custom finding                |
| `host`       | The host to which to attach the custom finding                  |
| `port`       | The port to which to attach the custom finding                  |
| `fields`     | A list of [fields](#dynamic-fields) containing the finding data |

Examples:

```json
{
  "type": "CustomFinding",
  "host": "1.2.3.4",
  "port": 80,
  "fields": [
    {
      "type": "image",
      "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"
    }
  ]
}
```

```json
{
  "type": "CustomFinding",
  "domainName": "stalker.is",
  "fields": [
    {
      "type": "text",
      "label": "Domain greatness level",
      "data": "This domain is great, would recommend"
    }
  ]
}
```

Here is an example of a custom finding for a port with the python SDK. In this example, the port will show the custom information _This port
runs an HTTP server_:

```python
from stalker_job_sdk import PortFinding, log_finding
port = 80
ip = "0.0.0.0"
log_finding(
    PortFinding(
        "HttpServerCheck", ip, port, "tcp", "This port runs an HTTP server"
    )
)
```

### Dynamic fields

Dynamic fields give flexiblity to jobs so they can output complex data. Here is the list of supported dynamic fields.

| Field | Description            |
| ----- | ---------------------- |
| Text  | A label with some text |
| Image | An image               |

Each field consist of at least a `key`, a `type` and `data`. The type is generally automatically populated by the SDK, and the `key` is used like a variable name, and the `data` should contain the interesting values extracted by the job.

> The `key` field can be used to inject the content of `data` as an input to a new job in an event subscription.

#### Text field

Create an `TextField` with the python SDK:

```python
key = 'topthreekeywords'
label = 'Top 3 keywords found in web page'
data = 'Potato, celery, transformers'
field = TextField(key, label, data)
```

It will result in a json like the following:

```json
{
  "key": "topthreekeywords",
  "type": "text",
  "label": "Top 3 keywords found in web page",
  "data": "Potato, celery, transformers"
}
```

#### Image field

Create an `ImageField` with the python SDK:

```python
key = 'myImageField'
image_data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII'
field = ImageField(key, image_data)
```

It will result in a json like the following:

```json
{
  "key": "myImageField",
  "type": "image",
  "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"
}
```

## PortServiceFinding

A `PortServiceFinding` is type of `CustomFinding` that fills a port's `service` database field with the `serviceName` text field label. It will then be shown in the interface under the `Service` field.

| Field      | Description                                                      |
| ---------- | ---------------------------------------------------------------- |
| `protocol` | The protocol, either 'tcp' or 'udp'                              |
| `ip`       | The ip                                                           |
| `port`     | The port number                                                  |
| `fields`   | A list of [fields](#dynamic-fields). Must include `serviceName`. |

Using the python SDK, you can emit this finding with the following code.

```python
from stalker_job_sdk import PortFinding, log_finding, TextField

ip = '0.0.0.0'
port = 22
protocol = 'tcp'
service_name = 'ssh'

fields = [
  TextField("serviceName", "Service name", service_name)
]

log_finding(
    PortFinding(
        "PortServiceFinding", ip, port, protocol, f"Found service {service_name}", fields
    )
)
```

Upon receiving this finding, the backend will set the service database field of the TCP port 22 for the `0.0.0.0` IP to `ssh`.
