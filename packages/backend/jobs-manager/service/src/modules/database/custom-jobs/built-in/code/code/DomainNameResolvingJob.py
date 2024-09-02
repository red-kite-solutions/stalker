import os
import socket

from stalker_job_sdk import DomainFinding, JobStatus, log_finding, log_status

hostname = os.environ.get("domainName")
data = socket.gethostbyname_ex(hostname)
ipx = data[2]

for ip in ipx:
    log_finding(
        DomainFinding(
            "HostnameIpFinding", hostname, ip, "New ip", [], "HostnameIpFinding"
        )
    )

log_status(JobStatus.SUCCESS)