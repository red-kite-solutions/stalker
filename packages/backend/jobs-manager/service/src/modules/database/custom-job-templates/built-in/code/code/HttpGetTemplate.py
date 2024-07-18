import os
from urllib.parse import urlparse

import httpx
from stalker_job_sdk import (JobStatus, TextField, WebsiteFinding, build_url,
                             is_valid_ip, is_valid_port, log_error,
                             log_finding, log_info, log_status, log_warning,
                             to_boolean)


class WebsiteFile:
    status_code: int
    url: str
    method: str

def get_valid_args():
    """Gets the arguments from environment variables"""
    target_ip: str = os.environ.get("targetIp")
    port: int = int(os.environ.get("port"))
    domain: str = os.environ.get("domainName")
    path: str = os.environ.get("path")
    ssl: str = to_boolean(os.environ.get("ssl"))
    endpoint: str = os.environ.get("endpoint")

    if not is_valid_ip(target_ip):
        log_error(f"targetIp parameter is invalid: {target_ip}")
        log_status(JobStatus.FAILED)
        exit()

    if not is_valid_port(port):
        log_error(f"port parameter is invalid: {str(port)}")
        log_status(JobStatus.FAILED)
        exit()

    return target_ip, port, domain, path, ssl, endpoint


def emit_file_finding(file: WebsiteFile, domain: str, ip: str, port: int, path: str, ssl: bool):
    fields = []
    fields.append(TextField("statusCode", "Status Code", file.status_code))
    endpoint = urlparse(file.url).path    
    fields.append(TextField("endpoint", "Endpoint", endpoint))
    fields.append(TextField("method", "Method", file.method))

    log_finding(
        WebsiteFinding(
            "WebsitePathFinding", ip, port, domain, path, ssl, f"Website path", fields
        )
    )

def main():
    target_ip, port, domain, path, ssl, endpoint = get_valid_args()

    url = build_url(target_ip, port, domain, endpoint if endpoint else path, ssl)

    with httpx.Client(verify=False, http2=True, timeout=10.0) as client:
        try:
            r = client.get(url)
            log_info(f"Got status code {str(r.status_code)} for {url}")
            if r.status_code != 404:
                file = WebsiteFile()
                file.method = "GET"
                file.status_code = r.status_code
                file.url = url
                emit_file_finding(file, domain, target_ip, port, path, ssl)
            return
        except Exception as err:
            log_warning(f"Exception while querying {url}")
            log_error(err)
            log_status(JobStatus.FAILED)
            exit()

try:
    main()
    log_status(JobStatus.SUCCESS)
except Exception as err:
    log_error("An unexpected error occured")
    log_error(err)
    log_status(JobStatus.FAILED)
    exit()