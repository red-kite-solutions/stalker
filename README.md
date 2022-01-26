# STALKER | Recon Automation

Contains three modules: 

Flow Manager: A NestJS TypeScript API that creates jobs, accepts job results and creates new jobs based on output and adds them to the Jobs Queue Handler

Jobs Queue Handler: A python flask API that is a priority queue in which you can add and remove jobs. Jobs are ordered with an explicit priority and on a FIFO basis

Jobs Handler: A python script that fetches jobs from the Jobs Queue Handler and executes them and gives the output to the Flow Manager. Many Jobs Handler can exist at the time


# Environment Variables

jobs_queue_handler :

```
API_KEY : Validates that the HTTP request is authorized to add a job to the queue
```

jobs_handler : 

```
Does not use environement variables, has a config file instead.
```

flow_manager : 

```
API_KEY : Used to connect to the jobs_queue_handler, must be provided as a HTTP header named API_KEY
```


# Config files

jobs_handler: 

file must be called `jobs_handler.config` and be in the same directory as `jobs_handler.py`

```
job_queue_handler_address=127.0.0.1
job_queue_handler_port=5000
flow_manager_address=127.0.0.1
flow_manager_port=3000
env=DEV
jqh_api_key={YOUR JQH API KEY HERE}
amass_config=
amass_bin_path=
amass_wordlists=
```


