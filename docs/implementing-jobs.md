# Implementing jobs

This article describes how to implement a job in Stalker. This process involves a few steps, but it is usually quite easy! There is
currently one type of job: a _python job_.

There are a few ways a job can be started: manually (through user input), or automatically (through configured subscriptions). In any case,
when a job needs to be run, the Jobs Manager (JM) drops a message on the _Job Requests Queue_. The Orchestrator consumes requests and runs
jobs inside [Kubernetes Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/). The Orchestrator monitors the container
standard output; this is how the job communicates its _findings_ and more to Stalker.

- [Python](#python)
  - [Setup](#setup)
- [Making contact with the outside world](#making-contact-with-the-outside-world)
  - [Producing findings](#producing-findings)
  - [Producing logs](#producing-logs)
- [Built-in Jobs](#built-in-jobs)
- [Custom Jobs](#custom-jobs)
  - [Custom Job Input](#custom-job-input)
  - [Custom Job Output](#custom-job-output)
  - [Types of custom jobs](#types-of-custom-jobs)
    - [Python Custom Job](#python-custom-job)
    - [Nuclei Custom Job](#nuclei-custom-job)
      - [Nuclei Custom Finding Handling](#nuclei-custom-finding-handling)

## Python

The `stalker_job_sdk` provides utilitary functions and classes to help you implement jobs.

### Setup

In order for intellisense to help you, you need to create a virtual environmnet. Vscode's
[python](https://marketplace.visualstudio.com/items?itemName=ms-python.python) extension can help you with that: use the "Python: Create
environment" command. Then, install the requirements:

```
pip install -r requirements.txt
```

## Making contact with the outside world

The goal of jobs is to produce _findings_. A job may also produce logs to inform the outside world whether things are going well or not.
Jobs communicate with Stalker through their standard output (STDOUT). To differentiate common logs from logs that are pertinent to Stalker,
jobs must tag logs with a prefix. Here's a list of supported prefixes.

| Syntax                                     | Description           |
| ------------------------------------------ | --------------------- |
| @finding \<[finding](#producing-findings)> | Produces a finding.   |
| @debug \<[message](#producing-logs)>       | Logs a debug message. |

### Producing findings

To give Stalker information about what was found in the job, you need to output findings in the proper format.

To learn more about how to produce findings, [click here](./findings.md).

### Producing logs

Logs let jobs communicate miscellaneous information to the outside world. It could be a progress report, an error log, an inspirational
quote, anything works.

To output a log, simply write a string prefixed with `@debug` to the standard output.

Example:

```python
print("@debug Hello world!")
```

There are different log levels available:

| Level         | Prefix   |
| ------------- | -------- |
| Debugging     | @debug   |
| Informational | @info    |
| Warning       | @warning |
| Error         | @error   |

## Built-in Jobs

Built-in jobs, often just called jobs, are implemented within Stalker's source code. They can still be modified by users when Stalker is
running.

To implement a `python` built-in job, the following files need to be created :

| File name                                                                                         | Service      | Description                                                                       |
| ------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------- |
| /packages/backend/jobs-manager/src/modules/database/custom-jobs/built-in/code/my-new-job.job.yaml | Jobs manager | Create the new job's metadata in yaml based on the `CustomJobMetadata` interface. |
| /packages/backend/jobs-manager/src/modules/database/custom-jobs/built-in/code/code/my-new-job.py  | Jobs manager | Create the new job's python code.                                                 |

> The name of the python file must match the path given in the metadata file.

Now that this new job has been implemented, the provider can load it in the database. It could then be called through `subscriptions` or
manually.

## Custom Jobs

Custom jobs are implemented by a Stalker's user or administrator.

Custom jobs can be run manually as a one time thing, or they can be run within the automation process through
[subscriptions](./subscriptions.md).

Implementing a `CustomJob` is easy. Simply name your new custom job, write your code, and make sure to
[output your findings properly](#making-contact-with-the-outside-world).

### Custom Job Input

A custom job's input is provided as environment variables.

Here is a python example of how to get a value from an environment variable.

```python
import os

var_content = os.environ['myCustomParameter']
```

All the parameters given to a job are provided as environment variables. Therefore, parameter names must respect a fixed character set. The
following regular expression is used to validate the characters of the parameter names before the creation of the job. Not respecting this
regex will result in the job not being created.

```javascript
/^[A-Za-z][A-Za-z0-9_]*$/;
```

Also, to avoid conflicts with common os variable names, the following variables must not be set. Naming a parameter with one of these names
will result in the job not being created.

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

Custom jobs communicate in the exact same way as regular jobs. They print to stdout,
[respecting the syntax for a @finding or a log](#making-contact-with-the-outside-world).

### Types of custom jobs

Several types of custom jobs are supported in Stalker. These custom job types have several advantages. Some types are more flexible, some
are faster to implement.

The types of custom jobs:

- [Python custom job](#python-custom-job)
- [Nuclei custom job](#nuclei-custom-job)

#### Python Custom Job

| Type | Language |
| ---- | -------- |
| Code | Python   |

A python custom job is the standard way of making a custom job. It gives you full flexibility, but you have to implement it yourself.

The python custom jobs come with a built-in SDK to help you properly [output findings and logs](./findings.md).

#### Nuclei Custom Job

| Type   | Language |
| ------ | -------- |
| Nuclei | Yaml     |

A Nuclei custom job uses [Project Discovery's Nuclei](https://github.com/projectdiscovery/nuclei) to run Nuclei templates and output
findings understandable by Stalker. It comes with a built-in parser, but if it does not suit your needs, you can specify a custom finding
handler. This custom finding handler will be responsible for parsing the Nuclei Findings as well as outputing the Stalker compatible
findings. It is implemented in python. Don't worry though, a template, a custom class and the python SDK are avalailable to help you.

To start a Nuclei custom job, a target is always required. You can provide the target with the following job parameter:

| Name         | Value Details                                                                   |
| ------------ | ------------------------------------------------------------------------------- |
| NucleiTarget | Corresponds to the `-target` parameter in Nuclei. It is a URL or a host to scan |

To start a Nuclei custom job with the default parser, you must configure the default parser by providing the two following job parameters:

| Name              | Value Details                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| StalkerOutputType | Either "domain", "host" or "port". It will change on which ressource the data binds by changing the type of findings that are published. |
| OutputFindingName | The finding name that you want. It will be used to match subscriptions.                                                                  |

##### Nuclei Custom Finding Handling

The custom finding handler parses every json output line from Nuclei in the `parse_finding` method. To help you in parsing the Nuclei
output, the `NucleiFinding` class is provided. The handler then outputs them all in the `publish_findings` method. Everything that is
outputted by the `parse_finding` method will be given to the `publish_findings` method in a list. To publish your findings properly, you can
refer to [the findings' documentation](./findings.md).

The custom finding handler template's code:

```python
from nuclei_finding import NucleiFinding
from stalker_job_sdk import log_info


class FindingHandler:
    """Custom parser template to get you started. The parse_finding and publish_findings methods are required."""

    def __init__(self):
        log_info("Initializing the custom handler")

    def parse_finding(self, finding_obj: dict):
        """This method returns a NucleiFinding, but it can return any object."""
        return NucleiFinding(finding_obj)

    def publish_findings(self, findings: list):
        """This method receives all the findings given by the parse_finding method as a list."""
        log_info("TODO: Publish findings")
        for finding in findings:
            log_info(finding.template_id)

```

> You could even pass parameters to the parser from the UI through environment variables, the same way you would pass a job parameter for a
> [code based custom job](#custom-job-input).

The `NucleiFinding` class will parse the provided finding in its constructor. Most of the time, you should not have to parse the findings
yourself. If a value is provided by Nuclei and it fits in one of the variables, it is parsed by the constructor.

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
