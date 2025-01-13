---
sidebar_position: 1
title: Resources
description: What are resources
---

# Resources

Resources represent the core entities of an exposed network. They are used to store and show the data found by
[Red Kite's jobs](../concepts/jobs). A resource can also often be created through the user interface and the API.

Every resource belongs to a project and is unique within that project. If you delete a project, all its resources go along with it, helping
you stay compliant and organized.

Resources share some key properties, such as their timestamp values. These include the creation date (`createdAt`), the last update date
(`updatedAt`) and the date at which they were last seen (`lastSeen`).

Jobs uncover data and communicate their discoveries through findings. Some findings give birth to new resources, while others enrich
existing ones. If a finding matches an existing resource, it simply updates the resource’s `lastSeen` value to keep things fresh and
up-to-date. Want to dive deeper? Check out the section on [learn more about findings](../concepts/findings).

## Types of Resources

Resources come in various types, each created by specific findings. Some findings are generated through the user interface, while others
originate from the API. Regardless of their origin, every resource is tied to a specific project.

### Domains

The domains represent domain names or a subdomains, such as `example.com` or `subdomain.example.com`. They store and display DNS-related
information and can be managed via the `Domains` page in the user interface.

Domains can be created using the `HostnameFinding`, via the API. They can also be created through the user interface's `Add domains`
functionality.

Typically, a domain resolves to one or more IP addresses, which are represented as host resources. A domain can be linked to one or more
hosts through the `HostnameIpFinding`. If a `HostnameIpFinding` identifies a new domain or host, it will create these resources
automatically.

Importantly, each domain's name, combined with its project identifier, must is unique within the database.

### Hosts

The hosts represent an exposed IP address: or a computer's network interface listening on the network. Hosts are leveraged to represent the
links between _domains_, hosts and _ports_. They can be seen in the user interface under the `Hosts` page.

A host can be created through the `IpFinding` for a standalone host, or through a `HostnameIpFinding` for a host that is linked to a
_domain_. `IpFinding`s can be emitted by the API through the user interface's `Add hosts` capabilities.

An existing host can be linked to a _domain_ through the `HostnameIpFinding`. A host can be linked to one or many domains.

A host will most of the time have _ports_ related to it. This is where more of the interesting data will be found. Deleting a host will
result in deleting its associated _ports_.

The combination of a host's IP and project identifier is unique in the database.

> At the moment, only IPv4 addresses are supported.

### Ports

A port represents a `tcp` or `udp` port. Ports are used, combined with a _host_'s IP address, to represent a network service. Every port is
linked to a _host_. They can be seen in the user interface under the `Ports` page.

A port is a numerical value between `1` and `65535` inclusively. Ports can run any kind of network services or servers. Some examples could
be a SSH server, a FTP server, a HTTP server, etc.

Red Kite reports a _host_'s `open` ports. `Tcp` ports are considered `open` when they can complete a full `tcp handshake`.

> At the moment, only TCP ports are officially supported.

A port can be created with a `PortFinding`. A port finding is a combination of an IP, a port and a protocol (tcp or udp). Therefore, when a
port is created, it is automatically linked to a _host_.

The combination of a port's number and host identifier is unique in the database.

### Websites

A website represents a `tcp` port running an http(s) server.

A website is the combination between a port, a host, a domain and a path. The path, when not specified, defaults to `/`. The domain can also
be empty, as not all websites have domains that resolve to them.

A website is usually created for each http(s) port for each domain linked to a host.

Therefore, if a host runs two http(s) ports with two domains, a total of 6 websites on the `/` path are possible. Let's take the domains
`dev.example.com` and `example.com`, the IP `1.2.3.4` and the ports `80` and `443` for the `/` path.

The following 6 values are possible:

| domain          | host    | port | path |
| --------------- | ------- | ---- | ---- |
|                 | 1.2.3.4 | 80   | /    |
| example.com     | 1.2.3.4 | 80   | /    |
| dev.example.com | 1.2.3.4 | 80   | /    |
|                 | 1.2.3.4 | 443  | /    |
| example.com     | 1.2.3.4 | 443  | /    |
| dev.example.com | 1.2.3.4 | 443  | /    |

Ports are used, combined with a _host_'s IP address, to represent a network service. Every port is linked to a _host_. They can be seen in
the user interface under the `Ports` page.

A website can be created with a `WebsiteFinding`. A website finding is a combination of an IP, a port, a domain and a path. Therefore, when
a website is created, it is automatically linked to the given port, host and domain.

The combination of a websites's port identifier, domain identifier and path is unique in the database.

## Interacting with Resources

### Tagging a Resource

Tagging a resource can be done through the user interface as well as through the API. Tagging a resource makes it easier to find it again in
the future through the `tags` filter. Any resource can be tagged and found again that way.

To tag a resource in the user interface, simply open the resource's specific view and use the `Manage tags` button.

### Deleting a Resource

Deleting a resource will remove it from the database. It will no longer exist in Red Kite. If the same resource is encountered again by Red
Kite in the future, it will be recreated and it will reappear.

It is useful to remove a resource that is not present anymore, but that we would like to see again if it ever comes back.

### Blocking a Resource

While deleted resources are removed from the database, blocked resources will stay in the database, but will be marked as `blocked`. Blocked
resources are removed from the automation workflow, and are therefore ignored by the different types of
[subscriptions](../concepts/subscriptions).

> **Important**: Blocking a _host_ will not automatically block its _ports_.

Blocked resources can be seen in the user interface by removing the default filter `-is: blocked`. Every resource will be shown that way,
blocked or not. If you wish to only see the blocked resources, use the `is: blocked` filter.

Blocking a resource is useful if, through automation, Red Kite found a resource that does not belong in the project. Deleting it would
likely result in it reappearing later and jobs being run on it. Blocking it will ensure that jobs are not automatically run on the resource
by remembering its existence.

### Exporting Resources

In Red Kite Enterprise, resources can be exported from the list views in the `JSON` or `CSV` format. The `JSON` format is recommended as it
is more flexible than CSV, and therefore better suited to the task.

### Merging Websites

Merging website resources into a single entity is often feasible because Red Kite generates multiple potential websites that may actually be
identical. For example, if Red Kite creates two different websites for ports 80 and 443 on the same IP address, they are likely to be the
same site accessible through different ports.

By merging these websites, automated workflows can treat them as a single entity, reducing the amount of work required. In other words, a
merged website will be ignored by the automated workflows and will point to the other website in which it is merged.

You can merge websites with the UI using the `Merge` button. Only the websites in a same project can be merged together.
