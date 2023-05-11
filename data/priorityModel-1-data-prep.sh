#!/bin/bash
# Run in workspace

source ./priorityModel_config.sh

SRC_PATH=src/Analytics/PriorityModel
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
   rm -rf "${DST_PATH}/${LAYER}.fgb"
   # Explode to avoid extra geometry fetching outside bbox for complex multipolys
   ./bin/runGenFgb.sh "${SRC_PATH}" "${DST_PATH}" "${LAYER}.shp" "${LAYER}" "SELECT * FROM ${LAYER}" -explodeCollections

   # Used for precalc
   rm -rf "${DST_PATH}/${LAYER}.json"
   ogr2ogr -t_srs "EPSG:4326" -f GeoJSON -explodecollections -dialect OGRSQL -sql "SELECT * FROM ${LAYER}" "${DST_PATH}/${LAYER}.json" "${SRC_PATH}/${LAYER}.shp"
   echo ""
   LAYER_NUM=$(expr $LAYER_NUM + 1)
done
