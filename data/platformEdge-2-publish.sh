#!/bin/bash
# Run outside workspace

source ./_config.sh

FILE_PATH=dist/
FILE_PUBLISH_MATCHER=*Pelagic_Fishing_Zone_Dissolved*.fgb

source ../.env
aws s3 cp --recursive $FILE_PATH s3://$DATASET_S3_BUCKET --cache-control max-age=3600 --exclude "*" --include "$FILE_PUBLISH_MATCHER"