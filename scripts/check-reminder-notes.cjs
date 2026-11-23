/* Pure model and local interaction checks. Does not automate or access a browser. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=file=>fs.readFileSync(path.join(__dirname,'../dist',file),'utf8');
const modelContext=vm.createContext({});
const N=vm.runInContext(source('reminder-notes-model.js')+';ReminderNotes',modelContext);
const valid={title:'Call account owner',details:'Confirm the rollout',due:'2026-10-20',clientId:'c1',noteColor:'mint',priority:'High'};
assert.equal(N.validate(valid,[{id:'c1'}]).title,valid.title);
for(const patch of [{title:' '},{title:'a'.repeat(161)},{details:'a'.repeat(2001)},{due:'2026-02-30'},{due:'bad'},{clientId:'missing'},{noteColor:'red'},{priority:'Urgent'}])assert.throws(()=>N.validate({...valid,...patch},[{id:'c1'}]));
assert.equal(N.validate({...valid,due:'2024-02-29'},[{id:'c1'}]).due,'2024-02-29');
assert.equal(N.position({x:-500,y:-200}).x,N.padding);assert.equal(N.position({x:9000,y:Infinity}).x,N.width-N.noteWidth-N.padding);
const grid=Array.from({length:12},(_,i)=>({id:String(i),notePosition:N.position(null,i)}));
const fresh=N.vacant(grid);assert.ok(grid.every(r=>Math.abs(r.notePosition.x-fresh.x)>=N.noteWidth||Math.abs(r.notePosition.y-fresh.y)>=N.noteHeight));assert.ok(N.height([...grid,{notePosition:fresh}])>=fresh.y+N.noteHeight);
assert.ok(N.matches({...valid,done:false},'due','rollout','2026-10-21'));assert.ok(!N.matches({...valid,done:true},'due','','2026-10-21'));assert.ok(N.matches({...valid,done:true},'done','sahyadri','2026-10-21','Sahyadri Bank'));
console.log('Reminder model: validation, calendar dates, filtering, canvas bounds and non-overlapping placement passed.');

const storage=new Map(),nodes=new Map(),events={},windowEvents={};let quota=false;
const node=()=>({innerHTML:'',textContent:'',dataset:{},style:{},children:[],scrollTop:0,scrollLeft:0,classList:{add(){},remove(){},toggle(){}},addEventListener(){},focus(){},setSelectionRange(){},querySelector(){return null;},querySelectorAll(){return [];},insertAdjacentHTML(){},setAttribute(){},remove(){},scrollIntoView(){}});
const document={querySelector(selector){if(selector==='#ticket-update-form'||selector==='.modal form')return null;if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector);},querySelectorAll(){return [];},getElementById(){return null;},addEventListener(type,fn,capture=false){(events[type]||=[]).push({fn,capture});},body:node(),activeElement:null,visibilityState:'visible'};
const sandbox={console,document,localStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){if(quota){const e=new Error('Full');e.name='QuotaExceededError';throw e;}storage.set(k,v);}},Date,Math,Set,Map,Intl,URL,URLSearchParams,location:{search:'?preview=local-check'},matchMedia:()=>({matches:true}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,innerWidth:1400,innerHeight:900,addEventListener(type,fn){(windowEvents[type]||=[]).push(fn);},scrollTo(){},CSS:{escape:x=>x}};sandbox.window=sandbox;
sandbox.FormData=class{constructor(form){this.values=form.values;}*[Symbol.iterator](){yield*Object.entries(this.values);}getAll(name){return [].concat(this.values[name]||[]);}};
vm.createContext(sandbox);sandbox.renderWorkflowCanvas=()=>'';sandbox.renderProspectHub=()=>'';
for(const file of ['crud-model.js','helpdesk-model.js','product-catalog-model.js','reminder-notes-model.js','app.js','crm-ops.js','core-workspaces.js','prospect-hub.js','helpdesk.js','product-catalog.js','reminder-notes.js'])vm.runInContext(source(file),sandbox,{filename:file});
const run=code=>vm.runInContext(code,sandbox),plain=value=>JSON.parse(JSON.stringify(value));
function target(dataset){return {dataset,closest(selector){return selector.split(',').some(part=>{const match=part.trim().match(/^\[data-([\w-]+)(?:="([^"]*)")?\]$/);if(!match)return false;const key=match[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return Object.hasOwn(dataset,key)&&(match[2]===undefined||dataset[key]===match[2]);})?this:null;}};}
function dispatch(type,extra){let stopped=false;const event={preventDefault(){},stopPropagation(){},stopImmediatePropagation(){stopped=true;},...extra};for(const {fn} of [...(events[type]||[])].sort((a,b)=>Number(b.capture)-Number(a.capture))){fn(event);if(stopped)break;}}
const click=(action,id)=>dispatch('click',{target:target({noteAction:action,id})});
run("setView('reminders')");assert.match(nodes.get('#main-content').innerHTML,/Reminder board/);assert.equal((run('renderReminderBoard()').match(/class="sticky-note/g)||[]).length,run('state.reminders.filter(r=>!r.done).length'));
click('new');assert.match(nodes.get('#modal-root').innerHTML,/note-editor-form/);
const values={...valid,title:'Test & follow-up <script>',details:'Line 1\nLine 2',clientId:run('state.clients[0].id')};
const form={id:'note-editor-form',dataset:{id:''},values};
dispatch('submit',{target:form});const id=run('state.reminders.at(-1).id');assert.equal(run('state.reminders.at(-1).title'),values.title);assert.match(run('renderReminderBoard()'),/Test &amp; follow-up &lt;script&gt;/);assert.equal(JSON.parse(storage.get('orbit-crm-idsspl-preview-v1')).reminders.at(-1).id,id);
const location=plain(run('state.reminders.at(-1).notePosition'));
click('edit',id);form.dataset.id=id;values.details='Updated details';dispatch('submit',{target:form});assert.equal(run('state.reminders.at(-1).details'),'Updated details');assert.deepEqual(plain(run('state.reminders.at(-1).notePosition')),location);
click('toggle',id);assert.equal(run('state.reminders.at(-1).done'),true);assert.ok(!run('renderReminderBoard()').includes('data-note-id="'+id+'"'));
dispatch('click',{target:target({noteFilter:'done'})});assert.ok(run('renderReminderBoard()').includes('data-note-id="'+id+'"'));click('toggle',id);assert.equal(run('state.reminders.at(-1).done'),false);
click('delete',id);assert.ok(run(`state.reminders.some(r=>r.id===${JSON.stringify(id)})`));assert.match(nodes.get('#modal-root').innerHTML,/Delete this note/);click('confirm-delete',id);assert.ok(!run(`state.reminders.some(r=>r.id===${JSON.stringify(id)})`));click('undo');assert.ok(run(`state.reminders.some(r=>r.id===${JSON.stringify(id)})`));assert.deepEqual(plain(run('state.reminders.at(-1).notePosition')),location);
click('read',id);assert.match(nodes.get('#modal-root').innerHTML,/Updated details/);
// Failed writes roll back both the note and presentation defaults.
click('edit',id);const before=run('JSON.stringify(state)');values.details='Should not save';quota=true;dispatch('submit',{target:form});quota=false;assert.equal(run('JSON.stringify(state)'),before);assert.match(nodes.get('#modal-root .form-error').textContent,/storage is full/);
const saved=storage.get('orbit-crm-idsspl-preview-v1');storage.set('orbit-crm-idsspl-preview-v1',saved+' ');dispatch('submit',{target:form});assert.equal(run('JSON.stringify(state)'),before);assert.match(nodes.get('#modal-root .form-error').textContent,/workspace changed/);storage.set('orbit-crm-idsspl-preview-v1',saved);
// Arrow-key placement is persistent and clamped to the canvas.
const handle=target({noteDrag:id});dispatch('keydown',{target:handle,key:'ArrowRight',shiftKey:true});assert.equal(run('state.reminders.at(-1).notePosition.x'),Math.min(location.x+30,N.width-N.noteWidth-N.padding));
const afterKey=plain(run('state.reminders.at(-1).notePosition'));
// Pointer movement accounts for zoom and scroll. Cancellation must not persist.
const card={...node(),isConnected:true},scroll={...node(),getBoundingClientRect:()=>({top:0,left:0,right:1000,bottom:800})};
handle.closest=selector=>selector==='[data-note-drag]'?handle:selector==='.sticky-note'?card:selector==='.notes-scroll'?scroll:null;handle.focus=()=>{};handle.setPointerCapture=()=>{};handle.hasPointerCapture=()=>false;
dispatch('pointerdown',{target:handle,button:0,isPrimary:true,pointerId:1,clientX:200,clientY:200});dispatch('pointermove',{pointerId:1,clientX:260,clientY:240});dispatch('pointercancel',{});assert.deepEqual(plain(run('state.reminders.at(-1).notePosition')),afterKey);
click('zoom-reset');assert.match(run('renderReminderBoard()'),/scale\(1.2\)/);
click('zoom-out');click('zoom-out');click('zoom-out');click('zoom-out');assert.match(run('renderReminderBoard()'),/scale\(0.8\)/);
dispatch('pointerdown',{target:handle,button:0,isPrimary:true,pointerId:2,clientX:200,clientY:200});dispatch('pointermove',{pointerId:2,clientX:240,clientY:240});dispatch('pointerup',{pointerId:2});assert.equal(run('state.reminders.at(-1).notePosition.x'),Math.min(afterKey.x+50,N.width-N.noteWidth-N.padding));assert.equal(run('state.reminders.at(-1).notePosition.y'),afterKey.y+50);
click('arrange');assert.deepEqual(plain(run('state.reminders.at(-1).notePosition')),plain(N.position(null,run('state.reminders.length-1'))));
assert.match(run('renderAssistant()'),/Open sticky note board/);
run("openForm('reminder')");assert.match(nodes.get('#modal-root').innerHTML,/note-editor-form/);
console.log('Reminder interactions: create/read/edit, assistant integration, completion, delete review/undo, persistent positions, zoom-aware drag, cancellation, keyboard movement, arrange, stale writes and storage rollback passed.');

// History records real changes without inventing a past for pre-existing notes.
const noteEvents=()=>plain(run(`state.noteHistory.entries.filter(e=>e.noteId===${JSON.stringify(id)})`));
for(const type of ['created','edited','completed','reopened','deleted','restored','moved'])assert.ok(noteEvents().some(e=>e.type===type),type+' recorded');
const detailsChange=noteEvents().find(e=>e.type==='edited').changes.find(c=>c.label==='Details');assert.equal(detailsChange.before,'Line 1\nLine 2');assert.equal(detailsChange.after,'Updated details');
assert.ok(run("state.noteHistory.entries.some(e=>e.noteId==='r1'&&e.type==='tracked')"));assert.ok(!run("state.noteHistory.entries.some(e=>e.noteId==='r1'&&e.type==='created')"));
const eventCount=run('state.noteHistory.entries.length');run('save()');run('save()');assert.equal(run('state.noteHistory.entries.length'),eventCount,'unrelated saves do not duplicate history');
click('history',id);assert.match(nodes.get('#modal-root').innerHTML,/View change/);assert.match(nodes.get('#modal-root').innerHTML,/Before/);assert.match(nodes.get('#modal-root').innerHTML,/Test &amp; follow-up &lt;script&gt;/);
click('history');assert.match(nodes.get('#modal-root').innerHTML,/Reminder history/);assert.match(nodes.get('#modal-root').innerHTML,/All existing notes are included/);assert.match(nodes.get('#modal-root').innerHTML,/data-tab="notes" aria-pressed="true"/);
// Restore through persisted history, independently of the short-lived Undo action.
click('delete',id);click('confirm-delete',id);assert.ok(run(`state.noteHistory.deleted.some(d=>d.record.id===${JSON.stringify(id)})`));
run('state=JSON.parse(localStorage.getItem(STORE_KEY));reminderHistoryBaseline=ReminderNotes.capture(state);');
click('history');dispatch('click',{target:target({noteAction:'history-tab',tab:'deleted'})});assert.match(nodes.get('#modal-root').innerHTML,/Test &amp; follow-up &lt;script&gt;/);click('history',id);assert.match(nodes.get('#modal-root').innerHTML,/Restore note/);
const archivedState=run('JSON.stringify(state)');quota=true;click('restore',id);quota=false;assert.equal(run('JSON.stringify(state)'),archivedState,'failed restoration retains archive and timeline');
click('restore',id);assert.ok(run(`state.reminders.some(r=>r.id===${JSON.stringify(id)})`));assert.ok(!run(`state.noteHistory.deleted.some(d=>d.record.id===${JSON.stringify(id)})`));assert.equal(noteEvents().at(-1).type,'restored');
// Assistant commands share the same log and deleted-note archive.
run("ask('remind me to history assistant example tomorrow')");const assistantId=run("state.reminders.find(r=>r.title==='history assistant example').id");
run("ask('complete history assistant example')");run("ask('delete reminder history assistant example')");
const assistantEvents=plain(run(`state.noteHistory.entries.filter(e=>e.noteId===${JSON.stringify(assistantId)})`));assert.deepEqual(assistantEvents.map(e=>e.type),['created','completed','deleted']);assert.ok(assistantEvents.every(e=>e.source==='Assistant'));assert.ok(run(`state.noteHistory.deleted.some(d=>d.record.id===${JSON.stringify(assistantId)})`));
// A deleted client must not be reintroduced by restoring a linked note.
run("state.clients.push({id:'history-test-client',name:'History test bank'});save();");
click('new');form.dataset.id='';Object.assign(values,{title:'Client removal history',details:'Keep this context',clientId:'history-test-client'});dispatch('submit',{target:form});const orphanId=run('state.reminders.at(-1).id');
click('delete',orphanId);click('confirm-delete',orphanId);run("state.clients=state.clients.filter(c=>c.id!=='history-test-client');save();");
click('history',orphanId);click('restore',orphanId);assert.equal(run('state.reminders.at(-1).clientId'),'');assert.equal(run('state.noteHistory.entries.at(-1).changes[0].before'),'History test bank');
console.log('Note history passed: accurate change details, legacy tracking boundary, no duplicate entries, persisted deletion/restoration, failure rollback, assistant events and safe restoration after client removal.');

// The default History list must include every existing note, even without an activity entry.
run("for(let i=0;i<25;i++)state.reminders.push({id:'legacy-note-'+i,title:'Earlier saved note '+i,details:'Existing note without a recorded event',due:'2026-10-13',done:i%2===0,clientId:''});");
const allIds=plain(run('state.reminders.map(r=>r.id)')).sort();click('history');
const idsInModal=()=>[...nodes.get('#modal-root').innerHTML.matchAll(/data-note-action="read" data-id="([^"]+)"/g)].map(match=>match[1]);
const listedIds=idsInModal();assert.equal(listedIds.length,20);click('history-next');listedIds.push(...idsInModal());assert.deepEqual(listedIds.sort(),allIds);
dispatch('click',{target:target({noteAction:'history-tab',tab:'completed'})});const completedIds=plain(run('state.reminders.filter(r=>r.done).map(r=>r.id)')).sort();assert.deepEqual(idsInModal().sort(),completedIds);
click('history');dispatch('input',{target:Object.assign(target({}),{id:'note-history-search',value:'Earlier saved note 24',selectionStart:21})});assert.deepEqual(idsInModal(),['legacy-note-24']);
click('read','legacy-note-24');assert.match(nodes.get('#modal-root').innerHTML,/Existing note without a recorded event/);assert.match(nodes.get('#modal-root').innerHTML,/View note history/);
console.log('All existing notes passed: open/completed records, notes without activity, full pagination, search and opening saved details.');
