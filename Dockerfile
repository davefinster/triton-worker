FROM mhart/alpine-node:7.1.0

COPY ./setup.js /usr/bin/container-setup/setup
COPY ./package.json /usr/bin/container-setup/package.json
COPY ./bash_shell /usr/bin/bash_shell

RUN apk update \
&& apk add bash git curl make python openssh openssl\
&& npm install -g triton manta \
&& cd ~ \
&& mkdir .ssh \
&& curl -O https://get.docker.com/builds/Linux/x86_64/docker-latest.tgz \
&& tar -zxvf docker-latest.tgz \
&& mv docker/docker /usr/bin/docker \
&& chmod +x /usr/bin/docker \
&& rm -rf docker \
&& mkdir -p ~/.triton/profiles.d \
&& chmod +x /usr/bin/container-setup/setup \
&& cd /usr/bin/container-setup \
&& npm install \
&& chmod +x /usr/bin/bash_shell

ENTRYPOINT [ "/usr/bin/container-setup/setup"]