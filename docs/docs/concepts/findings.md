---
sidebar_position: 4
title: Findings
description: What are findings and how to use them
---

# Findings

Findings are pieces of information attached to a project and a resource like a domain, a host or a port. They are created using Red Kite's
software development kit (SDK).

Findings come in different shapes and forms. Some findings will create new resources, others may simply add data to existing ones.

To produce a finding, the job must create an object containing the necessary information and serialize it as JSON.

The finding object must contain the `type` field. Here is a list of default types that come with the default jobs.

| Type                                                  | Description                                                  | Tier       |
| ----------------------------------------------------- | ------------------------------------------------------------ | ---------- |
| [HostnameFinding](#hostnamefinding)                   | Creates a new domain.                                        | Community  |
| [IpFinding](#ipfinding)                               | Creates a new host.                                          | Community  |
| [IpRangeFinding](#iprangefinding)                     | Creates a new IP range.                                      | Community  |
| [HostnameIpFinding](#hostnameipfinding)               | Creates a new host, attaches it to a given domain.           | Community  |
| [PortFinding](#portfinding)                           | Creates a new port, attaches it to the given host.           | Community  |
| [WebsiteFinding](#websitefinding)                     | Creates a new website, with the proper host, domain and port | Community  |
| [CustomFinding](#customfinding)                       | Attaches custom finding data to a given entity.              | Community  |
| [PortServiceFinding](#portservicefinding)             | Fills the `service` field of a port.                         | Community  |
| [WebsitePathFinding](#websitepathfinding)             | Adds an endpoint to a website's sitemap.                     | Community  |
| [TagFinding](#tagfinding)                             | Tags a ressource.                                            | Community  |
| [WebsiteScreenshotFinding](#websitescreenshotfinding) | A photo of a rendered website.                               | Community  |
| [AmassDomainReportFinding](#AmassDomainReportFinding) | A report of a domain's relationships.                        | Enterprise |
| [AmassHostReportFinding](#AmassHostReportFinding)     | A report of a host's relationships.                          | Enterprise |
| [RirOrgFinding](#RirOrgFinding)                       | The organization responsible for managing an IP.             | Enterprise |

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
  "domainName": "red-kite.io"
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
address, and it has to be already known to Red Kite as a valid domain. The hostname ip finding will create or update a host and attaches it
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
  "domainName": "red-kite.io",
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
host specified through the `ip` value. The `ip` must already be known to Red Kite as a valid host. A port finding creates or updates a port
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
ip = "1.2.3.4"
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

## WebsiteFinding

The `WebsiteFinding` will create a website resource. Websites are made from 4 characteristics: an IP address, a domain name, a port number
and a path. Only the IP address and the port are mandatory. The domain can be empty and the path will default to `/`.

To create a website, it must reference an existing port of a project. To reference a domain as well, it must also be a domain already known
to Red Kite.

It signals that an open port running an http(s) service, either `tcp` or `udp`, has been found on the host specified through the `ip` value.
The `ip` must already be known to Red Kite as a valid host. A port finding creates or updates a port and attaches it to the given host.

> Emitting a `PortServiceFinding` with a `serviceName` of `http` and `https` will result in creating a `WebsiteFinding` per domain linked to
> the host, and one with an empty domain. [Learn more about PortServiceFinding and websites](#portservicefinding-and-websites)

| Field        | Description                                             |
| ------------ | ------------------------------------------------------- |
| `ip`         | The ip                                                  |
| `port`       | The port number                                         |
| `domainName` | The domain on which the website is hosted, can be empty |
| `path`       | The folder path, defaults to `/`                        |
| `ssl`        | True if the website is protected by encryption          |

Example:

```json
{
  "type": "WebsiteFinding",
  "key": "WebsiteFinding",
  "ip": "1.2.3.4",
  "port": 80,
  "domainName": "example.com",
  "path": "/",
  "ssl": false
}
```

Using the python SDK, you can emit this finding with the following code:

```python
from stalker_job_sdk import WebsiteFinding, log_finding
port = 80
ip = "1.2.3.4"
domain = "example.com"
path = "/"
ssl = False

log_finding(
    WebsiteFinding(
        "WebsiteFinding",
        ip,
        port,
        domain,
        path,
        ssl,
        "New website",
        [],
        "WebsiteFinding",
    )
)
```

## CustomFinding

Dynamic findings allow jobs to attach custom data to resources.

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
  "domainName": "red-kite.io",
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
        "PortFunFact", ip, port, "tcp", "This is a fun fact about a port"
    )
)
```

### Dynamic fields

Dynamic fields give flexiblity to jobs so they can output complex data. Here is the list of supported dynamic fields.

| Field | Description            |
| ----- | ---------------------- |
| Text  | A label with some text |
| Image | An image               |

Each field consist of at least a `key`, a `type` and `data`. The type is generally automatically populated by the SDK, and the `key` is used
like a variable name, and the `data` should contain the interesting values extracted by the job.

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

A `PortServiceFinding` is type of `CustomFinding` that fills a port's `service` database field with the `serviceName` text field label. It
will then be shown in the interface under the `Service` field.

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

### PortServiceFinding and websites

When publishing a `PortServiceFinding` with the service name of `http` or `https`, the platform will understand that a website is located on
that port.

The platform will therefore create and publish several `WebsiteFinding`s, one for each of the host's linked domain name, and one for the IP
address alone.

These website findings will allow further investigation of the http(s) port with the different domain names, in case the port supporting
multiple virutal hosts.

For instance, imagine a host with the IP address `1.2.3.4`. This host has the linked domains `example.com` and `dev.example.com`.

Then, with the following code publishing the results for an https port:

```python
from stalker_job_sdk import PortFinding, log_finding, TextField

ip = '1.2.3.4'
port = 443
protocol = 'tcp'
service_name = 'https'

fields = [
  TextField("serviceName", "Service name", service_name)
]

log_finding(
    PortFinding(
        "PortServiceFinding", ip, port, protocol, f"Found service {service_name}", fields
    )
)
```

We would create the following three websites:

| domain          | host    | port | path |
| --------------- | ------- | ---- | ---- |
| N/A             | 1.2.3.4 | 443  | `/`  |
| example.com     | 1.2.3.4 | 443  | `/`  |
| dev.example.com | 1.2.3.4 | 443  | `/`  |

That way, a website at `dev.example.com`, which may be different than the one at `example.com`, will be found. The same goes for the website
through direct IP access.

## WebsitePathFinding

A `WebsitePathFinding` is type of `CustomFinding` that fills a website's `paths` database field with the `endpoint` text field label. It
will then be shown in the interface as the website's site map.

| Field        | Description                                                   |
| ------------ | ------------------------------------------------------------- |
| `domainName` | The website's domain                                          |
| `ip`         | The website's ip                                              |
| `port`       | The website's port number                                     |
| `path`       | The website's path                                            |
| `fields`     | A list of [fields](#dynamic-fields). Must include `endpoint`. |

Using the python SDK, you can emit this finding with the following code.

```python
from stalker_job_sdk import WebsiteFinding, log_finding, TextField

ip = '1.2.3.4'
domain = 'example.com'
port = 443
path = '/'
ssl = True
endpoint = '/example/endpoint.html'

fields = [
  TextField("endpoint", "Endpoint", endpoint)
]

log_finding(
    WebsiteFinding(
        "WebsitePathFinding", ip, port, domain, path, ssl, f"Website path", fields
    )
)
```

Upon receiving this finding, the backend will populate the proper website's path with the `endpoint` data.

## WebsiteScreenshotFinding

A `WebsiteScreenshotFinding` is type of `CustomFinding` that should contain an `ImageField` named `image`. This image will be considered the
landing page of the website and will be shown on the different website views.

| Field        | Description                                                |
| ------------ | ---------------------------------------------------------- |
| `domainName` | The website's domain                                       |
| `ip`         | The website's ip                                           |
| `port`       | The website's port number                                  |
| `path`       | The website's path                                         |
| `fields`     | A list of [fields](#dynamic-fields). Must include `image`. |

Using the python SDK, you can emit this finding with the following code.

```python
from stalker_job_sdk import WebsiteFinding, log_finding, ImageField, TextField
from base64 import b64encode

ip = '1.2.3.4'
domain = 'example.com'
port = 443
path = '/'
ssl = True
data = b64encode(image_bytes).decode('utf-8')
image_data =
endpoint = '/example/endpoint.html'

fields = [
  TextField("endpoint", "Endpoint", endpoint),
  ImageField("image", f"data:image/png;base64,{data}")
]

log_finding(
  WebsiteFinding(
      "WebsiteScreenshotFinding", ip, port, domain or '', path, ssl, "Website screenshot", fields
  )
)
```

## TagFinding

A `TagFinding` is a finding that will tag an existing resource with an existing tag. The resource and the tag must already exist.

| Field        | Description                              |
| ------------ | ---------------------------------------- |
| `tag`        | The tag's name                           |
| `ip`         | (optional) The resource's ip.            |
| `port`       | (optional) The resource's port number.   |
| `protocol`   | (optional) The resource's port protocol. |
| `domainName` | (optional) The resource's domain.        |
| `path`       | (optional) The resource's path.          |

Using the python SDK, you can emit this finding for a website with the following code.

```python
from stalker_job_sdk import log_finding, TagFinding

ip = '1.2.3.4'
domain = 'example.com'
port = 443
path = '/'
protocol='tcp'

log_finding(
    TagFinding(
        "Login", ip=ip, port=port, domainName=domain, path=path, protocol=protocol
    )
)
```

Upon receiving this finding, the backend will tag the found resource. The resource will be identified with the given values. The valid
combinations are:

| Valid combination                  | Resource type |
| ---------------------------------- | ------------- |
| domain                             | Domain        |
| ip                                 | Host          |
| ip, port, protocol                 | Port          |
| (domain), ip, port, protocol, path | Website       |

## AmassDomainReportFinding

Attaches a domain relationship report to a domain resource.

Here is an example of how you could emit one using the python SDK.

```python
from stalker_job_sdk import log_finding, DomainFinding, TextField

domain = "example.com"
content = "report content"
fields = [TextField("report", "Report", content)]
title = "Domain Relationship Report"

log_finding(
    DomainFinding(
        "AmassDomainReportFinding", domain, None, title, fields
    )
)
```

| Field        | Description                          |
| ------------ | ------------------------------------ |
| `domainName` | The domain name                      |
| `fields`     | A list of [fields](#dynamic-fields). |

All the fields have the `report` key and contain text information meant to inform users on the resource's realtionships.

## AmassHostReportFinding

Attaches a host relationship report to a host resource.

Here is an example of how you could emit one using the python SDK.

```python
from stalker_job_sdk import log_finding, IpFinding, TextField

ip = "1.1.1.1"
content = "report content"
fields = [TextField("report", "Report", content)]
title = "Host Relationship Report"

log_finding(
    IpFinding(
        "AmassHostReportFinding", ip, title, fields
    )
)
```

| Field    | Description                          |
| -------- | ------------------------------------ |
| `ip`     | The host's ip address                |
| `fields` | A list of [fields](#dynamic-fields). |

All the fields have the `report` key and contain text information meant to inform users on the resource's realtionships.

## RirOrgFinding

The organization responsible for managing an IP address, determined by the ASN.

Here is an example of how you could emit one using the python SDK.

```python
from stalker_job_sdk import log_finding, IpFinding, TextField

fields = [TextField("name", "Name", org_info)]
ip = "1.1.1.1"
title = "Regional Internet registry organization"

log_finding(
    IpFinding(
        "RirOrgFinding", ip, title, fields
    )
)
```

| Field    | Description                          |
| -------- | ------------------------------------ |
| `ip`     | The host's ip address                |
| `fields` | A list of [fields](#dynamic-fields). |

All the fields have the `name` key and contain the name of the organization responsible for managing the IP address.
