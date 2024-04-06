#!/usr/bin/env python

import argparse
import sys
import requests
from pprint import pprint
from urllib.parse import urljoin


SEMCON_URL = 'http://localhost:3000/api/data'


def get_args():
    parser = argparse.ArgumentParser()

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
        "scope": 'read'
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
        
    # retrieve OAuth header
    token = oauth_token(auth)
    headers = bearer_auth_header(token)

    r = requests.get(SEMCON_URL, headers=headers)  # use local semantic container
    r.raise_for_status()

    data = r.json()
    data = data.get('data')
    if data is None:
        print('No data key in response')
        sys.exit(1)
    if len(data) < 1:
        print('Empty data in response')
        sys.exit(1)
    data = data[-1]
    content = data.get('content')
    if content is None:
        print('no content key in data')
        sys.exit(1)
    pprint(content)


if __name__ == '__main__':
    main()
