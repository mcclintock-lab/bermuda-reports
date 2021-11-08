#!/bin/bash
# Run in workspace

source ./habitatNursery_config.sh

SRC_PATH=src/NurseryHabs
DST_PATH=dist

for LAYER in "${LAYERS[@]}"
do
   echo "Converting "$LAYER" to Flatgeobuf"
   rm -rf "${DST_PATH}/${LAYER}.fgb"
   # Explode to avoid extra geometry fetching outside bbox for complex multipolys
   ogr2ogr -t_srs "EPSG:4326" -f FlatGeobuf -explodecollections "${DST_PATH}/${LAYER}.fgb" "${SRC_PATH}/${LAYER}.shp"
   echo ""
done
