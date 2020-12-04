import json
from json import JSONEncoder

class Job(JSONEncoder):
    """Represents a job item to be added to the queue"""

    _id = ""
    _task = ""
    _data = {}

    def __init__(self, id, task, data):
        self._id = id
        self._task = task
        self._data = data

    def default(self, o):
        print("Called job JSON default")
        return self.__dict__