import requests
import json


class JobRequester():
    """Pulls a job from the job queue handler (jqh), if there is one, 
    with a GET HTTP request. Otherwise, it returns None."""

    _jqh_address: str
    _jqh_port: str

    def __init__(self, jqh_address: str, jqh_port: str):
        self._jqh_address = jqh_address
        self._jqh_port = jqh_port


    def get_job(self, config: dict) -> dict:
        """Performs a get request to get """
        headers = {'API_KEY': config['jqh_api_key']}
        r = requests.get(f'http://{self._jqh_address}:{self._jqh_port}/job', headers=headers)

        if r.status_code == 404:
            return None

        if r.status_code == 403:
            raise Exception('Got 403, API_KEY might be invalid')
        
        content_dict = json.loads(r.content)

        if (not content_dict.get('job') or 
                not content_dict['job'].get('_id') or 
                not content_dict['job'].get('_task') or 
                not content_dict['job'].get('_data')):
            raise Exception("""Missing data to make a proper Job object and 
                    respect the JobInterface.""")
        
        return content_dict['job']