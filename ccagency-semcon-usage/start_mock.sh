#!/bin/bash

# This script
# - starts a semantic container
# - writes some data to it
# - creates RED data and executes it on a running cc-agency installation

# TODO:
# - use RED-Connector-Semcon in create_red.js
# - test this script (only parts are tested until now)

# There should be a running cc-agency installation beforehand.
# See https://github.com/curious-containers/curious-containers/tree/master/cc-agency/docker/compose
# for easy setup of cc-agency with docker-compose.
# Easy in this context means easier than setup from scratch, not easy ;)


# start semantic container
. start_semantic_container.sh

# write mock data into semantic container
# todo: this should use authorization, if possible
file1="README.md"
file2="create_red.js"

if [ -z "$APP_KEY" ]
then
    python ./write_semcon.py test_scripts/hello_world.py "$file1" "$file2"
else
    python ./write_semcon.py test_scripts/hello_world.py "$file1" "$file2" --username $APP_KEY --password $APP_SECRET
fi

# start agency job on running agency
node create_red.js
