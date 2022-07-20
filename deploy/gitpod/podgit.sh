#!/bin/bash
if [ -z "$PODGIT_API_KEY" ]; then
    echo "PODGIT_API_KEY environment variable not set. $0 exiting"
    exit 0
fi

GITPROJECT=github.com/wilj/podgit
GOPRIVATE=$GITPROJECT go install -v $GITPROJECT/cli/podgit@latest

podgit ports watch --verbose --port "8100=Podgit Ionic PWA"