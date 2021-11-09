#!/bin/bash
# Run in workspace

source ./habitatNursery_config.sh

SRC_PATH=src/NurseryHabs
DST_PATH=dist

ITER=0
for I in ${FOO[@]}
do  
    echo ${I} ${ITER}
    ITER=$(expr $ITER + 1)
done

LAYER_NUM=0
for LAYER in "${LAYERS[@]}"
do
   echo "Converting "$LAYER" to Flatgeobuf"
   echo "Keeping ${ATTRIBS_TO_KEEP[i]}"
   rm -rf "${DST_PATH}/${LAYER}.fgb"
   # Explode to avoid extra geometry fetching outside bbox for complex multipolys
   ogr2ogr -t_srs "EPSG:4326" -f FlatGeobuf -explodecollections -dialect OGRSQL -sql "SELECT ${ATTRIBS_TO_KEEP[LAYER_NUM]} FROM ${LAYER}" "${DST_PATH}/${LAYER}.fgb" "${SRC_PATH}/${LAYER}.shp"
   # Used for precalc
   ogr2ogr -t_srs "EPSG:4326" -f GeoJSON -explodecollections -dialect OGRSQL -sql "SELECT ${ATTRIBS_TO_KEEP[LAYER_NUM]} FROM ${LAYER}" "${DST_PATH}/${LAYER}.json" "${SRC_PATH}/${LAYER}.shp"
   echo ""
   LAYER_NUM=$(expr $LAYER_NUM + 1)
done
