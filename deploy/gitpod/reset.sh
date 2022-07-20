#!/bin/bash
set -eux -o pipefail

. "${GITPOD_REPO_ROOT}/deploy/gitpod/lib.sh"

set -a
. "${GITPOD_REPO_ROOT}/site/.env"
set +a

docker stop $(docker ps -q) || echo "no containers to stop"
docker rm $(docker ps -aq) || echo "no containers to delete"

docker volume rm $(docker volume ls -q) || echo "no volumes to delete"

docker image rm ${CI_PROJECT_NAME}_server:latest || echo "no server image to delete"

rm -f "${GITPOD_REPO_ROOT}/deploy/gitpod/*.flag"
