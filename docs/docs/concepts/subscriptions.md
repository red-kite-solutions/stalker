---
sidebar_position: 5
title: Subscriptions
description: What are subscriptions and how to use them
---

# Subscriptions

Subscriptions are used in Red Kite to start jobs based on either a cron expression (cron subscriptions) or a finding (event subscription).
They are used to expand Red Kite's automation workflow.

A subscription can belong to a project, in which case, they will only take effect on the mentionned project. If a project is not specified
for a subscription, it will take effect on all the projects.

Some subscriptions come built-in Red Kite. These subscriptions are marked as such, but they can still be modified by the users. Built-in subscriptions can even be deleted, but be sure to
know what you are doing.

A susbcription, cron or event, will not trigger on a blocked resource.

A subscription is written in `yaml` format in the front-end. The project for which to apply the subscription can also be chosen using the
dropdown menu.

> A subscription belongning to a project will be deleted automatically if the project is deleted.

## Cron Subscriptions

Cron subscriptions are started based on a cron expression. They are the most simple subscriptions and only require the information necessary
to start a job.

Cron subscriptions can be reliably triggered as often as every twenty (20) seconds. The cron service, who is in charge of notifying the jobs
manager when a cron subscription triggers, checks its local cache of cron subscriptions every 10 seconds. The local cache is synchronized
with the subscriptions database every 60 seconds. A new cron subscription added from the UI will therefore be up and running at the latest
one 1 minute 20 seconds after the save.

Even though cron subscriptions do not require a project to be set, they require at least one project to exist at the moment it is triggered
to properly start at least one job.

### Cron Subscription Syntax

A cron subscription contains the following main elements :

| Element        | Description                                              | Mandatory |
| -------------- | -------------------------------------------------------- | --------- |
| name           | The name of the subscription, for future reference       | Yes       |
| cronExpression | The cron expression that specifies when to start the job | Yes       |
| input          | A value representing all the ressources of a type        | No        |
| job            | The job to launch when the cron expression is triggered  | Yes       |

> N.B. Additonnal details on these elements are given in the following sections

- The `name` element can be anything and is only used to distinguish the subscription from the others.
- The `cronExpression` element has to be a valid cron expression. It is used to trigger the job launch.
- The `input` element is either `ALL_DOMAINS`, `ALL_HOSTS`, `ALL_IP_RANGES`, `ALL_TCP_PORTS` or `ALL_WEBSITES`. These values represent all the ressources of
  the corresponding type.
- The `job` element contains multiple values:
  - `name` : mandatory, must be an existing Job's type. See the Jobs section for the list of valid values.
  - `parameters` : optionnal, but almost always needed. It describes the input values of the job by the parameter `name` and its `value` in
    a list.

#### Cron Subscription Simple Example

Here is one of the shortest subscription possible. It triggers every day at noon to launch a `DomainNameResolvingJob`, using `example.com`
as the `domainName` parameter value.

Therefore, it will resolve the domain name to an IP address by launching a `DomainNameResolvingJob`. It will emit a `HostnameIpFinding` if
it properly resolves the domain name.

It will start again the next day at noon.

```yaml
name: my cron subscription
cronExpression: 0 0 12 * * ?
job:
  name: DomainNameResolvingJob
  parameters:
    - name: domainName
      value: example.com
```

#### Input variable

The `input` variable specifies an input source. There are multiple input sources described in the following table. The `input` variable is
optionnal. The variables can be injected in the job parameters as well as in the conditions.

If a project is specified, only the ressources of the targeted project will be used.

| Input source  | Variables                         |
| ------------- | --------------------------------- |
| ALL_DOMAINS   | `${domainName}`                   |
| ALL_HOSTS     | `${ip}`                           |
| ALL_TCP_PORTS | `${ip}`, `${port}`, `${protocol}` |

When you specify the `ALL_DOMAINS` input, you have access to the `${domainName}` injectable variable. Red Kite will apply the subscription
for all the domains, and the domain's value will be injected where specified.

```yaml
name: Refreshing all domain names
input: ALL_DOMAINS
cronExpression: "0 0 * * *"
job:
  name: DomainNameResolvingJob
  parameters:
    - name: domainName
      value: ${domainName}
```

When you specify the `ALL_HOSTS` input, you have access to the `${ip}` injectable variable. Red Kite will apply the subscription for all the
hosts, and the hosts's ip value will be injected where specified.

```yaml
name: Rescanning all hosts
input: ALL_HOSTS
cronExpression: "0 0 * * *"
job:
  name: TcpPortScanningJob
  parameters:
    - name: targetIp
      value: ${ip}
    - name: threads
      value: 1000
    - name: socketTimeoutSeconds
      value: 0.7
    - name: portMin
      value: 1
    - name: portMax
      value: 65535
    - name: ports
      value: []
```

When you specify the `ALL_TCP_PORTS` input, you have access to the `${ip}`, `${port}` and `${protocol}` injectable variables. Red Kite will
apply the subscription for all the ports, and the ip, port and protocol values can be injected where specified. Protocol is either tcp or
udp.

> Only TCP ports are sent with this input, so the protocol variable will always equal 'tcp'

```yaml
name: All tcp ports with condition
input: ALL_TCP_PORTS
cronExpression: "0 0 * * *"
job:
  name: HttpServerCheckJob
  parameters:
    - name: targetIp
      value: ${ip}
    - name: ports
      value: ["${port}"]
conditions:
  - lhs: "${protocol}"
    operator: "equals"
    rhs: "tcp"
```

When you specify the `ALL_IP_RANGES` input, you have access to the `${ip}` and `${mask}` injectable variables. Red Kite will apply the
subscription for all the projects' ip ranges.

```yaml
name: Scanning IP ranges
cronExpression: 0 0 */7 * *
input: ALL_IP_RANGES
job:
  name: TcpIpRangeScanningJob
  parameters:
    - name: targetIp
      value: ${ip}
    - name: targetMask
      value: ${mask}
    - name: rate
      value: 100000
    - name: portMin
      value: 1
    - name: portMax
      value: 1000
    - name: ports
      value: []
```

When you specify the `ALL_WEBSITES` input, you have access to the `${domainName}`, `${ip}`, `${port}`, `${path}` and `${ssl}` injectable variables. Red Kite will apply the subscription for all the websites, and the websites's different values will be injected where specified.


```yaml
name: Recrawling websites
cronExpression: 0 0 */7 * *
input: ALL_WEBSITES
job:
  name: WebsiteCrawlingJob
  parameters:
    - name: domainName
      value: ${domainName}
    - name: targetIp
      value: ${ip}
    - name: port
      value: ${port}
    - name: path
      value: ${path}
    - name: ssl
      value: ${ssl}
    - name: maxDepth
      value: 3
    - name: crawlDurationSeconds
      value: 1800
    - name: fetcherConcurrency
      value: 10
    - name: inputParallelism
      value: 10
    - name: extraOptions
      value: -jc -kf all -duc -j -or -ob -silent
```


## Event Subscriptions

When Red Kite finds some information, either through the output of a Job or through user input, a Finding is emitted. This Finding contains
the output information given by the Job or the user. From this information, new Jobs are started that will output more Findings. This is
roughly how Red Kite's automation workflow works.

An event subscription allows for the customization of Red Kite's automation workflow by starting any Job on any Finding. These jobs can be
started on specified conditions. Also, the output of the finding can be used as a job input, as well as a condition parameter.

Event subscriptions also have a cooldown in seconds. This value ensures that a subscription is not triggered too often for the same
ressource. It prevents infinite loops and rescanning the same host right away, for instance.

### Event Subscription Syntax

An event subscription can contain these main elements :

| Element    | Description                                                                                             | Mandatory |
| ---------- | ------------------------------------------------------------------------------------------------------- | --------- |
| name       | The name of the subscription, for future reference                                                      | Yes       |
| findings   | The findings to react to. A list of the finding names.                                                  | Yes       |
| cooldown   | The minimum amount of time, in seconds, before a subscription can be retriggered for the same ressource | Yes       |
| job        | The job to launch when the finding and conditions are met                                               | Yes       |
| conditions | The preconditions to launching the job                                                                  | No        |

> N.B. Additonnal details on these elements are given in the following sections

- The `name` element can be anything and is only used to distinguish the Subscription from the others.
- The `findings` elements must be existing Finding's types. See [the Findings documentation](./findings) for the list.
- The `cooldown` is a number in seconds for which to wait before relaunching the job for the same ressource.
- The `job` element contains multiple values:
  - `name` : mandatory, must be an existing Job's type. See the Jobs section for the list of valid values.
  - `parameters` : optionnal, but almost always needed. It describes the input values of the job by the parameter `name` and its `value` in
    a list.
- The `conditions` element is the only non-mandatory main element. If it is not provided, the Job will always be started when the Finding is
  found. Multiple conditions can be provided in a list. Conditions contain mulitple elements:
  - `lhs` : The left-hand side operand.
  - `operator` : The operator to compare the two operands.
  - `rhs` : The right-hand side operand.

#### Event Subscription Dynamic Input

You can add dynamic input to an event subscription either by referencing a finding's fields, or by injecting a secret.

You can reference a Finding's output variable by name in a Job parameter's value or in a condition's operand using the following syntax:
`${parameterName}`. The variable name is case insensitive.

In a finding, you can find [dynamic fields](/docs/concepts/findings#dynamic-fields) in the `fields` array. The text based dynamic fields' values can be injected in the same way as a regular field, with the `${parameterName}` syntax. Simply reference the `key` part of a dynamic field as the variable name, and its `data` will be injected.

You can also inject a secret as a parameter value with the `${secrets.secretName}` syntax. You can [learn more about secrets here](/docs/concepts/secrets).

#### Event Subscription Simple Example

Here is one of the shortest event subscription possible. It reacts to a `HostnameFinding` to launch a `DomainNameResolvingJob`, using the
output of the Finding as the `domainName` parameter value.

Therefore, it will resolve the domain name found in the `HostnameFinding` to an IP address by launching a `DomainNameResolvingJob`. It will
emit a `HostnameIpFinding` if it properly resolves the domain name.

The `cooldown` here represents 23 hours. Therefore, the same hostname can only be resolved as often as every 23 hours through this
subscription.

> This subscription is already built in Red Kite

```yaml
name: Domain name resolution
findings: 
  - HostnameFinding
cooldown: 82800
job:
  name: DomainNameResolvingJob
  parameters:
    - name: domainName
      value: ${domainName}
```

#### Event Subscription Complex Example

Here is an example of how to start a `TcpPortScanningJob` when a `HostnameIpFinding` is emitted. This job will however only start if all the
conditions are met. The Finding's found `ip` must contain the case insensitive string "13.37", and 5 must be greater than or equal to 3.

If the conditions are met when a `HostnameIpFinding` is emitted, then the job will start with the specified parameters. Note here that the
`targetIp` parameter will contain the value of the Finding's output variable `ip`.

The Job, in this case, will scan the `${ip}`'s 1000 first ports ([1-1000]) as well as the ports 1234, 3389 and 8080. It will do so in 10
parallel threads. Every thread's socket will have a 1 second timeout if it does not respond. We can therefore expect the Job to finish in a
maximum of around 100 seconds.

> Something similar in behavior, except from the conditions, is already built in Red Kite.

```yaml
name: My complex subscription
findings: 
  - HostnameIpFinding
cooldown: 82800
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

#### Mutliple Findings In Subscriptions

An event subscription can be triggered by multiple finding types, as long as the values referenced in the subscription are available in the two finding types.

For instance, a subscription can be triggered from both an `HostnameIpFinding` as well as an `IpFinding` and use the overlapping fields.

The `HostnameIpFinding`:

```json
{
  "type": "HostnameIpFinding",
  "key": "HostnameIpFinding",
  "domainName": "red-kite.io",
  "ip": "0.0.0.0"
}
```

The `IpFinding`:

```json
{
  "type": "IpFinding",
  "key": "IpFinding",
  "ip": "0.0.0.0"
}
```

Since both the `HostnameIpFinding` and the `IpFinding` have an  `ip` field, it can be used in the subscription.

```yaml
name: My complex subscription
findings: 
  - HostnameIpFinding
  - IpFinding
cooldown: 82800
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

### Findings

A finding event is propagated by Red Kite whenever an information comes into play. Every finding type contains information that is specific
to it.

It is possible to reference a finding outputted by a job as an input of a new job, as well as a condition operand. All references to a
finding's output variable are case insensitive.

To learn more about findings, [click here](/docs/concepts/findings).

### Conditions

By default, an event subscription's Job will always start when the specified Finding is found. However, it is not always the desired
behavior. Sometimes, the Job should only start if the Finding's output respect some established conditions.

A condition is usually made of three elements: a left-hand side parameter (`lhs`), an `operator`, and a right-hand side parameter (`rhs`). The `lhs`
parameter is compared to the `rhs` parameter using the `operator`. A Finding's output variable can be used as a Condition's `lhs` or `rhs`
parameter when referenced using the syntax `${paramName}`.

The primitive type of the parameters must match together and must match with the operator for the condition to return `true`. The allowed
types of an operand are `string`, `number`, `boolean`, or an `array` of these types. When two arrays are provided, every element of the `lhs` array will be compared with every element of the `rhs` array. If all the condtions return true, then the specified job will be started.

| Operator     | Accepted Operand Types  | Description                                                                                                                                        |
| ------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| gte          | number                  | `lhs >= rhs`                                                                                                                                       |
| gt           | number                  | `lhs > rhs`                                                                                                                                        |
| lte          | number                  | `lhs <= rhs`                                                                                                                                       |
| lt           | number                  | `lhs < rhs`                                                                                                                                        |
| equals       | string, number, boolean | `lhs == rhs`                                                                                                                                       |
| equals_i     | string                  | Case insensitive, `lhs == rhs`                                                                                                                     |
| contains     | string                  | Validates if the `lhs` string contains the `rhs` string.                                                                                           |
| contains_i   | string                  | Validates if the `lhs` string contains the `rhs` string. Case insensitive.                                                                         |
| startsWith   | string                  | Validates if the `lhs` string starts with the `rhs` string.                                                                                        |
| startsWith_i | string                  | Validates if the `lhs` string starts with the `rhs` string. Case insensitive.                                                                      |
| endsWith     | string                  | Validates if the `lhs` string ends with the `rhs` string.                                                                                          |
| endsWith_i   | string                  | Validates if the `lhs` string ends with the `rhs` string. Case insensitive.                                                                        |
| not_         | string, number, boolean | Prefix `not_` to another operator to have the result negated. For instance, `not_equals` would be true when two operands are not considered equal. |
| or_          | string, number, boolean | Use with arrays to change the boolean operator between array elements from `and` to `or`.                                                          |

> Arrays of the corresponding type can be used on any operator

By default, conditions are linked with an `and` operator. It means that all conditions have to be met to launch the job. However, you can use the `and` and `or` operators in the condition yaml to change the operator applied on the different conditions. In the following example, even though the condition `4 >= 5` will be `false`, since it is in an `or` operator, the whole operator will return `true`. Since the `or` operator will return `true` and `1 <= 2` will be `true` as well, the job will start. 


```yaml
conditions:
  - or:
    - and:
      - lhs: asdf
        operator: endsWith
        rhs: df
      - lhs: qwerty
        operator: startsWith
        rhs: qwe
    - lhs: 4
      operator: gte
      rhs: 5
  - lhs: 1
    operator: lte
    rhs: 2
```

The previous condition would be roughly equivalent to the following python `if` statement:

```python
if (("qwerty".startswith("qwe") and "asdf".endswith("df")) or 4 >= 5) and 1 <= 2:
  print("Job will start")
```