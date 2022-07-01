# STALKER | Recon Automation

Stalker contains three modules:

**Flow Manager**: A NestJS TypeScript API that creates jobs, accepts job results and creates new jobs based on output and adds them to the Jobs Queue Handler

**Jobs Queue Handler**: A python flask API that is a priority queue in which you can add and remove jobs. Jobs are ordered with an explicit priority and on a FIFO basis

**Worker (Jobs Handler)**: A python script that fetches jobs from the Jobs Queue Handler and executes them and gives the output to the Flow Manager. Many Jobs Handler can exist at the time
