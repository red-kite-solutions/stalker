

class JobInterface:
    """Represents a job that needs to be run. Parent class of more specific jobs"""

    _id: str
    _task: str
    _company_id: str

    def __init__(self, id: str, task: str, company_id: str):
        self._id = id
        self._task = task
        self._company_id = company_id

    def run(self):
        pass
    
    def report(self):
        pass
