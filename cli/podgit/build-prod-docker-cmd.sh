#!/usr/bin/env bash
set -euo pipefail
./build-prod.sh
chown -R $DIST_UID:$DIST_UID ./dist