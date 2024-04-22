#!/bin/bash

declare -a arr=("ue3" "ue2" "ue1" "enb1" "enb2" "epc")

for i in "${arr[@]}"
do
    echo "Stopping $i"
    screen -X -S "$i" stuff "^C"
    sleep 5
done
echo "Done."
