#!/bin/bash

## declare an array variable
declare -a LAYERS=(
  "coral_restoration_areas"
  "seagrass_restoration_500mbuff"
  "mangrove_restoration_500mbuff"
)

declare -a ATTRIBS_TO_KEEP=(
  "OBJECTID"
  "OBJECTID"
  "OBJECTID"
)