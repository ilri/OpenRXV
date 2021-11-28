FROM docker.io/node:12-bullseye
RUN npm --version \
    && npm install -g npm@7 \
    && npm install -g @angular/cli \
    && rm -rf ~/.npm
RUN mkdir /frontend
COPY src /frontend/src
COPY angular.json package.json package-lock.json tsconfig.json tslint.json /frontend/
WORKDIR /frontend
RUN npm i
RUN ng b --prod --base-href=/explorer/

FROM docker.io/nginx:stable
COPY --from=0 /frontend/dist /frontend/dist
COPY docker/default.conf /etc/nginx/conf.d/default.conf
