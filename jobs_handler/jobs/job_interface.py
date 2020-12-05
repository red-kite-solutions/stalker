

class JobInterface:
    """Represents a job that needs to be run. Parent class of more specific jobs"""

    _id: str
    _task: str

    def __init__(self, id: str, task: str):
        self._id = id
        self._task = task

    def run(self):
        pass

