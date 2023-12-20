# Findings

* [HostnameFinding](#hostnamefinding)
* [IpFinding](#ipfinding)
* [HostnameIpFinding](#hostnameipfinding)
* [PortFinding](#portfinding)
* [CustomFinding](#customfinding)
  * [Dynamic fields](#dynamic-fields)
    * [Text field](#text-field)
    * [Image field](#image-field)

Findings are pieces of information attached to a company and a core entity like a domain, a host or a port.

Findings come in different shapes and forms. Some findings will create new core entities, others may simply add data to existing ones.

To produce a finding, the job must create an object containing the necessary information and serialize it as JSON.

The finding object must contain the `type` field. Here is a list of available types.

| Type                                    | Description                                        |
| --------------------------------------- | -------------------------------------------------- |
| [HostnameFinding](#hostnamefinding)     | Creates a new domain.                              |
| [IpFinding](#ipfinding)                 | Creates a new host.                                |
| [HostnameIpFinding](#hostnameipfinding) | Creates a new host, attaches it to a given domain. |
| [PortFinding](#portfinding)             | Creates a new port, attaches it to the given host. |
| [CustomFinding](#customfinding)         | Attaches custom finding data to a given entity.    |

## HostnameFinding

A `HostnameFinding` is an hostname found for a company. Hostname here is used as a short for *fully qualified domain name*, or *FQDN*. A hostname finding creates or updates a domain.

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

Using the python sdk, you can emit this finding with the following code:

```python
from stalker_job_sdk import DomainFinding, log_finding
hostname = "example.com"
log_finding(
    DomainFinding(
        "HostnameFinding", hostname, None, "New domain", [], "HostnameFinding"
    )
)
```

Which is roughly equivalent to the following python code, but with more metadata:

```python
print('@finding { "findings": [{ "key": "HostnameFinding", "type": "HostnameFinding","domainName": "example.com"}]}')
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

Using the python sdk, you can emit this finding with the following code:

```python
from stalker_job_sdk import IpFinding, log_finding
ip = "0.0.0.0"
log_finding(
    IpFinding(
        "IpFinding", ip, "New ip", [], "IpFinding"
    )
)
```

Which is roughly equivalent to the following python code, but with more metadata:

```python
print('@finding { "findings": [{ "key": "IpFinding", "type": "IpFinding","ip": "0.0.0.0"}]}')
```

## HostnameIpFinding

The `HostnameIpFinding` is usually the result of resolving a hostname to an ip address. The hostname, `domainName`, must resolve to the IP address, and it has to be already known to Stalker as a valid domain. The hostname ip finding will create or update a host and attaches it to the given existing domain.

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

Using the python sdk, you can emit this finding with the following code:

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

Which is roughly equivalent to the following python code, but with more metadata:

```python
print('@finding { "findings": [{ "key": "HostnameIpFinding", "type": "HostnameIpFinding","ip": "0.0.0.0", "domainName": "example.com"}]}')
```

## PortFinding

The `PortFinding` is usually the result of a port scanning job. It signals that an open port, either `tcp` or `udp`, has been found on the host specified through the `ip` value. The `ip` must already be known to Stalker as a valid host. A port finding creates or updates a port and attaches it to the given host.

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

Using the python sdk, you can emit this finding with the following code:

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

Which is roughly equivalent to the following python code:

```python
print('@finding { "findings": [{"key":"PortFinding","type":"PortFinding","name":"New port","fields":[{"key":"protocol","type":"text","label":"This is a TCP port","data":"tcp"}],"ip":"0.0.0.0","port":80,"protocol":"tcp"}]}')
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
      "content": "This domain is great, would recommend"
    }
  ]
}
```

Here is an example of a custom finding for a port with the python sdk. In this example, the port will show the custom information _This port runs an HTTP server_:

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

#### Text field

Example:

```json
{
  "type": "text",
  "label": "Top 3 keywords found in web page",
  "content": "Potato, celery, transformers"
}
```

#### Image field

Example:

```json
{
  "type": "image",
  "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"
}
```
