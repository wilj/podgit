#!/bin/bash
. "${GITPOD_REPO_ROOT}/site/.env"

docker exec -it -u postgres ${COMPOSE_PROJECT_NAME}-db-1 pg_dump -h localhost -d ${CI_PROJECT_NAME}
