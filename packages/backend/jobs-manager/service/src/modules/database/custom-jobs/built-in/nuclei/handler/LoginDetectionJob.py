from nuclei_finding import NucleiFinding
from nuclei_job_input import JobInput
from stalker_job_sdk import (TagFinding, TextField, WebsiteFinding,
                             log_finding, log_info)


class FindingHandler:
    """Custom parser template to get you started. The parse_finding and publish_findings methods are required."""

    def __init__(self):
        log_info("Initializing the custom handler")

    def parse_finding(self, finding_obj: dict, original_string: str, input: JobInput):
        """This method returns a NucleiFinding, but it can return any object."""
        return NucleiFinding(finding_obj, original_string=original_string, input=input)

    def publish_findings(self, findings: list):
        """This method receives all the findings given by the parse_finding method as a list."""
        fields = []

        for finding in findings:
            if finding.template_id:
                fields.append(TextField('template-id', 'Template ID', finding.template_id))
            if finding.url:
                fields.append(TextField('url', 'Url', finding.url))
            if finding.type:
                fields.append(TextField('type', 'Type', finding.type))
            if finding.scheme:
                fields.append(TextField('scheme', 'Schema', finding.scheme))
            if finding.description:
                fields.append(TextField('description', 'Description', finding.description))
            if finding.matched_at:
                fields.append(TextField('matched-at', 'Matched at', finding.matched_at))
            if finding.matcher_name:
                fields.append(TextField('matcher-name', 'Matcher name', finding.matcher_name))
            if finding.endpoint:
                fields.append(TextField('endpoint', 'Endpoint', finding.endpoint))

            domain = finding.domain or ''

            log_finding(
                WebsiteFinding(
                    "WebsiteLoginPortal",
                    finding.ip,
                    finding.port,
                    domain,
                    finding.original_path,
                    finding.ssl,
                    finding.name,
                    fields,
                )
            )

            log_finding(
                TagFinding(
                    "Login", ip=finding.ip, port=finding.port, domainName=domain, path=finding.original_path, protocol='tcp'
                )
            )


"""
class NucleiFinding:
    template_id: str = None
    name: str = None
    tags: 'list[str]' = None
    severity: str = None
    type: str = None
    port: int = None
    scheme: str = None
    url: str = None
    matched_at: str = None
    extracted_results: 'list[str]' = None
    ip: str = None
    domain: str = None
    timestamp: str = None
    curl_command: str = None
    description: str = None
    original_string: str = None
    matcher_name: str = None
    matcher_status: bool = None
    original_path: str = None
    endpoint: str = None
    ssl: bool = None
    path: str = None
"""