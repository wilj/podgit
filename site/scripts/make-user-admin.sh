#!/bin/bash
. "${GITPOD_REPO_ROOT}/site/.env"

echo "update app_public.users set is_admin=true, is_verified=true where username='$1'" \
  | docker exec -i -u postgres ${COMPOSE_PROJECT_NAME}-db-1 psql -h localhost -d $CI_PROJECT_NAME
