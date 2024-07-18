import os
import typing
from json import loads
from subprocess import PIPE, Popen
from urllib.parse import urlparse

from stalker_job_sdk import (JobStatus, TextField, WebsiteFinding, build_url,
                             is_valid_ip, is_valid_port, log_error,
                             log_finding, log_info, log_status, log_warning,
                             to_boolean)


class WebsiteRequest:
    method: str
    endpoint: str
    tag: str
    attribute: str
    source: str

class WebsiteResponse:
    status_code: int
    headers: typing.Dict[str, str]
    technologies: 'list[str]'

class WebsiteFile:
    timestamp: str
    request: WebsiteRequest
    response: WebsiteResponse
    
    def __init__(self, data: dict):
        self.timestamp = data.get("timestamp")
        self.request = WebsiteRequest()
        req: dict = data.get("request")
        self.request.attribute = req.get("attribute")
        self.request.endpoint = req.get("endpoint")
        self.request.method = req.get("method")
        self.request.source = req.get("source")
        self.request.tag = req.get("tag")
        self.response = WebsiteResponse()
        res: dict = data.get("response")
        self.response.headers = res.get("headers")
        self.response.status_code = res.get("status_code")
        self.response.technologies = res.get("technologies")
        

def get_valid_args():
    """Gets the arguments from environment variables"""
    target_ip: str = os.environ.get("targetIp")
    port: int = int(os.environ.get("port"))
    domain: str = os.environ.get("domainName")
    path: str = os.environ.get("path")
    ssl: str = to_boolean(os.environ.get("ssl"))
    max_depth: int = int(os.environ.get("maxDepth"))
    crawl_duration_seconds: int = int(os.environ.get("crawlDurationSeconds"))
    concurrency : int = int(os.environ.get("fetcherConcurrency"))
    parallelism : int = int(os.environ.get("inputParallelism"))
    
    extra_katana_option: str = os.environ.get("extraOptions")

    if not is_valid_ip(target_ip):
        log_error(f"targetIp parameter is invalid: {target_ip}")
        log_status(JobStatus.FAILED)
        exit()

    if not is_valid_port(port):
        log_error(f"port parameter is invalid: {str(port)}")
        log_status(JobStatus.FAILED)
        exit()

    if max_depth <= 0:
        log_error(f"maxDepth parameter is invalid: {str(max_depth)}")
        log_status(JobStatus.FAILED)
        exit()

    if crawl_duration_seconds <= 0:
        log_error(f"crawlDurationSeconds parameter is invalid: {str(crawl_duration_seconds)}")
        log_status(JobStatus.FAILED)
        exit()

    if concurrency <= 0:
        log_error(f"fetcherConcurrency parameter is invalid: {str(concurrency)}")
        log_status(JobStatus.FAILED)
        exit()

    if parallelism <= 0:
        log_error(f"inputParallelism parameter is invalid: {str(parallelism)}")
        log_status(JobStatus.FAILED)
        exit()

    return target_ip, port, domain, path, ssl, max_depth, crawl_duration_seconds, concurrency, parallelism, extra_katana_option


def emit_file_finding(file: WebsiteFile, domain: str, ip: str, port: int, path: str, ssl: bool):
    fields = []

    if file.response.status_code:
        fields.append(TextField("statusCode", "Status Code", file.response.status_code))

    if file.request.endpoint:
        endpoint = urlparse(file.request.endpoint).path
        fields.append(TextField("endpoint", "Endpoint", endpoint))

    if file.request.method:
        fields.append(TextField("method", "Method", file.request.method))
        
    if file.request.tag:
        fields.append(TextField("tag", "Tag", file.request.tag))

    if file.request.attribute:
        fields.append(TextField("attribute", "Attribute", file.request.attribute))
    
    if file.request.source:
        fields.append(TextField("source", "Source", file.request.source))

    log_finding(
        WebsiteFinding(
            "WebsitePathFinding", ip, port, domain, path, ssl, f"Website path", fields
        )
    )

def emit_technology_findings(technologies: 'list[str]', domain: str, ip: str, port: int, path: str, ssl: bool):
    for tech in technologies:
        log_finding(
            WebsiteFinding(
                "WebsiteTechnologyFinding", ip, port, domain, path, ssl, f"Technology", [TextField("technology", "Technology", tech)]
            )
        )

def main():
    target_ip, port, domain, path, ssl, max_depth, crawl_duration_seconds, concurrency, parallelism, extra_options = get_valid_args()
    url = build_url(target_ip, port, domain, path, ssl)

    katana_str: str = f"katana -u {url} -d {max_depth} -ct {crawl_duration_seconds} -c {str(concurrency)} -p {str(parallelism)} {extra_options}"
    log_info(f'Start of crawling: {katana_str}')

    # katana -u https://example.com -silent -d 3 -ct 3600 -jc -kf all -timeout 3 -duc -j -or -ob -c 10 -p 10
    technologies: 'set[str]' = set()
    with Popen(katana_str, stdout=PIPE, stderr=PIPE, universal_newlines=True, shell=True) as katana_process:
        
        for line in katana_process.stdout:
            file = ''
            try:
                file: WebsiteFile = WebsiteFile(loads(line))
                if file:
                    if file.response.technologies:
                        technologies.update(file.response.technologies)

                    if file.response.status_code == 404:
                        continue
                    
                    emit_file_finding(file, domain, target_ip, port, path, ssl)
            except Exception as err:
                log_warning(err)
                continue

        for line in katana_process.stderr:
            log_error(line)
            
    emit_technology_findings(technologies, domain, target_ip, port, path, ssl)

try:
    main()
    log_status(JobStatus.SUCCESS)
except Exception as err:
    log_error("An unexpected error occured")
    log_error(err)
    log_status(JobStatus.FAILED)
    exit()