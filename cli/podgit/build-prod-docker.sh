#!/usr/bin/env bash
set -euo pipefail

docker build -t podgit-client-builder .

rm -rf ./dist
mkdir ./dist

export UID
docker run --rm \
  --volume $(pwd):/go/src/app \
  -e DIST_UID=$UID \
  podgit-client-builder
