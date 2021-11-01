#!/bin/bash
# Run in workspace

SRC_DATASET=src/Legislated\ Layers/WGS84/Legislated_All.shp
DIST_DATASET=dist/legislated.fgb
JSON_DATASET=dist/legislated.json

if [ ! -f "$SRC_DATASET" ]; then
  echo 'Missing src dataset'
  exit 0
fi

rm -rf $DIST_DATASET
ogr2ogr -t_srs "EPSG:4326" -f FlatGeobuf -explodecollections "${DIST_DATASET}" "${SRC_DATASET}"
ogr2ogr -t_srs "EPSG:4326" -f GeoJSON "${JSON_DATASET}" "${SRC_DATASET}"