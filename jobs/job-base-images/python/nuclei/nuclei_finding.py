from urllib.parse import ParseResult, urlparse

_scheme_port_mapping = {
    "ftp": 21,
    "ssh": 22,
    "http": 80,
    "https": 443
}

class NucleiFinding:
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


    def __init__(self, json_data: dict, original_string=''):
        self.original_string = original_string
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
        
        self.domain = json_data.get("host") or None # host here is a domain name
        self.matched_at = json_data.get("matched-at") or None
        self.matcher_name = json_data.get("matcher-name") or None
        self.extracted_results = json_data.get("extracted-results") or None
        self.ip = json_data.get("ip") or None
        self.timestamp = json_data.get("timestamp") or None
        self.curl_command = json_data.get("curl-command") or None

        self._extended_port_parsing()  

    def _extended_port_parsing(self):
        """If the port value is not present, this function will try to deduce it from the object values"""

        if not self.port and self.url:
            try:
                url_obj: ParseResult = urlparse(self.url)
                if url_obj.port:
                    self.port = int(url_obj.port)
            except Exception:
                pass

        if not self.port and self.scheme:
            p = _scheme_port_mapping.get(self.scheme) 
            if p:
                self.port = p
