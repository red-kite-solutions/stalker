# Implementing jobs

This article describes how to implement a job in Stalker. This process involves a few steps, but it is usually quite easy!
There is currently one type of job: a _python job_.

There are a few ways a job can be started: manually (through user input), or automatically (through configured subscriptions or built-in Stalker automations).
In any case, when a job needs to be run, the Flow Manager (FM) drops a message on the _Job Requests Queue_. The Orchestrator consumes requests and runs jobs inside
[Kubernetes Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/). The Orchestrator monitors the container standard output; this is how the
job communicates its _findings_ and more to Stalker.

> This article is a work in progress, it is currently incomplete.


* [Output and findings](#making-contact-with-the-outside-world)
* [Built-in jobs](#built-in-jobs)
* [Custom jobs](#custom-jobs)

## Making contact with the outside world

The goal of jobs is to produce _findings_. A job may also produce logs to inform the outside world whether things are going well or not. Jobs communicate with Stalker through their standard output (STDOUT).
To differentiate common logs from logs that are pertinent to Stalker, jobs must tag logs with a prefix. Here's a list of supported prefixes.

| Syntax                                     | Description           |
| ------------------------------------------ | --------------------- |
| @finding \<[finding](#producing-findings)> | Produces a finding.   |
| @logdebug \<[message](#producing-logs)>    | Logs a debug message. |

### Producing findings

Findings are pieces of information attached to a company and a core entity like a domain, a host or a port.
Findings come in different shapes and forms. Some findings will create new core entities, others may simply add data to existing ones.
To produce a finding, the job must create an object containing the necessary information and serialize it as JSON.

The finding object must contain the `type` field. Here is a list of available types.

| Type                                    | Description                                        |
| --------------------------------------- | -------------------------------------------------- |
| [HostnameIpFinding](#hostnameipfinding) | Creates a new host, attaches it to a given domain. |
| [PortFinding](#portfinding)             | Creates a new port, attaches it to the given host. |
| [DynamicFinding](#dynamicfinding)       | Attaches custom finding data to a given entity.    |

#### HostnameIpFinding

A hostname ip finding creates a new host and attaches it to a given domain.

| Field    | Description                                |
| -------- | ------------------------------------------ |
| `domain` | The domain to which to attach the new host |
| `ip`     | The ip                                     |

Example:

```json
{
  "type": "HostnameIpFinding",
  "domain": "stalker.is",
  "ip": "0.0.0.0"
}
```

#### PortFinding

A port finding creates a new port attaches it to the given host.

| Field      | Description                         |
| ---------- | ----------------------------------- |
| `protocol` | The protocol, either 'tcp' or 'udp' |
| `ip`       | The ip                              |
| `port`     | The port number                     |

Example:

```json
{
  "type": "PortFinding",
  "protocol": "tcp",
  "ip": "1.2.3.4",
  "port": 80
}
```

#### DynamicFinding

Dynamic findings allow jobs to attach custom data to core entities.

| Field    | Description                                                     |
| -------- | --------------------------------------------------------------- |
| `domain` | The domain to which to attach the custom finding                |
| `host`   | The host to which to attach the custom finding                  |
| `port`   | The port to which to attach the custom finding                  |
| `fields` | A list of [fields](#dynamic-fields) containing the finding data |

Examples:

```json
{
  "type": "CustomFinding",
  "host": "1.2.3.4",
  "port": "80",
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
  "domain": "stalker.is",
  "fields": [
    {
      "type": "text",
      "label": "Domain greatness level",
      "content": "This domain is great, would recommend"
    }
  ]
}
```

##### Dynamic fields

Dynamic fields give flexiblity to jobs so they can output complex data. Here is the list of supported dynamic fields.

| Field | Description            |
| ----- | ---------------------- |
| Text  | A label with some text |
| Image | An image               |

###### Text field

Example:

```json
{
  "type": "text",
  "label": "Top 3 keywords found in web page"
  "content": "Potato, celery, transformers"
}
```

###### Image field

Example:

```json
{
  "type": "image",
  "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"
}
```

### Producing logs

Logs let jobs communicate miscellaneous information to the outside world. It could be a progress report, an error log, an inspirational quote, anything works.

To output a log, simply write a string prefixed with `@logdebug` to the standard output.

Example:

```
@logdebug Hello world!
```

## Built-in Jobs

Built-in jobs, often just called jobs, are implemented within Stalker's source code.

To implement a built-in job, the following files need to be edited :

| File name                                      | Service      | Description                              |
| ---------------------------------------------- | ------------ | ---------------------------------------- |
| src/modules/database/jobs/models/jobs.model.ts | Flow manager | Add the job name in the enum array.      |
| src/modules/database/jobs/jobs.service.ts      | Flow manager | Add the two functions to create the job. |
| src/modules/database/jobs/job-model.module.ts  | Flow manager | Add the job definition to the array      |

The following files also need to be created :

| File name                                        | Service      | Description                                  |
| ------------------------------------------------ | ------------ | -------------------------------------------- |
| src/modules/database/jobs/models/my-job.model.ts | Flow manager | Describes the job for the database.          |
| src/modules/database/jobs/dtos/my-job.dto.ts     | Flow manager | Validates the job content for the controller |

Now that this new job has been implemented, it could be called through `subscriptions` or manually. However, for it to be added into the built-in automation process, it needs to be called within a `finding`'s handler.


## Custom Jobs

Custom jobs are implemented by a Stalker user or administrator. They are a type of built-in job, but are much more flexible.

Custom jobs can be run manually as a one time thing, or they can be run within the automation process through `subscriptions`.

### Input

When given by a subscription, the custom job's input is provided as environment variables.

### Output

Custom jobs communicate in the exact same way as regular jobs. They print to stdout, respecting the syntax for a `@finding` or a `@logdebug`.
