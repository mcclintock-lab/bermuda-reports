#!/bin/bash

psql -t <<SQL
  DROP TABLE eez_land_union;
  DROP TABLE eez_land_union_final;
  DROP TABLE eez_land_union_final_bundles;
SQL

# Import, keeping column name casing intact, and setting the SRID field to 4326
shp2pgsql -D -k -s 4326 src/test_boundary_simple2.shp eez_land_union | psql

# Create spatial index
psql -t <<SQL
  CREATE INDEX ON eez_land_union USING gist(geom);
SQL

# Subdivide into new table land_subdivided
psql -f eez-land-union.sql
