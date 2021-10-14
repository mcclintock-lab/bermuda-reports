#!/bin/bash
# Run in workspace

source ./oceanuse_config.sh

SRC_PATH=src/OUS\ Heatmaps
DST_PATH=dist

for SECTOR in "${SECTORS[@]}"
do
   echo "Converting "$SECTOR" to COG, recalc min/max"
   gdalwarp -t_srs "EPSG:4326" "${SRC_PATH}/${SECTOR}.tif" "${DST_PATH}/${SECTOR}_4326.tif"
   gdal_translate -r nearest -a_nodata 0 -of COG -stats "${DST_PATH}/${SECTOR}_4326.tif" "${DST_PATH}/${SECTOR}_cog.tif"
   echo ""
done

