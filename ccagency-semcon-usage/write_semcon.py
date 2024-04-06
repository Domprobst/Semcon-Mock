#!/usr/bin/env python

import argparse
from pathlib import Path
from urllib.parse import urljoin

import requests


SEMCON_URL = 'http://localhost:3000/api/data'


def get_args():
    parser = argparse.ArgumentParser()

    parser.add_argument('executable', type=Path)
    parser.add_argument('input1', type=Path)
    parser.add_argument('input2', type=Path)
    parser.add_argument('--username', type=str, required=False)
    parser.add_argument('--password', type=str, required=False)

    return parser.parse_args()

def oauth_token(auth):
    if auth is None:
        return None
    
    url = urljoin(SEMCON_URL, '/oauth/token')
    data = {
        "client_id": auth[0],
        "client_secret": auth[1],
        "grant_type": 'client_credentials',
        "scope": 'write'
    }
    
    r = requests.post(url,json=data)
    r.raise_for_status()
    
    access_token = r.json().get('access_token')
    return access_token

def bearer_auth_header(access_token):
    if access_token is None:
        return None
    
    headers = {
        'Authorization': f"Bearer {access_token}"
    }
    return headers


def main():
    args = get_args()

    auth = None
    if args.username is not None and args.password is not None:
        auth = (args.username, args.password)

    # add executable code
    with open(args.executable, 'r') as f:
        executable_content = f.read()

    # add executable code
    with open(args.input1, 'r') as f:
        input1_content = f.read()

    # add executable code
    with open(args.input2, 'r') as f:
        input2_content = f.read()
        
    # retrieve OAuth header
    token = oauth_token(auth)
    headers = bearer_auth_header(token)

    # Some pseudo data. Replace with real data.
    data = {
        'executable': executable_content,
        'input_file0': input1_content,
        'input_file1': input2_content,
    }
    r = requests.post(SEMCON_URL, json=data, headers=headers)
    r.raise_for_status()
    print(r.status_code)


if __name__ == '__main__':
    main()
