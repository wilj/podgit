#!/usr/bin/env bash
set -euo pipefail

echo "Building branch $CI_COMMIT_BRANCH at $(date)"

SECRETS_HOME=~/.$CI_PROJECT_NAMESPACE/$CI_PROJECT_NAME/$CI_COMMIT_BRANCH

ROOT_URL="${CI_COMMIT_BRANCH}.${BASE_DOMAIN}"

if [ "$CI_COMMIT_BRANCH" == "main" ]; then
    ROOT_URL=$BASE_DOMAIN
fi

export SECRETS_HOME
export ROOT_URL
export BASE_DOMAIN

./init/env.sh

cp -R $SECRETS_HOME/* $CI_PROJECT_DIR/


buildAndPush() (
    cd $1
    shift
    local IMG
    IMG="registry.gitlab.com/$CI_PROJECT_NAMESPACE/$CI_PROJECT_NAME/$1:$CI_COMMIT_BRANCH"
    shift

    export DOCKER_BUILDKIT=1 
    time docker build \
        --no-cache \
        -t $IMG \
        $* . 
    echo "Docker build complete"
    time docker push $IMG 
    echo "Docker push complete"
)


# store the environment files in an encrypted 7z file
7z a $CI_PROJECT_DIR/secrets/$CI_COMMIT_BRANCH.7z $SECRETS_HOME/* -p$CI_SECRET_KEY
buildAndPush $CI_PROJECT_DIR/secrets secrets

if [ "$CI_COMMIT_BRANCH" != "main" ]; then
    echo "building mailhog"
    buildAndPush $CI_PROJECT_DIR/site/mailhog mailhog
fi


# build the database image
buildAndPush $CI_PROJECT_DIR/site postgres \
    -f postgres/Dockerfile 

# build the website/graphql server with dev tools for database migrations and stuff
buildAndPush $CI_PROJECT_DIR tools \
        --file deploy/docker/production.Dockerfile \
        --target builder \
        --build-arg ROOT_URL="$ROOT_URL" \
        --build-arg REACT_APP_ROOT_URL="$ROOT_URL" \
        --build-arg TARGET="server" 
        

sed -i s/BUILD_REPLACES_THIS_WITH_CI_COMMIT_SHA/$CI_COMMIT_SHA/g \
    $CI_PROJECT_DIR/app/src/service-worker.ts

# build the website/graphql server as a production deployment
buildAndPush $CI_PROJECT_DIR server \
        --file deploy/docker/production.Dockerfile \
        --target server \
        --build-arg ROOT_URL="https://$ROOT_URL" \
        --build-arg REACT_APP_ROOT_URL="https://$ROOT_URL" \
        --build-arg NODE_ENV="production" \
        --build-arg TARGET="server" 


# cleanup
docker image rm $(docker images -f"dangling=true" -q) || echo "no images to clean up"