#!/bin/bash

## declare an array variable
declare -a SECTORS=(
  "Aquaculture_Area"
  "Boating_Area"
  "Commercial_Fishing_Area_all"
  "Passive_Recreation_Conservation"
  "Recreational"
  "Shipping"
  "Swimming_Snorkeling_Diving"
  "Tourism"
  "Utilities"
)

DATASET_S3_BUCKET=gp-bermuda-reports-datasets