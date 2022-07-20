#!/bin/bash
${GITPOD_REPO_ROOT}/scripts/docker-stop.sh
docker volume rm ${CI_PROJECT_NAME}_db-volume
