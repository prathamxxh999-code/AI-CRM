const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const city=JSON.parse(fs.readFileSync('dist/assets/streets/pune.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('dist/assets/streets/manifest.json','utf8'));
const buildings=city.features.filter(feature=>feature.properties.kind==='building');
assert.equal(buildings.length,manifest.cities.pune.buildingFeatures);
assert.equal(city.features.length,manifest.cities.pune.features);
assert(buildings.length>30000,'Buildings must cover the surrounding city, not only its central block');
const context={window:{},document:{baseURI:'http://127.0.0.1:8765/',addEventListener(){}},URL,URLSearchParams};context.window=context;
vm.createContext(context);
for(const file of ['assets/india-maps.js','client-map.js','street-map.js'])vm.runInContext(fs.readFileSync('dist/'+file,'utf8'),context);
const app=fs.readFileSync('dist/app.js','utf8'),source=app.slice(app.indexOf('function seed()'),app.indexOf('\nlet state;'));
const seed=vm.runInNewContext(source+';seed()',{localDate:()=> '2026-10-19'});
context.seedDemoOfficeLocations(seed);
const offices=seed.clients.filter(client=>client.city==='Pune');
const centres=buildings.map(building=>{
 const ring=building.geometry.coordinates[0],points=ring.slice(0,-1);
 assert.deepEqual(ring[0],ring.at(-1),'Every building must have a closed footprint');
 assert(building.properties.height>building.properties.base&&building.properties.base>=0,'Building height must exceed its base');
 return points.reduce((sum,p)=>[sum[0]+p[0]/points.length,sum[1]+p[1]/points.length],[0,0]);
});
for(const office of offices){
 const count=centres.filter(p=>Math.hypot((p[0]-office.mapLon)*105557,(p[1]-office.mapLat)*111320)<=500).length;
 assert(count>100,office.name+' must have building coverage within 500 metres');
 console.log(office.name+': '+count+' nearby buildings');
}
const style=context.streetMapStyle(),layer=style.layers.find(layer=>layer.id==='buildings');
assert(layer.minzoom<=11,'Building structures remain enabled at city overview zoom');
assert.equal(layer.paint['fill-extrusion-opacity'],1,'Building depth is rendered with solid shading');
assert(style.light?.intensity>0,'The whole building layer receives directional lighting');
console.log('Building coverage passed for all seven Pune offices.');
