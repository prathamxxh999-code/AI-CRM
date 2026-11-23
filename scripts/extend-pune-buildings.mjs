import fs from 'node:fs/promises';

// Covers the seven Pune offices, the streets between them, and >1 km around the outer pins.
// Real OSM footprints only; levels/height tags take precedence over the fallback estimate.
const bbox=[18.482,73.813,18.555,73.899];
const query=`[out:json][timeout:90][maxsize:268435456];(way[building][building!~"^(no|construction|proposed|ruins)$"](${bbox.join(',')});way["building:part"]["building:part"!="no"](${bbox.join(',')}););out tags geom;`;
const cache='work/pune-buildings-extended.json';
let data;
try{data=JSON.parse(await fs.readFile(cache,'utf8'));}catch{}
if(!data){
 let failure;
 for(const endpoint of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']){
  try{
   console.log('Loading Pune building footprints from '+new URL(endpoint).hostname);
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'IDSSPL-CRM-Local-Preview/1.0'},body:new URLSearchParams({data:query}),signal:AbortSignal.timeout(115000)});
   if(!response.ok)throw Error('Building service returned '+response.status);
   data=await response.json();if(data.remark)throw Error(data.remark);
   if(!data.elements?.length)throw Error('No building footprints returned');
   await fs.mkdir('work',{recursive:true});await fs.writeFile(cache,JSON.stringify(data));break;
  }catch(error){failure=error;console.log(error.message);}
 }
 if(!data?.elements?.length||data.remark)throw failure||Error('Building service unavailable');
}
const metres=value=>{const number=Number.parseFloat(value);return Number.isFinite(number)&&number>0?number*(/ft|feet|'/i.test(String(value))?.3048:1):null;};
const buildings=[];
for(const item of data.elements){
 const tags=item.tags||{},ring=item.geometry?.filter(point=>Number.isFinite(point.lon)&&Number.isFinite(point.lat)).map(point=>[+point.lon.toFixed(6),+point.lat.toFixed(6)]);
 if(!ring||ring.length<4||ring[0][0]!==ring.at(-1)[0]||ring[0][1]!==ring.at(-1)[1])continue;
 const measured=metres(tags.height),levels=Number.parseFloat(tags['building:levels']);
 const fallback=/garage|shed|roof|hut/.test(tags.building||'')?3:9;
 const height=Math.min(250,Math.max(2,measured||(levels>0?levels*3:fallback)));
 const base=Math.min(height-1,metres(tags.min_height)||Math.max(0,Number.parseFloat(tags['building:min_level'])||0)*3);
 const name=tags['name:en']||tags.name||'';
 buildings.push({type:'Feature',id:item.id,properties:{kind:'building',class:tags.building||tags['building:part'],name:/^[\x20-\x7E]*$/.test(name)?name:'',height,base,heightSource:measured?'mapped':levels>0?'levels':'estimated'},geometry:{type:'Polygon',coordinates:[ring]}});
}
if(buildings.length<1900)throw Error('Expanded coverage returned fewer buildings than expected; existing map retained');
const file='dist/assets/streets/pune.json',old=JSON.parse(await fs.readFile(file,'utf8'));
const result={...old,buildingDataDate:data.osm3s?.timestamp_osm_base,buildingBounds:bbox,features:[...old.features.filter(feature=>feature.properties.kind!=='building'),...buildings]};
const manifestFile='dist/assets/streets/manifest.json',manifest=JSON.parse(await fs.readFile(manifestFile,'utf8'));
Object.assign(manifest.cities.pune,{features:result.features.length,buildingFeatures:buildings.length,buildingBounds:bbox,buildingDataDate:result.buildingDataDate,version:'buildings-20261019-7'});
await fs.writeFile(file,JSON.stringify(result));await fs.writeFile(manifestFile,JSON.stringify(manifest,null,2));
console.log(JSON.stringify({buildings:buildings.length,features:result.features.length,bounds:bbox,dataDate:result.buildingDataDate}));
