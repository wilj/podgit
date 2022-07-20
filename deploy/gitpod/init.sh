#!/usr/bin/env bash
set -euo pipefail

. "${GITPOD_REPO_ROOT}/deploy/gitpod/lib.sh"
rm -f "${GITPOD_REPO_ROOT}/deploy/gitpod/*.flag"

initStart

if [ -z "$DEFAULT_ADMIN_PASSWORD" ]; then
    echo "DEFAULT_ADMIN_PASSWORD environment variable not set. $0 exiting"
    exit 0
fi

go install github.com/spf13/cobra-cli@latest
go install github.com/uber-go/gopatch@latest

CI_COMMIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
CI_PROJECT_DIR=$GITPOD_REPO_ROOT
CI_PROJECT_NAME=podgit
CI_PROJECT_NAMESPACE=cyton-org
HTTP_PORT=8100
BASE_DOMAIN=$(gp url ${HTTP_PORT})
SENDINBLUE_API_KEY=

export CI_COMMIT_BRANCH
export CI_PROJECT_DIR
export CI_PROJECT_NAME
export CI_PROJECT_NAMESPACE
export BASE_DOMAIN
export SENDINBLUE_API_KEY

POSTGRES_PASSWORD=$(randompassword 30)
SECRET=$(randompassword 40)

export POSTGRES_PASSWORD
export SECRET

# generate app env
cat << EOF > "${GITPOD_REPO_ROOT}/app/.env"
ROOT_URL=${BASE_DOMAIN}
REACT_APP_ROOT_URL=${BASE_DOMAIN}
EOF

# generate site env
cat << EOF > "${GITPOD_REPO_ROOT}/site/.env"

CI_COMMIT_BRANCH=${CI_COMMIT_BRANCH}
CI_PROJECT_DIR=${CI_PROJECT_DIR}
CI_PROJECT_NAME=${CI_PROJECT_NAME}
CI_PROJECT_NAMESPACE=${CI_PROJECT_NAMESPACE}
BASE_DOMAIN=${BASE_DOMAIN}


# If you're supporting PostGraphile's development via Patreon or Graphile
# Store, add your license key from https://store.graphile.com here so you can
# use the Pro plugin - thanks so much!
GRAPHILE_LICENSE=

# This is a development environment (production wouldn't write envvars to a file)
NODE_ENV=development

# Superuser connection string (to a _different_ database), so databases can be dropped/created (may not be necessary in production)
ROOT_DATABASE_URL=postgres://postgres:${POSTGRES_PASSWORD}@db/postgres

# Where's the DB, and who owns it?
DATABASE_HOST=db
DATABASE_NAME=${CI_PROJECT_NAME}
DATABASE_OWNER=${CI_PROJECT_NAME}
DATABASE_OWNER_PASSWORD=${POSTGRES_PASSWORD}

# The PostGraphile database user, which has very limited
# privileges, but can switch into the DATABASE_VISITOR role
DATABASE_AUTHENTICATOR=${CI_PROJECT_NAME}_authenticator
DATABASE_AUTHENTICATOR_PASSWORD=${POSTGRES_PASSWORD}

# Visitor role, cannot be logged into directly
DATABASE_VISITOR=${CI_PROJECT_NAME}_visitor

# This secret is used for signing cookies
SECRET=${SECRET}

# Server API port - proxied in development
PORT=5678

# This is needed any time we use absolute URLs, e.g. for OAuth callback URLs
# IMPORTANT: must NOT end with a slash
ROOT_URL=$BASE_DOMAIN

# To enable login with GitHub, create a GitHub application by visiting
# https://github.com/settings/applications/new and then enter the Client
# ID/Secret below
#
#   Name: PostGraphile Starter (Dev)
#   Homepage URL: $(gp url ${HTTP_PORT})
#   Authorization callback URL: $(gp url ${HTTP_PORT})/auth/github/callback
#
# Client ID:
GITHUB_KEY=

# Client Secret:
GITHUB_SECRET=

# Set to 1 only if you're on Node v12 of higher; enables advanced optimisations:
GRAPHILE_TURBO=1

PROJECT_NAME=${CI_PROJECT_NAME}_${CI_COMMIT_BRANCH}
COMPOSE_PROJECT_NAME=${CI_PROJECT_NAME}_${CI_COMMIT_BRANCH}

SENDINBLUE_API_KEY=$SENDINBLUE_API_KEY

MAIL_ENV=development
EOF

cat << EOF > "${GITPOD_REPO_ROOT}/site/docker/.env"
# We'd like scripts ran through Docker to pretend they're in a normal
# interactive terminal.
FORCE_COLOR=2

# \`pg_dump\` is run from inside container, which doesn't have pg tools installed
# so it needs a way to still run it. \`docker-compose run\` would start an
# instance inside the current running container which doesn't work with volume
# mappings, so we must use \`docker-compose exec\`. \`-T\` is needed because our
# \`.gmrc\` checks for interactive TTY.
PG_DUMP=docker-compose exec -T db pg_dump

# Drops tables without asking in \`yarn setup\`. Reasoning: 1) docker-compose is
# not tty, 2) it's a dev env anyway.
CONFIRM_DROP=y

# POSTGRES_PASSWORD is the superuser password for PostgreSQL, it's required to
# initialize the Postgres docker volume.
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# We're accessing Postgres via Docker, so we must use the db host and the
# relevant password.
DATABASE_HOST=db
ROOT_DATABASE_URL=postgres://postgres:${POSTGRES_PASSWORD}@db/postgres

CI_PROJECT_NAME=${CI_PROJECT_NAME}
CI_COMMIT_BRANCH=${CI_COMMIT_BRANCH}

DEFAULT_ADMIN_USER=$DEFAULT_ADMIN_USER
DEFAULT_ADMIN_PASSWORD=$DEFAULT_ADMIN_PASSWORD
MAIL_ENV=development
EOF

set -a
. "${GITPOD_REPO_ROOT}/site/.env"
. "${GITPOD_REPO_ROOT}/app/.env"
set +a

docker stop $(docker ps -q) || echo "no containers to stop"
docker rm $(docker ps -aq) || echo "no containers to delete"

docker volume rm $(docker volume ls -q) || echo "no volumes to delete"

docker image rm ${CI_PROJECT_NAME}_server:latest || echo "no server image to delete"



set -eu -o pipefail 

export UID

(cd ${GITPOD_REPO_ROOT}/site && yarn docker setup)

(cd ${GITPOD_REPO_ROOT}/app && npm install)


initComplete