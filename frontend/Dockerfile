FROM docker.io/node:18-bookworm
RUN npm --version \
    && npm install -g npm@8 \
    && npm install -g @angular/cli@15 \
    && rm -rf ~/.npm
RUN mkdir /frontend
RUN ls /frontend
COPY src /frontend/src
COPY angular.json package.json package-lock.json tsconfig.json /frontend/
WORKDIR /frontend

ENV CONFIG_OpenRXV_BASE_HREF="/"
RUN sed -i -e "s;#CONFIG_OpenRXV_BASE_HREF#;$CONFIG_OpenRXV_BASE_HREF;g" \
    src/index.html && \
    sed -i -e "s;#CONFIG_OpenRXV_BASE_HREF#;$CONFIG_OpenRXV_BASE_HREF;g" \
    src/environments/environment.prod.ts && \
    sed -i -e "s;#CONFIG_OpenRXV_BASE_HREF#;$CONFIG_OpenRXV_BASE_HREF;g" \
    src/environments/environment.ts

# we need to force because @agm/core wants Angular 9/10
RUN npm ci --force
RUN ng b --base-href="$CONFIG_OpenRXV_BASE_HREF"

FROM docker.io/nginx:stable
COPY --from=0 /frontend/dist /frontend/dist
COPY docker/default.conf /etc/nginx/conf.d/default.conf

ENV CONFIG_OpenRXV_BASE_HREF="/"
RUN sed -i -e "s;#CONFIG_OpenRXV_BASE_HREF#;$CONFIG_OpenRXV_BASE_HREF;g" \
    /etc/nginx/conf.d/default.conf

RUN if [ "$CONFIG_OpenRXV_BASE_HREF" = "/" ]; then \
    sed -i -e "/#NONE_EMPTY_BASE_HREF_START/,/#NONE_EMPTY_BASE_HREF_END/d" /etc/nginx/conf.d/default.conf; \
  fi
