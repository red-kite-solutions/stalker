FROM python:3.11.0-slim-bullseye

RUN python -m pip install httpx[http2]
RUN python -m pip install "poetry==1.3.2"


COPY stalker_job_sdk /usr/src/stalker_job_sdk
RUN python -m pip install -e /usr/src/stalker_job_sdk

WORKDIR /usr/src/stalker-job

