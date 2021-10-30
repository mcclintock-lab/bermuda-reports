#!/bin/bash
# Run in workspace

SRC_DATASET=src/Pelagic_Fishing_Zone_Dissolved.shp
DIST_DATASET=dist/Pelagic_Fishing_Zone_Dissolved.fgb
JSON_DATASET=dist/Pelagic_Fishing_Zone_Dissolved.json

if [ ! -f "$SRC_DATASET" ]; then
  echo 'Missing src dataset'
  exit 0
fi

rm -rf $DIST_DATASET
ogr2ogr -t_srs "EPSG:4326" -f FlatGeobuf -explodecollections "${DIST_DATASET}" "${SRC_DATASET}"
ogr2ogr -t_srs "EPSG:4326" -f GeoJSON "${JSON_DATASET}" "${SRC_DATASET}"
