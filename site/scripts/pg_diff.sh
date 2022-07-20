#!/bin/bash
. "${GITPOD_REPO_ROOT}/site/.env"

dumpdb() {
  docker exec -it -u postgres ${COMPOSE_PROJECT_NAME}-db-1 pg_dump -h localhost -d $1
}

diff <(dumpdb ${CI_PROJECT_NAME}_shadow) <(dumpdb ${CI_PROJECT_NAME})

