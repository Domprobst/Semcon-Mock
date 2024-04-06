#!/bin/bash

CONTAINER_NAME="souvemed_semcon"

# remove old semantic container
docker container stop -t 1 "$CONTAINER_NAME"  && docker container rm "$CONTAINER_NAME" # &>/dev/null

# auth disabled
AUTH_ENABLED=
SEMCON_URL="http://localhost:3000"  # use local semantic container

# start semantic container
if [ -n "$AUTH_ENABLED" ]; then
	# use the following line to start container with authorization enabled:
	docker run -p 3000:3000 -d -e AUTH=1 --name "$CONTAINER_NAME" semcon/sc-base:2021_05
else
	docker run -p 3000:3000 -d --name "$CONTAINER_NAME" semcon/sc-base:2021_05
fi

# wait for start
echo -n "Waiting for semantic container to be active"
while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' $SEMCON_URL/api/active)" != "200" ]]; do
	echo -n "."
	sleep 1;
done
echo " now active"
sleep 5  # wait again, because semantic container is not ready yet

# get authorization from docker logs (only use if container started with authorization enabled)
# Some inspiration under https://github.com/OwnYourData/oydid/blob/main/cli/test/run_sc.sh
# todo: is there a better way to define auth information?
export APP_KEY
export APP_SECRET
if [ -n "$AUTH_ENABLED" ]; then
	APP_KEY=$(docker logs "$CONTAINER_NAME"  2>/dev/null | grep APP_KEY | cut -f 2 -d " ")
	APP_SECRET=$(docker logs "$CONTAINER_NAME" 2>/dev/null | grep APP_SECRET | cut -f 2 -d " ")
fi
echo $APP_KEY
echo $APP_SECRET