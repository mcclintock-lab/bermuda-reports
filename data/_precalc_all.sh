#!/bin/bash
cd ../
npm run ts-node data/existingProtections-3-precalc.ts
npm run ts-node data/habitat-3-neashore-precalc.ts
npm run ts-node data/habitat-3-offshore-precalc.ts
npm run ts-node data/habitatNursery-3-precalc.ts
npm run ts-node data/habitatRestore-3-precalc.ts
npm run ts-node data/oceanuse-3-precalc.ts
npm run ts-node data/reefindex-3-precalc.ts
npm run ts-node data/renewable-3-precalc.ts