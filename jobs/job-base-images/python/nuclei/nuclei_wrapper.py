
import os
from json import loads
from subprocess import CompletedProcess, run
from types import ModuleType

from nuclei_finding import NucleiFinding
from nuclei_job_input import JobInput
from stalker_job_sdk import (DomainFinding, Field, IpFinding, JobStatus,
                             PortFinding, TextField, WebsiteFinding, build_url,
                             is_valid_ip, is_valid_port, log_debug, log_error,
                             log_finding, log_info, log_status, log_warning,
                             to_boolean)


def handle_port_finding(finding: NucleiFinding, all_fields: 'list[Field]', output_finding_name: str):
    log_finding(
        PortFinding(
            output_finding_name,
            finding.ip,
            finding.port,
            "tcp",
            finding.name,
            all_fields,
        )
    )

def handle_host_finding(finding: NucleiFinding, all_fields: 'list[Field]', output_finding_name: str):
    log_finding(
        IpFinding(
            output_finding_name,
            finding.ip,
            finding.name,
            all_fields,
        )
    )

def handle_domain_finding(finding: NucleiFinding, all_fields: 'list[Field]', output_finding_name: str):
    log_finding(
        DomainFinding(
            output_finding_name,
            finding.domain,
            None,
            finding.name,
            all_fields,
        )
    )

def handle_website_finding(finding: NucleiFinding, all_fields: 'list[Field]', output_finding_name: str):
    log_finding(
        WebsiteFinding(
            output_finding_name,
            finding.ip,
            finding.port,
            finding.domain,
            finding.original_path,
            finding.ssl,
            finding.name,
            all_fields,
        )
    )

def handle_finding_switch(finding: NucleiFinding, all_fields: 'list[Field]', stalker_output_type: str, output_finding_name: str):
    match stalker_output_type:
        case 'port':
            handle_port_finding(finding, all_fields, output_finding_name)
        case 'host':
            handle_host_finding(finding, all_fields, output_finding_name)
        case 'domain':
            handle_domain_finding(finding, all_fields, output_finding_name)
        case 'website':
            handle_website_finding(finding, all_fields, output_finding_name)
        case _:
            log_error('Unidentified core ressource type')

def handle_finding(finding: NucleiFinding, stalker_output_type: str, output_finding_name: str):
    if stalker_output_type == 'website' and (not finding.ip or not finding.port):
        log_warning('Not enough information to generate a SDK WebsiteFinding, ip or port is missing:')
        log_warning(finding.original_string)
        return
    
    if stalker_output_type == 'port' and (not finding.ip or not finding.port):
        log_warning('Not enough information to generate a SDK PortFinding, ip or port is missing:')
        log_warning(finding.original_string)
        return
    
    if stalker_output_type == 'host' and not finding.ip:
        log_warning('Not enough information to generate a SDK IpFinding, ip is missing:')
        log_warning(finding.original_string)
        return

    if stalker_output_type == 'domain' and not finding.domain:
        log_warning('Not enough information to generate a SDK DomainFinding, host field is missing so no domain was found:')
        log_warning(finding.original_string)
        return

    fields: 'list[Field]' = []
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

    if finding.extracted_results and len(finding.extracted_results) >= 1:
        for result in finding.extracted_results:
            all_fields = [ TextField('extracted-result', 'Extracted result', result) ]
            all_fields.extend(fields)
            handle_finding_switch(finding, all_fields, stalker_output_type, output_finding_name)
    else:
        handle_finding_switch(finding, fields, stalker_output_type, output_finding_name)

def get_valid_args():
    """Gets the arguments from environment variables"""
    target_ip: str = os.environ.get("targetIp")
    port: int = int(os.environ.get("port"))
    domain: str = os.environ.get("domainName")
    path: str = os.environ.get("path")
    ssl: str = to_boolean(os.environ.get("ssl"))
    endpoint: str = os.environ.get("endpoint")

    input = JobInput()
    input.target_ip = target_ip
    input.port = port
    input.domain = domain
    input.path = path
    input.ssl = ssl
    input.endpoint = endpoint
    

    if not is_valid_ip(target_ip):
        log_error(f"targetIp parameter is invalid: {target_ip}")
        log_status(JobStatus.FAILED)
        exit()

    if not is_valid_port(port):
        log_error(f"port parameter is invalid: {str(port)}")
        log_status(JobStatus.FAILED)
        exit()

    return input


def main():
    # Provided through the UI
    template_content = os.environ.get('STALKER_NUCLEI_YAML_TEMPLATE')
    custom_parser_code = os.environ.get("NUCLEI_FINDING_HANDLER")

    stalker_output_type_str = 'stalkerOutputType'
    output_finding_name_str = 'outputFindingName'

    input = get_valid_args()

    target = ''

    if (input.domain or input.target_ip) and input.port and input.path:
        target = build_url(input.target_ip, input.port, input.domain, input.endpoint if input.endpoint else input.path, input.ssl if input.ssl else False)
    else:
        target = input.domain if input.domain else input.target_ip
        if input.port:
            target += f":{str(input.port)}"

    log_debug(f"targetIp: {input.target_ip}, port: {str(input.port)}, domainName: {str(input.domain)}, path: {input.path}, ssl: {str(input.ssl)}, endpoint: {input.endpoint}")
    log_info(f"Target: {target}")
    
    # Mandatory job parameters if no NUCLEI_FINDING_HANDLER provided
    expected_output_type = os.environ.get(stalker_output_type_str)
    output_finding_name = os.environ.get(output_finding_name_str)

    template_folder = "/nuclei/template/" 
    template_file = template_folder + 'template.yaml'
    output_file = '/nuclei/output/output.jsonl'

    custom_parser = None
    if custom_parser_code:
        try:
            log_info('Custom parser detected, attempting to load.')
            FindingHandlerModule = ModuleType('FindingHandlerModule')
            exec(custom_parser_code, FindingHandlerModule.__dict__)
            custom_parser = FindingHandlerModule.FindingHandler()
            log_info('Custom parser loaded.')
        except Exception:
            log_warning("The custom parser did not load properly, continuing with default parser")
            custom_parser_code = None
            custom_parser = None

    if not target:
        log_error(f'Unable to build target from: {{ targetIp: {input.target_ip}, domainName: {input.domain}, port: {str(input.port)}, ssl: {input.ssl}, path: {input.path} }}')
        log_status(JobStatus.FAILED)
        exit()

    if not custom_parser_code and not output_finding_name:
        log_error(f'{output_finding_name_str} is required when no custom finding handler is provided')
        log_status(JobStatus.FAILED)
        exit()
    
    if not custom_parser_code and not expected_output_type:
        log_error(f'{stalker_output_type_str} is required when no custom finding handler is provided')
        log_status(JobStatus.FAILED)
        exit()

    if not custom_parser_code and expected_output_type != 'domain' and expected_output_type != 'host' and expected_output_type != 'port' and expected_output_type != 'website':
        log_error(f'{stalker_output_type_str} has to be either domain, host, port or website')
        log_status(JobStatus.FAILED)
        exit()

    with open(template_file, 'w') as f:
        f.writelines(template_content)

    log_info("Starting Nuclei process. It may take several minutes.")

    #   -jle, -jsonl-export string    file to export results in JSONL(ine) format
    #   -duc, -disable-update-check   disable automatic nuclei/templates update check
    #   -ot, -omit-template           omit encoded template in the JSON, JSONL output
    #   -or, -omit-raw                omit request/response pairs in the JSON, JSONL, and Markdown outputs (for findings only)
    #   -silent                       display findings only
    #   -nc, -no-color                disable output content coloring (ANSI escape codes)
    nuclei_process: CompletedProcess = run(
        [
            'nuclei',
            '-target', target, 
            '-jle', output_file, 
            '-t', template_file, 
            '-duc',
            '-ot',
            '-or',
            '-silent',
            '-no-color'
        ],
        text=True, capture_output=True
    )


    if nuclei_process.stderr and len(str(nuclei_process.stderr)) > 0:
        log_error(str(nuclei_process.stderr))
        log_error("Error while running Nuclei, the template may be invalid.")

    if nuclei_process.stdout and len(str(nuclei_process.stdout)) <= 0:
        log_info("No results found. Better luck next time!")

    nuclei_findings: list['NucleiFinding'] = []
    custom_parser_findings: list = []

    if not os.path.isfile(output_file):
        log_warning('The output file did not exist.')
        log_status(JobStatus.SUCCESS)
        exit()

    try:
        with open(output_file, 'r') as f:
            for line in f:
                try:
                    if custom_parser:
                        custom_parser_findings.append(custom_parser.parse_finding(loads(line), original_string=line, input=input))
                    else:
                        nuclei_findings.append(NucleiFinding(loads(line), original_string=line, input=input))
                except Exception as err:
                    if custom_parser:
                        log_warning("Error while parsing json output with custom parser, skipping line:")
                    else:
                        log_warning("Error while parsing json output, skipping line:")
                    log_warning(line)
                    log_warning(err)
    except Exception as err:
        log_error("Error while reading the Nuclei output file")
        log_error(err)
        log_status(JobStatus.FAILED)
        exit()

    if custom_parser:
        try:
            custom_parser.publish_findings(custom_parser_findings)
        except Exception:
            log_error("Error in the publish_findings method of the custom FindingHandler class")
    else:
        for finding in nuclei_findings:
            handle_finding(finding, expected_output_type, output_finding_name)

    log_info('End of Nuclei wrapper.')
    

if __name__ == "__main__":
    try:
        main()
        log_status(JobStatus.SUCCESS)
    except Exception as err:
        log_error(err)
        log_status(JobStatus.FAILED)