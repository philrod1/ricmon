#!/bin/bash
count="5"
n=2
for ((i = 0; i < $count; i++)); do
    echo "Iteration $i"
done
echo $((count+n))
