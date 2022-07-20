#!/bin/bash
. "${GITPOD_REPO_ROOT}/deploy/gitpod/lib.sh"
waitForInit

set -a
. "${GITPOD_REPO_ROOT}/site/.env"
set +a


set -eux

export UID
docker stop $(docker ps -q) && docker rm $(docker ps -aq)

(cd site && yarn docker setup)

runSqlWithEnv() {
  cat ${GITPOD_REPO_ROOT}/$1 \
    | envsubst \
    | docker exec -i -u postgres ${COMPOSE_PROJECT_NAME}-db-1 psql -h localhost -d ${CI_PROJECT_NAME}
}

runSqlWithEnv deploy/shared/admin_user.sql 
runSqlWithEnv deploy/gitpod/admin_user_api_key.sql 

${GITPOD_REPO_ROOT}/deploy/gitpod/run-sqlpad.sh


(cd ${GITPOD_REPO_ROOT}/site/mailhog/ && docker build -t ${CI_PROJECT_NAME}/mailhog .)

( docker stop mailhog && docker rm mailhog ) || echo "mailhog not running"


# run mailhog
docker run -d \
  --name mailhog \
  -p 8025:8025 \
  -e DEFAULT_ADMIN_USER="$DEFAULT_ADMIN_USER" \
  -e DEFAULT_ADMIN_PASSWORD="$DEFAULT_ADMIN_PASSWORD" \
  ${CI_PROJECT_NAME}/mailhog

docker network connect ${COMPOSE_PROJECT_NAME}_default mailhog


(cd site && yarn docker start)
