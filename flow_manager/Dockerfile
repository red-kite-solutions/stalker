FROM node:16.5.0-alpine

RUN apk update
RUN apk add bash
# RUN apk add keybase-client
RUN apk add keybase-client --repository=http://dl-cdn.alpinelinux.org/alpine/edge/testing/

RUN mkdir /fm; mkdir /secrets; mkdir /fm/src

# ADD flow_manager/src /fm/src/
ADD flow_manager/nest-cli.json /fm/
ADD flow_manager/package-lock.json /fm/
ADD flow_manager/package.json /fm/
ADD flow_manager/tsconfig.build.json /fm/
ADD flow_manager/tsconfig.json /fm/

# Add secrets that will be in environment variables
ADD ./secrets/jqh_api_key.secret /secrets/
ADD ./secrets/fm_api_key.secret /secrets/
ADD ./secrets/kb_username.secret /secrets/
ADD ./secrets/kb_channelid.secret /secrets/
ADD ./secrets/kb_paperkey.secret /secrets/

ADD flow_manager/entrypoint.sh /fm/
RUN chmod +x /fm/entrypoint.sh

WORKDIR /fm/
RUN npm install
RUN npm install keybase-bot

EXPOSE 3000
CMD [ "/fm/entrypoint.sh" ]