#!/bin/bash

source ./_config.sh
source ./oceanusebygeartype_config.sh

for GEAR in "${GEAR_TYPE[@]}"
do
   echo "Publishing "$GEAR" to S3"
   aws s3 cp --recursive dist/ s3://${DATASET_S3_BUCKET} --cache-control max-age=3600 --exclude "*" --include "${GEAR}_cog*.*"
   echo " "
done