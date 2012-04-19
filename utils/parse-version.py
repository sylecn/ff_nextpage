#!/usr/bin/env python
# coding=utf-8

"""
parse version from install.rdf file
"""


import re

import sys
import os
PWD = os.path.abspath(os.path.dirname(__file__))
if PWD not in sys.path:
    sys.path.append(PWD)
pathjoin = os.path.join

PROJECT_ROOT = os.path.normpath(pathjoin(PWD, '..'))

INSTALL_RDF_FILE = pathjoin(PROJECT_ROOT, 'src', 'install.rdf')

version_pattern = re.compile(r'<em:version>(.*)</em:version>')

with open(INSTALL_RDF_FILE) as f:
    lines = f.read()
    mo = version_pattern.search(lines)
    if mo:
        version = mo.group(1)
        print 'v' + version
    else:
        sys.stderr.write('Error: Can\'t found version number in %s\n' % (
            INSTALL_RDF_FILE))
        print 'UNKNOWN_VERSION'
