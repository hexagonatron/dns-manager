#!/bin/sh

dnsmasq -qk --log-debug & node /usr/src/dns-manager/server.js

wait -n

exit $?
