#!/usr/bin/env bash
set -euo pipefail

export DEFAULT_ADMIN_PASSWORD

echo "Creating default admin user"

cat $CI_PROJECT_DIR/deploy/shared/admin_user.sql \
    | envsubst \
    | docker exec -i ${COMPOSE_PROJECT_NAME}-db-1 psql -U postgres -h localhost -d ${CI_PROJECT_NAME} 

echo "Default admin user created"