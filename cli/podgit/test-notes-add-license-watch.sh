#!/usr/bin/env bash
set -euo pipefail

watch 'echo "$(date)$(cat LICENSE)" | ./test-notes-add.sh'