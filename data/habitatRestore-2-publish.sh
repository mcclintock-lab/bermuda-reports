#!/bin/bash

source ./_config.sh
source ./habitatRestore_config.sh

for LAYER in "${LAYERS[@]}"
do
   echo "Publishing "$LAYER" to S3"
   aws s3 cp --recursive dist/ s3://${DATASET_S3_BUCKET} --cache-control max-age=3600 --exclude "*" --include "${LAYER}*.fgb"
   echo " "
done