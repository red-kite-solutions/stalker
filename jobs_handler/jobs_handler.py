from job_starters import start_subdomain_bruteforce_job
from parse_config import parse_config, config
from job_requester import JobRequester
import sys


parse_config('./jobs_handler.config')
job_requester = JobRequester(config['job_queue_handler_address'], config['job_queue_handler_port'])

job_info = job_requester.get_job(config)

while job_info: # If the job is None, the queue is empty
    switcher_dict = { 'subdomain bruteforce' : start_subdomain_bruteforce_job}

    if switcher_dict.get(job_info['_task']):
        switcher_dict[job_info['_task']](job_info, config)
    
    job_info = job_requester.get_job(config)