import requests
import json

class JobReporter():
    _fm_address: str
    _fm_port: str
    _key: str

    def __init__(self, fm_address: str, fm_port: str, key: str = ''):
        self._fm_address = fm_address
        self._fm_port = fm_port
        self._key = key

    def report(self, path: str, output: str):
        """Performs a POST request to report the output of a job to the flow manager"""
        headers = {
            'API_KEY': self._key,
            'Content-Type': 'application/json'
        }
        r = requests.post(f'http://{self._fm_address}:{self._fm_port}' + path, output, headers=headers)
        if r.status_code < 200 or r.status_code >= 300:
            print(f"ERROR sending output to {path} : ")
            print(output)