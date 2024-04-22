#!/bin/bash
sudo ip netns delete ue$1
sudo ip netns add ue$1
rx_port0=$(($1*100+2000))
tx_port0=$(($rx_port0+1))
rx_port1=$(($rx_port0+500))
tx_port1=$(($rx_port0+501))
imsi=$((123450000+$1))
echo $tx_port0 $rx_port0 $imsi
srsue                                                   \
       	--rf.device_name=zmq                            \
       	--rf.device_args="                              \
		tx_port0=tcp://*:$tx_port0,             \
		rx_port0=tcp://localhost:$rx_port0,     \
		tx_port1=tcp://*:$tx_port1,             \
		rx_port1=tcp://localhost:$rx_port1,     \
		id=ue$1,                                \
		base_srate=23.04e6                      \
	"	                                        \
	--gw.netns=ue$1                                 \
        --usim.algo=xor                                 \
        --usim.imsi=001010$imsi                         \

