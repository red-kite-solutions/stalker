import os
import socket
import time

from stalker_job_sdk import (
    DomainFinding,
    log_debug,
    log_error,
    log_finding,
    log_info,
    log_warning,
)

log_debug("Starting job (debug log)")
log_info("Starting job (info log)")
log_warning("Starting job (warning log)")
log_error("Starting job (error log)")

hostname = os.environ["HOSTNAME"]
data = socket.gethostbyname_ex(hostname)
ipx = data[2]

time.sleep(20)

for ip in ipx:
    log_finding(
        DomainFinding(
            "HostnameIpFinding", hostname, ip, "New ip", [], "HostnameIpFinding"
        )
    )
