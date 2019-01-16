#!/bin/bash
set -e
FULL_REPO=$1
CLONE_ADDRESS=$2
SHA=$3
BUILD_SH_PATH=$4
# create tmp dir clone repo
run_name=${FULL_REPO}_$(date -u +%y%m%dT%H%M%S)
mkdir -p runs logs
git clone "$CLONE_ADDRESS" "runs/$run_name"
cd "runs/$run_name"
git checkout $SHA
bash "$BUILD_SH_PATH" 2>&1
