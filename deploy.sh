#!/bin/bash

rm -rf tmp
mkdir tmp
cd tmp
git clone $1
cd *
# config_dir='xapp-descriptor'
#config_file="${config_dir}/config.json"
mv xapp-descriptor config
mv deploy config
mv config/config.json config/config-file.json 
config_dir='config'
config_file="${config_dir}/config-file.json" 
schema_file="${config_dir}/schema.json"
if ! [ -f $schema_file ]; then
  echo "No schema file found."
  cp ../../example-schema.json $schema_file
fi
app_name=$(cat $config_file | jq '.containers[0].name' | tr -d '"')
tmp="$(jq '.containers[0].image.registry = "oaic.local:5001"' $config_file)" && echo -E "${tmp}" > $config_file
version=$(cat $config_file | jq '.version' | tr -d '"')
name=$(cat $config_file | jq '.containers[0].image.name' | tr -d '"' | sed 's/.*\///')
tmp="$(jq ".containers[0].image.name = \"$name\"" $config_file)" && echo -E "${tmp}" > $config_file
tag=$(cat $config_file | jq '.containers[0].image.tag' | tr -d '"')
echo $name
echo $version
echo $tag
dms_cli uninstall --xapp_chart_name=$app_name --namespace=ricxapp
docker builder prune -af
echo "Before build"
docker build --no-cache -t localhost:5001/$name:$tag . 2>&1
echo "After build"
dms_cli onboard ./$config_file ./$schema_file
dms_cli install $app_name $version ricxapp