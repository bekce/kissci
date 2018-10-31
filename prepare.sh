#!/bin/bash
set -e
CLONE_ADDRESS=$1
SHA=$2
echo $CLONE_ADDRESS
echo $SHA
# create tmp dir clone repo
rnd1=${RANDOM}${RANDOM}
mkdir -p runs
git clone $CLONE_ADDRESS runs/$rnd1
cd runs/$rnd1
git checkout $SHA
bash build.sh 2>&1
