#!/bin/bash
    
    sudo srsenb     --enb.n_prb=50     --enb.name=enb1     --enb.enb_id=0x19B     --rf.device_name=zmq     --rf.device_args="fail_on_disconnect=true,tx_port0=tcp://*:2000,rx_port0=tcp://localhost:2001,tx_port1=tcp://*:2100,rx_port1=tcp://localhost:2101,id=enb,base_srate=23.04e6"     --ric.agent.remote_ipv4_addr=10.107.2.21     --log.all_level=warn     --ric.agent.log_level=debug     --log.filename=stdout     --ric.agent.local_ipv4_addr=192.168.122.19     --ric.agent.local_port=5006
