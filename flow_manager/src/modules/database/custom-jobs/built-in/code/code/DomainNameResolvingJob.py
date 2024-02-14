import os
import socket

from stalker_job_sdk import DomainFinding, log_finding

hostname = os.environ["domainName"]
data = socket.gethostbyname_ex(hostname)
ipx = data[2]

for ip in ipx:
    log_finding(
        DomainFinding(
            "HostnameIpFinding", hostname, ip, "New ip", [], "HostnameIpFinding"
        )
    )
