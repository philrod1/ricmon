#!/bin/bash

rm -rf tmp
mkdir tmp
cd tmp
git clone $1
cd *
# config_dir='xapp-descriptor'
#config_file="${config_dir}/config.json"
cp -R init config
cp -R xapp-descriptor config
cp -R deploy config
mv config/config.json config/config-file.json 
config_dir='config'
config_file="${config_dir}/config-file.json" 
schema_file="${config_dir}/schema.json"
if ! [ -f $schema_file ]; then
  echo "No schema file found."
  cp ../../example-schema.json $schema_file
fi
app_name=$(cat $config_file | jq '.containers[0].name' | tr -d '"')
tmp="$(jq '.containers[0].image.registry = "oaic.local:5008"' $config_file)" && echo -E "${tmp}" > $config_file
version=$(cat $config_file | jq '.version' | tr -d '"')
name=$(cat $config_file | jq '.containers[0].image.name' | tr -d '"' | sed 's/.*\///')
tmp="$(jq ".containers[0].image.name = \"$name\"" $config_file)" && echo -E "${tmp}" > $config_file
tmp="$(jq ".xapp_name = \"$name\"" $config_file)" && echo -E "${tmp}" > $config_file
tag=$(cat $config_file | jq '.containers[0].image.tag' | tr -d '"')
tmp="$(jq 'del(.controls)' $config_file)" && echo -E "${tmp}" > $config_file
echo $name
echo $version
echo $tag
rm ~/xapp_config_files/$name-config-file.json
docker builder prune -af
echo "Building"
docker build --no-cache -t oaic.local:5008/$name:$tag . 2>&1
echo "Deploying"
cp $config_file ~/xapp_config_files/$name-config-file.json
curl -L -X POST "http://$KONG_PROXY:32080/onboard/api/v1/onboard/download" --header 'Content-Type: application/json' --data-raw "{\"config-file.json_url\":\"http://$myip:5010/$name-config-file.json\"}"
curl -L -X POST "http://$KONG_PROXY:32080/appmgr/ric/v1/xapps" --header 'Content-Type: application/json' --data-raw "{\"xappName\": \"$name\"}"
echo "Done."
