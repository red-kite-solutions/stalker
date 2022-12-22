# Subscriptions

When Stalker finds some information, either through the output of a Job, or through user input, a Finding is emitted. This Finding contains the output information given by the Job or the user. From this information, new Jobs are started that will output more Findings. This is roughly how Stalker's automation workflow works.

A Subscription allows for the customization of Stalker's automation workflow by starting any Job on any Finding. These jobs can be started on specified conditions. Also, the output of the finding can be used as a job input, as well as a condition parameter.

## Syntax

A Subscription is written in a yaml format in the front-end. The company for which to apply the subscription also has to be chosen using the dropdown menu.

A Subscription can contain four main elements :

| Element    | Description                                               | Mandatory |
| ---------- | --------------------------------------------------------- | --------- |
| name       | The name of the subscription, for future reference        | Yes       |
| finding    | The finding to react to.                                  | Yes       |
| job        | The job to launch when the finding and conditions are met | Yes       |
| conditions | The preconditions to launching the job                    | No        |

> N.B. Additonnal details on these elements are given in the following sections

* The `name` element can be anything and is only used to distinguish the Subscription from the others.
* The `finding` element must be a existing Finding's type. See the Findings section for the list.
* The `job` element contains multiple values:
  * `name` : mandatory, must be an existing Job's type. See the Jobs section for the list of valid values.
  * `parameters` : optionnal, but almost always needed. It describes the input values of the job by the parameter `name` and its `value` in a list.
* The `conditions` element is the only non-mandatory main element. If it is not provided, the Job will always be started when the Finding is found. Multiple conditions can be provided in a list. Conditions contain mulitple elements:
  * `lhs` : The left-hand side operand.
  * `operator` : The operator to compare the two operands.
  * `rhs` : The right-hand side operand.

> You can reference a Finding's output variable by name in a Job parameter's value or in a condition's operand using the following syntax: `${parameterName}`. The variable name is case insensitive.

### Simple Example

Here is one of the shortest Subscription possible. It reacts to a `HostnameFinding` to launch a `DomainNameResolvingJob`, using the output of the Finding as the `domainName` parameter value.

Therefore, it will resolve the domain name found in the `HostnameFinding` to an IP address by launching a `DomainNameResolvingJob`. It will emit a `HostnameIpFinding` if it properly resolves the domain name.

> Something similar in behavior is already built in Stalker.

```yaml
name: My simple subscription
finding: HostnameFinding
job:
  name: DomainNameResolvingJob
  parameters:
    - name: domainName
      value: ${domainName}

```

### Complex Example

Here is an example of how to start a `TcpPortScanningJob` when a `HostnameIpFinding` is emitted. This job will however only start if all the conditions are met. The Finding's found `ip` must contain the case insensitive string "13.37", and 5 must be greater than or equal to 3.

If the conditions are met when a `HostnameIpFinding` is emitted, then the job will start with the specified parameters. Note here that the `targetIp` parameter will contain the value of the Finding's output variable `ip`.

The Job, in this case, will scan the `${ip}`'s 1000 first ports ([1-1000]) as well as the ports 1234, 3389 and 8080. It will do so in 10 parallel threads. Every thread's socket will have a 1 second timeout if it does not respond. We can therefore expect the Job to finish in a maximum of around 100 seconds.

> Something similar in behavior, except from the conditions, is already built in Stalker.

```yaml
name: My complex subscription
finding: HostnameIpFinding
job:
  name: TcpPortScanningJob
  parameters:
    - name: targetIp
      value: ${ip}
    - name: threads
      value: 10
    - name: socketTimeoutSeconds
      value: 1
    - name: portMin
      value: 1
    - name: portMax
      value: 1000
    - name: ports
      value: [1234, 3389, 8080]
conditions:
  - lhs: ${ip}
    operator: contains_i
    rhs: "13.37"
  - lhs: 5
    operator: gte
    rhs: 3
```

## Findings

A finding event is propagated by Stalker whenever an information comes into play. Every finding type contains information that is specific to it.

**Findings :**

* HostnameFinding
* HostnameIpFinding
* PortFinding

It is possible to reference a finding outputted by a job as an input of a new job, as well as a condition operand. All references to a finding's output variable are case insensitive.

### HostnameFinding

A `HostnameFinding` is the result of a new hostname being found for a company. A hostname is here used as a short for *fully qualified domain name*, or *FQDN*. It represents a Domain for Stalker.

| Variable Name | Type   | Value Description                         |
| ------------- | ------ | ----------------------------------------- |
| domainName    | string | A newly found FQDN, like `www.stalker.is` |

### HostnameIpFinding

The `HostnameIpFinding` is usually the result of resolving a hostname to an ip address. The hostname, `domainName`, must resolve to the IP address, and it has to be already known to Stalker as a valid Domain.

**output variables :**

| Variable Name | Type   | Value Description                                      |
| ------------- | ------ | ------------------------------------------------------ |
| domainName    | string | The FQDN resolving to the `ip`, like `www.stalker.is`  |
| ip            | string | The ipv4 address to which the `domainName` resolves to |

### PortFinding

The `PortFinding` is usually the result of a port scanning job. It signals that an open port, either `tcp` or `udp`, has been found on the host specified through the `ip` value. The `ip` must already be known to Stalker as a valid Host.

**output variables :**

| Variable Name | Type   | Value Description                           |
| ------------- | ------ | ------------------------------------------- |
| protocol      | string | `tcp` or `udp`                              |
| ip            | string | The ipv4 of the host where a port was found |
| port          | number | The open port number                        |

## Jobs

A job is the way for Stalker to find new information. It is started by Stalker and runs in a contained environment. Different jobs will generate different findings. It is possible to reference a Finding's output variable as a job parameter. A job parameter is one of a job's input variables.

When referencing a Finding's output variable by name (ex: `${domainName}`), the variable name is case insensitive.

A job can generate multiple findings of one or many finding types.

**Jobs :**

* DomainNameResolvingJob
* TcpPortScanningJob

### DomainNameResolvingJob

A `DomainNameResolvingJob` takes a domain name and resolves it to one or more ip address.

**Input variables :**

| Variable Name | Type   | Value Description                  |
| ------------- | ------ | ---------------------------------- |
| domainName    | string | A FQDN to resolve to an IP address |

**Possible Findings generated :**

* HostnameIpFinding

### TcpPortScanningJob

**Input variables :**

| Variable Name        | Type   | Value Description                                                                                                              |
| -------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| targetIp             | string | The Host's ipv4 address to scan.                                                                                               |
| threads              | string | The number of active threads to scan. `1 <= t <= 1000`                                                                         |
| socketTimeoutSeconds | number | How long the scanner waits before declaring a port as closed and timing out, in seconds. A floating point number. `0 < t <= 3` |
| portMin              | string | The first port to scan. `1 <= portMin < portMax`                                                                               |
| portMax              | string | The last port to scan. `portMin < portMax <= 65535`                                                                            |
| ports                | string | A JSON array in a string. Every port mentionned in it will be scanned. Ex: `"[3389, 8000, 8080, 8443]"`                        |

**Possible Findings generated :**

* PortFinding

## Conditions

By default, a Subscription's Job will always start when the specified Finding is found. However, it is not always the desired behavior. Sometimes, the Job should only start if the Finding's output respect some established Conditions.

A Condition is made of three elements: a left-hand side parameter (`lhs`), an `operator`, and a right-hand side parameter (`rhs`). The `lhs` parameter is compared to the `rhs` parameter using the `operator`. A Finding's output variable can be used as a Condition's `lhs` or `rhs` parameter when referenced using the syntax `${paramName}`.

The primitive type of the parameters must match together and must match with the operator for the condition to return `true`. The allowed types of an operand are `string`, `number` or `boolean`. If all the condtions return true, then the specified job will be started.

| Operator     | Accepted Operand Types  | Description                                                                   |
| ------------ | ----------------------- | ----------------------------------------------------------------------------- |
| gte          | number                  | `lhs >= rhs`                                                                  |
| gt           | number                  | `lhs > rhs`                                                                   |
| lte          | number                  | `lhs <= rhs`                                                                  |
| lt           | number                  | `lhs < rhs`                                                                   |
| equals       | string, number, boolean | `lhs == rhs`                                                                  |
| equals_i     | string                  | Case insensitive, `lhs == rhs`                                                |
| contains     | string                  | Validates if the `lhs` string contains the `rhs` string.                      |
| contains_i   | string                  | Validates if the `lhs` string contains the `rhs` string. Case insensitive.    |
| startsWith   | string                  | Validates if the `lhs` string starts with the `rhs` string.                   |
| startsWith_i | string                  | Validates if the `lhs` string starts with the `rhs` string. Case insensitive. |
| endsWith     | string                  | Validates if the `lhs` string ends with the `rhs` string.                     |
| endsWith_i   | string                  | Validates if the `lhs` string ends with the `rhs` string. Case insensitive.   |
