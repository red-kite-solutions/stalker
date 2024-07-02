FROM python:3.11.0-slim-bullseye

RUN python -m pip install httpx[http2]
RUN python -m pip install "poetry==1.3.2"

COPY stalker_job_sdk /usr/src/stalker_job_sdk

RUN python -m pip install -e /usr/src/stalker_job_sdk \
  && apt-get update \
  && apt-get install -y nmap git make gcc libpcap0.8 \
  && mkdir -p /tools/masscan/ \
  && git clone https://github.com/robertdavidgraham/masscan /tools/masscan/ \
  && cd /tools/masscan/ \
  && make -j \
  && make install \
  && apt-get remove -y git make gcc \
  && apt-get autoremove -y \
  && rm -rf /tools/

WORKDIR /usr/src/stalker-job
