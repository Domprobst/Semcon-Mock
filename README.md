# CC-Agency - Semantic Container - Mock

This directory contains scripts to make experiments for the agency <-> semcon communication.
For this to work it is necessary to have a cc-agency running on `localhost:8080` (probably in a docker container).
See [here](https://github.com/curious-containers/curious-containers/tree/master/cc-agency/docker/compose) for more
information on how to set up an agency locally in docker.

## Scripts
### `start_mock.sh`
Start the mock.
1. Create a semantic container with name `souvemed_semcon` (using `start_semantic_container.sh`).
2. Write some data to the semantic container (using `write_semcon.py`).
3. Create some RED-data and execute it on an agency installation (using `create_red.js`).

### `start_semantic_container.sh`
Creates a new semantic container.
1. Remove old container if present.
2. Create new semantic container with name `souvemed_semcon`.
3. Wait for the container to be available. Wait another 5 seconds, as tests showed that
the container was not usable before.
4. Read auth information from container.

### `write_semcon.py` / `read_semcon.py`
Write or read data to a semantic container that is running on localhost.
`write_semcon.py` expects three cli-arguments. The first argument should be the path to a python executable.
One such script could be `test_scripts/hello_world.py`.
The two other arguments are two text files of any kind which will be transferred to the semantic container as well
to serve as input files for the executable. The authorization is unused at the moment.

`read_semcon.py` reads data from the semantic container and prints it on the screen.

### `create_red.js`
This js script creates RED-data that can be used to be executed on an agency installation.
1. Create RED data.
2. Get local ip address to configure red data. (The semcon-connectors configured in the
   red-data need to access the semantic container running on the host machine.)
3. Execute the red-data on a local agency installation.
