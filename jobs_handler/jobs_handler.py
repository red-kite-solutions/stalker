from utils.parse_config import parse_config, config
from utils.job_requester import JobRequester
from utils.job_reporter import JobReporter
from jobs.subdomain_bruteforce_job import SubdomainBruteforceJob
from jobs.domain_name_resolving_job import DomainNameResolvingJob
import os
import time


parse_config('./jobs_handler.config')
job_requester = JobRequester(config['job_queue_handler_address'], config['job_queue_handler_port'], os.environ["JQH_API_KEY"])
job_reporter = JobReporter(config['flow_manager_address'], config['flow_manager_port'], os.environ["FM_API_KEY"])

job_info = job_requester.get_job()

# Add here the new jobs to be able to use them
switcher_dict = { 'subdomain bruteforce' : SubdomainBruteforceJob,
                'domain name resolving': DomainNameResolvingJob }

start_time = time.time()
current_time = start_time

# If the job_info is None, the queue is empty
# We still want to run for at least 5 min for now, will see later
while job_info or current_time - start_time < 30000: 
    if not job_info:
        #slow things down a bit to not spam too much
        print('I do not have a job for you brother')
        time.sleep(5)      
    elif switcher_dict.get(job_info['_task']):
        print('I got a job!')
        print(job_info)
        job = switcher_dict[job_info['_task']](job_info, config)
        job.run()
        job.report(job_reporter)
    
    job_info = job_requester.get_job()
    current_time = time.time()