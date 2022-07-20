#!/bin/bash
set -ex

eval $(grep "^POSTGRES_PASSWORD" "${GITPOD_REPO_ROOT}/site/docker/.env")

mkdir -p /workspace/sqlpad

docker stop sqlpad || :
docker rm sqlpad || :

docker run -d --rm \
    --name sqlpad \
    -e SQLPAD_ADMIN="$DEFAULT_ADMIN_USER" \
    -e SQLPAD_ADMIN_PASSWORD="$DEFAULT_ADMIN_PASSWORD" \
    -e SQLPAD_APP_LOG_LEVEL="info" \
    -e SQLPAD_WEB_LOG_LEVEL="warn" \
    -e SQLPAD_CONNECTIONS__postgres__name="Postgres" \
    -e SQLPAD_CONNECTIONS__postgres__driver="postgres" \
    -e SQLPAD_CONNECTIONS__postgres__host="db" \
    -e SQLPAD_CONNECTIONS__postgres__database="${CI_PROJECT_NAME}" \
    -e SQLPAD_CONNECTIONS__postgres__username="postgres" \
    -e SQLPAD_CONNECTIONS__postgres__password="$DATABASE_OWNER_PASSWORD" \
    -e SQLPAD_CONNECTIONS__postgres__multiStatementTransactionEnabled="'true'" \
    -e SQLPAD_CONNECTIONS__postgres__idleTimeoutSeconds="86400" \
    -v "/workspace/sqlpad":/var/lib/sqlpad \
    -p 13000:3000 \
    sqlpad/sqlpad:6

docker network connect ${COMPOSE_PROJECT_NAME}_default sqlpad
