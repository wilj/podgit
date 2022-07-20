#!/usr/bin/env bash
set -euo pipefail

./build.sh

PODGIT_URL=$(gp url 5678) ./dist/podgit \
  ports $* \
  --verbose \
  --port 8100="Ionic Application" \
  --port 8025="Mailhog" \
  --port 5678="API Server" \
  --port 3000="NPX Serve" 
