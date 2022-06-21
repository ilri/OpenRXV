FROM docker.io/node:14-bullseye
ARG DEBIAN_FRONTEND=noninteractive
RUN apt update -y \
    && apt install -y --no-install-recommends unoconv libreoffice-writer \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g npm@7 \
    && rm -rf ~/.npm
RUN mkdir /backend
COPY src /backend/src
COPY example.env nest-cli.json package.json package-lock.json tsconfig.build.json tsconfig.json docker/wait-for-elasticsearch.sh /backend/
WORKDIR /backend
RUN npm i

RUN cp example.env .env \
    && npm run copy:assets \
    && npm run build

CMD ["./wait-for-elasticsearch.sh", "http://elasticsearch_7:9200", "--", "node", "dist/main"]
