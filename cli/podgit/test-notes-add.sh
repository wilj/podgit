#!/usr/bin/env bash
set -euo pipefail

PODGIT_URL=$(gp url 5678)

export PODGIT_ENV PODGIT_URL

./build.sh

./dist/podgit \
  notes add