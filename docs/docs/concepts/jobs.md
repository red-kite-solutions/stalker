---
sidebar_position: 2
title: Jobs
description: What are jobs and how to use them
---

# Jobs

A job is the way for Red Kite to find new information. It is started by Red Kite and runs in a contained environment. Different jobs will
generate different findings. It is possible to reference a Finding's output variable as a job parameter. A job parameter is one of a job's
input variables.

When referencing a Finding's output variable by name (ex: `${domainName}`), the variable name is case insensitive.

A job can generate multiple findings of one or many finding types.

## Built-in jobs

The built-in jobs come with a fresh Red Kite installation. They can be fully modified and also reverted to their original value. They go
hand-in-hand with the built-in subscriptions. Keep in mind that altering a built-in job's name may break a built-in subscription. That
subscription would need to be adapted to the new name.

| Name                                              | Description                              | Type   | Language |
| ------------------------------------------------- | ---------------------------------------- | ------ | -------- |
| [DomainNameResolvingJob](#domainnameresolvingjob) | Resolves a domain name to an IP address  | Code   | Python   |
| [TcpPortScanningJob](#tcpportscanningjob)         | Scans the tcp ports of an IP address     | Code   | Python   |
| [TcpIpRangeScanningJob](#tcpiprangescanningjob)   | Scan an IP range for open ports          | Code   | Python   |
| [BannerGrabbingJob](#bannergrabbingjob)           | Identifies the service running on a port | Code   | Python   |
| [WebsiteCrawlingJob](#websitecrawlingjob)         | Crawls a website for its valid endpoints | Code   | Python   |
| [LoginDetectionJob](#logindetectionjob)           | Detects login portals on websites        | Nuclei | Yaml     |

### DomainNameResolvingJob

A `DomainNameResolvingJob` takes a domain name and resolves it to one or more IP address.

**Input variables :**

| Variable Name | Type   | Value Description                   |
| ------------- | ------ | ----------------------------------- |
| domainName    | string | An FQDN to resolve to an IP address |

**Possible findings generated :**

- HostnameIpFinding

### TcpPortScanningJob

Scans the TCP ports of a host.

**Input variables :**

| Variable Name        | Type     | Value Description                                                                                                              |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| targetIp             | string   | The Host's ipv4 address to scan.                                                                                               |
| threads              | number   | The number of active threads to scan. `1 <= t <= 1000`                                                                         |
| socketTimeoutSeconds | number   | How long the scanner waits before declaring a port as closed and timing out, in seconds. A floating point number. `0 < t <= 3` |
| portMin              | number   | The first port to scan. `1 <= portMin < portMax`                                                                               |
| portMax              | number   | The last port to scan. `portMin < portMax <= 65535`                                                                            |
| ports                | number[] | A JSON array. Every port mentionned in it will be scanned. Ex: `[3389, 8000, 8080, 8443]`                                      |

**Possible findings generated :**

- PortFinding

### TcpIpRangeScanningJob

Scans an IP range (ex: `1.2.3.4/24`) for open ports. It discovers hosts that way and reports the ports as open.

**Input variables :**

| Variable Name | Type     | Value description                                                                        |
| ------------- | -------- | ---------------------------------------------------------------------------------------- |
| targetIp      | string   | The range's IP to scan                                                                   |
| targetMask    | number   | The range's mask, like `16` for `/16`                                                    |
| rate          | number   | Masscan's scanning rate (packets/second)                                                 |
| portMin       | number   | The first port to scan. `1 <= portMin < portMax`                                         |
| portMax       | number   | The last port to scan. `portMin < portMax <= 65535`                                      |
| ports         | number[] | A JSON array. Every port mentionned in it will be scanned. Ex: `[3389, 8000, 8080, 8443] |

**Possible findings generated :**

- HostFinding
- PortFinding

### BannerGrabbingJob

Identifies the service running on a port and grabs the banner. It may occasionally find which OS the host is running on and sometimes other domain names as well.

**Input variables:**

| Variable Name | Type     | Value description                                  |
| ------------- | -------- | -------------------------------------------------- |
| targetIp      | string   | The IP address to check                            |
| ports         | number[] | The ports to check for a service                   |
| nmapOptions   | string   | A long string containing the options given to nmap |

**Possible findings generated :**

- PortServiceFinding
- HostnameIpFinding
- OperatingSystemFinding

### WebsiteCrawlingJob

Crawls a website for its differents valid endpoints. It can also find website technology information.

**Input variables:**

| Variable Name        | Type   | Value description                             |
| -------------------- | ------ | --------------------------------------------- |
| targetIp             | string | The website's IP address                      |
| port                 | number | The website's port                            |
| domainName           | string | The website's domain name                     |
| path                 | string | The website's base path                       |
| ssl                  | bool   | If the website is https                       |
| maxDepth             | number | The depth to crawl                            |
| crawlDurationSeconds | number | The max amount of time to crawl in seconds    |
| fetcherConcurrency   | number | The number of concurrent fetchers to get data |
| inputParallelism     | number | The number of concurrent inputs pprocessor    |
| extraOptions         | string | Katana extra options to adapt execution       |

**Possible findings generated :**

- WebsitePathFinding
- WebsiteTechnologyFinding

### LoginDetectionJob

Detects a login page based on regex and word match.

| Variable Name | Type   | Value description                |
| ------------- | ------ | -------------------------------- |
| targetIp      | string | The website's IP address         |
| port          | number | The website's port               |
| domainName    | string | The website's domain name        |
| path          | string | The website's base path          |
| ssl           | bool   | If the website is https          |
| endpoint      | string | The website's endpoint to target |

### WebsiteScreenshotJob

Takes a screenshot of a web page.

| Variable Name | Type   | Value description                                                             |
| ------------- | ------ | ----------------------------------------------------------------------------- |
| targetIp      | string | The website's IP address                                                      |
| port          | number | The website's port                                                            |
| domainName    | string | The website's domain name                                                     |
| path          | string | The website's base path                                                       |
| ssl           | bool   | If the website is https                                                       |
| endpoint      | string | The website's endpoint to target                                              |
| finding       | string | (Optional, default: WebsiteScreenshotFinding) The name of the emitted finding |
| findingTitle  | string | (Optional, default: Website screenshot) The title of the emitted finding      |
