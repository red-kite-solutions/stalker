from json import loads
from os import environ
from subprocess import CompletedProcess, run
from types import ModuleType

from nuclei_finding import NucleiFinding
from stalker_job_sdk import (DomainFinding, Field, IpFinding, PortFinding,
                             TextField, log_error, log_finding, log_info,
                             log_warning)


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

def handle_finding_switch(finding: NucleiFinding, all_fields: 'list[Field]', stalker_output_type: str, output_finding_name: str):
    match stalker_output_type:
        case 'port':
            handle_port_finding(finding, all_fields, output_finding_name)
        case 'host':
            handle_host_finding(finding, all_fields, output_finding_name)
        case 'domain':
            handle_domain_finding(finding, all_fields, output_finding_name)
        case _:
            log_error('Unidentified core ressource type')

def handle_finding(finding: NucleiFinding, stalker_output_type: str, output_finding_name: str):
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
        fields.append(TextField('template-id', '', finding.template_id))
    if finding.url:
        fields.append(TextField('url', '', finding.url))
    if finding.type:
        fields.append(TextField('type', '', finding.type))
    if finding.scheme:
        fields.append(TextField('scheme', '', finding.scheme))
    if finding.description:
        fields.append(TextField('description', '', finding.description))
    if finding.matched_at:
        fields.append(TextField('matched-at', '', finding.matched_at))
    if finding.matcher_name:
        fields.append(TextField('matcher-name', '', finding.matcher_name))

    if len(finding.extracted_results) >= 1:
        for result in finding.extracted_results:
            all_fields = [ TextField('extracted-result', '', result) ]
            all_fields.extend(fields)
            handle_finding_switch(finding, all_fields, stalker_output_type, output_finding_name)
    else:
        handle_finding_switch(finding, fields, stalker_output_type, output_finding_name)


def main():
    # Provided through the UI
    template_content = environ.get('STALKER_NUCLEI_YAML_TEMPLATE')
    custom_parser_code = environ.get("NUCLEI_FINDING_HANDLER")
    # Job parameters
    ## Mandatory parameter
    target = environ.get('NUCLEI_TARGET')
    ## Mandatory job parameters if no NUCLEI_FINDING_HANDLER provided
    expected_output_type = environ.get('STALKER_OUTPUT_TYPE')
    output_finding_name = environ.get('OUTPUT_FINDING_NAME')
    

    if not custom_parser_code and not output_finding_name:
        log_error('OUTPUT_FINDING_NAME is mandatory when no custom finding handler is provided')
        exit()
    
    if not custom_parser_code and not expected_output_type:
        log_error('STALKER_OUTPUT_TYPE is mandatory when no custom finding handler is provided')
        exit()

    if expected_output_type != 'domain' and expected_output_type != 'host' and expected_output_type != 'port':
        log_error('STALKER_OUTPUT_TYPE has to be either domain, host or port')
        exit()


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

    with open(template_file, 'w') as f:
        f.writelines(template_content)

    log_info("Starting Nuclei process. It may take several minutes.")

    #   -jle, -jsonl-export string    file to export results in JSONL(ine) format
    #   -duc, -disable-update-check   disable automatic nuclei/templates update check
    #   -ot, -omit-template           omit encoded template in the JSON, JSONL output
    #   -or, -omit-raw                omit request/response pairs in the JSON, JSONL, and Markdown outputs (for findings only)
    #   -silent                       display findings only
    nuclei_process: CompletedProcess = run(
        [
            'nuclei', 
            '-target', target, 
            '-jle', output_file, 
            '-t', template_file, 
            '-duc',
            '-ot',
            '-or',
            '-silent'
        ], 
        text=True, capture_output=True
    )

    if len(nuclei_process.stderr) > 0:
        log_error(nuclei_process.stderr)
        log_error("Error while running Nuclei, the template may be invalid.")

    nuclei_findings: list['NucleiFinding'] = []
    custom_parser_findings: list = []

    try:    
        with open(output_file, 'r') as f:
            for line in f:
                try:
                    if custom_parser:
                        custom_parser_findings.append(custom_parser.parse_finding(loads(line)))
                    else:
                        nuclei_findings.append(NucleiFinding(loads(line), original_string=line))
                except Exception:
                    if custom_parser:
                        log_warning("Error while parsing json output with custom parser, skipping line:")
                    else:
                        log_warning("Error while parsing json output, skipping line:")
                    log_warning(line)
    except Exception:
        log_error("Error while reading the Nuclei output file")
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
    main()