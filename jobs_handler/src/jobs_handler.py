import os
import time

from jobs.domain_name_resolving_job import DomainNameResolvingJob
from jobs.subdomain_bruteforce_job import SubdomainBruteforceJob
from utils.job_reporter import JobReporter
from utils.job_requester import JobRequester
from utils.parse_config import config, parse_config

parse_config('./jobs_handler.config')

jqh_host = os.environ.get('JQH_SERVICE_HOST')
jqh_port = os.environ.get('JQH_SERVICE_PORT')
jhq_api_key = os.environ["JQH_API_KEY"]

fm_host = os.environ.get('JQH_SERVICE_HOST')
fm_port = os.environ.get('FLOWMANAGER_SERVICE_HOST')
fm_api_key = os.environ.get('FM_API_KEY')

job_requester = JobRequester(jqh_host, jqh_port, jhq_api_key)
job_reporter = JobReporter(fm_host, fm_port, fm_api_key)

job_info = job_requester.get_job()

# Add here the new jobs to be able to use them
switcher_dict = { 'SubdomainBruteforce' : SubdomainBruteforceJob,
                'DomainNameResolvingJob': DomainNameResolvingJob }

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
        job_reporter.delete(job._id)
    else:
        print('Received unknown job ' + job_info['_task'])

    job_info = job_requester.get_job()
    current_time = time.time()
