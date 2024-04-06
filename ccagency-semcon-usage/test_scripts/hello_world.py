#!/usr/bin/env python3

# This function should take two input files by positional cli arguments, count the number of lines and output the result in a file called output.txt

import sys


if len(sys.argv) != 3:
    print('Two input files expected. Got {}'.format(len(sys.argv)-1))
    sys.exit(1)

with open(sys.argv[1], 'r') as f1:
    f1_len = len(f1.readlines())

with open(sys.argv[2], 'r') as f2:
    f2_len = len(f2.readlines())


with open('output.txt', 'w') as output_f:
    output_f.write('lines file1: {}\nlines file2: {}'.format(f1_len, f2_len))

