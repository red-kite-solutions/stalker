FROM alpine:latest

RUN apk add bash

# Install python/pip/flask
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip requests watchdog

RUN mkdir /jh/; mkdir /secrets
WORKDIR /jh/

# ADD jobs_handler/*.py /jh/
# ADD jobs_handler/utils /jh/utils
# ADD jobs_handler/jobs /jh/jobs
# ADD jobs_handler/jobs_handler.config /jh/
ADD ./secrets/jqh_api_key.secret /secrets/
ADD ./secrets/fm_api_key.secret /secrets/
ADD jobs_handler/entrypoint.sh /jh/

# RUN chmod -R 777 .
RUN chmod +x /jh/entrypoint.sh
CMD [ "./entrypoint.sh" ]