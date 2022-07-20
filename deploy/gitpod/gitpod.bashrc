#!/usr/bin/env bash

if [ -n "$WORKSPACE_SSH_PRIVATE_KEY" ]; then
    echo "$WORKSPACE_SSH_PRIVATE_KEY" | base64 --decode > ~/.ssh/id_ed25519
    echo "$WORKSPACE_SSH_PUBLIC_KEY" | base64 --decode > ~/.ssh/id_ed25519.pub
fi
chmod -R 600 ~/.ssh/*


g.app() {
    g.cdroot ./deploy/gitpod/app.sh
}

g.app-regenerate() (
    cd ${GITPOD_REPO_ROOT}/app
    npm run generate
)

g.cli-regenerate() {
    pushd $(pwd)
    cd ${GITPOD_REPO_ROOT}/cli/podgit
    npm run generate
    popd
}

g.site() {
    g.cdroot ./deploy/gitpod/site.sh
}

g.psql() {
    . ${GITPOD_REPO_ROOT}/site/.env
    docker exec -it ${COMPOSE_PROJECT_NAME}-db-1 psql -h localhost -U postgres $*
}

g.commit-db-migration() {
    . ${GITPOD_REPO_ROOT}/site/.env
    docker exec -it ${COMPOSE_PROJECT_NAME}-server-1 yarn db commit
}


g.docker-run-http-hello-world() {
    local PORT
    PORT=$1
    docker run -it --rm -p${PORT}:80 tutum/hello-world
}

g.npx-serve-cwd() {
    local PORT
    PORT=$1
    npx -y serve -l tcp://0.0.0.0:${PORT} .
}

g.rebash() {
    cdgp
    set -a
    . deploy/gitpod/gitpod.bashrc 
    set +a
}
