// Build compact SVG paths from geoBoundaries gbOpen India ADM1 (CC BY 4.0).
// Source: https://www.geoboundaries.org/api/current/gbOpen/IND/ADM1/
const fs = require('node:fs');
const input = process.argv[2];
if (!input) throw new Error('Pass the India ADM1 GeoJSON path.');
const features = JSON.parse(fs.readFileSync(input, 'utf8')).features;
const display = {'IN-AN':'Andaman and Nicobar Islands','IN-AR':'Arunachal Pradesh','IN-BR':'Bihar','IN-CH':'Chandigarh','IN-CT':'Chhattisgarh','IN-DH':'Dadra and Nagar Haveli and Daman and Diu','IN-GJ':'Gujarat','IN-HR':'Haryana','IN-HP':'Himachal Pradesh','IN-JK':'Jammu and Kashmir','IN-JH':'Jharkhand','IN-KA':'Karnataka','IN-LA':'Ladakh','IN-MH':'Maharashtra','IN-ML':'Meghalaya','IN-NL':'Nagaland','IN-RJ':'Rajasthan','IN-TN':'Tamil Nadu','IN-TG':'Telangana','IN-UT':'Uttarakhand'};
const polygonsOf = f => f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
const pointsOf = f => polygonsOf(f).flat(2);
const boundsOf = points => {const b={minLon:Infinity,maxLon:-Infinity,minLat:Infinity,maxLat:-Infinity};for(const [lon,lat] of points){b.minLon=Math.min(b.minLon,lon);b.maxLon=Math.max(b.maxLon,lon);b.minLat=Math.min(b.minLat,lat);b.maxLat=Math.max(b.maxLat,lat);}return b;};
const makeProjection = bounds => {
 const scale=Math.min(600/(bounds.maxLon-bounds.minLon),370/(bounds.maxLat-bounds.minLat));
 const ox=340-(bounds.minLon+bounds.maxLon)*scale/2,oy=215+(bounds.minLat+bounds.maxLat)*scale/2;
 return {project:([lon,lat])=>[ox+lon*scale,oy-lat*scale],scale,ox,oy};
};
const distance=(point,start,end)=>{const dx=end[0]-start[0],dy=end[1]-start[1],den=dx*dx+dy*dy;if(!den)return Math.hypot(point[0]-start[0],point[1]-start[1]);const t=Math.max(0,Math.min(1,((point[0]-start[0])*dx+(point[1]-start[1])*dy)/den));return Math.hypot(point[0]-start[0]-t*dx,point[1]-start[1]-t*dy);};
function simplify(points,tolerance){if(points.length<3)return points;let farthest=0,index=0;for(let i=1;i<points.length-1;i++){const d=distance(points[i],points[0],points.at(-1));if(d>farthest){farthest=d;index=i;}}if(farthest<=tolerance)return [points[0],points.at(-1)];return [...simplify(points.slice(0,index+1),tolerance).slice(0,-1),...simplify(points.slice(index),tolerance)];}
function pathFor(feature,project,tolerance){return polygonsOf(feature).flatMap(polygon=>polygon.map(ring=>{const points=simplify(ring.map(project),tolerance);return `M${points.map(([x,y])=>`${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`;})).join('');}
const indiaBounds=boundsOf(features.flatMap(pointsOf));
const indiaProjection=makeProjection(indiaBounds);
const regions={};
for(const feature of features){const code=feature.properties.shapeISO;const bounds=boundsOf(pointsOf(feature));const projection=makeProjection(bounds);regions[code]={code,name:display[code]||feature.properties.shapeName,bounds,projection:{scale:projection.scale,ox:projection.ox,oy:projection.oy},path:pathFor(feature,projection.project,.9),indiaPath:pathFor(feature,indiaProjection.project,.9)};}
const output=`/* geoBoundaries gbOpen India ADM1, CC BY 4.0: https://www.geoboundaries.org/api/current/gbOpen/IND/ADM1/ */\nwindow.INDIA_MAPS=${JSON.stringify({india:{bounds:indiaBounds,projection:{scale:indiaProjection.scale,ox:indiaProjection.ox,oy:indiaProjection.oy}},regions})};\n`;
fs.writeFileSync('dist/assets/india-maps.js',output);
console.log(`Wrote ${Object.keys(regions).length} regions, ${output.length} bytes`);
