from ipaddress import ip_address
from urllib.parse import ParseResult, urlparse

from nuclei_wrapper import JobInput

_scheme_port_mapping = {
    "ftp": 21,
    "ssh": 22,
    "http": 80,
    "https": 443
}

class NucleiFinding:
    """A Nuclei Finding represents and parses a json line from a Nuclei output file."""
    template_id: str = None
    name: str = None
    tags: 'list[str]' = None
    severity: str = None
    type: str = None
    port: int = None
    scheme: str = None
    url: str = None
    matched_at: str = None
    extracted_results: 'list[str]' = None
    ip: str = None
    domain: str = None
    timestamp: str = None
    curl_command: str = None
    description: str = None
    original_string: str = None
    matcher_name: str = None
    matcher_status: bool = None
    original_path: str = None
    endpoint: str = None
    ssl: bool = None
    path: str = None


    def __init__(self, json_data: dict, original_string='', input: JobInput = None):
        self.original_string = original_string
        self.original_path = input.path
        self.template_id = json_data.get("template-id") or None
        if json_data.get("info"):
            self.name = json_data.get("info").get("name") or None
            self.tags = json_data.get("info").get("tags") or None
            self.severity = json_data.get("info").get("severity") or None
            self.description = json_data.get("info").get('description') or None
        self.type = json_data.get("type")
        self.port = int(json_data.get("port")) if json_data.get("port") and isinstance(json_data.get("port"), int) else None
        self.scheme = json_data.get("scheme") or None
        self.url = json_data.get("url") or None
        self._domain_or_ip_parsing(json_data.get("host"))
        self.matched_at = json_data.get("matched-at") or None
        self.matcher_name = json_data.get("matcher-name") or None
        self.extracted_results = json_data.get("extracted-results") or None
        self.ip = json_data.get("ip") or input.target_ip
        self.timestamp = json_data.get("timestamp") or None
        self.curl_command = json_data.get("curl-command") or None
        self.matcher_status = json_data.get("matcher-status") or None
        self.path = json_data.get("path") or None

        self._extended_url_parsing()  

    def _extended_url_parsing(self):
        """This function will try to extract additionnal value from the object values"""
        if self.url:
            try:
                url_obj: ParseResult = urlparse(self.url)
                if not self.port and url_obj.port:
                    self.port = int(url_obj.port)
                if url_obj.path:
                    self.endpoint = url_obj.path
                if url_obj.hostname and not (self.ip or self.domain):
                    self._domain_or_ip_parsing(url_obj.hostname)
                if url_obj.scheme:
                    if url_obj.scheme == 'https':
                        self.ssl = True
                    if url_obj.scheme == 'http':
                        self.ssl = False
                    
            except Exception:
                pass

        if not self.port and self.scheme:
            p = _scheme_port_mapping.get(self.scheme) 
            if p:
                self.port = p

        
    def _domain_or_ip_parsing(self, hostname: str):
        if hostname and hostname.find(':') >= 0:
            split_host = hostname.split(':')
            hostname = split_host[0]
            if not self.port:
                self.port = int(split_host[1])
        try:
            ip = ip_address(hostname)
            if not self.ip:
                self.ip = ip
        except ValueError:
            if not self.domain:
                self.domain = hostname