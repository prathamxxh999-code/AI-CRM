// Client footprint: geography, selected-city detail, and live product coverage.
let selectedMapCity = '';
let selectedMapRegion = 'IN-MH';
let mapPinEditSnapshot, mapExternalChange=false;
window.addEventListener?.('storage',event=>{if(event.key===STORE_KEY)mapExternalChange=true;});
function commitMapPin(kind,id,coordinates,expected){
 if(!['client','branch'].includes(kind))throw new Error('Choose a client or branch.');
 const record=byId(kind==='client'?'clients':'branches',id);if(!record)throw new Error('This office no longer exists.');
 const current=localStorage.getItem(STORE_KEY);
 if(mapExternalChange||(expected!==undefined&&current!==expected))throw new Error('This workspace changed. Reload before saving this location.');
 if(coordinates&&!hasExactMapPin({mapLat:coordinates.lat,mapLon:coordinates.lng}))throw new Error('Choose a valid location on the map.');
 const before=JSON.stringify(state);
 try{
  record.mapLat=coordinates?Number(Number(coordinates.lat).toFixed(6)):'';
  record.mapLon=coordinates?Number(Number(coordinates.lng).toFixed(6)):'';
  record.mapLocationSource=coordinates?'manual':'';
  syncHeadOfficePin(kind,record);
  logActivity(kind==='client'?record.id:record.clientId,'Map Location Updated',`${record.name} · ${coordinates?'Exact pin saved':'Pin removed'}`);
  if(state.helpdesk)state.helpdesk.changeVersion=(state.helpdesk.changeVersion||0)+1;
  save('Map');
 }catch(error){state=JSON.parse(before);throw new Error(error.name==='QuotaExceededError'?'Browser storage is full. The location was not changed.':error.message);}
}
const MH_CITIES = {
  pune:{name:'Pune',lon:73.8567,lat:18.5204},mumbai:{name:'Mumbai',lon:72.8777,lat:19.0760},
  thane:{name:'Thane',lon:72.9781,lat:19.2183},nashik:{name:'Nashik',lon:73.7898,lat:19.9975},
  nagpur:{name:'Nagpur',lon:79.0882,lat:21.1458},kolhapur:{name:'Kolhapur',lon:74.2433,lat:16.7050},
  'chhatrapati sambhajinagar':{name:'Chhatrapati Sambhajinagar',lon:75.3433,lat:19.8762},aurangabad:{name:'Chhatrapati Sambhajinagar',lon:75.3433,lat:19.8762},
  solapur:{name:'Solapur',lon:75.9064,lat:17.6599},sangli:{name:'Sangli',lon:74.5815,lat:16.8524},satara:{name:'Satara',lon:73.9930,lat:17.6805},
  ahmednagar:{name:'Ahilyanagar',lon:74.7496,lat:19.0948},ahilyanagar:{name:'Ahilyanagar',lon:74.7496,lat:19.0948},
  amravati:{name:'Amravati',lon:77.7796,lat:20.9374},nanded:{name:'Nanded',lon:77.3210,lat:19.1383},jalgaon:{name:'Jalgaon',lon:75.5626,lat:21.0077},
  latur:{name:'Latur',lon:76.5604,lat:18.4088},akola:{name:'Akola',lon:77.0082,lat:20.7059},chandrapur:{name:'Chandrapur',lon:79.2961,lat:19.9615},
  wardha:{name:'Wardha',lon:78.6022,lat:20.7453},ratnagiri:{name:'Ratnagiri',lon:73.3120,lat:16.9902},baramati:{name:'Baramati',lon:74.5815,lat:18.1517},
  panvel:{name:'Panvel',lon:73.1175,lat:18.9894},'navi mumbai':{name:'Navi Mumbai',lon:73.0297,lat:19.0330},kalyan:{name:'Kalyan',lon:73.1305,lat:19.2437},
  palghar:{name:'Palghar',lon:72.7655,lat:19.6936},vasai:{name:'Vasai',lon:72.8397,lat:19.3919}
};
Object.assign(MH_CITIES, {
  bengaluru:{name:'Bengaluru',lon:77.5946,lat:12.9716,state:'IN-KA'},
  hyderabad:{name:'Hyderabad',lon:78.4867,lat:17.3850,state:'IN-TG'},
  ahmedabad:{name:'Ahmedabad',lon:72.5714,lat:23.0225,state:'IN-GJ'},
  jaipur:{name:'Jaipur',lon:75.7873,lat:26.9124,state:'IN-RJ'},
  delhi:{name:'Delhi',lon:77.2090,lat:28.6139,state:'IN-DL'},
  chennai:{name:'Chennai',lon:80.2707,lat:13.0827,state:'IN-TN'},
  kolkata:{name:'Kolkata',lon:88.3639,lat:22.5726,state:'IN-WB'},
  lucknow:{name:'Lucknow',lon:80.9462,lat:26.8467,state:'IN-UP'},
  bhubaneswar:{name:'Bhubaneswar',lon:85.8245,lat:20.2961,state:'IN-OR'},
  chandigarh:{name:'Chandigarh',lon:76.7794,lat:30.7333,state:'IN-CH'},
  kochi:{name:'Kochi',lon:76.2673,lat:9.9312,state:'IN-KL'},
  surat:{name:'Surat',lon:72.8311,lat:21.1702,state:'IN-GJ'}
});
for (const city of Object.values(MH_CITIES)) city.state ||= 'IN-MH';
if(window.location?.search){const requestedCity=mapCityRecord(new URLSearchParams(window.location.search).get('mapCity'));if(requestedCity){selectedMapCity=requestedCity.name;selectedMapRegion=requestedCity.state;}}

function mapCityRecord(city){
  const clean=String(city||'').split(',')[0].trim().toLowerCase();
  return MH_CITIES[clean];
}
function mapCityKey(city){return mapCityRecord(city)?.name||'';}
function mapCityLocations(){
  const locations=new Map();
  const add=(city,client,branch)=>{
    const key=mapCityKey(city);if(!key||!client)return;
    if(!locations.has(key))locations.set(key,{key,city:mapCityRecord(city),clients:new Map(),branches:[]});
    const location=locations.get(key);
    if(!location.clients.has(client.id))location.clients.set(client.id,{client,primary:false,branches:[]});
    const entry=location.clients.get(client.id);
    if(branch){entry.branches.push(branch);location.branches.push(branch);}else entry.primary=true;
  };
  state.clients.forEach(client=>add(client.city,client));
  state.branches.forEach(branch=>add(branch.city,byId('clients',branch.clientId),branch));
  return [...locations.values()].sort((a,b)=>b.clients.size-a.clients.size||a.key.localeCompare(b.key));
}
const footprintLocations = () => mapCityLocations().filter(location => selectedMapRegion==='IN' || location.city.state===selectedMapRegion);
const mapProjection = (city,projection) => ({x:projection.ox+city.lon*projection.scale,y:projection.oy-city.lat*projection.scale});

function renderMapCityDetail(key){
  const location=footprintLocations().find(item=>item.key===key);
  if(!location)return `<div class="map-detail-empty"><strong>No city selected</strong><span>${selectedMapRegion==='IN'?'Choose a city marker to browse its clients and branches.':'Choose a city marker, or add a client or branch in this state.'}</span></div>`;
  const entries=[...location.clients.values()].sort((a,b)=>a.client.name.localeCompare(b.client.name));
  const network=entries.map(entry=>({entry,branches:state.branches.filter(branch=>branch.clientId===entry.client.id&&mapCityRecord(branch.city))}));
  const exact=network.reduce((count,{entry,branches})=>count+(hasExactMapPin(entry.client)?1:0)+branches.filter(hasExactMapPin).length,0);
  const rows=network.map(({entry,branches})=>{
    const client=entry.client,hqCity=client.city||'Not set';
    return `<div class="map-client-entry"><button class="map-client" data-profile="${esc(client.id)}"><span class="map-client-avatar">${esc(initials(client.name))}</span><span><strong>${esc(client.name)}</strong><small>Head office: ${esc(hqCity)} · ${branches.length} linked branch${branches.length===1?'':'es'}</small></span><span aria-hidden="true">↗</span></button><button class="map-pin-edit" data-map-edit="client:${esc(client.id)}">${hasExactMapPin(client)?'Edit head office pin':'Set exact head office pin'}</button>${branches.length?`<div class="map-branch-list">${branches.map(branch=>`<span class="map-branch-entry"><button data-detail="branch:${esc(branch.id)}">${icon('branch')} ${esc(branch.name)} · ${esc(branch.city)} ↗</button><button class="map-pin-edit" data-map-edit="branch:${esc(branch.id)}">${hasExactMapPin(branch)?'Edit exact pin':'Set exact pin'}</button></span>`).join('')}</div>`:''}</div>`;
  }).join('');
  return `<div class="map-detail-heading"><span class="map-detail-eyebrow">SELECTED CITY</span><h3>${esc(location.key)}</h3><p>${location.clients.size} client${location.clients.size===1?'':'s'} · ${location.branches.length} local branch${location.branches.length===1?'':'es'}</p><small class="map-location-accuracy">${exact} exact pin${exact===1?'':'s'} · other pins show approximate city locations</small><small class="map-location-accuracy">Orange lines link each head office to its branches; they are not driving routes.</small></div><div class="map-client-list">${rows}</div>`;
}

function hasExactMapPin(record){return record?.mapLat!=null&&record?.mapLon!=null&&record.mapLat!==''&&record.mapLon!==''&&Number.isFinite(Number(record.mapLat))&&Number.isFinite(Number(record.mapLon))&&Math.abs(Number(record.mapLat))<=85&&Math.abs(Number(record.mapLon))<=180;}
// User-requested dummy positions for the existing fictional Pune offices only.
// Applied once so a removed pin stays removed, and existing coordinates always win.
function seedDemoOfficeLocations(data){
 if(data.mapDemoOfficeLocationsApplied)return false;
 const positions={c1:[73.8567,18.5204],cx1:[73.8416,18.5143],cx9:[73.8737,18.5306],cx17:[73.8487,18.5381],cx25:[73.8788,18.5132],cx33:[73.8328,18.5318],cx41:[73.8570,18.4986]};
 let changed=false;
 for(const client of data.clients){
  const point=positions[client.id];if(!point||mapCityKey(client.city)!=='Pune'||!String(client.email||'').endsWith('.example'))continue;
  const heads=data.branches.filter(branch=>branch.clientId===client.id&&mapCityKey(branch.city)==='Pune'&&/head\s*office|headquarters|\bhq\b/i.test(branch.name));
  if(hasExactMapPin(client)||heads.some(hasExactMapPin))continue;
  const pin={mapLon:point[0],mapLat:point[1],mapLocationSource:'demo'};
  Object.assign(client,pin);for(const head of heads)Object.assign(head,pin);changed=true;
 }
 if(changed)data.mapDemoOfficeLocationsApplied=true;
 return changed;
}
function initializeDemoOfficeLocations(){
 if(mapExternalChange||state.mapDemoOfficeLocationsApplied)return;
 const before=JSON.stringify(state);if(!seedDemoOfficeLocations(state))return;
 try{save('Demo map locations');}catch(error){state=JSON.parse(before);toast('Demo locations could not be saved. Browser storage may be full.');}
}
function syncHeadOfficePin(kind,record){
 const isHead=branch=>/head\s*office|headquarters|\bhq\b/i.test(branch.name);
 if(kind==='client'){
  for(const branch of state.branches.filter(b=>b.clientId===record.id&&isHead(b)&&mapCityKey(b.city)===mapCityKey(record.city)))Object.assign(branch,{mapLat:record.mapLat,mapLon:record.mapLon,mapLocationSource:record.mapLocationSource||''});
 }else{
  const client=byId('clients',record.clientId);
  if(client&&isHead(record)&&mapCityKey(record.city)&&mapCityKey(record.city)===mapCityKey(client.city))Object.assign(client,{mapLat:record.mapLat,mapLon:record.mapLon,mapLocationSource:record.mapLocationSource||''});
 }
}
function mapPinPoint(record,projection){return hasExactMapPin(record)?mapProjection({lat:Number(record.mapLat),lon:Number(record.mapLon)},projection):null;}
const mapPolygonCache=new Map();
function mapMainPolygon(path){
 if(mapPolygonCache.has(path))return mapPolygonCache.get(path);
 const polygons=(path.match(/M[^Z]*Z/g)||[]).map(section=>[...section.matchAll(/[ML](-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map(match=>({x:Number(match[1]),y:Number(match[2])}))).filter(points=>points.length>2);
 const area=points=>Math.abs(points.reduce((sum,point,index)=>{const next=points[(index+1)%points.length];return sum+point.x*next.y-next.x*point.y;},0));
 const main=polygons.sort((a,b)=>area(b)-area(a))[0]||[];mapPolygonCache.set(path,main);return main;
}
function mapPointInside(point,polygon){
 let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }return inside;
}
function mapEdgeDistance(point,polygon){
 let nearest=Infinity;for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length],dx=b.x-a.x,dy=b.y-a.y;
  const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy||1)));
  nearest=Math.min(nearest,Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy));
 }return nearest;
}
function mapPlaceBadge(preferred,polygon,occupied,radius){
 const available=(point,edge)=>mapPointInside(point,polygon)&&mapEdgeDistance(point,polygon)>=edge&&occupied.every(item=>Math.hypot(point.x-item.point.x,point.y-item.point.y)>=radius+item.radius+3);
 for(const edge of [radius+2,radius]){
  if(available(preferred,edge)){occupied.push({point:preferred,radius});return preferred;}
  for(let distance=10;distance<=160;distance+=10){
   for(let step=0;step<32;step++){
    const angle=step*Math.PI/16,point={x:preferred.x+Math.cos(angle)*distance,y:preferred.y+Math.sin(angle)*distance};
    if(available(point,edge)){occupied.push({point,radius});return point;}
   }
  }
 }
 const bounds=polygon.reduce((box,point)=>({minX:Math.min(box.minX,point.x),maxX:Math.max(box.maxX,point.x),minY:Math.min(box.minY,point.y),maxY:Math.max(box.maxY,point.y)}),{minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity});
 let best=null;
 const inset=Math.min(radius,Math.max(1,(bounds.maxX-bounds.minX)/8,(bounds.maxY-bounds.minY)/8));
 for(let y=bounds.minY+1;y<=bounds.maxY-1;y+=3)for(let x=bounds.minX+1;x<=bounds.maxX-1;x+=3){
  const point={x,y};if(!mapPointInside(point,polygon))continue;
  const edge=mapEdgeDistance(point,polygon);if(edge<Math.min(inset,2))continue;
  const separation=occupied.reduce((smallest,item)=>Math.min(smallest,Math.hypot(x-item.point.x,y-item.point.y)-radius-item.radius),Infinity);
  const score=Math.hypot(x-preferred.x,y-preferred.y)+Math.max(0,3-separation)*200+Math.max(0,radius-edge)*4;
  if(!best||score<best.score)best={point,score};
 }
 const fallback=best?.point||preferred;
 occupied.push({point:fallback,radius});return fallback;
}
function mapPinDefs(){
 return '<defs><linearGradient id="map-pin-head" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB1A3"/><stop offset=".42" stop-color="#F45A45"/><stop offset="1" stop-color="#D82620"/></linearGradient><linearGradient id="map-pin-branch" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE9A5"/><stop offset=".45" stop-color="#FFC35B"/><stop offset="1" stop-color="#E78227"/></linearGradient></defs>';
}
function mapPinArt(kind,label=''){
 const face=kind==='branch'?'url(#map-pin-branch)':'url(#map-pin-head)';
 const compact=selectedMapRegion==='IN';
 const scale=compact?(kind==='branch'?'.34':kind==='city'?'.60':'.43'):(kind==='branch'?'.56':kind==='city'?'.76':'.72');
 return `<g class="map-pin-art" transform="scale(${scale})"><ellipse class="map-pin-shadow" cy="3" rx="13" ry="3"/><path class="map-pin-front" d="M-2-42C-13-42-19-33-19-24-19-12-8-3-2 0 4-3 14-12 14-24 14-33 8-42-2-42Z" fill="${face}"/><circle class="map-pin-hole-rim" cx="-2" cy="-25" r="10"/><circle class="map-pin-hole" cx="-2" cy="-25" r="7"/>${label?`<text class="map-pin-text" text-anchor="middle" x="-2" y="-21">${esc(label)}</text>`:''}</g>`;
}
function mapCityEntities(location,projection){
 const india=selectedMapRegion==='IN',occupied=[];
 const polygonFor=city=>{const region=window.INDIA_MAPS.regions[city.state];return mapMainPolygon(india?region.indiaPath:region.path);};
 const entries=[...location.clients.values()].sort((a,b)=>a.client.name.localeCompare(b.client.name));
 const clients=[],branches=[],links=[];
 entries.forEach((entry,index)=>{
  const hqCity=mapCityRecord(entry.client.city),hqHere=hqCity&&(india||hqCity.state===location.city.state);
  const network=state.branches.filter(branch=>{const city=mapCityRecord(branch.city);return branch.clientId===entry.client.id&&city&&(india||city.state===location.city.state);});
  const hqBranch=hqHere?network.find(branch=>mapCityKey(branch.city)===mapCityKey(entry.client.city)&&/head\s*office|headquarters|\bhq\b/i.test(branch.name)):null;
  let hqPoint=null;
  if(hqHere){
   const cityPoint=mapProjection(hqCity,projection),angle=-Math.PI/2+index*2*Math.PI/Math.max(1,entries.length);
   const spread=entries.length===1?0:entries.length<=4?25:36;
   const anchor=mapPinPoint(entry.client,projection)||mapPinPoint(hqBranch,projection);
   hqPoint=mapPlaceBadge(anchor||{x:cityPoint.x+Math.cos(angle)*spread,y:cityPoint.y+Math.sin(angle)*spread*.8},polygonFor(hqCity),occupied,india?14:31);
   clients.push({record:entry.client,point:hqPoint,anchor,exact:Boolean(anchor),headOfficeBranch:hqBranch});
  }
  network.filter(branch=>branch!==hqBranch).forEach((branch,branchIndex)=>{
   const city=mapCityRecord(branch.city),cityPoint=mapProjection(city,projection),angle=(branchIndex+index*2)*2.39996;
   const anchor=mapPinPoint(branch,projection);
   const preferred=anchor||{x:cityPoint.x+Math.cos(angle)*13,y:cityPoint.y+Math.sin(angle)*13};
   const point=mapPlaceBadge(preferred,polygonFor(city),occupied,india?10:23);
   branches.push({record:branch,point,anchor,exact:Boolean(anchor),clientId:entry.client.id});
   if(hqPoint)links.push({from:hqPoint,to:point,clientId:entry.client.id});
  });
 });
 return {clients,branches,links};
}

function footprintProductChart(){
  const live=state.deployments.filter(deployment=>{
    if(deployment.status!=='Live')return false;
    const branch=byId('branches',deployment.branchId),client=byId('clients',deployment.clientId);
    const city=mapCityRecord(branch?.city)||mapCityRecord(client?.city);
    return city && (selectedMapRegion==='IN'||city.state===selectedMapRegion);
  });
  const counts=new Map();for(const deployment of live)counts.set(deployment.productId,(counts.get(deployment.productId)||0)+1);
  const rows=[...counts].map(([id,count])=>({name:nameOf('products',id),count})).sort((a,b)=>b.count-a.count);
  const max=Math.max(1,...rows.map(row=>row.count));
  return `<div class="map-coverage"><div class="map-coverage-heading"><div><span class="map-detail-eyebrow">PRODUCT COVERAGE</span><h3>Live in ${esc(selectedMapRegion==='IN'?'India':window.INDIA_MAPS.regions[selectedMapRegion].name)}</h3><p>Active installations by product</p></div><strong>${live.length}<small>deployments</small></strong></div>${rows.length?`<div class="map-coverage-bars">${rows.map((row,index)=>`<div class="map-coverage-row" style="--bar-delay:${index*65}ms"><span title="${esc(row.name)}">${esc(row.name)}</span><div class="map-coverage-track"><i style="width:${Math.max(6,Math.round(row.count/max*100))}%"></i></div><strong>${row.count}</strong></div>`).join('')}</div>`:'<div class="map-coverage-empty">No live product deployments are mapped here yet.</div>'}</div>`;
}

function renderSelectedMapPins(entities){
 const exactLeaders=[...entities.clients,...entities.branches].filter(item=>item.exact&&item.anchor&&Math.hypot(item.anchor.x-item.point.x,item.anchor.y-item.point.y)>3).map(item=>`<path class="map-pin-leader" d="M${item.anchor.x.toFixed(1)} ${item.anchor.y.toFixed(1)} L${item.point.x.toFixed(1)} ${item.point.y.toFixed(1)}"/><circle class="map-exact-anchor" cx="${item.anchor.x.toFixed(1)}" cy="${item.anchor.y.toFixed(1)}" r="3"/>`).join('');
 const links=entities.links.map((link,index)=>{const mid=(link.from.x+link.to.x)/2;return `<path class="map-branch-link" data-map-link-client="${esc(link.clientId)}" d="M${link.from.x.toFixed(1)} ${link.from.y.toFixed(1)} L${mid.toFixed(1)} ${link.from.y.toFixed(1)} L${mid.toFixed(1)} ${link.to.y.toFixed(1)} L${link.to.x.toFixed(1)} ${link.to.y.toFixed(1)}" style="--map-delay:${index*55}ms"/>`;}).join('');
 const heads=entities.clients.map(({record,point,exact},index)=>`<g class="map-entity-node map-client-node" data-map-entity data-map-client="${esc(record.id)}" data-profile="${esc(record.id)}" role="button" tabindex="0" aria-label="Open ${esc(record.name)} head office in ${esc(record.city)}${exact?' · exact pin':' · city-level pin'}" transform="translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})" style="--map-delay:${index*55}ms">${mapPinArt('head','H')}</g>`).join('');
 const branches=entities.branches.map(({record,point,exact,clientId},index)=>`<g class="map-entity-node map-branch-node" data-map-entity data-map-client="${esc(clientId)}" data-detail="branch:${esc(record.id)}" role="button" tabindex="0" aria-label="Open ${esc(record.name)} branch of ${esc(nameOf('clients',clientId))} in ${esc(record.city)}${exact?' · exact pin':' · city-level pin'}" transform="translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})" style="--map-delay:${index*55}ms">${mapPinArt('branch','B')}</g>`).join('');
 return exactLeaders+links+heads+branches;
}
function renderCityMapPins(locations,projection,india){
 return locations.map((location,index)=>{
  const point=mapProjection(location.city,projection),labelVisible=!india&&locations.length<=12;
  const labelX=location.city.name==='Mumbai'?-16:location.city.name==='Thane'?16:location.city.name==='Nashik'?18:0;
  const labelAnchor=location.city.name==='Mumbai'?'end':labelX?'start':'middle';
  return `<g class="map-marker ${india?'is-india':''}" data-map-city="${esc(location.key)}" role="button" tabindex="0" aria-label="${esc(location.key)}: ${location.clients.size} clients, ${location.branches.length} branches" transform="translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})" style="--map-delay:${index*65}ms">${mapPinArt('city',String(location.clients.size))}${labelVisible?`<text class="map-marker-label" text-anchor="${labelAnchor}" x="${labelX}" y="16">${esc(location.key)}</text>`:''}</g>`;
 }).join('');
}

function renderStreetCityMap(location){return renderStreetNetworkShell(location);}

function renderMaharashtraMap(){
  const atlas=window.INDIA_MAPS;if(!atlas)return '';
  const region=atlas.regions[selectedMapRegion],india=selectedMapRegion==='IN';
  const projection=india?atlas.india.projection:region.projection;
  const locations=footprintLocations();
  if(selectedMapCity&&!locations.some(item=>item.key===selectedMapCity))selectedMapCity='';
  const streetLocation=locations.find(item=>item.key===selectedMapCity);
  if(streetLocation)return renderStreetCityMap(streetLocation,Object.values(atlas.regions).sort((a,b)=>a.name.localeCompare(b.name)));
  const represented=new Set(locations.flatMap(location=>[...location.clients.keys()]));
  const orderedRegions=Object.values(atlas.regions).sort((a,b)=>a.name.localeCompare(b.name));
  const shapes=india?`${orderedRegions.map(item=>`<path class="map-state-depth map-state-depth-deep" d="${item.indiaPath}" transform="translate(0 16)"/>`).join('')}${orderedRegions.map(item=>`<path class="map-state-depth map-state-depth-mid" d="${item.indiaPath}" transform="translate(0 8)"/>`).join('')}${orderedRegions.map(item=>`<path class="map-state-shape" d="${item.indiaPath}" data-map-region="${item.code}"><title>${esc(item.name)} · select state</title></path>`).join('')}`:`<path class="map-extrusion map-extrusion-deep" d="${region.path}" transform="translate(0 24)"/><path class="map-extrusion map-extrusion-mid" d="${region.path}" transform="translate(0 12)"/><path class="map-land" d="${region.path}"/><path class="map-land-grid" d="${region.path}"/>`;
  const selectedLocation=locations.find(item=>item.key===selectedMapCity);
  const selectedPoint=selectedLocation&&mapProjection(selectedLocation.city,projection);
  const entities=selectedLocation&&mapCityEntities(selectedLocation,projection);
  const focusPoints=selectedPoint?[selectedPoint,...entities.clients.map(item=>item.point),...entities.branches.map(item=>item.point)]:[];
  const extent=focusPoints.length?{minX:Math.min(...focusPoints.map(p=>p.x)),maxX:Math.max(...focusPoints.map(p=>p.x)),minY:Math.min(...focusPoints.map(p=>p.y)),maxY:Math.max(...focusPoints.map(p=>p.y))}:null;
  const boxWidth=extent?Math.min(680,Math.max(350,extent.maxX-extent.minX+96,(extent.maxY-extent.minY+96)*680/430)):680;
  const boxHeight=boxWidth*430/680;
  const fittedOrigin=(center,min,max,size,pad)=>Math.min(Math.max(center-size/2,max+pad-size),min-pad);
  const svgViewBox=extent?`${fittedOrigin(selectedPoint.x,extent.minX,extent.maxX,boxWidth,35).toFixed(1)} ${fittedOrigin(selectedPoint.y,extent.minY,extent.maxY,boxHeight,35).toFixed(1)} ${boxWidth.toFixed(1)} ${boxHeight.toFixed(1)}`:'0 0 680 430';
  const markers=mapPinDefs()+(selectedLocation?renderSelectedMapPins(entities):renderCityMapPins(locations,projection,india));
  const linkedLocations=[];
  const routes='';
  const regionName=india?'India':region.name;
  return `<section class="overview-map card" aria-labelledby="overview-map-title"><div class="overview-map-top"><div><span class="map-section-label">CLIENT FOOTPRINT</span><h2 id="overview-map-title">${esc(regionName)}, at a glance</h2><p>Click a city to explore its clients and branches. Select a state to change the map.</p></div><div class="map-top-controls"><label><span>Map geography</span><select id="map-region" aria-label="Map geography"><option value="IN" ${india?'selected':''}>All India</option>${orderedRegions.map(item=>`<option value="${item.code}" ${selectedMapRegion===item.code?'selected':''}>${esc(item.name)}</option>`).join('')}</select></label></div></div><div class="overview-map-layout"><div class="map-stage"><div class="map-stage-glow"></div>${linkedLocations.length?`<span class="map-network-label">${linkedLocations.length} linked ${linkedLocations.length===1?'city':'cities'}</span>`:''}<svg class="maharashtra-svg ${india?'india-svg':''}" viewBox="${svgViewBox}" aria-label="Illustrated 3D map of ${esc(regionName)} showing client locations"><defs><linearGradient id="mh-fill" x1=".1" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="#68AC82"/><stop offset=".52" stop-color="#2B815B"/><stop offset="1" stop-color="#0D523D"/></linearGradient><linearGradient id="mh-edge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D7FB9E"/><stop offset="1" stop-color="#73C895"/></linearGradient><pattern id="mh-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="#B7E6BE" stroke-opacity=".055" stroke-width="1"/></pattern></defs>${shapes}${routes}${markers}</svg>${selectedMapCity?'<button class="map-reset-view" data-map-reset type="button">↖ Region view</button>':''}<span class="map-north">N ↑</span><a class="map-source" href="https://www.geoboundaries.org/api/current/gbOpen/IND/ADM1/" target="_blank" rel="noopener noreferrer">Boundary: geoBoundaries · CC BY 4.0</a></div><aside class="map-detail" aria-label="Clients at selected location"><div id="map-location-detail">${renderMapCityDetail(selectedMapCity)}</div><div class="map-detail-foot"><span>${represented.size} clients · ${locations.reduce((n,item)=>n+item.branches.length,0)} branches mapped</span><button data-view="clients">All clients ↗</button></div></aside></div>${footprintProductChart()}</section>`;
}

function bindOverviewMap(){
  const stage=$('.overview-map .map-stage');
  if(stage?.classList.contains('street-mode')){if(typeof bindClientStreetMap==='function')bindClientStreetMap(stage);return;}
  const svg=stage?.querySelector('.maharashtra-svg');
  if(!stage||!svg)return;
  stage.querySelector('.map-network-label')?.remove();
  if(selectedMapRegion!=='IN'){
    const back=document.createElement('button');
    back.type='button';back.className='map-back-india';back.dataset.mapBack='';back.textContent='← All India';
    stage.append(back);
    if(selectedMapCity){
      const network=document.createElement('button');network.type='button';network.className='map-full-network';network.dataset.mapFullNetwork='';network.textContent='All India network ↗';stage.append(network);
    }
  }
  const entityNodes=svg.querySelectorAll('.map-entity-node');
  if(entityNodes.length){
    const tooltip=document.createElement('div');tooltip.className='map-hover-card';tooltip.hidden=true;stage.append(tooltip);
    let activeClient='';
    const highlight=clientId=>{
      if(activeClient===clientId)return;
      activeClient=clientId;
      entityNodes.forEach(node=>{node.classList.toggle('is-related',Boolean(clientId)&&node.dataset.mapClient===clientId);node.classList.toggle('is-muted',Boolean(clientId)&&node.dataset.mapClient!==clientId);});
      svg.querySelectorAll('[data-map-link-client]').forEach(link=>{link.classList.toggle('is-related',Boolean(clientId)&&link.dataset.mapLinkClient===clientId);link.classList.toggle('is-muted',Boolean(clientId)&&link.dataset.mapLinkClient!==clientId);});
    };
    const hideTooltip=()=>{tooltip.hidden=true;highlight('');};
    const showTooltip=node=>{
      const branchId=node.dataset.detail?.startsWith('branch:')?node.dataset.detail.slice(7):'';
      const branch=branchId?byId('branches',branchId):null;
      const client=node.dataset.profile?byId('clients',node.dataset.profile):null;
      const ownerId=branch?.clientId||client?.id||'';
      const linkedCount=ownerId?state.branches.filter(item=>item.clientId===ownerId).length:0;
      tooltip.textContent=branch?`Branch · ${branch.name} · ${nameOf('clients',branch.clientId)} · Head office: ${byId('clients',branch.clientId)?.city||'not set'}`:client?`Head office · ${client.name} · ${client.city||'city not set'} · ${linkedCount} linked branch${linkedCount===1?'':'es'}`:'';
      if(!tooltip.textContent){hideTooltip();return;}
      highlight(ownerId);
      tooltip.hidden=false;
      const pin=node.getBoundingClientRect(),bounds=stage.getBoundingClientRect();
      tooltip.style.left=`${Math.max(8,Math.min(stage.clientWidth-tooltip.offsetWidth-8,pin.left+pin.width/2-bounds.left-tooltip.offsetWidth/2))}px`;
      const above=pin.top-bounds.top-tooltip.offsetHeight-9;
      tooltip.style.top=`${above>=8?above:pin.bottom-bounds.top+9}px`;
    };
    svg.addEventListener('pointermove',event=>{
      if(stage.classList.contains('is-dragging')){hideTooltip();return;}
      const node=event.target.closest?.('.map-entity-node');if(node)showTooltip(node);else hideTooltip();
    });
    svg.addEventListener('pointerleave',hideTooltip);
    svg.addEventListener('focusin',event=>{const node=event.target.closest?.('.map-entity-node');if(node)showTooltip(node);});
    svg.addEventListener('focusout',hideTooltip);
  }
  let drag=null,suppressClickUntil=0;
  const box=()=>svg.getAttribute('viewBox').split(/\s+/).map(Number);
  const setBox=(x,y,w,h)=>{const xPad=selectedMapCity?Math.min(w*.35,150):0,yPad=selectedMapCity?Math.min(h*.35,100):0;svg.setAttribute('viewBox',`${Math.max(-xPad,Math.min(680-w+xPad,x)).toFixed(2)} ${Math.max(-yPad,Math.min(430-h+yPad,y)).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);};
  svg.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    drag={x:event.clientX,y:event.clientY,box:box(),moved:false,pointerId:event.pointerId};
  });
  svg.addEventListener('pointermove',event=>{
    if(!drag)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(Math.hypot(dx,dy)>4&&!drag.moved){drag.moved=true;svg.setPointerCapture(drag.pointerId);}
    if(!drag.moved)return;
    stage.classList.add('is-dragging');
    setBox(drag.box[0]-dx*drag.box[2]/svg.clientWidth,drag.box[1]-dy*drag.box[3]/svg.clientHeight,drag.box[2],drag.box[3]);
  });
  const finish=()=>{if(drag?.moved)suppressClickUntil=performance.now()+180;drag=null;stage.classList.remove('is-dragging');};
  svg.addEventListener('pointerup',finish);svg.addEventListener('pointercancel',finish);
  svg.addEventListener('click',event=>{if(performance.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
}
function animateMapViewBox(svg,from){
  if(!svg||!from||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const startBox=from.split(/\s+/).map(Number),endBox=svg.getAttribute('viewBox').split(/\s+/).map(Number);
  if(startBox.length!==4||startBox.some(Number.isNaN)||endBox.some(Number.isNaN))return;
  const started=performance.now(),duration=680;
  svg.setAttribute('viewBox',from);
  const frame=now=>{
    if(!svg.isConnected)return;
    const t=Math.min(1,(now-started)/duration),eased=1-Math.pow(1-t,3);
    svg.setAttribute('viewBox',startBox.map((value,i)=>(value+(endBox[i]-value)*eased).toFixed(2)).join(' '));
    if(t<1)requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
function showMapCity(key,pin=false){
  if(!pin)return;
  const restoreFocus=document.activeElement?.hasAttribute?.('data-map-city');
  const from=$('.overview-map .maharashtra-svg')?.getAttribute('viewBox');
  const location=mapCityLocations().find(item=>item.key===key);
  const switchingRegion=selectedMapRegion==='IN'&&location?.city.state;
  if(switchingRegion)selectedMapRegion=location.city.state;
  selectedMapCity=key;
  const section=$('.overview-map');if(section)section.outerHTML=renderMaharashtraMap();
  bindOverviewMap();
  animateMapViewBox($('.overview-map .maharashtra-svg'),switchingRegion?'0 0 680 430':from);
  if(restoreFocus)$('.overview-map .map-client-node')?.focus();
}
document.addEventListener('change',event=>{if(event.target.id==='map-region'){selectedMapRegion=event.target.value;selectedMapCity='';render();}});
document.addEventListener('click',event=>{const region=event.target.closest?.('.map-state-shape');if(region){selectedMapRegion=region.dataset.mapRegion;selectedMapCity='';render();}});
document.addEventListener('click',event=>{if(!event.target.closest?.('[data-map-reset]'))return;window.disposeClientStreetMap?.();const from=$('.overview-map .maharashtra-svg')?.getAttribute('viewBox');selectedMapCity='';const section=$('.overview-map');if(section)section.outerHTML=renderMaharashtraMap();bindOverviewMap();animateMapViewBox($('.overview-map .maharashtra-svg'),from);});
document.addEventListener('click',event=>{if(!event.target.closest?.('[data-map-back]'))return;selectedMapRegion='IN';selectedMapCity='';render();});
document.addEventListener('click',event=>{if(!event.target.closest?.('[data-map-full-network]'))return;selectedMapRegion='IN';const section=$('.overview-map');if(section)section.outerHTML=renderMaharashtraMap();bindOverviewMap();});
document.addEventListener('keydown',event=>{const node=event.target.closest?.('[data-map-entity]');if(node&&(event.key==='Enter'||event.key===' ')){event.preventDefault();node.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
document.addEventListener('click',event=>{
  const edit=event.target.closest?.('[data-map-edit]');if(!edit)return;
  const [kind,id]=edit.dataset.mapEdit.split(':');
  openMapPinEditor(kind,id);
});
function openMapPinEditor(kind,id,coordinates){
  const record=byId(kind==='client'?'clients':'branches',id);if(!record)return;
  mapPinEditSnapshot=localStorage.getItem(STORE_KEY);
  const lat=coordinates?Number(coordinates.lat.toFixed(6)):record.mapLat??'',lon=coordinates?Number(coordinates.lng.toFixed(6)):record.mapLon??'';
  modal(coordinates?'Save this office location':'Exact map location',`${record.name} · ${record.city||'City not set'}`,`<form id="entity-form" data-type="map-pin" data-id="${esc(kind+':'+id)}"><p class="form-note">${coordinates?'Confirm the street location you selected. This pin will be linked to this office and its bank.':'Enter the office coordinates. Without a saved pin, the map shows its city area.'}</p><div class="form-grid">${field('Latitude','mapLat','number',false,'e.g. 19.9975',lat)}${field('Longitude','mapLon','number',false,'e.g. 73.7898',lon)}</div><div class="form-error" id="form-error"></div></form>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="entity-form">Save map pin</button>`);
  for(const name of ['mapLat','mapLon'])$('#entity-form').elements[name].step='any';
}
function openRemoveMapPin(kind,id){
 const record=byId(kind==='client'?'clients':'branches',id);if(!record)return;
 mapPinEditSnapshot=localStorage.getItem(STORE_KEY);
 modal('Remove office pin',record.name,`<form id="entity-form" data-type="map-pin" data-id="${esc(kind+':'+id)}"><p>Remove this office’s saved map location? The ${kind} record and its linked work will stay available.</p><input type="hidden" name="mapLat" value=""><input type="hidden" name="mapLon" value=""><div class="form-error" id="form-error"></div></form>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-danger" type="submit" form="entity-form">Remove pin</button>`);
}
