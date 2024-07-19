import os
from base64 import b64encode
from shutil import rmtree
from subprocess import CompletedProcess, run

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
    endpoint: str = os.environ.get("endpoint")
    findingName: str = os.environ.get("finding")

    if not is_valid_ip(target_ip):
        log_error(f"targetIp parameter is invalid: {target_ip}")
        log_status(JobStatus.FAILED)
        exit()

    if not is_valid_port(port):
        log_error(f"port parameter is invalid: {str(port)}")
        log_status(JobStatus.FAILED)
        exit()

    if not findingName:
        findingName = "WebsiteScreenshotFinding"

    return target_ip, port, domain, path, ssl, endpoint, findingName


def emit_screenshot_finding(findingName: str, domain: str, ip: str, port: int, path: str, ssl: bool, endpoint: str, url: str, data: str):
    fields = []
    fields.append(TextField("url", "Url", url))
    fields.append(TextField("endpoint", "Endpoint", endpoint if endpoint else path))
    fields.append(ImageField("image", f"data:image/png;base64,{data}"))
    
    log_finding(
        WebsiteFinding(
            findingName, ip, port, domain or '', path, ssl, f"Website screenshot", fields
        )
    )

def main():
    output_folder = './output/screenshot/'
    retry_count = 0
    max_retry = 1
    target_ip, port, domain, path, ssl, endpoint, findingName = get_valid_args()
    

    url = build_url(target_ip, port, domain, endpoint if endpoint else path, ssl)

    httpx_str: str = f"httpx -silent -screenshot -system-chrome -duc -u {url}"

    while retry_count <= max_retry:
        log_info(f'Screenshot starting: {httpx_str}')
        httpx_process: CompletedProcess = run(httpx_str.split(" "), text=True)

        for root, directories, files in os.walk(output_folder):
            for file in files:
                if (file.endswith('.png')):
                    data = ''
                    with open(root + '/' + file, 'rb') as f:
                        data = f.read()

                    data = b64encode(data).decode('utf-8')
                    
                    if len(data) > 0:
                        emit_screenshot_finding(findingName, domain, target_ip, port, path, ssl, endpoint, url, data)
                    else:
                        retry_count += 1
                        if retry_count <= max_retry:
                            log_warning("Screenshot data is empty, retrying")
                        else:
                            log_warning("Screenshot data is empty and out of retries")

try:
    main()
    log_status(JobStatus.SUCCESS)
except Exception as err:
    log_error("An unexpected error occured")
    log_error(err)
    log_status(JobStatus.FAILED)
    exit()