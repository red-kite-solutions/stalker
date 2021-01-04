from utils.parse_config import parse_config, config
from utils.job_requester import JobRequester
from utils.job_reporter import JobReporter
from jobs.subdomain_bruteforce_job import SubdomainBruteforceJob
import sys
import time


parse_config('./jobs_handler.config')
job_requester = JobRequester(config['job_queue_handler_address'], config['job_queue_handler_port'])
job_reporter = JobReporter(config['flow_manager_address'], config['flow_manager_port'])

job_info = job_requester.get_job(config)

# Add here the new jobs to be able to use them
switcher_dict = { 'subdomain bruteforce' : SubdomainBruteforceJob}

start_time = time.time()
current_time = start_time

# If the job_info is None, the queue is empty
# We still want to run for at least 5 min for now, will see later
while job_info or current_time - start_time < 300: 
    if not job_info:
        #slow things down a bit to not spam too much
        time.sleep(3)      
    elif switcher_dict.get(job_info['_task']):
        job = switcher_dict[job_info['_task']](job_info, config)
        job.run()
        job.report(job_reporter)
    
    job_info = job_requester.get_job(config)
    current_time = time.time()