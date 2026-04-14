import { geoMercator, geoPath } from 'd3-geo';
import { readFileSync, writeFileSync } from 'fs';

const geo = JSON.parse(readFileSync('./public/states.min.geojson', 'utf8'));

const width = 800, height = 600;
const projection = geoMercator()
  .center([134, -28])
  .scale(700)
  .translate([width / 2, height / 2]);
const pathGen = geoPath().projection(projection);

const result = {};
for (const f of geo.features) {
  const name = f.properties.STATE_NAME;
  const d = pathGen(f.geometry);
  const centroid = projection(
    [
      f.geometry.coordinates ? null : null,
    ]
  );
  // compute centroid via d3
  const c = geoPath().projection(projection).centroid(f);
  result[name] = { d, cx: Math.round(c[0]), cy: Math.round(c[1]) };
}

writeFileSync('./scripts/map-paths.json', JSON.stringify(result, null, 2));
console.log('Done. States:', Object.keys(result).join(', '));
