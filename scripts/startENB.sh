#!/bin/bash
p0=$((1999+$1))
p1=$(($p0+50))
p2=$(($p0+25))
p3=$(($p2+50))
ricport=$((5005+$1))
tba="127.0.1.$1"
sba="127.0.1.$1"

srsenb                                                \
     --enb.n_prb=50                                   \
     --enb.name=enb$1                                 \
     --enb.enb_id=0x19$1                              \
     --rf.device_name=zmq                             \
     --rf.device_args="                               \
           fail_on_disconnect=true,                   \
           tx_port0=tcp://*:$p0,                      \
           rx_port0=tcp://localhost:$p1,              \
           tx_port1=tcp://*:$p2,                      \
           rx_port1=tcp://localhost:$p3,              \
           id=enb$1,                                  \
           base_srate=23.04e6                         \
     "                                                \
     --ric.agent.remote_ipv4_addr=10.106.63.27        \
     --log.all_level=warn                             \
     --ric.agent.log_level=debug                      \
     --log.filename=stdout                            \
     --ric.agent.local_ipv4_addr=192.168.122.186      \
     --ric.agent.local_port=$ricport
     --tp_bind_addr=$tba:36422
     --s1c_bind_addr=$sba:36422
