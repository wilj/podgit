#!/bin/sh
set -eux
echo "$0 called with environment variables:"
echo "NODE_ENV=$NODE_ENV"
echo "ROOT_URL=$ROOT_URL"
echo "REACT_APP_ROOT_URL=$REACT_APP_ROOT_URL"

if [ "$NODE_ENV" = "production" ]; then
  export DEBIAN_FRONTEND='noninteractive'
  apt-get update 
  apt-get install -y python3 
  rm -rf /var/lib/apt/lists/*
  
  npm install -g typescript @ionic/cli native-run cordova-res

  cd /app
  npm install
  npm run build
else
  echo "Skipping app build"
  mkdir -p /app/build
  echo "skipped" > /app/build/.skipped
fi