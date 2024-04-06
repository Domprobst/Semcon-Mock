/**
 * It is assumed that an executable and the data that should be analysed is stored under some url (possibly in a
 * semantic container). Further it is known whether this program is a python or a bash script.
 * Then the function create_red_data() can be used to create a RED Document that can be transferred to a cc-agency
 * installation and be executed there.
 *
 */

// DRYRUN = true will print the created RED-data. DRYRUN = false will send the created RED-data to an agency.
const DRYRUN = false;

/**
 * Creates some basic red structure without special information.
 *
 * @returns red data stub
 */
function create_basic_red(agency) {
    return {
        "redVersion": "9",
        "cli": {
            "cwlVersion": "v1.0",
            "class": "CommandLineTool",
            "baseCommand": null,  // to set
            "inputs": {},  // to set
            "outputs": {},  // to set
        },
        "inputs": {},  // to set
        "outputs": {},
        "container": {
            "engine": "docker",
            "settings": {
                "image": {
                    "url": "dprobst/cc_python:semcon-v3.0.0",
                },
                "ram": 1024 * 4, // max 4 GB
            }
        },
        "execution": {
            "engine": "ccagency",
            "settings": {
                "access": {
                    "url": agency.url,
                    "auth": {
                        username: agency.username,
                        password: agency.password,
                    },
                }
            }
        }
    }
}

/**
 * Add the base command to the RED file. The base command is either "/bin/bash" or "/usr/bin/python3".
 *
 * @param red_data The red data to add the base command to
 * @param program_type Specifies whether we want to execute a bash or python program.
 */
function add_base_command(red_data, program_type) {
    let base_command = null;
    if (program_type === 'python') {
        base_command = '/usr/bin/python3';
    } else if (program_type === 'bash') {
        base_command = '/bin/bash';
    } else {
        throw 'unknown program_type: '.concat(program_type);
    }
    red_data.cli.baseCommand = base_command;
}

/**
 * The executable is the first command line argument for the base command. Usually a python script transferred from
 * outside.
 *
 * @param red_data: The red data to add the executable to
 * @param executable_url: The url of the executable to add. This could be the URL of a semantic container.
 * @param semcon_cred: Credentials for the semantic container. Should have keys [username, password].
 */
function add_executable(red_data, executable_url, semcon_cred) {
    red_data.cli.inputs.executable = {
        type: 'File',
        inputBinding: {position: 0}, // executable is first positional argument
    };

    // add connector input
    red_data.inputs.executable = {
        class: 'File',
        basename: 'executable.py',
        connector: {
            command: 'red-connector-semcon', // use semcon connector
            access: {
                url: executable_url,
                resource: {
                    resourceType: 'id',
                    resourceValue: '1',
                    key: 'executable',
                    format: 'plain'
                },
            }
        }
    }

    if(semcon_cred['username']) { // oauth authentification data
        red_data.inputs.executable.connector.access.auth = {
            username: semcon_cred['username'],
            password: semcon_cred['password'],
            scope: 'read'
        }
    }
}

/**
 * Adds cli-input specifications and connector-input specifications to the given red-data.
 *
 * @param red_data: The red data to add inputs to
 * @param input_urls: An array of urls or a single url, that should be fetched and used for the experiment. Every input
 *                    url is creating a new input with a red-connector-semcon as connector. The data key is
 *                    `input_file${index}`.
 * @param semcon_cred: Credentials for the semantic container. Should have keys [username, password].
 */
function add_inputs(red_data, input_urls, semcon_cred) {
    // make sure input_urls is an array
    if (!Array.isArray(input_urls)) {
        input_urls = [input_urls];
    }
    let input_index = 0;
    for (let input_url of input_urls) {
        const input_key = 'input_file' + input_index;

        // add cli input
        red_data.cli.inputs[input_key] = {
            type: 'File',
            inputBinding: {position: input_index + 1}, // use + 1 here, because executable is first positional argument
        };

        // add connector input
        red_data.inputs[input_key] = {
            class: 'File',
            connector: {
                command: 'red-connector-semcon', // use http to get input file (maybe change in the future)
                access: {
                    url: input_url,
                    resource: {
                        resourceType: 'id',
                        resourceValue: '1',
                        key: input_key,
                        format: 'plain'
                    },
                }
            }
        }

        if(semcon_cred['username']) { // oauth authentification data
            red_data.inputs[input_key].connector.access.auth = {
                username: semcon_cred['username'],
                password: semcon_cred['password'],
                scope: 'read'
            }
        }

        input_index++;
    }
}

/**
 * Adds output definitions to cli.outputs and outputs of red data.
 *
 * @param red_data: The red data to add outputs to
 * @param outputs: The outputs to add. Every output is a dictionary with keys [url, glob].
 * @param semcon_cred: Credentials for the semantic container. Should have keys [username, password].
 */
function add_outputs(red_data, outputs, semcon_cred) {
    // make sure outputs is an array
    if (!Array.isArray(outputs)) {
        outputs = [outputs];
    }
    let output_index = 0;
    for (let output of outputs) {
        const output_key = 'output_file' + output_index;

        red_data.cli.outputs[output_key] = {
            type: 'File',
            outputBinding: {
                glob: output.glob,
            }
        }

        red_data.outputs[output_key] = {
            class: 'File',
            connector: {
                command: 'red-connector-semcon',
                access: {
                    url: output.url,
                    resource: {
                        dri: '0',
                        schemaDri: 'results',
                        tableName: 'files'
                    },
                }
            }
        }

        if(semcon_cred['username']) { // oauth authentification data
            red_data.outputs[output_key].connector.access.auth = {
                username: semcon_cred['username'],
                password: semcon_cred['password'],
                scope: 'write'
            }
        }

        output_index++;
    }
}

/**
 * Puts together all parts of a red file.
 *
 * @param program_type: One of ['python', 'bash']
 * @param executable_url: The url to the executable
 * @param input_urls: Urls to some input files
 * @param outputs: Outputs for the experiment. Every output is a dictionary with keys [url, glob]
 * @param agency: Access information to agency. Should have keys [url, username, password].
 * @param semcon_cred: OAuth credentials for the semantic container. Should have keys [username, password].
 * @return red_data: An object containing the RED data.
 */
function create_red(program_type, executable_url, input_urls, outputs, agency, semcon_cred) {
    const red_data = create_basic_red(agency);

    add_base_command(red_data, program_type);
    add_executable(red_data, executable_url, semcon_cred)
    add_inputs(red_data, input_urls, semcon_cred)
    add_outputs(red_data, outputs, semcon_cred)

    return red_data;
}

/**
 * We need the local ip of this computer to reach the semantic container from inside a docker container. The ip
 * "localhost" does not work as it gets resolved as the localhost inside the docker container.
 *
 * @returns ip: An ip address of this computer.
 */
function get_local_ip() {
    // taken from https://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
    const { networkInterfaces } = require('os');

    const nets = networkInterfaces();
    const results = {};

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
            const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
            if (net.family === familyV4Value && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }

    // search for device that fits best (avoid localhost or docker addresses)
    for (let device_name_part of ["eth", "enp", "wlan"]) {
        for (let [device, ips] of Object.entries(results)) {
            if (device.includes(device_name_part)) {
                if (ips?.length) {
                    return ips[0];
                }
            }
        }
    }

    throw new Error("Failed to identify local ip address");
}

const local_ip = get_local_ip();

// use local ip to configure the inputs and outputs.
const red_data = create_red(
    'python',
    `http://${local_ip}:3000/api/data`,
    [`http://${local_ip}:3000/api/data`, `http://${local_ip}:3000/api/data`],
    [{'url': `http://${local_ip}:3000/api/data`, 'glob': 'output.txt'}],
    {url: 'http://127.0.0.1:8080', username: 'agency_user', password: 'agency_password'},
    {username: process.env.APP_KEY, password: process.env.APP_SECRET}
);

/**
 * Run the specified RED data on an agency installation. The agency URL should be specified in the data itself.
 * @param red_data: The experiment description to execute.
 */
function startExperiment(red_data) {
    const post_data = JSON.stringify(red_data)

    // parse agency url
    const agency_url = red_data['execution']['settings']['access']['url'];

    // split protocol
    let [protocol, url] = agency_url.split("://");
    if (typeof url === 'undefined') {
        url = protocol;
        protocol = 'http';
    }

    // split path
    const url_parts = url.split("/");
    let hostname_port = url_parts[0];
    let path = "";
    if (url_parts.length >= 1) {
        path = url_parts.slice(1).join("/");
    }
    path = path.concat("/red");

    // split port
    let [hostname, port] = hostname_port.split(":");
    if (typeof port === 'undefined') {
        port = 8080;
    } else {
        port = parseInt(port);
    }

    // read authorization information
    const username = red_data['execution']['settings']['access']['auth']['username'];
    const password = red_data['execution']['settings']['access']['auth']['password'];
    let auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');

    // actually send the data to the agency
    const options = {
        hostname: hostname,
        port: port,
        path: path,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(post_data),
            "Authorization": auth,
        },
    }
    // use http or https
    let request_module;
    if (protocol === "http") {
        request_module = require("http");
    } else if (protocol === "https") {
        request_module = require("https");
    } else {
        throw new Error("Unknown protocol: ".concat(protocol));
    }
    const req = request_module.request(options, resp => {
        let buffer = ""
        resp.on("data", chunk => {
            buffer += chunk
        })
        resp.on("end", () => {
            console.log(JSON.parse(buffer)) // log response
        })
    }).on("error", err => {
        console.error("[error] " + err.message) // handle error
    })
    req.write(post_data)
    req.end()
}

if (DRYRUN) {
    // log red data in fancy way
    const util = require('util');
    console.log(util.inspect(red_data, {showHidden: false, depth: null, colors: true}))
} else {
    // execute on agency
    startExperiment(red_data);
}
