import json
import os
import random

import httpx
from stalker_job_sdk import PortFinding, log_error, log_finding

TARGET_IP: str = os.environ["TARGET_IP"]  # IP to scan
PORTS = os.environ["PORTS"]  # expects a json array of numbers, ex: [ 80, 443, 3389 ].

ports_list: list = json.loads(PORTS) if PORTS and PORTS != "" else []
ports_set: set = set(ports_list)

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
            print(e)

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
            log_error(e)
