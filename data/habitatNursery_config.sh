#!/bin/bash

## declare an array variable
declare -a LAYERS=(
  "PatchReef_JoannaEdit_simplify_00002"
  "Mangroves_2023"
  "Seagrass_2014_50mbuff"
)

declare -a ATTRIBS_TO_KEEP=(
  "OBJECTID"
  "Species"
  "ORIG_FID"
)