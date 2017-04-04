FROM node:7.7-alpine
MAINTAINER raul.requero@vizzuality.com

ENV NAME dataset
ENV USER microservice

RUN apk update && apk upgrade && \
    apk add --no-cache --update bash git openssh python alpine-sdk

RUN addgroup $USER && adduser -s /bin/bash -D -G $USER $USER

RUN npm install -g grunt-cli bunyan

RUN mkdir -p /opt/$NAME
COPY ./app /opt/$NAME/app

RUN cd /opt/$NAME/app/src/data && mkdir -p /usr/share/unicode && cp UnicodeData.txt /usr/share/unicode/UnicodeData.txt

COPY package.json /opt/$NAME/package.json
RUN cd /opt/$NAME && npm install

COPY entrypoint.sh /opt/$NAME/entrypoint.sh
COPY config /opt/$NAME/config

WORKDIR /opt/$NAME

RUN chown $USER:$USER /opt/$NAME

# Tell Docker we are going to use this ports
EXPOSE 3000
USER $USER

ENTRYPOINT ["./entrypoint.sh"]
