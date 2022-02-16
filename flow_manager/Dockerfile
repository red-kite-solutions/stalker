FROM node:16.5.0-alpine

RUN apk update
RUN apk add bash
# RUN apk add keybase-client
RUN apk add keybase-client --repository=http://dl-cdn.alpinelinux.org/alpine/edge/testing/

RUN mkdir /fm; mkdir /secrets; mkdir /fm/src

ADD ./src /fm/src/
ADD nest-cli.json /fm/
ADD package-lock.json /fm/
ADD package.json /fm/
ADD tsconfig.build.json /fm/
ADD tsconfig.json /fm/

# Add secrets that will be in environment variables
ADD jqh_api_key.secret /secrets/
ADD fm_api_key.secret /secrets/
ADD kb_username.secret /secrets/
ADD kb_channelid.secret /secrets/
ADD kb_paperkey.secret /secrets/

ADD entrypoint.sh /fm/
RUN chmod +x /fm/entrypoint.sh

WORKDIR /fm/
RUN npm install
RUN npm install keybase-bot

EXPOSE 3000
CMD [ "/fm/entrypoint.sh" ]