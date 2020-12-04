from flask import Flask, request, abort, Response
from os import getenv
import json
import uuid
from queue import PriorityQueue
from prioritized_job import PrioritizedJob

API_KEY = getenv('API_KEY')
jobs_queue = PriorityQueue()

app = Flask(__name__)

@app.before_request
def validate_api_key():
    if request.headers['API_KEY'] != API_KEY:
        abort(403, description='Missing API key')

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/job', methods=['POST'])
def add_job_to_queue():
    json_request_data = json.loads(request.data) 

    if (not json_request_data.get('task') or
            json_request_data.get('priority') == None or 
            not json_request_data.get('data')):
        print(json_request_data)
        abort(400, description='The json object did not contain all the required fields.')

    id = uuid.uuid4().__str__()
    prioritized_job = PrioritizedJob(json_request_data['priority'], id, json_request_data['task'], json_request_data['data'] )
    jobs_queue.put(prioritized_job)

    ret = json.dumps(prioritized_job, default=lambda o: o.__dict__, indent=4)
    
    return Response(response=ret,
                    status=200,
                    mimetype="application/json")

@app.route('/jobs')
def get_jobs():
    ret = json.dumps(jobs_queue.queue, default=lambda o: o.__dict__, indent=4)
    return Response(response=ret,
                    status=200,
                    mimetype="application/json")