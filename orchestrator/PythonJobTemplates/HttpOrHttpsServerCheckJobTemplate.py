import json
import os
import random
import requests


TARGET_IP: str = os.environ['TARGET_IP'] # IP to scan
PORTS = os.environ['PORTS'] # expects a json array of numbers, ex: [ 80, 443, 3389 ].

ports_list: list = json.loads(PORTS) if PORTS and PORTS != '' else []
ports_set: set =  set(ports_list)

ports_list = list(ports_set)
random.shuffle(ports_list) # randomizing port scan order


sublists = []
total_ports = len(ports_list)

for port in ports_set:
  # Try HTTPS
  try:
    requests.get(f'https://{TARGET_IP}:{port}', timeout=5)
    finding = {
      "findings": [
        {
          "type": "CustomFinding",
          "ip": TARGET_IP,
          "port": port,
          "name": "This port runs an HTTPS server",
          "fields": []
        }
      ]
    }
    print(f'@finding {json.dumps(finding)}')
    exit()

  except Exception as e:
    print(e)

  # Try HTTP
  try:
    requests.get(f'http://{TARGET_IP}:{port}', timeout=5)
    finding = {
      "findings": [
        {
          "type": "CustomFinding",
          "ip": TARGET_IP,
          "port": port,
          "name": "This port runs an HTTP server",
          "fields": []
        }
      ]
    }
    print(f'@finding {json.dumps(finding)}')

  except Exception as e:
    print(e)