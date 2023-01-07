# Implementing jobs

This article describes how to implement a job in Stalker. This process involves a few steps, but it is usually quite easy!
There is currently one type of job: a _python job_.

There are a few ways a job can be started: manually (through user input), or automatically (through configured subscriptions or built-in Stalker automations).
In any case, when a job needs to be run, the Flow Manager (FM) drops a message on the _Job Requests Queue_. The Orchestrator consumes requests and runs jobs inside
[Kubernetes Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/). The Orchestrator monitors the container standard output; this is how the
job communicates its _findings_ and more to Stalker.

> This article is a work in progress, it is currently incomplete.

## Making contact with the outside world

The goal of jobs is to produce _findings_. A job may also produce logs to inform the outside world whether things are going well or not. Jobs communicate with Stalker through their standard output (STDOUT).
To differentiate common logs from logs that are pertinent to Stalker, jobs must tag logs with a prefix. Here's a list of supported prefixes.

| Syntax                                   | Description           |
| ---------------------------------------- | --------------------- |
| @event \<[finding](#producing-findings)> | Produces a finding.   |
| @logdebug \<[message](#producing-logs)>  | Logs a debug message. |

### Producing findings

Findings are pieces of information attached to a company and a core entity like a domain, a host or a port.
Findings come in different shapes and forms. Some findings will create new core entities, others may simply add data to existing ones.
To produce a finding, the job must create an object containing the necessary information and serialize it as JSON.

The finding object must contain the `type` field. Here is a list of available types.

| Type                                    | Description                                        |
| --------------------------------------- | -------------------------------------------------- |
| [HostnameIpFinding](#hostnameipfinding) | Creates a new host, attaches it to a given domain. |
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
