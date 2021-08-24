FROM docker.io/node:12-buster
ARG DEBIAN_FRONTEND=noninteractive
RUN apt update -y \
    && apt install -y unoconv \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g npm
