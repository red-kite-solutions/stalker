from jobs.subdomain_bruteforce_job import SubdomainBruteforceJob

job = SubdomainBruteforceJob('bnc.ca', 
        '/home/lapinsmorts/tools/amass/amass_linux_amd64/examples/wordlists/bnc.txt', 
        '/home/lapinsmorts/tools/amass/amass_linux_amd64/personnal_config.ini', 
        '/home/lapinsmorts/tools/amass/amass_linux_amd64/')

job.run()