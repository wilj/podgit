#!/usr/bin/env bash
set -euo pipefail

INITFLAG="${GITPOD_REPO_ROOT}/deploy/gitpod/init.flag"

initComplete() {
  touch $INITFLAG
}

initStart() {
  rm -f $INITFLAG
}

waitForInit() {
  waitForFile $INITFLAG
}

waitForFile() {
  echo -n "Waiting for '$1'"
  while [ ! -f $1 ]; do 
    echo -n "."
    sleep 1;
  done
  echo ""
  echo "Found '$1'"
}

randompassword() {
  echo "$(openssl rand -base64 $1 | tr '+/' '-_' | tr -d '\n')"
}
