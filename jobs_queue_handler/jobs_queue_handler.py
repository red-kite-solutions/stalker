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
    if request.headers.get('API_KEY') != API_KEY:
        abort(403, description='Missing API key')

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/job', methods=['POST'])
def add_job_to_queue():
    json_request_data = json.loads(request.data) 

    if (not json_request_data.get('task') or
        not json_request_data.get('id') or
        json_request_data.get('priority') == None):
        print(json_request_data)
        abort(400, description='The json object did not contain all the required fields.')

    id = json_request_data.pop('id')
    priority = json_request_data.pop('priority')
    task = json_request_data.pop('task')
    data = json_request_data

    prioritized_job = PrioritizedJob(priority, id, task, data)
    jobs_queue.put(prioritized_job)

    ret = json.dumps(prioritized_job, default=lambda o: o.__dict__, indent=4)
    
    return Response(response=ret,
                    status=200,
                    mimetype="application/json")


@app.route('/job', methods=['GET'])
def get_job_from_queue():
    if jobs_queue.empty():
        return Response(response='{"error": "The queue is empty"}',
                    status=404,
                    mimetype="application/json")

    ret = json.dumps(jobs_queue.get(), default=lambda o: o.__dict__, indent=4)
    return Response(response=ret,
                    status=200,
                    mimetype="application/json")


@app.route('/jobs', methods=['GET'])
def get_jobs():
    ret = json.dumps(jobs_queue.queue, default=lambda o: o.__dict__, indent=4)
    return Response(response=ret,
                    status=200,
                    mimetype="application/json")

@app.route('/jobs', methods=['DELETE'])
def purge_job_queue():
    jobs_queue = PriorityQueue()