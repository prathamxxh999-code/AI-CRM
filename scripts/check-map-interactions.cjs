/* Exercise the actual map interaction code with an in-memory map adapter; no browser automation. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
class Events{
 constructor(){this.events=new Map();}
 on(type,fn){if(!this.events.has(type))this.events.set(type,new Set());this.events.get(type).add(fn);return this;}
 emit(type,event={}){for(const fn of [...(this.events.get(type)||[])])fn(event);}
 addEventListener(type,fn){this.on(type,fn);}
 removeEventListener(type,fn){this.events.get(type)?.delete(fn);}
}
class Element extends Events{
 constructor(){super();this.innerHTML='';this.textContent='';this.dataset={};this.attributes={};this.nodes=new Map();this.hidden=false;this.isConnected=true;this.clientWidth=800;this.clientHeight=560;this.style={setProperty(){}};const classes=new Set();this.classList={add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)};}
 querySelector(key){if(!this.nodes.has(key))this.nodes.set(key,new Element());return this.nodes.get(key);}
 querySelectorAll(){return [];}
 setAttribute(key,value){this.attributes[key]=value;}
 getAttribute(key){return this.attributes[key];}
 removeAttribute(key){delete this.attributes[key];}
 hasAttribute(key){return key in this.attributes||key.startsWith('data-')&&key.slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase()) in this.dataset;}
 closest(selector){return selector==='button'?this:null;}
 contains(element){return element===this;}
 focus(){}remove(){this.isConnected=false;}
}
const stage=new Element(),section=new Element(),document=new Element(),windowEvents=new Events(),activeMarkers=new Set();
stage.closest=()=>section;document.baseURI='http://127.0.0.1:8765/';document.body=new Element();document.createElement=()=>new Element();
let map,quota=false,stored=null,view='',detail=null,toast='',modalArgs=null;
const lngLat=value=>Array.isArray(value)?{lng:value[0],lat:value[1]}:{lng:value.lng,lat:value.lat};
class MapAdapter extends Events{
 constructor(options){super();map=this;this.options=options;this.camera={center:lngLat(options.center),zoom:options.zoom,pitch:options.pitch,bearing:options.bearing};this.boxZoom={disable(){}};this.dragRotate={disable(){}};this.touchZoomRotate={disableRotation(){}};}
 addControl(){}getZoom(){return this.camera.zoom;}getCenter(){return this.camera.center;}getPitch(){return this.camera.pitch;}getBearing(){return this.camera.bearing;}
 project(value){const p=lngLat(value),scale=10000*2**(this.camera.zoom-13);return {x:400+(p.lng-73.8567)*scale,y:280-(p.lat-18.5204)*scale};}
 unproject([x,y]){const scale=10000*2**(this.camera.zoom-13);return {lng:73.8567+(x-400)/scale,lat:18.5204-(y-280)/scale};}
 jumpTo(camera){for(const key of ['zoom','pitch','bearing'])if(camera[key]!==undefined)this.camera[key]=camera[key];if(camera.center)this.camera.center=lngLat(camera.center);this.emit('move');this.emit('moveend');}
 flyTo(camera){this.jumpTo(camera);}easeTo(camera){this.jumpTo(camera);}zoomTo(zoom){this.jumpTo({zoom});}
 fitBounds(bounds,options){this.jumpTo({center:bounds.first,zoom:options.maxZoom,pitch:options.pitch,bearing:options.bearing});}
 getSource(){return {setData(){}};}isStyleLoaded(){return true;}resize(){}remove(){this.removed=true;}
}
class Marker extends Events{
 constructor(options){super();this.options=options;}
 setLngLat(value){this.point=lngLat(value);return this;}getLngLat(){return {...this.point};}addTo(){activeMarkers.add(this);return this;}remove(){activeMarkers.delete(this);return this;}
}
class Popup extends Events{
 setLngLat(){return this;}setDOMContent(element){this.element=element;return this;}addTo(){return this;}remove(){this.emit('close');return this;}
}
const state={clients:[{id:'one',name:'One Bank',city:'Pune'},{id:'two',name:'Two Bank',city:'Pune'}],branches:[{id:'hq',clientId:'one',name:'Head Office',city:'Pune'},{id:'branch',clientId:'one',name:'East branch',city:'Pune'}],deployments:[],activity:[],helpdesk:{changeVersion:0}};
const demoStartup=process.argv.includes('--demo');
if(demoStartup){
 const app=fs.readFileSync('dist/app.js','utf8'),seedSource=app.slice(app.indexOf('function seed()'),app.indexOf('\nlet state;'));
 const fixture=vm.runInNewContext(seedSource+';seed()',{localDate:()=> '2026-10-19'});
 state.clients=fixture.clients;state.branches=fixture.branches;
}
const context={console,state,document,URL,URLSearchParams,Date,Math,Map,Set,Promise,STORE_KEY:'crm',location:new URL('http://127.0.0.1:8765/?mapCity=Pune&mapSample=1'),matchMedia:()=>({matches:true}),ResizeObserver:class{observe(){}disconnect(){}},setTimeout:()=>1,clearTimeout(){},
 localStorage:{getItem:()=>stored,setItem:(key,value)=>{if(quota){const e=new Error('Full');e.name='QuotaExceededError';throw e;}stored=value;}},
 esc:value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),initials:name=>name.split(' ').map(x=>x[0]).join('').slice(0,2),
 addEventListener:windowEvents.addEventListener.bind(windowEvents),removeEventListener:windowEvents.removeEventListener.bind(windowEvents),
 testMapLibrary:{Map:MapAdapter,Marker,Popup,ScaleControl:class{},LngLatBounds:class{constructor(first){this.first=first;}extend(){return this;}},setWorkerUrl(){}},
 $:selector=>document.querySelector(selector),modal:(...args)=>{modalArgs=args;},setView:value=>{view=value;},showDetail:(...args)=>{detail=args;},toast:value=>{toast=value;},field:()=>'',fetch:async file=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('dist/'+file.split('?')[0],'utf8'))}),
};context.window=context;
context.history={state:null,replaceState(state,title,url){this.state=state;context.location=new URL(url);}};
context.byId=(collection,id)=>context.state[collection].find(record=>record.id===id);context.nameOf=(collection,id)=>context.byId(collection,id)?.name||'';
context.logActivity=(clientId,title,message)=>context.state.activity.unshift({clientId,title,message});context.save=()=>context.localStorage.setItem('crm',JSON.stringify(context.state));
vm.createContext(context);const run=code=>vm.runInContext(code,context);for(const file of ['assets/india-maps.js','client-map.js','street-map.js']){
 const code=fs.readFileSync('dist/'+file,'utf8').replace("await import('./assets/maplibre-gl.mjs')","await Promise.resolve(globalThis.testMapLibrary)");vm.runInContext(code,context,{filename:file});
}
const click=dataset=>{const target=new Element();target.dataset=dataset;section.emit('click',{target});};
const editMarker=()=>[...activeMarkers].find(marker=>marker.options.draggable);
const candidate=(lng,lat)=>{const marker=editMarker();assert(marker,'A temporary draggable pin exists');marker.setLngLat([lng,lat]);marker.emit('dragend');};
const plain=value=>JSON.parse(JSON.stringify(value));
function checkTiltKeepsUserView(){
 const original=plain(map.camera);
 map.jumpTo({center:[73.902,18.56],zoom:12.25,bearing:17,pitch:0});
 const before=plain(map.camera);click({networkTilt:''});
 assert.deepEqual(plain(map.camera),{...before,pitch:60},'3D tilts without changing the current center, zoom, or heading');
 assert.equal(stage.querySelector('[data-network-tilt]').textContent,'2D');
 map.jumpTo({center:[73.844,18.509],zoom:14.125});
 const explored=plain(map.camera);click({networkTilt:''});
 assert.deepEqual(plain(map.camera),{...explored,pitch:0},'2D preserves where the user panned and zoomed while in 3D');
 assert.equal(stage.querySelector('[data-network-tilt]').textContent,'3D');
 click({networkTilt:''});click({networkTilt:''});
 assert.deepEqual(plain(map.camera),{...explored,pitch:0},'Repeated perspective changes cannot reset the view');
 map.jumpTo(original);
}
if(demoStartup){
 const preserved=plain(state),office=preserved.clients.find(record=>record.id==='c1');
 Object.assign(office,{mapLat:18.56,mapLon:73.88,mapLocationSource:'manual'});
 preserved.clients.push({id:'custom',name:'Custom client',city:'Pune',email:'office@example.com'});
 context.seedDemoOfficeLocations(preserved);
 assert.equal(office.mapLat,18.56,'Demo setup preserves an existing office position');
 assert.equal(office.mapLocationSource,'manual');
 assert.equal(preserved.clients.find(record=>record.id==='custom').mapLat,undefined,'Only existing fictional demo records receive dummy positions');
}
(async()=>{
 run("selectedMapCity='Pune';selectedMapRegion='IN-MH'");context.save();const startupState=JSON.stringify(context.state);await context.bindClientStreetMap(stage);
 assert(map,'Map initialized');assert(section.events.get('click')?.size,'Map actions are bound');map.emit('load');
 checkTiltKeepsUserView();
 if(demoStartup){
  const offices=context.state.clients.filter(record=>record.city==='Pune');
  assert.equal(offices.length,7);assert.equal(activeMarkers.size,7,'All seven Pune demo office pins appear on first load');
  assert.equal(new Set(offices.map(record=>record.mapLat+','+record.mapLon)).size,7,'Demo offices have distinct positions');
  assert(offices.every(record=>record.mapLocationSource==='demo'));
  assert.equal(context.byId('branches','b1').mapLat,context.byId('clients','c1').mapLat,'HQ coordinates are synchronized');
  assert(JSON.parse(stored).mapDemoOfficeLocationsApplied,'Demo positions persist for refresh');
  assert(section.querySelector('#network-distance-panel').innerHTML.includes('Between demo locations'));
  assert(!stage.querySelector('.network-connections').innerHTML.includes('<path'),'Different clients remain unlinked');
  click({networkTilt:''});assert.equal(activeMarkers.size,7,'All pins remain visible in 3D');
  await context.bindClientStreetMap(stage);map.emit('load');assert.equal(activeMarkers.size,7,'Reopening the map preserves all demo pins');
  run("commitMapPin('client','c1',null)");context.refreshClientStreetMap();
  await context.bindClientStreetMap(stage);map.emit('load');assert.equal(activeMarkers.size,6,'Removing a dummy pin persists and does not reseed it');
  run("commitMapPin('client','cx1',{lat:18.51,lng:73.84})");assert.equal(context.byId('clients','cx1').mapLocationSource,'manual');assert.equal(context.byId('branches','bx1').mapLocationSource,'manual');
  context.disposeClientStreetMap();console.log('Seven demo Pune offices: visible on load and reload, distinct positions, compact markers, HQ sync, editable locations, persistent removal, and no cross-client links.');return;
 }
 assert.equal(activeMarkers.size,0,'Old sample preview links cannot invent office positions');
 assert.equal(JSON.stringify(context.state),startupState,'Opening the map cannot write coordinates');
 assert(section.querySelector('#network-unplaced-list').innerHTML.includes('Locations needed'));
 assert(section.querySelector('#network-distance-panel').innerHTML.includes('Save locations for two offices'));
 map.zoomTo(16);assert.equal(activeMarkers.size,0,'Zoom cannot invent locations for unsaved offices');
 // Coordinates are test fixtures saved through the normal office location operation.
 run("commitMapPin('client','one',{lat:18.52,lng:73.855});commitMapPin('client','two',{lat:18.54,lng:73.865});commitMapPin('branch','branch',{lat:18.535,lng:73.875});");
 context.refreshClientStreetMap();
 assert.equal(activeMarkers.size,3);assert([...activeMarkers].every(marker=>marker.options.element.innerHTML.includes('map-pushpin-red.png')),'Saved offices use the reference-style pushpin');
 assert(!stage.querySelector('.network-connections').innerHTML.includes('<path'),'Different clients are never connected in city view');
 assert(section.querySelector('#network-distance-panel').innerHTML.includes('Between saved locations'));
 click({networkTilt:''});assert.equal(activeMarkers.size,3,'Saved pins remain visible in 3D');
 click({streetFocus:'network'});checkTiltKeepsUserView();map.zoomTo(16);assert.equal(activeMarkers.size,2,'Bank view keeps only its own offices');
 assert(stage.querySelector('.network-connections').innerHTML.includes('network-link-distance'),'Own-branch connection shows its straight-line distance');
 assert(!stage.querySelector('.network-connections').innerHTML.includes('network-spread-leg'),'No decorative fan-out lines can imply cross-client links');
 click({streetFocus:'city'});assert.equal(activeMarkers.size,3,'City view restores all saved pins');
 const before=JSON.stringify(context.state),beforeCamera=plain(map.camera);
 click({networkPlace:'head:one'});candidate(73.87,18.53);assert.equal(JSON.stringify(context.state),before,'Dragging is temporary');
 click({networkCancelPlace:''});assert.equal(JSON.stringify(context.state),before);assert(!editMarker());assert.deepEqual(plain(map.camera),beforeCamera,'Cancel restores the camera');
 click({networkPlace:'head:one'});map.emit('click',{lngLat:{lng:73.87,lat:18.53}});document.emit('keydown',{key:'Escape',target:new Element()});assert.equal(JSON.stringify(context.state),before);assert(!editMarker());
 click({networkPlace:'head:one'});candidate(73.87,18.53);click({networkSavePlace:''});
 assert.equal(context.byId('clients','one').mapLat,18.53);assert.equal(context.byId('branches','hq').mapLat,18.53,'HQ coordinates stay synchronized');assert.equal(JSON.parse(stored).clients[0].mapLon,73.87);assert(!editMarker());assert.equal(toast,'Office location saved.');
 click({networkPlace:'head:one'});const keyboardPin=editMarker();keyboardPin.options.element.emit('keydown',{key:'ArrowRight',preventDefault(){},stopPropagation(){}});assert(keyboardPin.point.lng>73.87);windowEvents.emit('pointercancel');assert.equal(context.byId('clients','one').mapLon,73.87);assert(!editMarker());
 click({networkPlace:'head:one'});candidate(73.88,18.54);windowEvents.emit('blur');assert.equal(context.byId('clients','one').mapLon,73.87);assert(!editMarker());
 const saved=JSON.stringify(context.state);click({networkPlace:'head:one'});candidate(73.89,18.55);quota=true;click({networkSavePlace:''});quota=false;assert.equal(JSON.stringify(context.state),saved,'Failed save restores coordinates, linked HQ, and history');assert(stage.querySelector('.network-place-banner').innerHTML.includes('not changed'));click({networkCancelPlace:''});
 click({networkPlace:'head:one'});candidate(73.9,18.56);const previousStored=stored;stored=stored+' ';click({networkSavePlace:''});assert.equal(JSON.stringify(context.state),saved,'A stale editor cannot overwrite newer storage');assert(stage.querySelector('.network-place-banner').innerHTML.includes('workspace changed'));click({networkCancelPlace:''});stored=previousStored;
 click({networkView:'branch:branch'});assert.deepEqual(detail,['branch','branch']);click({networkView:'head:one'});assert.equal(view,'profile');assert.equal(run('selectedClientId'),'one');
 click({networkRemove:'head:one'});assert.equal(modalArgs[0],'Remove office pin');assert.equal(JSON.stringify(context.state),saved,'Opening a remove confirmation has no side effect');
 run("commitMapPin('client','one',null,mapPinEditSnapshot)");context.refreshClientStreetMap();assert.equal(context.byId('clients','one').mapLat,'');assert.equal(context.byId('branches','hq').mapLat,'');assert.equal(context.state.clients.length,2,'Removing a pin keeps the client record');
 click({networkPlace:'branch:branch'});candidate(73.86,18.54);context.disposeClientStreetMap();assert(!editMarker());assert.equal(context.byId('branches','branch').mapLat,18.535,'Leaving the map preserves the saved location and discards the draft');assert.equal(context.refreshClientStreetMap,null);
 console.log('Map interactions passed: saved coordinates only, legacy sample links ignored, no cross-client links, distance labels, temporary drag, Save/Cancel, Escape, keyboard movement, touch cancellation, stale edits, quota rollback, view actions, pin removal, and cleanup.');
})().catch(error=>{console.error(error);process.exitCode=1;});
