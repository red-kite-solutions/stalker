from jobs.job_interface import JobInterface
import os


class SubdomainBruteforceJob(JobInterface):
    """Perform a subdomain brute-force and a lot more with the 
            enum function of AMASS to get submains from a domain"""
    
    _domain_name: str
    _wordlist: str
    _config_file: str
    _amass_bin_path: str

    def __init__(self, id: str, task: str, domain_name: str, 
            wordlist: str = '', config_file: str = '', 
            amass_bin_path : str = ''):
        super().__init__(id, task)
        self._domain_name = domain_name
        self._wordlist = wordlist
        self._config_file = config_file
        self._amass_bin_path = amass_bin_path

    def run(self):
        """Start the job"""
        print("brute force job is running")
        print(self._domain_name)
        print(self._wordlist)
        print(self._config_file)
        print(self._amass_bin_path)
        return
        # amass_string = ''
        # if self._domain_name != '':
        #     amass_string += f'{self._amass_bin_path}amass enum -brute -d {self._domain_name}'
        # else:
        #     raise Exception('Missing domain name for subdomain bruteforcing.')

        # if self._wordlist != '':
        #     amass_string += f' -w {self._wordlist}'
        
        # if self._config_file != '':
        #     amass_string += f' -config {self._config_file}'

        # print(amass_string)
        # stream = os.popen(amass_string)
        # output = stream.readlines()
        # fixed_output = [x[:-1] for x in output] # remove trailing \n
        # print(fixed_output)


