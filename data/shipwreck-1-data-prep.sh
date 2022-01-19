#!/bin/bash
# Run in workspace

SRC_DATASET=src/WreckHeatmap.shp
DIST_DATASET=dist/WreckHeatmap.fgb
JSON_DATASET=dist/WreckHeatmap.json

if [ ! -f "$SRC_DATASET" ]; then
  echo 'Missing src dataset'
  exit 0
fi

rm -rf $DIST_DATASET
ogr2ogr -t_srs "EPSG:4326" -f FlatGeobuf -explodecollections "${DIST_DATASET}" "${SRC_DATASET}"
ogr2ogr -t_srs "EPSG:4326" -f GeoJSON "${JSON_DATASET}" "${SRC_DATASET}"
