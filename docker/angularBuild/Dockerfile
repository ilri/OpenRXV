FROM ubuntu:20.04
# Work around tzdata prompting user during apt install (default is UTC anyways)
# See: https://grigorkh.medium.com/fix-tzdata-hangs-docker-image-build-cdb52cc3360d
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN apt update -y
RUN apt install -y curl gnupg
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt install -y nodejs
RUN npm install -g @angular/cli
RUN apt install -y nginx
COPY ./start.sh /start.sh
EXPOSE 80
CMD ["./start.sh"]
