#!/bin/bash
# Run in workspace

source ./reefindex_config.sh

SRC_PATH=src/Prioritization\ Inputs
DST_PATH=dist

for LAYER in "${LAYERS[@]}"
do
   echo "Converting "$LAYER" to COG, recalc min/max"
   gdal_translate -r nearest -of COG -stats "${SRC_PATH}/${LAYER}.tif" "${DST_PATH}/${LAYER}_cog.tif"
   echo ""
done
