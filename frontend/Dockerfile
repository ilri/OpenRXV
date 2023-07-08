FROM docker.io/node:16-bullseye
RUN npm --version \
    && npm install -g npm@8 \
    && npm install -g @angular/cli@13 \
    && rm -rf ~/.npm
RUN mkdir /frontend
COPY src /frontend/src
COPY angular.json package.json package-lock.json tsconfig.json /frontend/
WORKDIR /frontend
# we need to force because @agm/core wants Angular 9/10
RUN npm ci --force
RUN ng b --base-href=/explorer/

FROM docker.io/nginx:stable
COPY --from=0 /frontend/dist /frontend/dist
COPY docker/default.conf /etc/nginx/conf.d/default.conf
