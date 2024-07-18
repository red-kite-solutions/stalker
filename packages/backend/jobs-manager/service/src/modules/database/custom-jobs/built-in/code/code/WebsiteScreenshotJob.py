import os
from base64 import b64encode
from subprocess import CompletedProcess, run
from urllib.parse import urlparse

from stalker_job_sdk import (ImageField, JobStatus, TextField, WebsiteFinding,
                             build_url, is_valid_ip, is_valid_port, log_error,
                             log_finding, log_info, log_status, log_warning,
                             to_boolean)


def get_valid_args():
    """Gets the arguments from environment variables"""
    target_ip: str = os.environ.get("targetIp")
    port: int = int(os.environ.get("port"))
    domain: str = os.environ.get("domainName")
    path: str = os.environ.get("path")
    ssl: str = to_boolean(os.environ.get("ssl"))
    endpoint: str = to_boolean(os.environ.get("endpoint"))

    if not is_valid_ip(target_ip):
        log_error(f"targetIp parameter is invalid: {target_ip}")
        log_status(JobStatus.FAILED)
        exit()

    if not is_valid_port(port):
        log_error(f"port parameter is invalid: {str(port)}")
        log_status(JobStatus.FAILED)
        exit()

    return target_ip, port, domain, path, ssl, endpoint


def emit_screenshot_finding(domain: str, ip: str, port: int, path: str, ssl: bool, endpoint: str, url: str):
    output_folder = './output/screenshot/'

    for root, directories, files in os.walk(output_folder):
        for file in files:
            if (file.endswith('.png')):
                data = ''
                with open(root + '/' + file, 'rb') as f:
                    data = f.read()

                data = b64encode(data).decode('utf-8')
                
                fields = []
                fields.append(TextField("url", "Url", url))
                if(endpoint):
                    fields.append(TextField("endpoint", "Endpoint", endpoint))
                fields.append(ImageField("image", f"data:image/png;base64,{data}"))
                
                log_finding(
                    WebsiteFinding(
                        "WebsiteScreenshotFinding", ip, port, domain, path, ssl, f"Website screenshot", fields
                    )
                )

def main():
    target_ip, port, domain, path, ssl, endpoint = get_valid_args()

    url = build_url(target_ip, port, domain, endpoint if endpoint else path, ssl)

    httpx_str: str = f"httpx -silent -screenshot -system-chrome -duc -u {url}"

    log_info(f'Screenshot starting: {httpx_str}')

    httpx_process: CompletedProcess = run(httpx_str.split(" "), text=True)

    emit_screenshot_finding(domain, target_ip, port, path, ssl, endpoint, url)

try:
    main()
    log_status(JobStatus.SUCCESS)
except Exception as err:
    log_error("An unexpected error occured")
    log_error(err)
    log_status(JobStatus.FAILED)
    exit()