import json
import math
import os
import random
import socket
import threading

from stalker_job_sdk import PortFinding, TextField, log_finding


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
        except:
            return False

    def run(self):
        for p in self.ports_to_scan:
            if self.is_tcp_port_open(p):
                self.open_ports.append(p)


TARGET_IP: str = os.environ["targetIp"]  # IP to scan
THREADS: int = int(os.environ["threads"])  # number of threads to do the requests
SOCKET_TIMEOUT: float = float(
    os.environ["socketTimeoutSeconds"]
)  # time in seconds to wait for socket
PORT_MIN: int = int(os.environ["portMin"])  # expects a number (0 < p1 < 65535)
PORT_MAX: int = int(
    os.environ["portMax"]
)  # expects a number (0 < p2 <= 65535 and p2 > p1)

PORTS = os.environ[
    "ports"
]  # expects a json array of numbers, ex: [ 80, 443, 3389 ]. Array can be empty

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
