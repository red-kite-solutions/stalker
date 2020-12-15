from jobs.subdomain_bruteforce_job import SubdomainBruteforceJob


def start_subdomain_bruteforce_job(job_info: dict, config: dict):
    if not job_info['_data'].get('domain_name'):
        raise Exception("""Missing domain name information for 
                subdomain bruteforce job.""")

    wordlist = config['amass_wordlists'] + 'all.txt'
    if job_info['_data'].get('wordlist'):
        wordlist = config['amass_wordlists'] + job_info['_data']['wordlist']
    
    job = SubdomainBruteforceJob(
            job_info['_id'], 
            job_info['_task'],
            job_info['_data']['domain_name'], 
            wordlist, 
            config['amass_config'],
            config['amass_bin_path'])

    job.run()