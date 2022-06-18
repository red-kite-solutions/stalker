FROM alpine:latest

ENV FLASK_APP=jobs_queue_handler
RUN apk add bash

# Install python/pip/flask
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN apk --no-cache add curl
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools
RUN pip3 install flask

RUN mkdir /jqh
WORKDIR /jqh

COPY .  .

EXPOSE 5000
CMD [ "flask", "run", "--host=0.0.0.0" ]