#!/bin/bash
sudo ip netns add ue1
sudo srsue --gw.netns=ue1
