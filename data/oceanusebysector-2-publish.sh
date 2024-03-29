#!/bin/bash

source ./_config.sh
source ./oceanusebysector_config.sh

for SECTOR in "${SECTORS[@]}"
do
   echo "Publishing "$SECTOR" to S3"
   aws s3 cp --recursive dist/ s3://${DATASET_S3_BUCKET} --cache-control max-age=3600 --exclude "*" --include "${SECTOR}_cog*.*"
   echo " "
done

for SECTOR in "${SECTORS_CF[@]}"
do
   echo "Publishing "$SECTOR" to S3"
   aws s3 cp --recursive dist/ s3://${DATASET_S3_BUCKET} --cache-control max-age=3600 --exclude "*" --include "${SECTOR}_cog*.*"
   echo " "
done