import json
import os
import socket

hostname = os.environ['HOSTNAME']
data = socket.gethostbyname_ex(hostname)
ipx = data[2]

for ip in ipx:
  print('@finding {{ "findings": [ {{ "type": "HostnameIpFinding", "domainName": {0}, "ip": {1} }} ] }}'.format(json.dumps(hostname), json.dumps(ip)))
