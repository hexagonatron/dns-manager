#!/bin/sh

dnsmasq -qk & node /usr/src/dns-manager/server.js

wait -n

exit $?
