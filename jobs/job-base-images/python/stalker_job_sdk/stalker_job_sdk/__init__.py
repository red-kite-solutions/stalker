import httpx
import json
import sys
from abc import ABC
from ipaddress import ip_address
from os import getenv
from functools import lru_cache



@lru_cache
def get_http_client():
    return httpx.Client(verify=False, http2=True)

class Field(ABC):
    def __init__(self, key: str, type: str):
        self.key = key
        self.type = type


class TextField(Field):
    def __init__(self, key: str, label: str, data: str) -> None:
        super().__init__(key, "text")
        self.label = label
        self.data = data


class ImageField(Field):
    def __init__(self, key: str, data: str) -> None:
        super().__init__(key, "image")
        self.data = data


class Finding(ABC):
    def __init__(
        self, key: str, type: str, name: str = None, fields: list[Field] = []
    ) -> None:
        self.key = key
        self.type = type
        self.name = name
        self.fields = fields


class IpFinding(Finding):
    def __init__(
        self,
        key: str,
        ip: str,
        name: str = None,
        fields: list[Field] = [],
        type: str = "CustomFinding",
    ):
        super().__init__(key, type, name, fields)
        self.ip = ip

class IpRangeFinding(Finding):
    def __init__(
        self,
        ip: str,
        mask: str
    ):
        super().__init__("IpRangeFinding", "IpRangeFinding", "Ip Range", [])
        self.ip = ip
        self.mask = mask

class PortFinding(Finding):
    def __init__(
        self,
        key: str,
        ip: str,
        port: int,
        protocol: str,
        name: str = None,
        fields: list[Field] = [],
        type: str = "CustomFinding",
    ):
        super().__init__(key, type, name, fields)
        self.ip = ip
        self.port = port
        self.protocol = protocol

class WebsiteFinding(Finding):
    def __init__(
        self,
        key: str,
        ip: str,
        port: int,
        domainName: str,
        path: str,
        ssl: bool = None,
        name: str = None,
        fields: list[Field] = [],
        type: str = "CustomFinding",
    ):
        super().__init__(key, type, name, fields)
        self.ip = ip
        self.port = port
        self.domainName = domainName
        self.protocol = 'tcp'
        self.path = path
        self.ssl = ssl

class DomainFinding(Finding):
    def __init__(
        self,
        key: str,
        domainName: str,
        ip: str,
        name: str = None,
        fields: list[Field] = [],
        type: str = "CustomFinding",
    ):
        super().__init__(key, type, name, fields)
        self.ip = ip
        self.domainName = domainName

class TagFinding(Finding):
    def __init__(
        self,
        tag: str,
        ip: str = None,
        port: int  = None,
        protocol: str = None,
        domainName: str = None,
        path: str = None,
    ):
        super().__init__("TagFinding", "TagFinding", "Tag", [])
        self.ip = ip
        self.port = port
        self.domainName = domainName
        self.protocol = protocol
        self.path = path
        self.tag = tag

class JobStatus:
    SUCCESS = "Success"
    FAILED = "Failed"

def log_finding(*findings: list[Finding]):
    data = {"findings": findings}
    _log("@finding", json.dumps(data, default=vars))


def log_debug(message: str):
    _log("@debug", message)


def log_info(message: str):
    _log("@info", message)


def log_warning(message: str):
    _log("@warning", message)


def log_error(message: str):
    _log("@error", message)
    

def _log(prefix: str, message: str):
    jobId = getenv('RedKiteJobId')
    orchestratorUrl = getenv('RedKiteOrchestratorUrl') or 'http://orchestrator.stalker.svc.cluster.local.'
    output = f"{prefix} {message}"
    if(not jobId):
        print(output)
        sys.stdout.flush()
        return

    client = get_http_client()
    client.post(f"{orchestratorUrl}/Jobs/{jobId}/Finding", json={ "Finding": output})

def log_status(status: str):
    """Reports the status to the orchestrator. Status can be Success of Failed."""
    if status != JobStatus.SUCCESS and status != JobStatus.FAILED:
        return
    
    jobId = getenv('RedKiteJobId')
    orchestratorUrl = getenv('RedKiteOrchestratorUrl') or 'http://orchestrator.stalker.svc.cluster.local.'
    
    if(not jobId):
        print(f"Status: {status}")
        sys.stdout.flush()
        return
    
    client = get_http_client()
    client.post(f"{orchestratorUrl}/Jobs/{jobId}/Status", json={ "Status": status})


def _log_done():
    """Reports the job has ended."""
    jobId = getenv('RedKiteJobId')
    orchestratorUrl = getenv('RedKiteOrchestratorUrl') or 'http://orchestrator.stalker.svc.cluster.local.'
    
    if(not jobId):
        print(f"Status: Ended")
        sys.stdout.flush()
        return
    
    client = get_http_client()
    client.post(f"{orchestratorUrl}/Jobs/{jobId}/Status", json={ "Status": "Ended"})
    
def is_valid_ip(ip: str):
    """Validates an IP address. Returns false if the IP is invalid, true otherwise."""
    try:
        ip = ip_address(ip)
    except ValueError:
        return False
    return True

def is_valid_port(port: int):
    """Validates a port number. Returns false if the port is invalid, true otherwise."""
    try:
        if not isinstance(port, int) or port < 1 or port > 65535:
            return False
    except Exception:
        return False
    return True

def build_url(ip: str, port: int, domain: str, path: str, ssl: bool):
    url = "https://" if ssl else "http://"
    url += domain if domain else ip
    url += f":{str(port)}" if port != 80 and port != 443 else ""
    if path:
        url += path if path[0] == '/' else f"/{path}"
    return url

def to_boolean(value: str):
    if value:
        value = value.lower()
        if value == "true":
            return True
        elif value == "false":
            return False
    return None
