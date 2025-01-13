---
sidebar_position: 1
title: SDK
description: Using the SDK in job development
---

# Software Development Kit (SDK)

We provide a software development kit (SDK) to facilitate the development of Red Kite jobs. The SDK can be used to report findings, log
output and validate input. It therefore helps in communicating with Red Kite.

## Python

The python SDK, available in the python containers under the `red_kite_job_sdk` name, provides utilitary functions and classes to help you
implement jobs.

[Follow this link to get the python SDK.](https://github.com/red-kite-solutions/stalker/tree/main/jobs/job-base-images/python/stalker_job_sdk)

### Local Setup

The supported local setup is with Visual Studio Code, but any IDE should work.

In order for intellisense to help you, you need to create a virtual environment. Vscode's
[python](https://marketplace.visualstudio.com/items?itemName=ms-python.python) extension can help you with that: use the "Python: Create
environment" command. Then, install the requirements:

```
pip install -r requirements.txt
```

### Producing findings

The goal of jobs is, most of the time, to produce _findings_. To give Red Kite information about what was found in a job, you need to output
findings in the proper format.

To log a finding, the `log_finding` function can be used coupled with the proper input. You can consult the following link to learn more
about [producing findings](../concepts/findings).

### Producing logs

A job may also produce logs to inform Red Kite whether things are going well or not.

Logs let jobs communicate miscellaneous information to the outside world. It could be a progress report, an error log, an inspirational
quote, anything works.

To output a log, use Red Kite's Job SDK.

Example:

```python
from stalker_job_sdk import log_debug

log_debug("Hello world!")
```

There are different log levels available:

| Level         | Function    |
| ------------- | ----------- |
| Debugging     | log_debug   |
| Informational | log_info    |
| Warning       | log_warning |
| Error         | log_error   |

### Updating the job's status

Before exiting, a job **must** update it's log its status. Otherwise, it will never be marked as finished. For that reason, we recommend
wrapping the job execution in an exception handler to catch any errors and report the job's status.

To update the status, simply use the SDK:

```python
from stalker_job_sdk import log_status, JobStatus

# If the job succeeded
log_status(JobStatus.SUCCESS)
# or, if the job failed
log_status(JobStatus.FAILED)
```

Updating the status should be the last thing done by your job before exiting.
