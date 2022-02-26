FROM node:17-alpine

RUN apk upgrade & \
    apk add dnsmasq 

# COPY config/dnsmasq.conf /etc/dnsmasq.conf 
RUN echo "port=54">> /etc/dnsmasq.conf

WORKDIR /usr/src/dns-manager

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5300 53/tcp 53/udp

CMD ./run-container.sh
