import json
import os
import socket

hostname = os.environ['HOSTNAME']
data = socket.gethostbyname_ex(hostname)
ipx = data[2]
print('@event {{ "findings": [ {{ "type": "HostnameIpFinding", "domainName": {0}, "ips": {1} }} ] }}'.format(json.dumps(hostname), json.dumps(ipx)))
