from jobs.job_interface import JobInterface
import os


class SubdomainBruteforceJob(JobInterface):
    """Perform a subdomain brute-force and a lot more with the 
            enum function of AMASS to get submains from a domain"""
    
    _domain_name: str
    _wordlist: str
    _config_file: str
    _amass_bin_path: str
    _env: str
    _output: str

    def __init__(self, job_info: dict, config: dict):
        super().__init__(job_info['_id'], job_info['_task'])
        if not job_info['_data'].get('domain_name'):
            raise Exception("""Missing domain name information for 
                subdomain bruteforce job.""")

        wordlist = config['amass_wordlists'] + 'all.txt'
        if job_info['_data'].get('wordlist'):
            wordlist = config['amass_wordlists'] + job_info['_data']['wordlist']
        
        self._domain_name = job_info['_data']['domain_name']
        self._wordlist = wordlist
        self._config_file = config['amass_config']
        self._amass_bin_path = config['amass_bin_path']
        self._env = config['env']

    def run(self):
        """Start the job"""
        if self._env == 'DEV':
            print("brute force job is running")
            print(self._domain_name)
            print(self._wordlist)
            print(self._config_file)
            print(self._amass_bin_path)
        else:
            amass_string = ''
            if self._domain_name != '':
                amass_string += f'{self._amass_bin_path}amass enum -brute -d {self._domain_name}'
            else:
                raise Exception('Missing domain name for subdomain bruteforcing.')

            if self._wordlist != '':
                amass_string += f' -w {self._wordlist}'
            
            if self._config_file != '':
                amass_string += f' -config {self._config_file}'

            stream = os.popen(amass_string)
            output = stream.readlines()
            self._output = [x[:-1] for x in output] # remove trailing \n


