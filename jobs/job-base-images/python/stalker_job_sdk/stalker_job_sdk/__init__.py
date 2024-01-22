import json
import sys
from abc import ABC


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
    lines = str(message).splitlines()
    for line in lines:
        print(f"{prefix} {line}")
    sys.stdout.flush()
