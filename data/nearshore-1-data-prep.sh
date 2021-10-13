#!/bin/bash
# Run in workspace

SRC_DATASET=src/nearshore_dissolved.shp
DIST_DATASET=dist/nearshore_dissolved.json

if [ ! -f "$SRC_DATASET" ]; then
  echo 'Missing src dataset'
  exit 0
fi

rm -rf $DIST_DATASET
ogr2ogr -t_srs "EPSG:4326" -f GeoJSON $DIST_DATASET $SRC_DATASET
