from stalker_job_sdk import JobStatus, log_error, log_info, log_status


def main():
    log_info('Hello, World!')

try:
    main()
    log_status(JobStatus.SUCCESS)
except Exception as err:
    log_error("An unexpected error occured")
    log_error(err)
    log_status(JobStatus.FAILED)
    exit()