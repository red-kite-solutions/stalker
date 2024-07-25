import os

import httpx
from stalker_job_sdk import (JobStatus, PortFinding, TextField, is_valid_ip,
                             is_valid_port, log_error, log_finding, log_info,
                             log_status, log_warning)


def get_args():
    """Gets the arguments from environment variables"""
    target_ip: str = os.environ.get("targetIp")
    port = int(os.environ.get("port"))
    domain = os.environ.get("domainName") # DOMAIN should resolve to TARGET_IP
    path = os.environ.get("path") # Http server file path to GET

    if not path or len(path) == 0:
        path = '/'

    if path[0] != '/':
        path = f"/{path}"

    return target_ip, port, domain, path

def validate_input(ip: str, port: int, domain: str, path: str):
    if ip and not is_valid_ip(ip):
        log_error(f"targetIp parameter is invalid: {ip}")
        log_status(JobStatus.FAILED)
        exit()

    if not is_valid_port(port):
        log_error(f"Invalid port {str(port)}")
        log_status(JobStatus.FAILED)
        exit()

    if not path:
        log_error(f"path parameter is missing")
        log_status(JobStatus.FAILED)
        exit()

def emit_finding(url: str, ip: str, port: int, domain: str, path: str):
    log_finding(
        PortFinding(
            "HttpFileFound", ip, port, "tcp", f"Found file {path}", [
                TextField("domain", "domain", domain),
                TextField("url", "url", url),
                TextField("path", "path", path),
                TextField("statusCode", "status code", "200")
            ]
        )
    )

def main():
    target_ip, port, domain, path = get_args()

    validate_input(target_ip, port, domain, path)

    url = ""

    if domain:
        url = f"{domain}:{str(port)}{path}"
    else:
        url = f"{target_ip}:{str(port)}{path}"

    with httpx.Client(verify=False, http2=True, timeout=10.0) as client:
        try:
            full_url = f"https://{url}"
            r = client.get(full_url)
            log_info(f"Got status code {str(r.status_code)}")
            if r.status_code == 200:
                emit_finding(full_url, target_ip, port, domain, path)
            return
        except Exception as e:
            pass # retrying with http
        
        try:
            full_url = f"http://{url}"
            r = client.get(full_url)
            log_info(f"Got status code {str(r.status_code)}")
            if r.status_code == 200:
                emit_finding(full_url, target_ip, port, domain, path)
            return
        except Exception as e:
            log_warning(f"Exception while querying http(s)://{url}")

try:
    main()
    log_status(JobStatus.SUCCESS)
except Exception as err:
    log_error("An unexpected error occured")
    log_error(err)
    log_status(JobStatus.FAILED)
    exit()