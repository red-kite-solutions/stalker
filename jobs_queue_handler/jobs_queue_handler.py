from flask import Flask
from flask import request
from flask import abort
from os import getenv

API_KEY = getenv('API_KEY')

app = Flask(__name__)

@app.before_request
def validate_api_key():
    if request.headers['API_KEY'] != API_KEY:
        abort(403, description="Missing API key")

@app.route('/')
def hello_world():
    return 'Hello, World!'

# @app.route('/jobs', methods=['POST'])
# def hello_world():
#     return 'Hello, World!'

