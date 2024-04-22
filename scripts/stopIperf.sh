#!/bin/bash

declare -a arr=("c1" "c2" "c3" "s1" "s2" "s3")

for i in "${arr[@]}"
do
    echo "Stopping $i"
    screen -X -S "$i" stuff "^C"
    sleep 1
done
echo "Done."
