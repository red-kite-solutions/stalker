import json
import sys
from abc import ABC
from ipaddress import ip_address
from os import getenv

import httpx


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
    jobId = getenv('StalkerJobId')
    output = f"{prefix} {message}"
    if(not jobId):
        print(output)
        sys.stdout.flush()
        return
    
    with httpx.Client(verify=False, http2=True) as client:
        client.post("http://orchestrator.stalker:80/Jobs/Finding", json={ "JobId": jobId, "Finding": output})

def log_status(status: str):
    """Reports the status to the orchestrator. Reporting a status will eventually clean up the job. Status can be Success of Failed."""
    if status != JobStatus.SUCCESS and JobStatus.FAILED:
        return
    
    jobId = getenv('StalkerJobId')
    
    if(not jobId):
        print(f"Status: {status}")
        sys.stdout.flush()
        return
    
    with httpx.Client(verify=False, http2=True) as client:
        client.post("http://orchestrator.stalker:80/Jobs/Status", json={ "JobId": jobId, "Status": status})

    
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