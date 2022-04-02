from typing import List
from jobs.job_interface import JobInterface
from utils.job_reporter import JobReporter
import socket


class DomainNameResolvingJob(JobInterface):
    """Perform a subdomain brute-force and a lot more with the 
            enum function of AMASS to get submains from a domain"""
    
    _domain_name: str
    _ips: List[str]

    def _get_ips_by_dns_lookup(self, target: str, port=None):
        ipx: List[str]
        try:
            data = socket.gethostbyname_ex(target)
            ipx = repr(data[2])
        except Exception as e:
            ipx = []
        return ipx

    def __init__(self, job_info: dict, config: dict):
        super().__init__(job_info['_id'], job_info['_task'])
        if not job_info['_data'].get('domain_name'):
            raise Exception("""Missing domain name to resolve for 
                domain name resolving job""")
        self._domain_name = str(job_info['_data'].get('domain_name'))
            

    def run(self):
        """Start the job"""
        self._ips = self._get_ips_by_dns_lookup(self._domain_name)
        

    def report(self, job_reporter: JobReporter):
        """Report the content to the server"""
        ips = str(self._ips).replace("'", '"')
        output = f'{{ "domainName" : "{self._domain_name}", "ips" : {ips} }}'
        job_reporter.report(f'/report/hosts/{self._id}', output)
