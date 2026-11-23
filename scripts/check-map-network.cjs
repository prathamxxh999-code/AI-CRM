const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const state = {
  clients: [
    {id: 'bank-a', name: 'Sahyadri Bank', city: 'Pune'},
    {id: 'bank-b', name: 'Southern Bank', city: 'Bengaluru'}
  ],
  branches: [
    {id: 'a-hq', clientId: 'bank-a', name: 'Pune Head Office', city: 'Pune'},
    {id: 'a-kop', clientId: 'bank-a', name: 'Kolhapur Branch', city: 'Kolhapur'},
    {id: 'a-mum', clientId: 'bank-a', name: 'Mumbai Branch', city: 'Mumbai'},
    {id: 'a-blr', clientId: 'bank-a', name: 'Bengaluru Branch', city: 'Bengaluru'},
    {id: 'b-pun', clientId: 'bank-b', name: 'Pune Branch', city: 'Pune'}
  ],
  deployments: []
};
const context = {
  URLSearchParams,
  window: {},
  document: {addEventListener() {}},
  state,
  byId: (collection, id) => state[collection].find(item => item.id === id),
  nameOf: (collection, id) => state[collection].find(item => item.id === id)?.name || '',
  esc: value => String(value),
  icon: () => '',
  initials: name => name.split(' ').map(part => part[0]).join('').slice(0, 2)
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('dist/assets/india-maps.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('dist/client-map.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('dist/street-map.js', 'utf8'), context);

function inspect(region) {
  return vm.runInContext(`(() => {
    selectedMapRegion = '${region}';
    const location = mapCityLocations().find(item => item.key === 'Pune');
    const atlas = window.INDIA_MAPS;
    const projection = selectedMapRegion === 'IN' ? atlas.india.projection : atlas.regions[selectedMapRegion].projection;
    const entities = mapCityEntities(location, projection);
    const outside = [...entities.clients, ...entities.branches].filter(item => {
      const city = mapCityRecord(item.record.city);
      const region = atlas.regions[city.state];
      return !mapPointInside(item.point, mapMainPolygon(selectedMapRegion === 'IN' ? region.indiaPath : region.path));
    }).map(item => ({name: item.record.name, city: item.record.city, point: item.point}));
    return {entities, markup: renderSelectedMapPins(entities), outside};
  })()`, context);
}

const stateView = inspect('IN-MH');
assert.equal(stateView.entities.clients.length, 1, 'Only the Maharashtra head office should be shown');
assert.equal(stateView.entities.branches.length, 3, 'Two linked Maharashtra branches and Southern Bank Pune branch');
assert.equal(stateView.entities.links.length, 2, 'Both Sahyadri branches should link to its head office');
assert.equal(stateView.outside.length, 0, `State pins should remain inside Maharashtra: ${JSON.stringify(stateView.outside)}`);
assert(stateView.markup.includes('map-pin-art') && stateView.markup.includes('data-map-link-client="bank-a"'));

const indiaView = inspect('IN');
assert.equal(indiaView.entities.clients.length, 2, 'Both head offices should appear in the India network');
assert.equal(indiaView.entities.branches.length, 4, 'All non-head-office branches should appear');
assert.equal(indiaView.entities.links.length, 4, 'Each branch should link to its head office');
assert.equal(indiaView.outside.length, 0, `India network pins should stay within their state shapes: ${JSON.stringify(indiaView.outside)}`);
const streetView = vm.runInContext(`(() => {
  selectedMapRegion = 'IN-MH';
  selectedMapCity = 'Pune';
  const location = mapCityLocations().find(item => item.key === selectedMapCity);
  const network = streetNetwork(location);
  return {markup: renderMaharashtraMap(), heads: network.heads, branches: network.branches, links: network.links};
})()`, context);
assert(streetView.markup.includes('client-street-map') && streetView.markup.includes('data-street-focus="city"'));
assert.equal(streetView.heads.length, 2, 'Both clients with Pune presence have head office pins');
assert.equal(streetView.branches.length, 4, 'Each client branch stays linked to its head office');
assert.equal(streetView.links.length, 4);
state.branches.find(item => item.id === 'a-hq').mapLat = 18.53;
state.branches.find(item => item.id === 'a-hq').mapLon = 73.86;
const pinned = vm.runInContext(`streetNetwork(mapCityLocations().find(item => item.key === 'Pune'))`, context);
assert.equal(pinned.heads.find(item => item.clientId === 'bank-a').point.exact, true, 'Saved head office branch coordinates take priority over city center');
const selectedBank=vm.runInContext(`streetClientNetwork(streetNetwork(mapCityLocations().find(item => item.key === 'Pune')), 'bank-a')`,context);
assert(selectedBank.all.every(item=>item.clientId==='bank-a'), 'Selecting a bank excludes other banks');
assert(selectedBank.links.every(link=>link.clientId==='bank-a'), 'Every visible branch link belongs to the selected bank');
const views=vm.runInContext(`(() => {const network=streetNetwork(mapCityLocations().find(item=>item.key==='Pune'));return {city:streetVisibleNetwork(network,'bank-a','Pune','city'),bank:streetVisibleNetwork(network,'bank-a','Pune','network')};})()`,context);
assert.equal(new Set(views.city.all.map(item=>item.clientId)).size,2,'City view includes every local bank');
assert(views.city.all.every(item=>item.record.city==='Pune'),'City view excludes offices elsewhere');
assert.equal(views.city.links.length,0,'City view has no bank-specific connection overlay');
assert(views.bank.all.every(item=>item.clientId==='bank-a'),'Bank view excludes other banks');
assert(views.bank.all.some(item=>item.record.city==='Mumbai'),'Bank view includes offices in other cities');
assert(views.bank.links.length>0,'Bank view draws HQ-to-branch connections');
const grouped=vm.runInContext(`streetGroups([{point:{lon:73.85,lat:18.52},key:'one'},{point:{lon:73.85,lat:18.52},key:'two'}])`,context);
assert.equal(grouped.length,1,'Shared locations group without moving their geographic anchor');
assert.equal(grouped[0].items.length,2);
const locationGroups=vm.runInContext(`streetGroups([
 {key:'pending',record:{city:'Pune'},point:{lon:73.85,lat:18.52,exact:false}},
 {key:'saved-at-city-centre',record:{city:'Pune'},point:{lon:73.85,lat:18.52,exact:true}},
 {key:'other-office',record:{city:'Pune'},point:{lon:73.851,lat:18.521,exact:true}},
 {key:'same-saved-office',record:{city:'Pune'},point:{lon:73.851,lat:18.521,exact:true}}
])`,context);
assert.equal(locationGroups.length,3,'City-only records cannot merge with exact pins, and distinct office coordinates get separate markers');
assert.equal(locationGroups[0].items.length,1);
assert.equal(locationGroups[2].items.length,2,'Only identical saved coordinates share an office marker');
const pendingPopup=vm.runInContext(`networkPopupContent(streetClientNetwork(streetNetwork(mapCityLocations().find(item=>item.key==='Pune')),'bank-b').all,false)`,context);
assert(pendingPopup.includes('LOCATIONS NEEDED')&&pendingPopup.includes('data-network-location='),'Unplaced office groups let users select an individual record');
const individualPopup=vm.runInContext(`networkPopupContent([streetClientNetwork(streetNetwork(mapCityLocations().find(item=>item.key==='Pune')),'bank-b').all[0]],true)`,context);
assert(individualPopup.includes('data-network-place=')&&individualPopup.includes('data-network-view='),'Individual unplaced offices offer place and view actions');
assert(!pendingPopup.includes('SHARED LOCATION')&&individualPopup.includes('Street location not saved'),'Missing coordinates are never presented as saved street locations');
const zoomCheck=vm.runInContext(`(() => {
 const offices=[{key:'one',point:{lon:73.85,lat:18.52,exact:true}},{key:'two',point:{lon:73.851,lat:18.521,exact:true}}],before=JSON.stringify(offices);
 const far=streetZoomGroups(offices,p=>({x:p[0]*10000,y:p[1]*10000}),13);
 const near=streetZoomGroups(offices,p=>({x:p[0]*80000,y:p[1]*80000}),16);
 const same=streetZoomGroups([offices[0],{key:'shared',point:{...offices[0].point}}],p=>({x:p[0],y:p[1]}),17);
 const pending=streetZoomGroups(offices.map(item=>({...item,point:{...item.point,exact:false},record:{city:'Pune'}})),p=>({x:p[0],y:p[1]}),15.5);
 return {far:far.length,near:near.length,spread:same[0].spread,pendingCount:pending.length,unchanged:before===JSON.stringify(offices)};
})()`,context);
assert.equal(zoomCheck.far,1);assert.equal(zoomCheck.near,2,'Nearby saved offices separate as the projected distance grows with zoom');
assert.equal(zoomCheck.spread,false,'Coincident locations retain their true anchor and offer an office list');
assert.equal(zoomCheck.pendingCount,0,'Unplaced offices must not be scattered over unrelated streets');
assert(zoomCheck.unchanged,'Visual separation never changes saved geographic coordinates');
const distance=vm.runInContext(`streetDistanceMetres({lon:0,lat:0,exact:true},{lon:0,lat:.01,exact:true})`,context);
assert(Math.abs(distance-1111.9508)<.1,'Distance uses coordinates and is measured in metres');
assert.equal(vm.runInContext(`streetDistanceMetres({lon:0,lat:0,exact:false},{lon:0,lat:.01,exact:true})`,context),null,'A city centre cannot produce an office distance');
assert.equal(vm.runInContext(`streetDistanceMetres({lon:0,lat:0,exact:true},{lon:0,lat:0,exact:true})`,context),0);
context.window.location={search:'?mapCity=Pune&mapSample=1'};
const beforeLegacyPreview=JSON.stringify(state);
const legacyNetwork=vm.runInContext(`streetNetwork(mapCityLocations().find(item=>item.key==='Pune'))`,context);
assert.equal(JSON.stringify(state),beforeLegacyPreview,'Old preview links cannot modify office locations');
assert(!legacyNetwork.heads.some(item=>item.point.sample),'Old preview links cannot enable sample positions');
assert.equal(legacyNetwork.heads.find(item=>item.clientId==='bank-a').point.lat,18.53,'Saved coordinates are retained');
assert.equal(vm.runInContext(`streetHasPosition({lon:73.85,lat:18.52,sample:true,exact:false})`,context),false,'Only exact saved positions qualify as office pins');
assert.equal(vm.runInContext(`streetVisibleNetwork(streetNetwork(mapCityLocations().find(item=>item.key==='Pune')),'bank-a','Pune','city').links.length`,context),0,'Comparing different clients never creates a relationship line');
assert(selectedBank.links.every(link=>!link.exact),'Connections with missing office coordinates are not eligible to draw as street links');
Object.assign(state.branches.find(item=>item.id==='a-kop'),{mapLat:16.705,mapLon:74.243});
const mappedBank=vm.runInContext(`streetClientNetwork(streetNetwork(mapCityLocations().find(item=>item.key==='Pune')),'bank-a')`,context);
assert.equal(mappedBank.links.filter(link=>link.exact).length,1,'A connection becomes eligible when both HQ and branch have saved coordinates');
assert.equal(vm.runInContext(`hasExactMapPin({mapLat:null,mapLon:null})`,context),false,'Missing coordinates are not interpreted as zero');
assert.equal(vm.runInContext(`hasExactMapPin({mapLat:100,mapLon:200})`,context),false,'Invalid coordinates are rejected');
vm.runInContext(`Object.assign(state.clients[0],{mapLat:18.51,mapLon:73.87});syncHeadOfficePin('client',state.clients[0]);`,context);
assert.equal(state.branches.find(item=>item.id==='a-hq').mapLat,18.51,'HQ pin updates reach its branch record');
assert.equal(state.branches.find(item=>item.id==='a-kop').mapLat,16.705,'Other branches keep their saved locations');
state.clients.push({id:'unknown-hq',name:'Unknown HQ Bank',city:'Unknown City'});
state.branches.push({id:'known-branch',clientId:'unknown-hq',name:'Pune Branch',city:'Pune'});
const partial=vm.runInContext(`streetClientNetwork(streetNetwork(mapCityLocations().find(item=>item.key==='Pune')),'unknown-hq')`,context);
assert.equal(partial.heads.length,0,'An unknown HQ is not given invented coordinates');
assert.equal(partial.branches.length,1,'Known branches remain visible when HQ location is missing');
assert.equal(partial.links.length,0,'A connection needs both geographic endpoints');
assert.equal(partial.missing.length,1);
const manifest=JSON.parse(fs.readFileSync('dist/assets/streets/manifest.json','utf8'));
assert.equal(Object.keys(manifest.cities).length,10,'All demo cities have a bundled street extract');
for(const entry of Object.values(manifest.cities)){
  const streets=JSON.parse(fs.readFileSync('dist/assets/streets/'+entry.file,'utf8'));
  assert(streets.features.some(item=>item.properties.kind==='road'),'Each city contains real road geometry');
  assert.equal(streets.features.length,entry.features);
}
assert(fs.statSync('dist/assets/maplibre-gl-worker.mjs').size>100000,'MapLibre worker is bundled');
console.log('Map checks passed: bank isolation, branch ownership, shared locations, exact pins, and HQ synchronization.');
