import os
import xml.etree.ElementTree as ET
from json import loads
from subprocess import CompletedProcess, run

from stalker_job_sdk import (DomainFinding, IpFinding, JobStatus, PortFinding,
                             TextField, is_valid_ip, is_valid_port, log_error,
                             log_finding, log_info, log_status)


class PortInfo:
    ip: str = ''
    port: int = 0
    protocol: str = ''
    service_name: str = ''
    service_version: str = ''
    service_product: str = ''
    service_extra_info: str = ''

def get_valid_args():
    """Gets the arguments from environment variables"""
    target_ip: str = os.environ.get("targetIp")
    ports_str: str = os.environ.get("ports")
    nmap_options: str = os.environ.get("nmapOptions")

    ports_list:list = []
    ports_set: set = set()

    try:
        ports_list = loads(ports_str) if ports_str and ports_str != "" else []
        ports_set: set = set()
        for p in ports_list:
            if is_valid_port(p):
                ports_set.add(p)
    except Exception:
        log_error(f"ports parameter is invalid: {ports_str}")
        log_status(JobStatus.FAILED)
        exit()

    if not is_valid_ip(target_ip):
        log_error(f"targetIp parameter is invalid: {target_ip}")
        log_status(JobStatus.FAILED)
        exit()

    return target_ip, list(ports_set), nmap_options


def emit_port_finding(port_info: PortInfo):
    labels = []

    if port_info.service_name != '':
        labels.append(TextField("serviceName", "Service name", port_info.service_name))

    if port_info.service_product != '':
        labels.append(TextField("serviceProduct", "Product", port_info.service_product))

    if port_info.service_version != '':
        labels.append(TextField("serviceVersion", "Version", port_info.service_version))

    if port_info.service_extra_info != '':
        labels.append(TextField("serviceExtraInfo", "Extra info", port_info.service_extra_info))

    log_finding(
        PortFinding(
            "PortServiceFinding", port_info.ip, port_info.port, port_info.protocol, f"Found service {port_info.service_name}", labels
        )
    )

def emit_domain_finding(hostname: str, ip: str):
    log_finding(
        DomainFinding(
            "HostnameIpFinding", hostname, ip, "New domain for IP", [], "HostnameIpFinding"
        )
    )

def emit_os_finding(ip: str, operating_system: str):
    log_finding(
        IpFinding(
            "OperatingSystemFinding", ip, "Operating system", [TextField("os", "os", operating_system)],
        )
    )

def main():
    target_ip, ports, nmap_options = get_valid_args()
    output_file = "output.xml"

    nmap_str: str = f"nmap -p {','.join(str(p) for p in ports)} {nmap_options} {target_ip}"
    print(nmap_str)
    log_info(f'Start of  banner grabbing: {nmap_str}')

    nmap_process: CompletedProcess = run(nmap_str.split(" "), text=True)

    tree = ET.parse(output_file)
    root = tree.getroot()

    # Listing oportunistic hostnames
    for item in root.findall('./host/hostnames/'):
        emit_domain_finding(item.attrib.get("name"), target_ip)

    operating_system = ''

    # Listing services
    for item in root.findall('./host/ports/'):
        pinfo = PortInfo()
        pinfo.port = item.attrib.get("portid")
        pinfo.protocol = item.attrib.get("protocol")
        pinfo.ip = target_ip
        for i in item.findall('./service'):
            name = i.attrib.get("name") if i.attrib.get("name") is not None else ''
            product = i.attrib.get("product") if i.attrib.get("product") is not None else ''
            version = i.attrib.get("version") if i.attrib.get("version") is not None else ''
            extrainfo = i.attrib.get("extrainfo") if i.attrib.get("extrainfo") is not None else ''
            ostype = i.attrib.get("ostype") if i.attrib.get("ostype") is not None else ''
            tunnel = i.attrib.get("tunnel") if i.attrib.get("tunnel") is not None else ''

            if (name == 'ssl' or name == 'http') and tunnel == 'ssl':
                name = 'https'

            if ostype != '':
                operating_system += ostype

            pinfo.service_name = name.strip()
            pinfo.service_product = product.strip()
            pinfo.service_version = version.strip()
            pinfo.service_extra_info = f"{extrainfo} {ostype}".strip()
            if ostype != '':
                operating_system = ostype

        emit_port_finding(pinfo)
    
    if operating_system != '':
        emit_os_finding(target_ip, operating_system)

try:
    main()
    log_status(JobStatus.SUCCESS)
except Exception as err:
    log_error("An unexpected error occured")
    log_error(err)
    log_status(JobStatus.FAILED)
    exit()