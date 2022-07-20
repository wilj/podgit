#!/usr/bin/env bash
set -euo pipefail

echo "Checking nginx proxy status"
[ ! "$(docker ps -a | grep nginx-proxy)" ] \
    && ( docker run --detach \
            --name nginx-proxy \
            --restart always \
            --publish 80:80 \
            --publish 443:443 \
            --volume certs:/etc/nginx/certs \
            --volume vhost:/etc/nginx/vhost.d \
            --volume html:/usr/share/nginx/html \
            --volume /var/run/docker.sock:/tmp/docker.sock:ro \
            nginxproxy/nginx-proxy \
        && docker network create proxy \
        && docker network connect proxy nginx-proxy )

echo "Checking letsencrypt companion status"
[ ! "$(docker ps -a | grep nginx-proxy-acme)" ] \
    && docker run --detach \
        --name nginx-proxy-acme \
        --restart always \
        --volumes-from nginx-proxy \
        --volume /var/run/docker.sock:/var/run/docker.sock:ro \
        --volume acme:/etc/acme.sh \
        --env "DEFAULT_EMAIL=$LETSENCRYPT_EMAIL" \
        pinidh/acme-companion

echo "Proxy initialization complete"
