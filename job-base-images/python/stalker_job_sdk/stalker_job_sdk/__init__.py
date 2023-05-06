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
        name: str = None,
        fields: list[Field] = [],
        type: str = "CustomFinding",
    ):
        super().__init__(key, type, name, fields)
        self.ip = ip
        self.port = port


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
    print(f"@finding {json.dumps(data, default=vars)}")
    sys.stdout.flush()


def log_debug(message: str):
    print(f"@debug {message}")
    sys.stdout.flush()


def log_info(message: str):
    print(f"@info {message}")
    sys.stdout.flush()


def log_warning(message: str):
    print(f"@warning {message}")
    sys.stdout.flush()


def log_error(message: str):
    print(f"@error {message}")
    sys.stdout.flush()
