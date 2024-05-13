#!/bin/bash
#iperf3 -s -i 1 -p $((4000+$1)) -f k
iperf3 -s -i 1 -p $((4000+$1)) -f k --forceflush | stdbuf --output=L sed -r 's/.+ +([[:digit:]]+) +.+\/sec.*$/\1/' > /home/evo/iperf/server$1.speed
#  --forceflush | stdbuf --output=L
