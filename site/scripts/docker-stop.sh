#!/bin/bash
docker stop $(docker ps -q)
docker rm -f $(docker ps -aq)

