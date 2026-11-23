/* One bank network at a time, on locally cached OpenStreetMap streets. */
let clientStreetMap=null,streetMapToken=0,streetMapCleanup=null;
let selectedStreetClientId='',streetScope='city',streetTilt=false,lastStreetCity='';
function streetHasPosition(point){return Boolean(point?.exact);}
function streetDistanceMetres(a,b){
 if(!streetHasPosition(a)||!streetHasPosition(b))return null;
 if(![a.lon,a.lat,b.lon,b.lat].every(Number.isFinite))return null;
 const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlon=(b.lon-a.lon)*rad;
 const h=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlon/2)**2;
 return 6371008.8*2*Math.atan2(Math.sqrt(Math.min(1,h)),Math.sqrt(Math.max(0,1-h)));
}
function streetDistanceLabel(metres){return metres===null?'Location needed':metres<1000?`${Math.round(metres)} m`:`${(metres/1000).toFixed(1)} km`;}
const streetDataCache=new Map();
const emptyStreetGeoJSON=()=>({type:'FeatureCollection',features:[]});
function disposeClientStreetMap(){
 streetMapToken++;streetMapCleanup?.();streetMapCleanup=null;
 if(clientStreetMap){clientStreetMap.remove();clientStreetMap=null;}
}
window.disposeClientStreetMap=disposeClientStreetMap;
function streetPoint(record){
 if(hasExactMapPin(record))return {lon:Number(record.mapLon),lat:Number(record.mapLat),exact:true,demo:record.mapLocationSource==='demo'};
 const city=mapCityRecord(record?.city);return city?{lon:city.lon,lat:city.lat,exact:false}:null;
}
function streetNetwork(location){
 const heads=[],branches=[],links=[],missing=[];
 for(const {client} of [...location.clients.values()].sort((a,b)=>a.client.name.localeCompare(b.client.name))){
  const records=state.branches.filter(branch=>branch.clientId===client.id);
  const headBranch=records.find(branch=>mapCityKey(branch.city)===mapCityKey(client.city)&&/head\s*office|headquarters|\bhq\b/i.test(branch.name));
  const head=hasExactMapPin(client)?streetPoint(client):hasExactMapPin(headBranch)?streetPoint(headBranch):streetPoint(client)||streetPoint(headBranch);
  const headItem={key:'head:'+client.id,kind:'head',record:client,clientId:client.id,point:head,branchCount:records.filter(branch=>branch!==headBranch).length};
  (head?heads:missing).push(headItem);
  for(const branch of records.filter(item=>item!==headBranch)){
   const point=streetPoint(branch),item={key:'branch:'+branch.id,kind:'branch',record:branch,clientId:client.id,point};
   (point?branches:missing).push(item);
   if(head&&point)links.push({key:item.key,clientId:client.id,coordinates:[[head.lon,head.lat],[point.lon,point.lat]],exact:head.exact&&point.exact});
  }
 }
 return {heads,branches,links,missing};
}
function streetGroups(items){
 const groups=new Map();
 for(const item of items){
  const coordinates=item.point.lon+','+item.point.lat;
  const key=item.point.exact?'pin:'+coordinates:'city:'+(mapCityKey(item.record?.city)||coordinates);
  if(!groups.has(key))groups.set(key,{point:item.point,items:[]});groups.get(key).items.push(item);
 }
 return [...groups.values()];
}
// Group saved office coordinates; never spread offices over invented streets.
function streetZoomGroups(items,project,zoom){
 const groups=[];
 const positioned=items.filter(item=>streetHasPosition(item.point)).sort((a,b)=>a.key.localeCompare(b.key));
 if(zoom>=17){const shared=new Map();for(const item of positioned){const key=item.point.lon+','+item.point.lat;if(!shared.has(key))shared.set(key,{point:{...item.point},items:[],spread:false});shared.get(key).items.push(item);}return [...shared.values()];}
 for(const item of positioned){
  const p=project([item.point.lon,item.point.lat]);
  const group=groups.find(group=>Math.hypot(group.screen.x-p.x,group.screen.y-p.y)<52);
  if(group){group.items.push(item);const n=group.items.length;group.screen={x:(group.screen.x*(n-1)+p.x)/n,y:(group.screen.y*(n-1)+p.y)/n};group.point={lon:(group.point.lon*(n-1)+item.point.lon)/n,lat:(group.point.lat*(n-1)+item.point.lat)/n,exact:group.point.exact&&item.point.exact};}
  else groups.push({point:{...item.point},screen:p,items:[item]});
 }
 for(const group of groups)group.spread=false;
 return groups;
}
function networkOfficeActions(item){
 const kind=item.kind==='head'?'client':'branch',id=esc(item.record.id),key=esc(item.key);
 return `<div class="network-office-actions"><button type="button" data-network-view="${key}">View ${kind==='client'?'profile':'branch'}</button><details class="network-office-menu"><summary aria-label="Location actions for ${esc(item.record.name)}">⋯</summary><div><button type="button" data-network-place="${key}">${item.point?.exact?'Move pin':'Place pin'}</button><button type="button" data-map-edit="${kind}:${id}">Edit coordinates</button>${item.point?.exact?`<button type="button" data-network-remove="${key}">Remove pin</button>`:''}</div></details></div>`;
}
function streetClientNetwork(network,id){
 const heads=network.heads.filter(item=>item.clientId===id),branches=network.branches.filter(item=>item.clientId===id);
 return {heads,branches,all:[...heads,...branches],links:network.links.filter(item=>item.clientId===id),missing:network.missing.filter(item=>item.clientId===id)};
}
function streetVisibleNetwork(network,id,city,scope){
 if(scope==='network')return streetClientNetwork(network,id);
 const local=item=>mapCityKey(item.record.city)===mapCityKey(city);
 const heads=network.heads.filter(local),branches=network.branches.filter(local);
 return {heads,branches,all:[...heads,...branches],links:[],missing:network.missing.filter(local)};
}
function renderStreetNetworkShell(location){
 const region=window.INDIA_MAPS.regions[selectedMapRegion],entries=[...location.clients.values()].sort((a,b)=>a.client.name.localeCompare(b.client.name));
 return `<section class="overview-map card network-map-card" aria-labelledby="overview-map-title"><div class="network-heading"><div><span class="map-section-label">YOUR CLIENT NETWORK</span><h2 id="overview-map-title">${esc(location.key)}, connected.</h2><p>Explore each bank’s head office and branches on the map.</p></div><span class="network-city-total"><strong>${entries.length}</strong> clients in this city</span></div><div class="network-toolbar"><div class="network-breadcrumb"><button type="button" data-map-reset>← ${esc(region?.name||'Region')}</button><span>/</span><strong>${esc(location.key)}</strong></div><div class="network-scope" aria-label="Map focus"><button type="button" data-street-focus="city" class="active" aria-pressed="true">City view</button><button type="button" data-street-focus="network" aria-pressed="false">Bank network</button></div><button type="button" class="network-expand" data-network-expand aria-label="Expand map">⛶ <span>Expand</span></button></div><div class="network-map-layout"><div class="map-stage street-mode network-stage"><div id="client-street-map" class="client-street-map" aria-label="Street map showing client locations in ${esc(location.key)}"></div><svg class="network-connections" aria-hidden="true"></svg><div class="network-loading" role="status"><span></span>Opening street map…</div><div class="network-place-banner" hidden><span></span><button type="button" data-network-cancel-place>Cancel</button></div><div class="network-map-badge"><span class="network-badge-dot"></span><span data-network-map-title>${esc(location.key)}</span></div><div class="network-map-tools"><button type="button" data-network-zoom="in" aria-label="Zoom in">+</button><button type="button" data-network-zoom="out" aria-label="Zoom out">−</button><i></i><button type="button" data-network-fit aria-label="Fit selected view">⌖</button><button type="button" data-network-tilt aria-label="Toggle tilted map" aria-pressed="false">3D</button></div><div class="network-map-legend"><span><i class="network-legend-head"></i>Head office</span><span><i class="network-legend-branch"></i>Branch</span><span data-network-link-legend><i class="network-legend-link"></i>Bank connection</span></div></div><aside class="network-rail" aria-label="Selected client network"><div class="network-client-picker"><label for="network-client-select">EXPLORE A CLIENT</label><select id="network-client-select">${entries.map(({client})=>`<option value="${esc(client.id)}">${esc(client.name)}</option>`).join('')}</select></div><div id="network-unplaced-list"></div><div id="network-inspector"></div><div id="network-distance-panel"></div></aside></div><p class="network-view-description" data-network-view-description aria-live="polite"></p><div class="network-footnote"><span>Drag to explore · Zoom to separate pins · Click a pin for actions</span><span>Lines connect branches of the same client · Distances are straight-line.</span></div>${footprintProductChart()}</section>`;
}
function streetRegionData(){
 const atlas=window.INDIA_MAPS,projection=atlas.india.projection,features=[];
 for(const region of Object.values(atlas.regions))for(const part of region.indiaPath.match(/M[^Z]*Z/g)||[]){
  const ring=[...part.matchAll(/[ML](-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map(m=>[(Number(m[1])-projection.ox)/projection.scale,(projection.oy-Number(m[2]))/projection.scale]);
  if(ring.length<3)continue;ring.push(ring[0]);features.push({type:'Feature',properties:{name:region.name},geometry:{type:'Polygon',coordinates:[ring]}});
 }
 return {type:'FeatureCollection',features};
}
function streetMapStyle(){
 const road=['==',['get','kind'],'road'],major=['in',['get','class'],['literal',['motorway','trunk','primary','secondary']]],font=['Open Sans Semibold'];
 const cities={type:'FeatureCollection',features:Object.values(MH_CITIES).map(city=>({type:'Feature',properties:{name:city.name},geometry:{type:'Point',coordinates:[city.lon,city.lat]}}))};
 return {version:8,light:{anchor:'viewport',color:'#fffcee',position:[1.5,210,35],intensity:.55},glyphs:new URL('assets/map-fonts/',document.baseURI).href+'{fontstack}/{range}.pbf',sources:{regions:{type:'geojson',data:streetRegionData(),attribution:'Boundary © <a href="https://www.geoboundaries.org/" target="_blank" rel="noopener">geoBoundaries</a> · CC BY 4.0'},streets:{type:'geojson',data:emptyStreetGeoJSON(),attribution:'Streets © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a> · ODbL'},cities:{type:'geojson',data:cities}},layers:[
  {id:'background',type:'background',paint:{'background-color':'#c8e1e3'}},
  {id:'land',type:'fill',source:'regions',paint:{'fill-color':'#e9eee4'}},
  {id:'boundaries',type:'line',source:'regions',paint:{'line-color':'#aabca5','line-width':.7,'line-dasharray':[4,4]}},
  {id:'parks',type:'fill',source:'streets',filter:['all',['==',['get','kind'],'park'],['==',['geometry-type'],'Polygon']],paint:{'fill-color':'#c6dda8','fill-opacity':.75}},
  {id:'water',type:'fill',source:'streets',filter:['all',['==',['get','kind'],'water'],['==',['geometry-type'],'Polygon']],paint:{'fill-color':'#b8dbdf'}},
  {id:'river',type:'line',source:'streets',filter:['==',['get','kind'],'river'],paint:{'line-color':'#b8dbdf','line-width':['interpolate',['linear'],['zoom'],10,3,13,14,17,42],'line-opacity':.9}},
  {id:'buildings',type:'fill-extrusion',source:'streets',minzoom:11,filter:['all',['==',['get','kind'],'building'],['==',['geometry-type'],'Polygon']],paint:{'fill-extrusion-color':'#becfb0','fill-extrusion-height':['interpolate',['linear'],['zoom'],11,['*',['coalesce',['get','height'],9],4],14,['*',['coalesce',['get','height'],9],2.5],16,['coalesce',['get','height'],9]],'fill-extrusion-base':['coalesce',['get','base'],0],'fill-extrusion-opacity':1,'fill-extrusion-vertical-gradient':true}},
  {id:'road-casing',type:'line',source:'streets',filter:road,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#cbd3c2','line-width':['interpolate',['linear'],['zoom'],10,.6,13,['case',major,5,2.5],16,['case',major,17,9],18,24]}},
  {id:'roads',type:'line',source:'streets',filter:road,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':['case',major,'#fffdf2','#ffffff'],'line-width':['interpolate',['linear'],['zoom'],10,.3,13,['case',major,3.4,1.5],16,['case',major,14,7],18,21]}},
  {id:'road-names',type:'symbol',source:'streets',minzoom:13,filter:['all',road,['!=',['get','name'],'']],layout:{'symbol-placement':'line','text-field':['get','name'],'text-font':font,'text-size':11,'symbol-spacing':280,'text-max-angle':30},paint:{'text-color':'#6a7869','text-halo-color':'#fffffc','text-halo-width':2}},
  {id:'city-labels',type:'symbol',source:'cities',maxzoom:12,layout:{'text-field':['get','name'],'text-font':font,'text-size':['interpolate',['linear'],['zoom'],5,10,11,15],'text-anchor':'top','text-offset':[0,1]},paint:{'text-color':'#536a5b','text-halo-color':'#f4f7ee','text-halo-width':2}}
 ]};
}
async function streetDataFor(cities){
 if(!streetDataCache.has('manifest'))streetDataCache.set('manifest',fetch('assets/streets/manifest.json?v=20261019-buildings7').then(r=>{if(!r.ok)throw Error('Street atlas unavailable');return r.json();}));
 const manifest=await streetDataCache.get('manifest'),features=new Map(),missing=[];
 await Promise.all([...new Set(cities.map(city=>String(city||'').trim().toLowerCase()))].map(async city=>{
  const entry=manifest.cities[city];if(!entry){missing.push(city);return;}
  const key='city:'+city;if(!streetDataCache.has(key))streetDataCache.set(key,fetch('assets/streets/'+entry.file+(entry.version?'?v='+encodeURIComponent(entry.version):'')).then(r=>{if(!r.ok)throw Error('Street extract unavailable');return r.json();}));
  try{const data=await streetDataCache.get(key);for(const feature of data.features)features.set(feature.id,feature);}catch{streetDataCache.delete(key);missing.push(city);}
 }));
 return {data:{type:'FeatureCollection',features:[...features.values()]},missing};
}
function networkPinArt(){
 return '<img src="assets/map-pushpin-red.png" alt="" draggable="false" aria-hidden="true">';
}
function networkLocationRow(item,head){
 const type=item.kind==='head'?'Head office':'Branch',key=esc(item.key),exact=item.point?.exact;
 return `<div class="network-location-row" data-network-row="${key}"><button type="button" class="network-location-focus" data-network-location="${key}" ${streetHasPosition(item.point)?'':'disabled'}><span class="network-location-dot ${item.kind}">${item.kind==='head'?'H':'B'}</span><span><small>${type} · ${esc(item.record.city||'City needed')}</small><strong>${esc(item.kind==='head'?'Head office':item.record.name)}</strong><em class="${exact?'is-exact':''}">${item.point?.demo?'Demo location':exact?'Exact pin saved':'Location needed'}</em></span><span class="network-location-arrow">⌖</span></button>${head&&item.kind==='branch'&&streetDistanceMetres(head.point,item.point)!==null?`<small class="network-office-distance">${streetDistanceLabel(streetDistanceMetres(head.point,item.point))} from head office · straight line</small>`:''}${networkOfficeActions(item)}</div>`;
}
function networkPopupContent(items,locked=false){
 const exact=items.every(item=>item.point.exact),city=esc(items[0].record.city);
 if(items.length>1){
  const title=`${items.length} offices`;
  return `<small>${exact?'NEARBY OFFICES':'LOCATIONS NEEDED'} · ${city}</small><strong>${title}</strong><p>${exact?'Zoom in to separate the pins. Select an office to view or manage it.':'These offices need saved street locations. Select an office to place its pin.'}</p><div class="network-popup-list" role="region" aria-label="Offices" tabindex="0">${items.map(item=>`<button type="button" data-network-location="${esc(item.key)}">${esc(nameOf('clients',item.clientId))} · ${item.kind==='head'?'Head office':esc(item.record.name)} <span>↗</span></button>`).join('')}</div>`;
 }
 const item=items[0];
 return `<small>${item.kind==='head'?'HEAD OFFICE':'BRANCH'} · ${city}</small><strong>${esc(item.kind==='head'?nameOf('clients',item.clientId):item.record.name)}</strong><p>${item.kind==='branch'?esc(nameOf('clients',item.clientId))+'<br>':''}${item.point?.demo?'Demo office location · replace with the real address when available.':exact?'Exact saved location':'Street location not saved yet. Place this office on the map to see its actual position.'}</p>${networkOfficeActions(item)}`;
}
function networkDistancePanel(data,fromKey,toKey){
 const offices=data.all.filter(item=>streetHasPosition(item.point));
 if(offices.length<2)return '<section class="network-distance-card"><h3>Distance between offices</h3><p>Save locations for two offices to compare their distance.</p></section>';
 const from=offices.find(item=>item.key===fromKey)||offices[0],to=offices.find(item=>item.key===toKey&&item.key!==from.key)||offices.find(item=>item.key!==from.key);
 const options=(selected,exclude)=>offices.filter(item=>item.key!==exclude).map(item=>`<option value="${esc(item.key)}" ${item.key===selected?'selected':''}>${esc(nameOf('clients',item.clientId))} · ${esc(item.kind==='head'?'Head office':item.record.name)}</option>`).join('');
 return `<section class="network-distance-card"><h3>Distance between offices</h3><label for="network-distance-from">From</label><select id="network-distance-from" data-network-distance="from">${options(from.key)}</select><label for="network-distance-to">To</label><select id="network-distance-to" data-network-distance="to">${options(to.key,from.key)}</select><output><strong>${streetDistanceLabel(streetDistanceMetres(from.point,to.point))}</strong><span>${from.point.demo||to.point.demo?'Between demo locations':'Between saved locations'}<br>Straight-line distance</span></output><p>Distance compares positions; it does not link client records.</p></section>`;
}
function renderNetworkInspector(client,data){
 const exact=data.all.filter(item=>item.point.exact).length,branchCount=data.branches.length+data.missing.filter(item=>item.kind==='branch').length;
 return `<div class="network-client-summary"><span class="network-client-monogram">${esc(initials(client.name))}</span><div><h3>${esc(client.name)}</h3><p>${esc(client.type||'Client')}</p></div></div><div class="network-client-stats"><span><strong>1</strong>Head office</span><span><strong>${branchCount}</strong>${branchCount===1?'Branch':'Branches'}</span><span><strong>${exact}</strong>Mapped offices</span></div><div class="network-location-list">${[...data.heads,...data.missing.filter(item=>item.kind==='head'),...data.branches,...data.missing.filter(item=>item.kind==='branch')].map(item=>networkLocationRow(item,data.heads[0])).join('')}</div>${branchCount?'':'<p class="network-empty-branches">No additional branches recorded for this client yet.</p>'}<div class="network-accuracy-note">${data.all.some(item=>item.point.demo)?'Demo positions are editable. Save each office’s real location when available.':data.all.some(item=>!item.point.exact)?'Place each office’s exact pin to show its location and branch connections.':'Pins use the saved coordinates for each office.'}</div><button type="button" class="network-profile-link" data-profile="${esc(client.id)}">Open client profile <span>↗</span></button>`;
}
async function bindClientStreetMap(stage){
 disposeClientStreetMap();
 initializeDemoOfficeLocations();
 const token=streetMapToken,section=stage.closest('.network-map-card'),container=stage.querySelector('#client-street-map');
 const location=footprintLocations().find(item=>item.key===selectedMapCity);if(!location||!container)return;
 let network=streetNetwork(location);
 const picker=section.querySelector('#network-client-select'),inspector=section.querySelector('#network-inspector'),loading=stage.querySelector('.network-loading'),svg=stage.querySelector('.network-connections');
 const candidates=[...location.clients.values()].sort((a,b)=>streetClientNetwork(network,b.client.id).branches.length-streetClientNetwork(network,a.client.id).branches.length||a.client.name.localeCompare(b.client.name));
 if(lastStreetCity!==location.key){selectedStreetClientId='';streetScope='city';lastStreetCity=location.key;}
 if(!location.clients.has(selectedStreetClientId))selectedStreetClientId=candidates[0]?.client.id||'';
 picker.value=selectedStreetClientId;
 let selected=streetClientNetwork(network,selectedStreetClientId),markers=[],popup=null,popupCloseTimer=null,hoverKey='',placing=null,loadVersion=0,expanded=false,resizeObserver;
 let distanceFromKey='',distanceToKey='',editMarker=null,editCoordinates=null,editChanged=false,editSnapshot,editReturn=null;
 streetTilt=false;
 const visible=()=>streetVisibleNetwork(network,selectedStreetClientId,location.key,streetScope);
 const syncView=()=>{
  const data=visible(),clients=new Set(data.all.map(item=>item.clientId)).size,pending=data.all.filter(item=>!item.point.exact).length;
  section.querySelectorAll('[data-street-focus]').forEach(button=>{const active=button.dataset.streetFocus===streetScope;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  stage.querySelector('[data-network-map-title]').textContent=streetScope==='city'?`${location.key} · All ${clients} clients`:nameOf('clients',selectedStreetClientId);
  const description=section.querySelector('[data-network-view-description]');
  if(description)description.textContent=streetTilt?'3D buildings · Estimated heights where unavailable; depth enhanced at wide zoom.':streetScope==='city'?`${data.all.length} offices across ${clients} clients in ${location.key}. Select a bank to see its connections.`:`${data.all.length} offices in ${new Set(data.all.map(item=>mapCityKey(item.record.city))).size} cities · Connections belong to ${nameOf('clients',selectedStreetClientId)}.${data.links.length?'':' No additional branch connections recorded.'}`;
  const legend=stage.querySelector('[data-network-link-legend]');if(description&&pending)description.textContent+=` ${pending} office locations still need to be saved.`;
  const tilt=stage.querySelector('[data-network-tilt]');tilt.textContent=streetTilt?'2D':'3D';tilt.classList.toggle('active',streetTilt);tilt.setAttribute('aria-pressed',String(streetTilt));tilt.setAttribute('aria-label',streetTilt?'Return to flat map':'Explore streets in 3D');tilt.title=tilt.getAttribute('aria-label');
  const unplaced=[...data.all.filter(item=>!streetHasPosition(item.point)),...data.missing];
  section.querySelector('#network-unplaced-list').innerHTML=unplaced.length?`<details class="network-unplaced-list" open><summary>Locations needed <span>${unplaced.length}</span></summary><p>These offices have no saved street position.</p>${unplaced.map(item=>`<div><strong>${esc(nameOf('clients',item.clientId))}</strong><small>${esc(item.kind==='head'?'Head office':item.record.name)} · ${esc(item.record.city||'City not set')}</small>${networkOfficeActions(item)}</div>`).join('')}</details>`:'';
  section.querySelector('#network-distance-panel').innerHTML=networkDistancePanel(data,distanceFromKey,distanceToKey);
  if(legend)legend.hidden=streetScope==='city'||!data.links.some(link=>link.exact);
 };
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const updateInspector=()=>{const client=byId('clients',selectedStreetClientId);if(!client)return;inspector.innerHTML=renderNetworkInspector(client,selected);syncView();};
 updateInspector();
 try{
  const lib=await import('./assets/maplibre-gl.mjs');if(token!==streetMapToken||!container.isConnected)return;
  lib.setWorkerUrl(new URL('assets/maplibre-gl-worker.mjs',document.baseURI).href);
  const map=new lib.Map({container,style:streetMapStyle(),center:[location.city.lon,location.city.lat],zoom:13.8,minZoom:4,maxZoom:18,maxPitch:65,pitch:0,bearing:0,cooperativeGestures:true,attributionControl:{compact:true},fadeDuration:200});clientStreetMap=map;
  map.boxZoom.disable();map.dragRotate.disable();map.touchZoomRotate.disableRotation();map.addControl(new lib.ScaleControl({maxWidth:85,unit:'metric'}),'bottom-left');
  function drawConnections(){
   if(token!==streetMapToken)return;svg.setAttribute('viewBox',`0 0 ${stage.clientWidth} ${stage.clientHeight}`);let html='';
   for(const link of visible().links){
    const draftHead=placing?.key==='head:'+link.clientId&&editCoordinates,draftBranch=placing?.key===link.key&&editCoordinates;
    const head=network.heads.find(item=>item.clientId===link.clientId),branch=network.branches.find(item=>item.key===link.key);
    if(head?.clientId!==branch?.clientId||head?.clientId!==selectedStreetClientId)continue;
    if(!(streetHasPosition(head?.point)||draftHead)||!(streetHasPosition(branch?.point)||draftBranch))continue;
    const from=map.project(draftHead?[draftHead.lng,draftHead.lat]:link.coordinates[0]),to=map.project(draftBranch?[draftBranch.lng,draftBranch.lat]:link.coordinates[1]),dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);if(length<3)continue;
    const bend=Math.min(70,length*.17),cx=(from.x+to.x)/2-dy/length*bend,cy=(from.y+to.y)/2+dx/length*bend,d=`M${from.x} ${from.y}Q${cx} ${cy} ${to.x} ${to.y}`,muted=hoverKey&&hoverKey!==link.key&&!hoverKey.startsWith('head:');
    html+=`<g class="network-link ${muted?'is-muted':''} ${draftHead||draftBranch?'is-preview':''}"><path class="network-link-halo" d="${d}"/><path class="network-link-line" d="${d}"/><path class="network-link-flow" d="${d}"/></g>`;
    if(length>100){const a=draftHead?{lon:draftHead.lng,lat:draftHead.lat,exact:true}:head.point,b=draftBranch?{lon:draftBranch.lng,lat:draftBranch.lat,exact:true}:branch.point;html+=`<text class="network-link-distance" x="${cx}" y="${cy-8}" text-anchor="middle">${streetDistanceLabel(streetDistanceMetres(a,b))}</text>`;}
   }
   
   svg.innerHTML=html;
  }
  const itemByKey=key=>[...network.heads,...network.branches,...network.missing].find(item=>item.key===key);
  const cancelPopupClose=()=>{clearTimeout(popupCloseTimer);popupCloseTimer=null;};
  const closePopup=()=>{cancelPopupClose();popup?.remove();popup=null;hoverKey='';drawConnections();};
  const schedulePopupClose=()=>{cancelPopupClose();popupCloseTimer=setTimeout(()=>{if(!popup?._networkLocked)closePopup();},220);};
  function showPopup(items,point,locked=false){
   cancelPopupClose();popup?.remove();const box=document.createElement('div');box.className='network-popup';
   box.style.setProperty('--network-popup-height',Math.max(120,stage.clientHeight-100)+'px');
   box.innerHTML=networkPopupContent(items,locked);
   box.addEventListener('mouseenter',cancelPopupClose);box.addEventListener('mouseleave',schedulePopupClose);
   box.addEventListener('focusin',cancelPopupClose);box.addEventListener('focusout',event=>{if(!box.contains(event.relatedTarget))schedulePopupClose();});
   // Keep native list scrolling and button clicks, without starting a map drag.
   for(const type of ['pointerdown','mousedown','dblclick','touchstart','touchmove','wheel'])box.addEventListener(type,event=>event.stopPropagation(),{passive:true});
   const nextPopup=new lib.Popup({closeButton:true,closeOnClick:false,focusAfterOpen:false,maxWidth:'280px',offset:32,className:'client-network-popup'}).setLngLat([point.lon,point.lat]).setDOMContent(box).addTo(map);popup=nextPopup;popup._networkLocked=locked;
   nextPopup.on('close',()=>{if(popup===nextPopup){popup=null;hoverKey='';cancelPopupClose();drawConnections();}});
  }
  function drawPins(close=true){
   for(const marker of markers)marker.remove();markers=[];if(close)closePopup();
   const zoom=map.getZoom();
   for(const group of streetZoomGroups(visible().all.filter(item=>item.key!==placing?.key),point=>map.project(point),zoom)){
    const cluster=group.items.length>1,kind=group.items.some(item=>item.kind==='head')?'head':'branch',element=document.createElement('button');element.type='button';
    element.className=cluster?'network-cluster':`network-pin ${kind}`;
    element.innerHTML=cluster?`<strong>${group.items.length}</strong><small>+</small>`:networkPinArt(kind,1);
    element.setAttribute('aria-label',cluster?`${group.items.length} nearby offices. Zoom in or select an office.`:`${nameOf('clients',group.items[0].clientId)}, ${kind==='head'?'Head office':group.items[0].record.name}, saved location. View actions.`);
    element.addEventListener('mouseenter',()=>{cancelPopupClose();if(placing||popup?._networkLocked)return;hoverKey=group.items[0].key;drawConnections();showPopup(group.items,group.point);});
    element.addEventListener('mouseleave',schedulePopupClose);
    element.addEventListener('focus',()=>{if(!placing){hoverKey=group.items[0].key;drawConnections();showPopup(group.items,group.point);}});
    element.addEventListener('click',event=>{event.stopPropagation();if(placing)return;if(cluster&&zoom<17){closePopup();map.flyTo({center:[group.point.lon,group.point.lat],zoom:Math.min(18,zoom+2),duration:reduced?0:600});return;}hoverKey=group.items[0].key;showPopup(group.items,group.point,true);drawConnections();});
    markers.push(new lib.Marker({element,anchor:cluster?'center':'bottom',offset:[0,0]}).setLngLat([group.point.lon,group.point.lat]).addTo(map));
   }drawConnections();
  }
  function refreshNetwork(){
   const current=footprintLocations().find(item=>item.key===selectedMapCity);if(!current)return;
   network=streetNetwork(current);selected=streetClientNetwork(network,selectedStreetClientId);updateInspector();drawPins();
  }
  window.refreshClientStreetMap=refreshNetwork;
  function cancelPlacement(restore=true,redraw=true){
   const previous=editReturn;placing=null;editMarker?.remove();editMarker=null;editCoordinates=null;editChanged=false;editReturn=null;
   stage.classList.remove('is-placing');stage.querySelector('.network-place-banner').hidden=true;
   if(restore&&previous){streetScope=previous.scope;selectedStreetClientId=previous.clientId;picker.value=selectedStreetClientId;selected=streetClientNetwork(network,selectedStreetClientId);updateInspector();map.jumpTo(previous.camera);}
   if(redraw)drawPins();
  }
  function updatePlacementBanner(message=''){
   if(!placing)return;
   const banner=stage.querySelector('.network-place-banner');banner.hidden=false;
   banner.innerHTML=`<div><strong>${esc(nameOf('clients',placing.clientId))} · ${esc(placing.kind==='head'?'Head office':placing.record.name)}</strong><span>${editCoordinates?'Drag the pin or click another street. Save to confirm.':'Click the correct street or drag the temporary pin.'}</span><small>${editCoordinates?`${editCoordinates.lat.toFixed(6)}, ${editCoordinates.lng.toFixed(6)} · Unsaved`: 'No change saved'}</small>${message?`<p role="alert">${esc(message)}</p>`:''}</div><div class="network-placement-actions"><button type="button" data-network-cancel-place>Cancel</button><button type="button" data-network-save-place ${!editChanged||!editCoordinates?'disabled':''}>Save location</button></div>`;
  }
  function setCandidate(coordinates){
   if(!placing)return;
   const lng=((Number(coordinates.lng)+180)%360+360)%360-180,lat=Number(coordinates.lat);
   if(!Number.isFinite(lng)||!Number.isFinite(lat)||Math.abs(lat)>85){updatePlacementBanner('Choose a valid street location.');return;}
   editCoordinates={lng,lat};editChanged=true;editMarker?.setLngLat([lng,lat]);updatePlacementBanner();drawConnections();
  }
  function beginPlacement(item){
   cancelPlacement(false,false);closePopup();
   const centre=map.getCenter();editReturn={scope:streetScope,clientId:selectedStreetClientId,camera:{center:[centre.lng,centre.lat],zoom:map.getZoom(),pitch:map.getPitch(),bearing:map.getBearing()}};
   if(item.clientId!==selectedStreetClientId){selectedStreetClientId=item.clientId;picker.value=item.clientId;selected=streetClientNetwork(network,item.clientId);}
   placing=item;editSnapshot=localStorage.getItem(STORE_KEY);editCoordinates=item.point?.exact?{lng:item.point.lon,lat:item.point.lat}:null;editChanged=false;
   streetScope='network';updateInspector();drawPins();stage.classList.add('is-placing');
   const start=item.point||location.city,element=document.createElement('button');element.type='button';element.className=`network-pin network-edit-pin ${item.kind}`;element.innerHTML=networkPinArt(item.kind,1);element.setAttribute('aria-label','Unsaved office pin. Drag or use arrow keys to move. Escape cancels.');
   editMarker=new lib.Marker({element,anchor:'bottom',offset:[0,4],draggable:true}).setLngLat([start.lon,start.lat]).addTo(map);
   editMarker.on('drag',()=>{if(placing&&editMarker)setCandidate(editMarker.getLngLat());});
   editMarker.on('dragend',()=>{if(placing&&editMarker)setCandidate(editMarker.getLngLat());});
   element.addEventListener('click',event=>event.stopPropagation());
   element.addEventListener('keydown',event=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();event.stopPropagation();const p=map.project(editMarker.getLngLat()),step=event.shiftKey?20:5;setCandidate(map.unproject([p.x+(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0),p.y+(event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0)]));});
   updatePlacementBanner();map.flyTo({center:[start.lon,start.lat],zoom:Math.max(15.5,map.getZoom()),duration:reduced?0:600});element.focus({preventScroll:true});
  }
  function savePlacement(){
   if(!placing||!editCoordinates||!editChanged)return;
   const key=placing.key,kind=placing.kind==='head'?'client':'branch';
   try{commitMapPin(kind,placing.record.id,editCoordinates,editSnapshot);}
   catch(error){const current=footprintLocations().find(item=>item.key===selectedMapCity);if(current)network=streetNetwork(current);updatePlacementBanner(error.message);return;}
   cancelPlacement(false,false);refreshNetwork();const item=itemByKey(key);if(item?.point)showPopup([item],item.point,true);toast('Office location saved.');
  }
  function fit(scope=streetScope){
   cancelPlacement(false,false);streetScope=scope;streetTilt=false;syncView();drawPins();
   const items=visible().all.filter(item=>streetHasPosition(item.point));
   if(!items.length){map.flyTo({center:[location.city.lon,location.city.lat],zoom:13.8,pitch:0,bearing:0,duration:reduced?0:850});return;}
   const coordinates=items.map(item=>[item.point.lon,item.point.lat]),bounds=coordinates.reduce((box,point)=>box.extend(point),new lib.LngLatBounds(coordinates[0],coordinates[0]));
   map.fitBounds(bounds,{padding:{top:90,right:55,bottom:90,left:55},maxZoom:16,duration:reduced?0:900,pitch:0,bearing:0});
  }
  async function loadStreets(){
   const version=++loadVersion;loading.hidden=false;loading.innerHTML='<span></span>Opening street map…';
   try{const result=await streetDataFor([location.city.name,...selected.all.map(item=>mapCityKey(item.record.city))]);if(token!==streetMapToken||version!==loadVersion)return;map.getSource('streets')?.setData(result.data);loading.hidden=!result.missing.includes(location.city.name.toLowerCase());if(!loading.hidden)loading.textContent='Detailed streets are not available for this city yet.';}
   catch{if(token===streetMapToken){loading.hidden=false;loading.textContent='Street details could not load. Your client locations are still shown.';}}
  }
  function selectClient(id,fitView=true){
   if(!location.clients.has(id))return;cancelPlacement(false,false);selectedStreetClientId=id;picker.value=id;selected=streetClientNetwork(network,id);streetScope='network';updateInspector();loadStreets();if(fitView)fit('network');else drawPins();
  }
  function focusItem(key){
   const item=itemByKey(key);if(!item?.point)return;
   if(!streetHasPosition(item.point)){beginPlacement(item);return;}
   cancelPlacement(false,false);
   if(item.clientId!==selectedStreetClientId)selectClient(item.clientId,false);
   streetScope='network';syncView();drawPins();inspector.querySelectorAll('[data-network-row]').forEach(row=>row.classList.toggle('is-selected',row.dataset.networkRow===key));hoverKey=key;
   map.flyTo({center:[item.point.lon,item.point.lat],zoom:Math.max(map.getZoom(),item.point.exact?16:15.5),duration:reduced?0:850,pitch:streetTilt?60:0,bearing:streetTilt?-24:0});showPopup([item],item.point,true);drawConnections();
  }
  const onClick=event=>{
   const target=event.target.closest('button');if(!target)return;
   if(target.hasAttribute('data-network-save-place')){savePlacement();return;}
   if(target.hasAttribute('data-network-cancel-place')){cancelPlacement();return;}
   if(target.dataset.networkPlace){const item=itemByKey(target.dataset.networkPlace);if(item)beginPlacement(item);return;}
   if(target.dataset.networkRemove){const item=itemByKey(target.dataset.networkRemove);if(item){cancelPlacement(false);closePopup();openRemoveMapPin(item.kind==='head'?'client':'branch',item.record.id);}return;}
   if(target.dataset.networkView){const item=itemByKey(target.dataset.networkView);if(item){cancelPlacement(false);closePopup();if(item.kind==='head'){selectedClientId=item.record.id;profileTab='overview';setView('profile');}else showDetail('branch',item.record.id);}return;}
   if(target.dataset.mapEdit){cancelPlacement(false);}
   if(target.dataset.streetFocus){closePopup();fit(target.dataset.streetFocus);}
   if(target.dataset.networkLocation)focusItem(target.dataset.networkLocation);
   if(target.dataset.networkZoom)map.zoomTo(map.getZoom()+(target.dataset.networkZoom==='in'?1:-1),{duration:reduced?0:450});
   if(target.hasAttribute('data-network-fit')){closePopup();fit();}
   if(target.hasAttribute('data-network-tilt')){
    cancelPlacement(false);closePopup();streetTilt=!streetTilt;
    // Change perspective at the user's current position and zoom, in either direction.
    map.easeTo({pitch:streetTilt?60:0,duration:reduced?0:650});
    syncView();
   }
   if(target.hasAttribute('data-network-expand')){expanded=!expanded;section.classList.toggle('is-expanded',expanded);document.body.classList.toggle('network-map-expanded',expanded);target.innerHTML=expanded?'× <span>Close</span>':'⛶ <span>Expand</span>';target.setAttribute('aria-label',expanded?'Close expanded map':'Expand map');map.resize();fit();}
  };
  const onKey=event=>{if(event.key==='Escape'){if(placing){cancelPlacement();return;}closePopup();section.querySelectorAll('.network-office-menu[open]').forEach(menu=>menu.removeAttribute('open'));if(expanded){expanded=false;section.classList.remove('is-expanded');document.body.classList.remove('network-map-expanded');section.querySelector('[data-network-expand]').innerHTML='⛶ <span>Expand</span>';map.resize();}}};
  const onChange=()=>selectClient(picker.value),onDistanceChange=event=>{if(!event.target.dataset.networkDistance)return;distanceFromKey=section.querySelector('#network-distance-from').value;distanceToKey=section.querySelector('#network-distance-to').value;section.querySelector('#network-distance-panel').innerHTML=networkDistancePanel(visible(),distanceFromKey,distanceToKey);};section.addEventListener('click',onClick);section.addEventListener('change',onDistanceChange);picker.addEventListener('change',onChange);document.addEventListener('keydown',onKey);
  const interruptPlacement=()=>{if(placing)cancelPlacement();};window.addEventListener('blur',interruptPlacement);window.addEventListener('pointercancel',interruptPlacement);
  map.on('click',event=>{if(event.originalEvent?.target?.closest?.('.maplibregl-popup,.maplibregl-marker'))return;if(!placing){closePopup();section.querySelectorAll('.network-office-menu[open]').forEach(menu=>menu.removeAttribute('open'));return;}setCandidate(event.lngLat);});
  map.on('move',drawConnections);
  map.on('moveend',()=>{if(token===streetMapToken)drawPins(false);});
  map.on('load',()=>{if(token!==streetMapToken)return;stage.classList.add('street-ready');loadStreets();fit();});
  map.on('error',()=>{if(token===streetMapToken&&!map.isStyleLoaded()){loading.hidden=false;loading.textContent='The map could not initialize. Reload this page to try again.';}});
  resizeObserver=new ResizeObserver(()=>{if(token===streetMapToken){map.resize();drawPins(false);}});resizeObserver.observe(stage);
  streetMapCleanup=()=>{cancelPopupClose();for(const marker of markers)marker.remove();markers=[];if(window.refreshClientStreetMap===refreshNetwork)window.refreshClientStreetMap=null;placing=null;editMarker?.remove();document.body.classList.remove('network-map-expanded');resizeObserver?.disconnect();document.removeEventListener('keydown',onKey);window.removeEventListener('blur',interruptPlacement);window.removeEventListener('pointercancel',interruptPlacement);section.removeEventListener('click',onClick);section.removeEventListener('change',onDistanceChange);picker.removeEventListener('change',onChange);popup?.remove();};
 }catch(error){if(token===streetMapToken){loading.hidden=false;loading.textContent='The map could not open. Reload this page to try again.';}}
}
window.bindClientStreetMap=bindClientStreetMap;
