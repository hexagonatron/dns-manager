FROM node:17-alpine

RUN apk upgrade --no-cache && \
    apk add dnsmasq 

COPY config/dnsmasq.conf /etc/dnsmasq.conf 

WORKDIR /usr/src/dns-manager

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5300
EXPOSE 53/tcp
EXPOSE 53/udp
EXPOSE 5353/tcp
EXPOSE 5353/udp

CMD ./run-container.sh