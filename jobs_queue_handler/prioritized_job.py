from job import Job
from dataclasses import dataclass, field

@dataclass(order=True)
class PrioritizedJob():
    priority: int
    job: Job=field(compare=False)

    def __init__(self, priority, id, task, data):
        self.priority = priority
        self.job = Job(id, task, data)
