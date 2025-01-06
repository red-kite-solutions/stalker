---
sidebar_position: 1
title: Implementing Jobs
description: How to implement Red Kite jobs
---

# Implementing jobs

This article describes how to implement a job in Red Kite. This process involves a few steps, but it is usually quite easy! There is currently two types of jobs: a _python job_ and a _Nuclei job_.

There are a few ways a job can be started: manually (through user input or the Launch Job interface), or automatically (through configured subscriptions). In any case, when a job needs to be run, the Jobs Manager (JM) drops a message on the _Job Requests Queue_. The Orchestrator consumes requests and runs jobs inside [Kubernetes Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/). The Orchestrator then waits for the job's _findings_ on its API. 

> Implementing a job requires at least user level privileges.

Jobs can be run manually as a one time thing, or they can be run within the automation process through [subscriptions](../concepts/subscriptions).

Implementing a `Job` is easy. Simply name your new job, write your code, and make sure to
[output your findings properly](#job-output).

## Job Communications

A job, to work properly, will have inputs and outputs. Inputs will often be the target's information, and output will oten be logs and findings.

### Job Input

A job's input is provided as environment variables.

Here is a python example of how to get a value from an environment variable.

```python
import os

var_content = os.environ['myCustomParameter']
```

> Input data can often be validated using [the provided SDK](./sdk.md).

All the parameters given to a job are provided as environment variables. Therefore, parameter names must respect a fixed character set. The following regular expression is used to validate the characters of the parameter names before the creation of the job. Not respecting this regex will result in the job not being created.

```javascript
/^[A-Za-z][A-Za-z0-9_]*$/;
```

Also, to avoid conflicts with common os variable names, the following variables must not be set. Naming a parameter with one of these names will result in the job not being created.

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

### Job Output

Jobs communicate by sending log messages to the orchestrator's API. To do so, it is easier to use the provided [Software Development Kit (SDK)](./sdk.md)

## Types of jobs

Several types of jobs are supported in Red Kite. These job types have several advantages. Some types are more flexible, some
are faster to implement.

The types of jobs:

- [Python job](#python-job)
- [Nuclei job](#nuclei-job)

#### Python Job

| Type | Language |
| ---- | -------- |
| Code | Python   |

A python job is the standard way of making a job. It gives you full flexibility, but you have to implement it yourself.

The python jobs come with a built-in SDK to help you properly [output findings and logs](/docs/concepts/findings).

#### Nuclei Job

| Type   | Language |
| ------ | -------- |
| Nuclei | Yaml     |

A Nuclei job uses [Project Discovery's Nuclei](https://github.com/projectdiscovery/nuclei) to run Nuclei templates and output findings understandable by Red Kite. It comes with a built-in parser, but if it does not suit your needs, you can specify a custom finding handler. This custom finding handler will be responsible for parsing the Nuclei Findings as well as outputing the Red Kite compatible findings. It is implemented in python. Don't worry though, a template, a custom class and the python SDK are avalailable to help you.

To start a Nuclei job, a target is always required. You can provide the target with the following job parameter:

| Name       | Value Details                                                                      |
| ---------- | ---------------------------------------------------------------------------------- |
| targetIp   | The IP address of the target                                                       |
| port       | The port of the target                                                             |
| domainName | The domain name of the target. Prioritized over targetIp when building the target. |
| path       | The path identifying the root of the website, for instance, `/`                    |
| ssl        | True if the website uses encryption, false otherwise.                              |
| endpoint   | The target's endpoint. For instance, `/target/file.html`.                          |

This information will be used to build the Nuclei target and identify the resource to which the findings belong. Partial information can be given to target different things. For instance, for a DNS check, only the `domainName` value is necessary. For a web check, all the previous parameters are necessary.

To start a Nuclei job with the default parser, you must configure the default parser by providing the two following job parameters:

| Name              | Value Details                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| stalkerOutputType | Either `domain`, `host`, `port` or `website`. It will change on which resource the data binds by changing the type of findings that are published. |
| outputFindingName | The finding name that you want. It will be used to match subscriptions.                                                                            |

##### Nuclei Finding Handling

The custom finding handler parses every json output line from Nuclei in the `parse_finding` method. To help you in parsing the Nuclei output, the `NucleiFinding` class is provided. The handler then outputs them all in the `publish_findings` method. Everything that is outputted by the `parse_finding` method will be given to the `publish_findings` method in a list. To publish your findings properly, you can refer to [the findings' documentation](../concepts/findings).

The custom finding handler template's code:

```python
from nuclei_finding import NucleiFinding
from stalker_job_sdk import log_info


class FindingHandler:
    """Custom parser template to get you started. The parse_finding and publish_findings methods are required."""

    def __init__(self):
        log_info("Initializing the custom handler")

    def parse_finding(self, finding_obj: dict, original_string: str, original_path: str):
        """This method returns a NucleiFinding, but it can return any object."""
        return NucleiFinding(finding_obj, original_string=original_string, original_path=original_path)

    def publish_findings(self, findings: list):
        """This method receives all the findings given by the parse_finding method as a list."""
        log_info("TODO: Publish findings")
        for finding in findings:
            log_info(finding.template_id)

```

> You could even pass parameters to the parser from the UI through environment variables, the same way you would pass a job parameter for a
> [code based job](#custom-job-input).

The `NucleiFinding` class will parse the provided finding in its constructor. Most of the time, you should not have to parse the findings yourself. If a value is provided by Nuclei and it fits in one of the variables, it is parsed by the constructor.

The `NucleiFinding` class and an overview of its data:

```python
class NucleiFinding:
    template_id: str = None
    name: str = None
    tags: 'list[str]' = None
    severity: str = None
    type: str = None
    port: int = None
    scheme: str = None
    url: str = None
    matched_at: str = None
    extracted_results: 'list[str]' = None
    ip: str = None
    domain: str = None
    timestamp: str = None
    curl_command: str = None
    description: str = None
    original_string: str = None
    matcher_name: str = None
```
