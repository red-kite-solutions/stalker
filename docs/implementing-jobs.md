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

| File name                                                       | Service      | Description                                  |
| --------------------------------------------------------------- | ------------ | -------------------------------------------- |
| /flow_manager/src/modules/database/jobs/models/jobs.model.ts    | Flow manager | Add the job name in the enum array.          |
| /flow_manager/src/modules/database/jobs/job-model.module.ts     | Flow manager | Add the job definition to the array.         |
| /orchestrator/Orchestrator/Jobs/JobFactory.cs                   | Orchestrator | Edit the Create function to add the new job. |
| /orchestrator/Orchestrator/Jobs/PythonJobTemplateProvider.cs    | Orchestrator | Add the new job to the `PythonJobs` array.   |
| /orchestrator/Orchestrator/Queue/JobsConsummer/JobSerializer.cs | Orchestrator | Detail how to deserialize to a `JobRequest`. |

The following files also need to be created :

| File name                                                                     | Service      | Description                                                        |
| ----------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------ |
| /flow_manager/src/modules/database/jobs/models/my-new-job.model.ts            | Flow manager | Describes the job for the database. Implement the `create` method. |
| /flow_manager/src/modules/database/jobs/dtos/my-new-job.dto.ts                | Flow manager | Validates the job content for the controller.                      |
| /orchestrator/Orchestrator/Jobs/Commands/MyNewJobCommand.cs                   | Orchestrator | Create the job command.                                            |
| /orchestrator/Orchestrator/Jobs/JobTemplates/MyNewJobTemplate.cs              | Orchestrator | Create the job template.                                           |
| /orchestrator/Orchestrator/Queue/JobsConsummer/JobRequests/MyNewJobRequest.cs | Orchestrator | Create the job request.                                            |
| /orchestrator/PythonJobTemplates/MyNewJob.py                                  | Job          | Create the job itself in python.                                   |

> The name of the python file must match exactly the name of the job's task. The task `MyNewJob` requires a file named `MyNewJob.py`.

Now that this new job has been implemented, it could be called through `subscriptions` or manually. However, for it to be added into the built-in automation process, it needs to be called within a `finding`'s handler.

## Custom Jobs

Custom jobs are implemented by a Stalker user or administrator. They are a type of built-in job, but are much more flexible.

Custom jobs can be run manually as a one time thing, or they can be run within the automation process through [subscriptions](./subscriptions.md#custom-job-example).

Implementing a `CustomJob` is easy. Simply name your new custom job, write your code, and make sure to [output your findings properly](#making-contact-with-the-outside-world).

### Custom Job Input

A custom job's input is provided as environment variables.

Here is a python example of how to get a value from an environment variable.

```python
import os

var_content = os.environ['myCustomParameter']
```

All the parameters given to a job are provided as environment variables. Therefore, parameter names must respect a fixed character set. The following regular expression is used to validate the characters of the parameter names before the creation of the job. Not respecting this regex will result in the job not being created.

```javascript
/^[A-Za-z][A-Za-z0-9_]*$/
```

Also, to avoid conflicts with common os variable names, the following varibles must not be set. Naming a parameter with one of these names will result in the job not being created.

|             |             |           |            |            |
| ----------- | ----------- | --------- | ---------- | ---------- |
| RFLAGS      | IFS         | MAILPATH  | PS1        | CC         |
| LANG        | MAILRC      | PS2       | CDPATH     | LC_ALL     |
| MAKEFLAGS   | PS3         | CFLAGS    | LC_COLLATE | MAKESHELL  |
| PS4         | CHARSET     | LC_CTYPE  | MANPATH    | PWD        |
| COLUMNS     | LC_MESSAGES | MBOX      | RANDOM     | DATEMSK    |
| LC_MONETARY | MORE        | SECONDS   | DEAD       | LC_NUMERIC |
| MSGVERB     | SHELL       | EDITOR    | LC_TIME    | NLSPATH    |
| TERM        | ENV         | LDFLAGS   | NPROC      | TERMCAP    |
| EXINIT      | LEX         | OLDPWD    | TERMINFO   | FC         |
| LFLAGS      | OPTARG      | TMPDIR    | FCEDIT     | LINENO     |
| OPTERR      | TZ          | FFLAGS    | LINES      | OPTIND     |
| USER        | GET         | LISTER    | PAGER      | VISUAL     |
| GFLAGS      | LOGNAME     | PATH      | YACC       | HISTFILE   |
| LPDEST      | PPID        | YFLAGS    | HISTORY    | MAIL       |
| PRINTER     | HISTSIZE    | MAILCHECK | PROCLANG   | HOME       |
| MAILER      | PROJECTDIR  |           |            |            |

### Custom Job Output

Custom jobs communicate in the exact same way as regular jobs. They print to stdout, [respecting the syntax for a @finding or a @logdebug](#making-contact-with-the-outside-world).
