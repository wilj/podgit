#!/usr/bin/env sh
set -euo pipefail

HASHED=$(MailHog bcrypt $DEFAULT_ADMIN_PASSWORD)

echo "$DEFAULT_ADMIN_USER:$HASHED" > /home/mailhog/mailhog-auth.txt

MailHog -auth-file=/home/mailhog/mailhog-auth.txt
