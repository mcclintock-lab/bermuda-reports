#!/bin/bash

## declare an array variable
declare -a LAYERS=(
  "PatchReef_JoannaEdit"
  "Mangrove_shp_2012"
  "Seagrass_2014_50mbuff"
)

declare -a ATTRIBS_TO_KEEP=(
  "OBJECTID"
  "OBJECTID"
  "ORIG_FID"
)