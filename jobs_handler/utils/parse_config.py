import os

config: dict = {}

def parse_config(config_file_path: str):
    lines = []
    with open(config_file_path) as config_file:
        lines = config_file.readlines()
    
    for line in lines:
        if not line:
            continue

        split_config_line = line.split('=')
        key = split_config_line[0].strip()
        value = split_config_line[1].strip()
        config[key] = value
