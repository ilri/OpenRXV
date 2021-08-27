FROM docker.io/node:12-bullseye
ARG DEBIAN_FRONTEND=noninteractive
RUN apt update -y \
    && apt install -y --no-install-recommends unoconv libreoffice-writer \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g npm
