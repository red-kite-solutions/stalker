# STALKER | Recon Automation

Contains three modules:

**Flow Manager**: A NestJS TypeScript API that creates jobs, accepts job results and creates new jobs based on output and adds them to the Jobs Queue Handler

**Jobs Queue Handler**: A python flask API that is a priority queue in which you can add and remove jobs. Jobs are ordered with an explicit priority and on a FIFO basis

**Worker (Jobs Handler)**: A python script that fetches jobs from the Jobs Queue Handler and executes them and gives the output to the Flow Manager. Many Jobs Handler can exist at the time

## Environment Variables

By default, stalker uses the variables from _[devspace.base.yaml](./devspace.base.yaml)_. For Stalker to work properly though, you must first create a copy of the _[devspace.dev.yaml.template](./devspace.dev.yaml.template)_ and name it _devspace.dev.yaml_. This file will hold your personal configurations. Any variables defined in this file will override the ones found in _devspace.base.yaml_.

#### Worker (jobs handler)

file must be called `jobs_handler.config` and be in the same directory as `jobs_handler.py`

```
job_queue_handler_address=jqh
job_queue_handler_port=5000
flow_manager_address=fm
flow_manager_port=3000
env=DEV
amass_config=/bin/amass/amass.config
amass_bin_path=/bin/amass/
amass_wordlists=/wordlist/path/
```
