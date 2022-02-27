FROM node:17-alpine

RUN apk upgrade & \
    apk add dnsmasq 

WORKDIR /usr/src/dns-manager

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5300 53/tcp 53/udp

CMD ./run-container.sh
