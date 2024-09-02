import json
import math
import os
import random
import socket
import threading
from ipaddress import ip_address

from stalker_job_sdk import (JobStatus, PortFinding, TextField, is_valid_ip,
                             is_valid_port, log_error, log_finding, log_status,
                             log_warning)


def validate_ip(ip: str, name: str):
    if not is_valid_ip(ip):
        log_error(f"{name} parameter is invalid: {ip}")
        log_status(JobStatus.FAILED)
        exit()
        
def validate_port(port: int, name: str):
    if not is_valid_port(port):
        log_error(f"Invalid port {str(port)} in {name}")
        log_status(JobStatus.FAILED)
        exit()

class PortScanThread(threading.Thread):
    def __init__(self, ports: list):
        threading.Thread.__init__(self)
        self.ports_to_scan = ports
        self.open_ports = []

    def is_tcp_port_open(self, port: int):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(SOCKET_TIMEOUT)
        try:
            s.connect((TARGET_IP, port))
            s.close()
            return True
        except Exception:
            return False

    def run(self):
        for p in self.ports_to_scan:
            if self.is_tcp_port_open(p):
                self.open_ports.append(p)


TARGET_IP: str = os.environ.get("targetIp")  # IP to scan
THREADS: int = int(os.environ.get("threads"))  # number of threads to do the requests
SOCKET_TIMEOUT: float = float(
    os.environ.get("socketTimeoutSeconds")
)  # time in seconds to wait for socket
PORT_MIN: int = int(os.environ.get("portMin"))  # expects a number (0 < p1 < 65535)
PORT_MAX: int = int(
    os.environ.get("portMax")
)  # expects a number (0 < p2 <= 65535 and p2 > p1)

PORTS = os.environ[
    "ports"
]  # expects a json array of numbers, ex: [ 80, 443, 3389 ]. Array can be empty

validate_ip(TARGET_IP, 'targetIp')

if not isinstance(THREADS, int) or THREADS <= 0:
    log_error(f"Invalid rate parameter: {str(THREADS)}")
    
if THREADS > 1300:
    log_warning(f"threads value is high (> 1,300) and may have an effect on performances.")

ports_list:list = []
ports_set: set = set()

try:
    ports_list = json.loads(PORTS) if PORTS and PORTS != "" else []
    for p in ports_list:
        validate_port(p, 'ports')
    ports_set: set = set(ports_list)
except Exception:
    log_error(f"ports parameter is invalid: {PORTS}")
    log_status(JobStatus.FAILED)
    exit()

validate_port(PORT_MIN, 'portMin')
validate_port(PORT_MAX, 'portMax')

if (not isinstance(SOCKET_TIMEOUT, int) and not isinstance(SOCKET_TIMEOUT, float)) or SOCKET_TIMEOUT < 0:
    log_error(f"socketTimeoutSeconds parameter is invalid: {SOCKET_TIMEOUT}")

if SOCKET_TIMEOUT > 3:
    log_warning(f"socketTimeoutSeconds value is high (> 3) and it may have an effect on performances.")

ports_list: list = json.loads(PORTS) if PORTS and PORTS != "" else []
ports_set: set = set(ports_list)

if PORT_MIN and PORT_MAX and PORT_MAX > PORT_MIN:
    for p in range(PORT_MIN, PORT_MAX + 1):
        ports_set.add(p)

ports_list = list(ports_set)
random.shuffle(ports_list)  # randomizing port scan order


threads = THREADS if THREADS and THREADS > 0 and THREADS <= 1000 else 100

sublists = []
total_ports = len(ports_list)
ports_per_thread = math.floor(total_ports / threads)

if ports_per_thread < 1:
    ports_per_thread = 1

for thread_i in range(0, threads):
    min_port = thread_i * ports_per_thread
    max_port = min_port + ports_per_thread

    if max_port < total_ports:
        sublists.append(ports_list[min_port:max_port])
    else:
        sublists.append(ports_list[min_port:])
        break  # required to handle a case like 10 ports with 20 threads

allocated_ports = ports_per_thread * threads
if allocated_ports < total_ports:
    for i in range(0, total_ports - allocated_ports):
        sublists[i % threads].append(ports_list[allocated_ports + i])

threads_list = []

# Start all the port scan threads
for l in sublists:
    t = PortScanThread(l)
    t.start()
    threads_list.append(t)

# Wait for port scan threads to finish
for t in threads_list:
    t.join()

open_ports_output = []
for t in threads_list:
    if t.open_ports:
        open_ports_output += t.open_ports

open_ports_output.sort()

for port in open_ports_output:
    log_finding(
        PortFinding(
            "PortFinding",
            TARGET_IP,
            port,
            "tcp",
            "Port scanning finding",
            [TextField("protocol", "This is a TCP port", "tcp")],
            "PortFinding",
        )
    )

log_status(JobStatus.SUCCESS)