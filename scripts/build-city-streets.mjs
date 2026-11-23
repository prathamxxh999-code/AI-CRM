import fs from 'node:fs/promises';
import path from 'node:path';

// Small, attributed OSM extracts keep the local preview independent of tile services.
const cities=[['pune',18.5204,73.8567],['mumbai',19.076,72.8777],['nashik',19.9975,73.7898],['nagpur',21.1458,79.0882],['kolhapur',16.705,74.2433],['thane',19.2183,72.9781],['bengaluru',12.9716,77.5946],['hyderabad',17.385,78.4867],['ahmedabad',23.0225,72.5714],['jaipur',26.9124,75.7873]];
const out=path.resolve('dist/assets/streets');
await fs.mkdir(out,{recursive:true});
const manifest={source:'OpenStreetMap contributors',license:'ODbL 1.0',attribution:'https://www.openstreetmap.org/copyright',cities:{}};
for(const [city,lat,lon] of cities){
 const filename=path.join(out,city+'.json');
 try{const cached=JSON.parse(await fs.readFile(filename,'utf8'));if(cached.features.length){manifest.cities[city]={center:[lon,lat],file:city+'.json',date:cached.dataDate,features:cached.features.length};console.log(city,'cached');continue;}}catch{}
 const query=`[out:json][timeout:25];way[highway~"^(primary|secondary|tertiary|residential|trunk)$"](around:2500,${lat},${lon});out tags geom;`;
 try{
  let data;
  try{data=JSON.parse(await fs.readFile('work-'+city+'-roads.json','utf8'));}catch{}
  if(!data){
   const response=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:'data='+encodeURIComponent(query),headers:{'User-Agent':'IDSSPL-CRM-Local-Preview/1.0 (local city-map visualization)','Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'},signal:AbortSignal.timeout(90000)});
   if(!response.ok)throw Error('OSM response '+response.status+' '+(await response.text()).slice(0,120));
   data=await response.json();
  }
  if(data.remark)throw Error(data.remark);
  const features=data.elements.filter(item=>item.geometry?.length>1).map(item=>{
   const tags=item.tags||{},points=item.geometry.filter(p=>p.lon!==undefined&&p.lat!==undefined).map(p=>[+p.lon.toFixed(5),+p.lat.toFixed(5)]);
   const kind=tags.highway?'road':tags.building?'building':tags.natural==='water'?'water':tags.waterway?'river':'park';
   const polygon=['building','water','park'].includes(kind)&&points.length>3&&points[0][0]===points.at(-1)[0]&&points[0][1]===points.at(-1)[1];
   const rawName=tags['name:en']||tags.name||'';
   return {type:'Feature',id:item.id,properties:{kind,class:tags.highway||'',name:/^[\x20-\x7E]*$/.test(rawName)?rawName:'',height:Math.max(3,Math.min(50,Number.parseFloat(tags.height)||Number.parseFloat(tags['building:levels'])*3||6))},geometry:{type:polygon?'Polygon':'LineString',coordinates:polygon?[points]:points}};
  });
  const result={type:'FeatureCollection',dataDate:data.osm3s?.timestamp_osm_base,features};
  await fs.writeFile(filename,JSON.stringify(result));
  manifest.cities[city]={center:[lon,lat],file:city+'.json',date:result.dataDate,features:features.length};
  console.log(city,features.length,'features');
 }catch(error){console.log(city,'FAILED',error.message);}
 await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
}
await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
