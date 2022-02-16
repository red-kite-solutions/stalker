FROM alpine:latest

RUN apk add bash

# Install python/pip/flask
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools
RUN pip3 install flask

RUN mkdir /jqh; mkdir /secrets
WORKDIR /jqh/

ADD jobs_queue_handler/*.py /jqh/
ADD ./secrets/jqh_api_key.secret /secrets/
ADD jobs_queue_handler/entrypoint.sh /jqh/

RUN chmod +x /jqh/entrypoint.sh
EXPOSE 5000
CMD [ "/jqh/entrypoint.sh" ]