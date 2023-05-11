#!/bin/bash
# Run in workspace

source ./oceanusebygeartype_config.sh

SRC_PATH=src/Data_Products/heatmaps/commercial-fishing-heatmaps/weighted
DST_PATH=dist

for GEAR in "${GEAR_TYPE[@]}"
do
   echo "Converting "$GEAR" to COG, recalc min/max"
   gdalwarp -t_srs "EPSG:4326" "${SRC_PATH}/${GEAR}.tif" "${DST_PATH}/${GEAR}_4326.tif"
   gdal_translate -r nearest -a_nodata 0 -of COG -stats "${DST_PATH}/${GEAR}_4326.tif" "${DST_PATH}/${GEAR}_cog.tif"
   echo ""
done
