from ipaddress import ip_address
from json import loads
from os import environ
from subprocess import CompletedProcess, run

from stalker_job_sdk import (IpFinding, JobStatus, PortFinding, TextField,
                             is_valid_ip, is_valid_port, log_error,
                             log_finding, log_info, log_status, log_warning)


def validate_ip(ip: str, name: str):
    if not is_valid_ip(ip):
        log_error(f"{name} parameter is invalid: {ip}")
        log_status(JobStatus.FAILED)
        exit()
        
def validate_port(port: int, name: str):
    if not is_valid_port(port):
        log_error(f"Invalid port {str(port)} in {name}")
        log_status(JobStatus.FAILED)
        exit()
        
def main():
    TARGET_IP: str = environ.get("targetIp")  # Start of ip range
    TARGET_MASK: int = int(environ.get("targetMask"))  # mask (ex: /24)
    RATE: int = int(environ.get("rate"))  # number of threads to do the requests
    PORT_MIN: int = int(environ.get("portMin"))  # expects a number (0 < p1 < 65535)
    PORT_MAX: int = int(
        environ.get("portMax")
    )  # expects a number (0 < p2 <= 65535 and p2 > p1)

    PORTS = environ[
        "ports"
    ]  # expects a json array of numbers, ex: [ 80, 443, 3389 ]. Array can be empty

    validate_ip(TARGET_IP, 'targetIp')
    if not isinstance(TARGET_MASK, int) or TARGET_MASK < 0 or TARGET_MASK > 32:
        log_error(f"Invalid mask parameter: {str(TARGET_MASK)}")
        log_status(JobStatus.FAILED)
        exit()
    
    if not isinstance(RATE, int) or RATE < 0:
        log_error(f"Invalid rate parameter: {str(RATE)}")
    
    if RATE >= 1000000:
        log_warning(f"rate value is high (>= 1 000 000) and may have an effect on performances.")

    ports_list:list = []
    ports_set: set = set()

    try:
        ports_list = loads(PORTS) if PORTS and PORTS != "" else []
        for p in ports_list:
            validate_port(p, 'ports')
        ports_set: set = set(ports_list)
    except Exception:
        log_error(f"ports parameter is invalid: {PORTS}")
        log_status(JobStatus.FAILED)
        exit()

    validate_port(PORT_MIN, 'portMin')
    validate_port(PORT_MAX, 'portMax')


    output_file = 'out.txt'
    ports_str = ','.join(str(n) for n in ports_set)

    if PORT_MIN and PORT_MAX and PORT_MAX > PORT_MIN:
        ports_str = ports_str + ',' if ports_str else ''
        ports_str += f'{str(PORT_MIN)}-{str(PORT_MAX)}'

    if not ports_str:
        log_error('No ports provided, exiting')
        log_status(JobStatus.FAILED)
        exit()

    log_info(f'Start of the IP range scanning {TARGET_IP}/{str(TARGET_MASK)} (rate: {RATE}, ports: {ports_str}). It may take a while.')

    masscan_process: CompletedProcess = run(
            [
                'masscan',
                '--rate', str(RATE), 
                '-oL', output_file,
                '--open-only',
                '-p', ports_str,
                f'{TARGET_IP}/{str(TARGET_MASK)}'
            ],
            text=True
        )

    hosts = set()
    with open(output_file, 'r') as f:
        for line in f:
            try:
                if not line or line[0] == "#":
                    continue
                finding = line.split(' ')
                port = int(finding[2])
                
                ip_str = finding[3]
                ip_int = int(ip_address(ip_str))

                if ip_int not in hosts:
                    hosts.add(ip_int)
                    print(ip_str)
                    # log host
                    log_finding(
                        IpFinding(
                            "IpFinding",
                            ip_str,
                            "Ip range scanning finding",
                            [],
                            "IpFinding",
                        )
                    )

                # log port
                log_finding(
                    PortFinding(
                        "PortFinding",
                        ip_str,
                        port,
                        "tcp",
                        "Ip range scanning finding",
                        [TextField("protocol", "TCP port", "tcp")],
                        "PortFinding",
                    )
                )

            except Exception:
                log_warning(f'Error while parsing line: {line}. Continuing')

    log_info(f'End of the IP range scanning {TARGET_IP}/{str(TARGET_MASK)}')
            

if __name__ == "__main__":
    try:
        main()
        log_status(JobStatus.SUCCESS)
    except Exception as err:
        log_error(err)
        log_status(JobStatus.FAILED)