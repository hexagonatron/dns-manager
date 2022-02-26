#!/bin/bash

/bin/node /usr/src/dns-manager/server.js & dnsmasq -k &

wait -n

exit $?