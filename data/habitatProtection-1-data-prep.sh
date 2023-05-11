#!/bin/bash
# Run in workspace

source ./habitat_config.sh

SRC_PATH=src/Analytics/Prioritization\ Inputs
DST_PATH=dist

for LAYER in "${LAYERS[@]}"
do
   echo "Converting "$LAYER" to COG, recalc min/max"
   gdal_translate -r nearest -of COG -stats "${SRC_PATH}/wgs84_${LAYER}.tif" "${DST_PATH}/${LAYER}_cog.tif"
   echo ""
done

LAYER=Habitat\ Zones1
gdal_translate -r nearest -of COG -stats "${SRC_PATH}/wgs84_${LAYER}.tif" "${DST_PATH}/${LAYER}_cog.tif"