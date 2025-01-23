import sys
from stalker_job_sdk import JobStatus, log_status, log_error, log_debug, log_done

log_debug('Job execution started.')

try:
  command = sys.argv[1]
  exec(command)

except Exception as exception:
  log_error(exception)
  log_status(JobStatus.FAILED)

log_done()
log_debug('Job execution ended.')