#!/usr/bin/env bash
set -euxo pipefail
export UID

echo "Deploying branch $CI_COMMIT_BRANCH at $(date)"

SECRETS_HOME=$HOME/.$CI_PROJECT_NAMESPACE/$CI_PROJECT_NAME/$CI_COMMIT_BRANCH
export SECRETS_HOME

echo "Decrypting secrets"
rm -rf $SECRETS_HOME
mkdir -p $SECRETS_HOME
SECRETS_IMAGE=registry.gitlab.com/$CI_PROJECT_NAMESPACE/$CI_PROJECT_NAME/secrets:$CI_COMMIT_BRANCH
docker pull $SECRETS_IMAGE

docker run \
    --rm \
    --user $(id -u):$(id -g) \
    -v $SECRETS_HOME:/output \
    $SECRETS_IMAGE \
        7z x /secrets/${CI_COMMIT_BRANCH}.7z -o/output -p$CI_SECRET_KEY
   

./init/proxy.sh


set -a
. ${SECRETS_HOME}/site.env
set +a

echo "Deploying to url $ROOT_URL"

export UID

echo "Using COMPOSE_PROJECT_NAME=$COMPOSE_PROJECT_NAME"
COMPOSE_FILE="docker-compose-main.yml"
if [ "$CI_COMMIT_BRANCH" != "main" ]; then
    COMPOSE_FILE="docker-compose-develop.yml"
fi

DC="docker-compose --project-name $COMPOSE_PROJECT_NAME --file $COMPOSE_FILE "

cdc() (
    cd $CI_PROJECT_DIR/deploy/docker \
        && $*
)

cdc $DC pull

runQuery() (
    cd $CI_PROJECT_DIR/deploy/docker 
    $DC exec -T db psql -h localhost -U postgres -X -A -t -c "$*"
)

if [ "$CI_COMMIT_BRANCH" != "main" ]; then
    echo "Starting mailhog"
    cdc $DC  up -d mailhog
fi

echo "Starting database"
cdc $DC up -d db 

# wait for the database to start
RETRIES=20
until runQuery "select 'database' || 'available'" > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    echo "Waiting for postgres server, $((RETRIES--)) remaining attempts..."
    sleep 3
done


ROLE_EXISTS=$(runQuery "select 1 from pg_roles where rolname='${CI_PROJECT_NAME}'")

if [ "$ROLE_EXISTS" = "1" ]; then
    echo "Skipping database setup since it has already been executed."
else
    echo "Running initial database setup"
    ( cd $CI_PROJECT_DIR/deploy/docker \
        && $DC run --rm dbsetup )
    
    # add default admin user
    ./init/users.sh
fi

echo "Running database migration"
cdc $DC run --rm dbmigrate 


echo "Starting site"
cdc $DC up -d server 

echo "Starting worker"
cdc $DC up -d worker 

# cleanup
docker image rm $(docker images -f"dangling=true" -q) || echo "nothing to clean up"