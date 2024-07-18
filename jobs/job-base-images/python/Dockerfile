FROM python:3.12.4-slim-bullseye AS base

RUN python -m pip install httpx[http2]
RUN python -m pip install "poetry==1.3.2"

COPY stalker_job_sdk /usr/src/stalker_job_sdk

RUN python -m pip install -e /usr/src/stalker_job_sdk
RUN apt-get update && apt-get install -y nmap libpcap0.8 wget gnupg libc6 

FROM base AS build
RUN apt-get install -y git make gcc zip curl

# Masscan
RUN mkdir -p /tools/masscan/
RUN git clone https://github.com/robertdavidgraham/masscan /tools/masscan/
WORKDIR /tools/masscan
RUN make -j && make install

# Katana
FROM golang:1.22.4-bullseye AS katana

RUN apt-get update && apt-get install -y git gcc musl-dev
RUN mkdir -p /tools/katana/
RUN git clone https://github.com/projectdiscovery/katana.git /tools/katana
WORKDIR /tools/katana
RUN go mod download
RUN go build ./cmd/katana

# httpx
FROM golang:1.22.4-bullseye AS httpx

RUN mkdir -p /tools/httpx/
RUN git clone https://github.com/projectdiscovery/httpx.git /tools/httpx
WORKDIR /tools/httpx/cmd/httpx
RUN go build

FROM base AS final

RUN mkdir -p /tools/ "$HOME/.cache/rod/browser/"

COPY --from=build /usr/bin/masscan /tools/masscan
COPY --from=katana /tools/katana/katana /tools/katana
COPY --from=httpx /tools/httpx/cmd/httpx/httpx /tools/httpx

ENV PATH "/tools:$PATH"

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -  \
  && sh -c 'echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt update && apt install -y google-chrome-stable

WORKDIR /usr/src/stalker-job
