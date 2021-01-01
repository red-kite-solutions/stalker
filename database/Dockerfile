FROM ubuntu:20.04
EXPOSE 27017
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y mongodb

RUN mkdir -p /data/db && \
    touch /var/log/mongodb/mongod.log

CMD mongod --bind_ip_all && tail -f /var/log/mongodb/mongod.log