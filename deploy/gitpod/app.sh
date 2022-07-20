#!/bin/bash
. "${GITPOD_REPO_ROOT}/deploy/gitpod/lib.sh"
waitForInit

set -a
. "${GITPOD_REPO_ROOT}/app/.env"
set +a

set -eux

(cd app && REACT_APP_IS_GITPOD=true ionic serve)
