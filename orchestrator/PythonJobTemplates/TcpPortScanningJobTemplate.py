# import json
# import math
# import os
# import random
# import socket
# import threading

print('@logdebug hello we are in the tcp port scan job')
import time

time.sleep(30)

# class PortScanThread(threading.Thread):
#   def __init__(self, ports: list):
#     threading.Thread.__init__(self)
#     self.ports_to_scan = ports
#     self.open_ports = []

#   # This function could be faster if it only did a TCP SYN and waited for TCP
#   # ACK instead of a full TCP handshake. There may be something to do about the
#   # new socket / settimeout / s.close() everytime too
#   # Also, the usage of zmap could be considered: https://github.com/zmap/zmap
#   def is_tcp_port_open(self, port: int):
#     s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
#     s.settimeout(SOCKET_TIMEOUT)
#     try:
#       s.connect((TARGET_IP, port))
#       s.close()
#       return True
#     except: 
#       return False

#   def run(self):
#     for p in self.ports_to_scan:
#       if self.is_tcp_port_open(p):
#         self.open_ports.append(p)


# TARGET_IP: str = os.environ['TARGET_IP'] # IP to scan
# THREADS: int = int(os.environ['THREADS']) # number of threads to do the requests
# SOCKET_TIMEOUT: float = float(os.environ['SOCKET_TIMEOUT']) # time in seconds to wait for socket
# PORT_MIN: int = int(os.environ['PORT_MIN']) # expects a number (0 < p1 < 65535)
# PORT_MAX: int = int(os.environ['PORT_MAX']) # expects a number (0 < p2 <= 65535 and p2 > p1)

# PORTS = os.environ['PORTS'] # expects a json array of numbers [ 80, 443, 3389 ]. Array can be empty


# ports_list: list = json.loads(PORTS) if PORTS and PORTS != '' else []
# ports_set: set =  set(ports_list)

# if(PORT_MIN and PORT_MAX and PORT_MAX > PORT_MIN):
#   for p in range(PORT_MIN, PORT_MAX + 1):
#     ports_set.add(p)

# ports_list = list(ports_set)
# random.shuffle(ports_list) # randomizing port scan order


# threads = THREADS if THREADS and THREADS > 0 and THREADS <= 1000 else 100

# sublists = []
# total_ports = len(ports_list)
# ports_per_thread = math.floor(total_ports/threads)

# if ports_per_thread < 1:
#   ports_per_thread = 1

# for thread_i in range(0, threads):
#   min_port = thread_i * ports_per_thread
#   max_port = min_port + ports_per_thread

#   if max_port < total_ports:
#     sublists.append(ports_list[min_port:max_port])
#   else : 
#     sublists.append(ports_list[min_port:])
#     break # required to handle a case like 10 ports with 20 threads

# allocated_ports = ports_per_thread * threads
# if allocated_ports < total_ports:
#   for i in range(0, total_ports - allocated_ports):
#     sublists[i % threads].append(ports_list[allocated_ports + i])

# threads_list = []

# # Start all the port scan threads
# for l in sublists:
#   t = PortScanThread(l)
#   t.start()
#   threads_list.append(t)

# # Wait for port scan threads to finish
# for t in threads_list:
#   t.join()

# open_ports_output = []
# for t in threads_list:
#   if t.open_ports:
#     open_ports_output += t.open_ports

# print('@finding {{ "findings": [ {{ "type": "TcpPortsFinding", "ip": {0}, "ports": {1} }} ] }}'.format(json.dumps(TARGET_IP), json.dumps(open_ports_output)))
