from flask import Flask, request, abort
from os import getenv
import json

API_KEY = getenv('API_KEY')

app = Flask(__name__)

@app.before_request
def validate_api_key():
    if request.headers['API_KEY'] != API_KEY:
        abort(403, description="Missing API key")

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/jobs', methods=['POST'])
def add_job_to_queue():
    json_request_data = json.loads(request.data) 

    if (not json_request_data.get("id") or not json_request_data.get("task") or
            json_request_data.get("priority") == None or 
            not json_request_data.get("data")):
        print(json_request_data)
        abort(400, description="The json object did not contain all the required fields.")
    
        
    return 'Hello, World!'

