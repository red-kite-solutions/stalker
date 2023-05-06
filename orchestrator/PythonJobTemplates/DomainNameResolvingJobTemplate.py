import os
import socket
import time

from stalker_job_sdk import DomainFinding, log_finding

hostname = os.environ["HOSTNAME"]
data = socket.gethostbyname_ex(hostname)
ipx = data[2]

time.sleep(1)

for ip in ipx:
    log_finding(
        DomainFinding(
            "HostnameIpFinding", hostname, ip, "New ip", [], "HostnameIpFinding"
        )
    )
