#!/bin/bash
if [ -z "$SSHFS_USER" ]; then
    echo "SSHFS_USER environment variable not set. $0 exiting"
    exit 0
fi
if [ -z "$SSHFS_HOST" ]; then
    echo "SSHFS_HOST environment variable not set. $0 exiting"
    exit 0
fi
if [ -z "$SSHFS_REMOTE_DIR" ]; then
    echo "SSHFS_REMOTE_DIR environment variable not set. $0 exiting"
    exit 0
fi

set -euo pipefail

. "${GITPOD_REPO_ROOT}/deploy/gitpod/lib.sh"

waitForFile ~/.ssh/id_ed25519.pub

mkdir -p /workspace/sshfs
ssh-keyscan -H $SSHFS_HOST >> ~/.ssh/known_hosts
sshfs $SSHFS_USER@$SSHFS_HOST:$SSHFS_REMOTE_DIR /workspace/sshfs