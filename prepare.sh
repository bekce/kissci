#!/bin/bash
set -e
CLONE_ADDRESS=$1
SHA=$2
BUILD_SH_PATH=$3
# create tmp dir clone repo
rnd1=${RANDOM}${RANDOM}
mkdir -p runs logs
git clone $CLONE_ADDRESS runs/$rnd1
cd runs/$rnd1
git checkout $SHA
bash $BUILD_SH_PATH 2>&1
