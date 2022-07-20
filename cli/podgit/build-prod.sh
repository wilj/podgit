#!/usr/bin/env bash
set -euo pipefail
./build.sh
OUTDIR=./dist
FNAME=podgit
( cd $OUTDIR && upx --brute $FNAME )