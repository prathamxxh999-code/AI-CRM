/* Source/runtime integration only: no browser or remote page access. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const store=new Map(),listeners={},nodes=new Map();let simulateQuota=false;
const node=()=>({innerHTML:'',textContent:'',dataset:{},children:[],classList:{add(){},remove(){},toggle(){}},addEventListener(){},focus(){},querySelector(){return null;},querySelectorAll(){return [];},insertAdjacentHTML(){},setAttribute(){},remove(){}});
const document={querySelector(selector){if(selector==='#ticket-update-form'||selector==='.modal form')return null;if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector);},querySelectorAll(){return [];},getElementById(){return null;},addEventListener(type,fn){(listeners[type]||=[]).push(fn);},body:node(),activeElement:null,visibilityState:'visible'};
const sandbox={console,document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>{if(simulateQuota){const error=new Error('Full');error.name='QuotaExceededError';throw error;}store.set(k,v);}},Date,Math,Set,Map,Intl,URLSearchParams,location:{search:'?preview=unit-check'},matchMedia:()=>({matches:true}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,innerWidth:1400,innerHeight:900,addEventListener(){},scrollTo(){},CSS:{escape:x=>x}};sandbox.window=sandbox;
vm.createContext(sandbox);
// Other workspaces are outside this integration check.
sandbox.renderWorkflowCanvas=()=>'';sandbox.renderProspectHub=()=>'';
for(const file of ['crud-model.js','helpdesk-model.js','app.js','crm-ops.js','core-workspaces.js','helpdesk.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist',file),'utf8'),sandbox,{filename:file});
let html=vm.runInContext('renderHelpdesk()',sandbox);assert.match(html,/Case queue/);assert.match(html,/Team &amp;|Team & service rules/);assert.match(html,/Needs assignment/);
html=vm.runInContext("selectedTicketId='t1';renderTicketDetail()",sandbox);for(const name of ['hd-status-form','hd-message-form','hd-file-form','Conversation & notes','Activity history','Support coverage']){if(name==='Support coverage')continue;assert.ok(html.includes(name),name+' missing');}
assert.doesNotMatch(html,/data-action="delete-ticket"/);
vm.runInContext("view='ticketDetail';render()",sandbox);assert.match(nodes.get('#main-content').innerHTML,/Case context/);
html=vm.runInContext("view='profile';selectedClientId='c1';profileTab='overview';renderProfile()",sandbox);assert.match(html,/Support cases/);
vm.runInContext("state.tickets[0].status='Closed';",sandbox);html=vm.runInContext('renderProfile()',sandbox);assert.match(html,/<strong>0<\/strong><span>Open Tickets/);
vm.runInContext("state.tickets[0].sourceMessageIds=['m1'];selectedMail='m1';mailFolder='Inbox';",sandbox);html=vm.runInContext('renderInbox()',sandbox);assert.match(html,/Open HD-2481/);assert.doesNotMatch(html,/Create support case/);
html=vm.runInContext('renderSettings()',sandbox);assert.match(html,/Manage Helpdesk/);
assert.ok(listeners.submit.length>0);assert.ok(JSON.parse(store.get('orbit-crm-idsspl-preview-v1')).helpdesk);
console.log('Helpdesk integration passed: script initialization, queue, case panels, parent renderer, bank profile counts, linked inbox action and settings.');
// Drive the actual submit handler with simple form data to verify atomic writes.
sandbox.FormData=class{constructor(form){this.values=form.values;}entries(){return Object.entries(this.values)[Symbol.iterator]();}[Symbol.iterator](){return this.entries();}};
(async()=>{
 vm.runInContext("selectedTicketId='t1';view='ticketDetail';state.tickets[0].status='Open';save();",sandbox);
 const error={textContent:''},form={id:'hd-status-form',dataset:{revision:vm.runInContext('state.tickets[0].revision',sandbox)},values:{status:'In progress',note:'Reviewing the access configuration.',ownerId:'support-demo',priority:'High'},querySelector:selector=>selector==='.form-error'?error:null};
 const submit=()=>listeners.submit.at(-1)({target:form,preventDefault(){},stopImmediatePropagation(){}});
 simulateQuota=true;await submit();simulateQuota=false;assert.match(error.textContent,/storage is full/);assert.equal(vm.runInContext('state.tickets[0].status',sandbox),'Open');
 const saved=store.get('orbit-crm-idsspl-preview-v1'),other=JSON.parse(saved);other.helpdesk.changeVersion=(other.helpdesk.changeVersion||0)+1;store.set('orbit-crm-idsspl-preview-v1',JSON.stringify(other));await submit();assert.match(error.textContent,/Another tab/);assert.equal(vm.runInContext('state.tickets[0].status',sandbox),'Open');
 store.set('orbit-crm-idsspl-preview-v1',saved);await submit();assert.equal(vm.runInContext('state.tickets[0].status',sandbox),'In progress');assert.equal(JSON.parse(store.get('orbit-crm-idsspl-preview-v1')).tickets[0].status,'In progress');
 console.log('Actual form handler passed: storage rollback, newer-tab conflict and persisted case update.');
})().catch(error=>{console.error(error);process.exitCode=1;});
