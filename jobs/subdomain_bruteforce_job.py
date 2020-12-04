import os

class SubdomainBruteforceJob:
    """Uses AMASS to try to find subdomains by brute-forcing."""
    
    _domain_name = ''
    _wordlist = ''
    _config_file = ''
    _amass_bin_path = ''

    def __init__(self, domain_name, wordlist='', config_file = '', amass_bin_path = ''):
        self._domain_name = domain_name
        self._wordlist = wordlist
        self._config_file = config_file
        self._amass_bin_path = amass_bin_path

    def run(self):
        amass_string = ''
        if self._domain_name != '':
            amass_string += f'{self._amass_bin_path}amass enum -brute -d {self._domain_name}'
        else:
            raise Exception('Missing domain name for subdomain bruteforcing.')

        if self._wordlist != '':
            amass_string += f' -w {self._wordlist}'
        
        if self._config_file != '':
            amass_string += f' -config {self._config_file}'

        print(amass_string)
        stream = os.popen(amass_string)
        output = stream.readlines()
        fixed_output = [x[:-1] for x in output] # remove trailing \n
        print(fixed_output)


