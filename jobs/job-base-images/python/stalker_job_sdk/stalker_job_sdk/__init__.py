from typing import Any, Dict
import httpx
import json
import sys
import re
import tldextract
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
        key: str,
        ip: str,
        mask: str,
        name: str = None,
        fields: list[Field] = [],
        type: str = "CustomFinding",
    ):
        super().__init__(key, type, name, fields)
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
        mask: int = None
    ):
        super().__init__("TagFinding", "TagFinding", "Tag", [])
        self.ip = ip
        self.port = port
        self.domainName = domainName
        self.protocol = protocol
        self.path = path
        self.tag = tag
        self.mask = mask

def convert_value(value: Any, target_type: str, classes: Dict[str, type]):
    """
    Convert the value into the target_type. target_type can be an object contained in classes.

    @param value The value containing the data to convert
    @param target_type The target type as a string, can be as simple as "str" but as complex as "List[List[MyClass]]"
    @param classes Custom classes available to convert values into. All custom classes must implement the class method from_dict
    """
    # target_type is a string like 'MyClass', 'List[MyClass]', 'Optional[MyClass]', 'List[List[MyClass]]', etc.
    if value is None:
        return None
    # handle List[...]
    if target_type.startswith('List[') and isinstance(value, list):
        inner = target_type[5:-1]
        return [convert_value(v, inner, classes) for v in value]
    # handle Optional[...]
    if target_type.startswith('Optional['):
        inner = target_type[9:-1]
        return convert_value(value, inner, classes)
    # handle Union[...] -> try to convert with first matching simple strategy
    if target_type.startswith('Union['):
        opts = [o.strip() for o in target_type[6:-1].split(',')]
        for o in opts:
            try:
                return convert_value(value, o, classes)
            except Exception:
                continue
        return value
    # handle class types
    if target_type in classes and isinstance(value, dict):
        return classes[target_type].from_dict(value)
    # primitives: assume already correct or let Python coerce where sensible
    return value


def get_all_domains(domainNames: list['str']) -> list['str']:
    """
    Gets all the possible domains and subdomains from a list of domain names.

    For instance, input such as: ["*.asdf.example.com", "qwerty.co.uk.", "abc.asd.asd.com"]

    Would return the following domain findings in no particular order:

    example.com
    asdf.example.com
    qwerty.co.uk
    asd.com
    asd.asd.com
    abc.asd.asd.com
    """
    domain_regex = r"(?:(?:[a-z0-9](?:[a-z0-9\x2d]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9\x2d]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9\x2d]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])"
    all_domains = set()
    for domain in domainNames:
        match = re.search(domain_regex, domain) 
        if match is None:
            continue

        full_domain = match.group()
        tld_obj = tldextract.extract(full_domain)
        domain_no_tld = tld_obj.domain
        subdomains_no_tld = tld_obj.subdomain
        tld = tld_obj.suffix

        
        all_domains.add(f"{domain_no_tld}.{tld}")
        if subdomains_no_tld == '':
            continue

        subdomains_list = subdomains_no_tld.split('.')
        subdomains_list.reverse()
        for i in range(len(subdomains_list)):
            sublist = subdomains_list[:i+1]
            sublist.reverse()
            sublist.append(f"{domain_no_tld}.{tld}")
            
            all_domains.add(f"{".".join(sublist)}")

    return all_domains


def emit_all_domains(domainNames: list['str']):
    """
    Emits domain findings for all domains and subdomains of the strings in domainNames. It also manages leading dots and wildcards and trailing dots.

    For instance, input such as: ["*.asdf.example.com", "qwerty.co.uk.", "abc.asd.asd.com"]

    Would emit the following domain findings:

    example.com
    asdf.example.com
    qwerty.co.uk
    asd.com
    asd.asd.com
    abc.asd.asd.com
    """
    # https://stackoverflow.com/questions/201323/how-can-i-validate-an-email-address-using-a-regular-expression
    all_domains = get_all_domains(domainNames)
    for domain in all_domains:
        log_finding(
            DomainFinding(
                "HostnameFinding", domain, None, "New domain", [], "HostnameFinding"
            )
        )

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
