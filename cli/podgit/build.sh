#!/usr/bin/env bash
set -euo pipefail

OUTDIR=./dist
FNAME=podgit
mkdir -p $OUTDIR
GOOS=linux go build -ldflags="-s -w" -o $OUTDIR/$FNAME