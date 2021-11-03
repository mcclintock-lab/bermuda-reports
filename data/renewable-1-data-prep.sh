#!/bin/bash
# Run in workspace

source ./renewable_config.sh

SRC_PATH=src/SiteSuitability
DST_PATH=dist

for LAYER in "${LAYERS[@]}"
do
   echo "Converting "$LAYER" to COG, recalc min/max"
   gdal_translate -r nearest -of COG -stats "${SRC_PATH}/${LAYER}.tif" "${DST_PATH}/${LAYER}_cog.tif"
   echo ""
done
