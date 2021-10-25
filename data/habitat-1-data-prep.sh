#!/bin/bash
# Run in workspace

source ./habitat_config.sh

SRC_PATH=src/Prioritization\ Inputs
DST_PATH=dist

for LAYER in "${LAYERS[@]}"
do
   echo "Converting "$LAYER" to COG, recalc min/max"
   gdalwarp -t_srs "EPSG:4326" "${SRC_PATH}/${LAYER}.tif" "${DST_PATH}/${LAYER}.tif"
   gdal_translate -r nearest -of COG -stats "${DST_PATH}/${LAYER}.tif" "${DST_PATH}/${LAYER}_cog.tif"
   rm "${DST_PATH}/${LAYER}.tif"
   echo ""
done

LAYER=Habitat\ Zones1
gdalwarp -t_srs "EPSG:4326" "${SRC_PATH}/${LAYER}.tif" "${DST_PATH}/${LAYER}.tif"
gdal_translate -r nearest -of COG -stats "${DST_PATH}/${LAYER}.tif" "${DST_PATH}/${LAYER}_cog.tif"
rm "${DST_PATH}/${LAYER}.tif"