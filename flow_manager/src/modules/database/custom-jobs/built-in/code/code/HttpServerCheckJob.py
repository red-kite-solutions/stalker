import json
import os
import random
from ipaddress import ip_address

import httpx
from stalker_job_sdk import (PortFinding, is_valid_ip, is_valid_port,
                             log_error, log_finding, log_info)

TARGET_IP: str = os.environ["targetIp"]  # IP to scan
PORTS = os.environ["ports"]  # expects a json array of numbers, ex: [ 80, 443, 3389 ].

if not is_valid_ip(TARGET_IP):
    log_error(f"targetIp parameter is invalid: {TARGET_IP}")
    exit()

ports_list:list = []
ports_set: set = set()

try:
    ports_list = json.loads(PORTS) if PORTS and PORTS != "" else []
    for p in ports_list:
        if not is_valid_port(p):
            log_error(f"Invalid port {str(p)} of the ports list {str(ports_list)}")
            exit()
    ports_set: set = set(ports_list)
except Exception:
    log_error(f"ports parameter is invalid: {PORTS}")
    exit()

ports_list = list(ports_set)
random.shuffle(ports_list)  # randomizing port scan order

sublists = []
total_ports = len(ports_list)

with httpx.Client(verify=False, http2=True) as client:
    # Try HTTPS
    for port in ports_set:
        try:
            r = client.get(f"https://{TARGET_IP}:{port}", timeout=10.0)
            log_finding(
                PortFinding(
                    "HttpServerCheck", TARGET_IP, port, "tcp", "This port runs an HTTPS server"
                )
            )

            exit()

        except Exception as e:
            a = "retrying with http"

        # Test HTTP
        try:
            r = client.get(f"http://{TARGET_IP}:{port}", timeout=10.0)
            log_finding(
                PortFinding(
                    "HttpServerCheck", TARGET_IP, port, "tcp", "This port runs an HTTP server"
                )
            )
            exit()

        except Exception as e:
            log_info(f"Port {port} is not http(s)")
