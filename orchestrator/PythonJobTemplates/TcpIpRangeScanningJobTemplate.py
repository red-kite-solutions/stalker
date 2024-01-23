from ipaddress import ip_address
from json import loads
from os import environ
from subprocess import CompletedProcess, run

from stalker_job_sdk import (IpFinding, PortFinding, TextField, log_error,
                             log_finding, log_info, log_warning)


def main():
    TARGET_IP: str = environ["TARGET_IP"]  # Start of ip range
    TARGET_MASK: int = int(environ["TARGET_MASK"])  # mask (ex: /24)
    RATE: int = int(environ["RATE"])  # number of threads to do the requests
    PORT_MIN: int = int(environ["PORT_MIN"])  # expects a number (0 < p1 < 65535)
    PORT_MAX: int = int(
        environ["PORT_MAX"]
    )  # expects a number (0 < p2 <= 65535 and p2 > p1)

    PORTS = environ[
        "PORTS"
    ]  # expects a json array of numbers, ex: [ 80, 443, 3389 ]. Array can be empty

    ports_list: list = loads(PORTS) if PORTS and PORTS != "" else []
    ports_set: set = set(ports_list)
    output_file = 'out.txt'
    ports_str = ','.join(str(n) for n in ports_set)

    if PORT_MIN and PORT_MAX and PORT_MAX > PORT_MIN:
        ports_str = ports_str + ',' if ports_str else ''
        ports_str += f'{str(PORT_MIN)}-{str(PORT_MAX)}'

    if not ports_str:
        log_error('No ports provided, exiting')
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
    except Exception as err:
        log_error(err)