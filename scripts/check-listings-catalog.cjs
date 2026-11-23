/* Source/runtime integration only: no browser or remote page access. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const store=new Map(),listeners={},nodes=new Map();let simulateQuota=false;
const node=()=>({innerHTML:'',textContent:'',dataset:{},children:[],classList:{add(){},remove(){},toggle(){}},addEventListener(){},focus(){},querySelector(){return null;},querySelectorAll(){return [];},insertAdjacentHTML(){},setAttribute(){},remove(){}});
const document={querySelector(selector){if(selector==='#ticket-update-form'||selector==='.modal form')return null;if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector);},querySelectorAll(){return [];},getElementById(){return null;},addEventListener(type,fn){(listeners[type]||=[]).push(fn);},body:node(),activeElement:null,visibilityState:'visible'};
const sandbox={console,document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>{if(simulateQuota){const error=new Error('Full');error.name='QuotaExceededError';throw error;}store.set(k,v);}},Date,Math,Set,Map,Intl,URL,URLSearchParams,location:{search:'?preview=unit-check'},matchMedia:()=>({matches:true}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,innerWidth:1400,innerHeight:900,addEventListener(){},scrollTo(){},CSS:{escape:x=>x}};sandbox.window=sandbox;
vm.createContext(sandbox);
// Other workspaces are outside this integration check.
sandbox.renderWorkflowCanvas=()=>'';sandbox.renderProspectHub=()=>'';
for(const file of ['crud-model.js','helpdesk-model.js','product-catalog-model.js','app.js','crm-ops.js','core-workspaces.js','prospect-hub.js','helpdesk.js','product-catalog.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist',file),'utf8'),sandbox,{filename:file});
const run=code=>vm.runInContext(code,sandbox);
function checkTables(markup,label){
 for(const match of markup.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)){
  const count=(match[1].match(/<th\b/g)||[]).length;
  const actionTable=/\bhas-row-actions\b/.test(match[0].split('>')[0]);
  if(actionTable)assert.match(match[1].match(/<thead>[\s\S]*?<\/thead>/)[0],/<span class="sr-only">Actions?<\/span>/,label+' accessible action header');
  for(const row of (match[1].match(/<tbody>([\s\S]*?)<\/tbody>/)||[]).slice(1).flatMap(body=>body.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/g)||[])){
   const cells=[...row.matchAll(/<td\b([^>]*)>/g)];assert.equal(cells.reduce((sum,cell)=>sum+Number(cell[1].match(/colspan="(\d+)"/)?.[1]||1),0),count,label+' column alignment');
   if(actionTable&&cells.length>1){const last=[...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].at(-1)[1];assert.equal((last.match(/<button\b/g)||[]).length,1,label+' one action trigger');assert.match(last,/data-action="toggle-record-menu"/,label+' shared menu');assert.match(last,/aria-haspopup="menu"/,label+' menu semantics');assert.match(last,/>⋯<\/button>/,label+' three-dot icon');}
  }
 }
}
for(const name of ['Clients','Products','Contacts','Prospects','Billing','Helpdesk','Tasks','Branches']){const html=run(`render${name}()`);assert(html.length>100,name);checkTables(html,name);}
for(const id of run('state.products.map(p=>p.id)')){const html=run(`selectedProductId=${JSON.stringify(id)};renderProductDetail()`);checkTables(html,id);assert.match(html,/product-list-header/);assert.match(html,/deployment-list-table/);assert.match(html,/CATALOG RECORD/);}
for(const tab of ['branches','products','billing','documents'])checkTables(run(`selectedClientId='c1';profileTab='${tab}';renderProfile()`),'Profile '+tab);
for(const id of run('state.leads.map(l=>l.id)'))checkTables(run(`selectedLeadId=${JSON.stringify(id)};renderLeadDetail()`),'Prospect profile '+id);
run("filter='a query with no matches';");for(const name of ['Clients','Products','Prospects'])checkTables(run(`render${name}()`),name+' empty');run("filter='';");
console.log('All listing renderers and product/client tables passed column and empty-state checks.');
const error={textContent:'',scrollIntoView(){}},fields={hidden:false,disabled:false},usageFields={hidden:false,disabled:false};
const values={name:'Integration product',code:'INT-01',family:'Operations',description:'Reusable product definition',owner:'Product team',source:'https://example.com',deliveryMode:'Cloud hosted',pricing:'Reference price',model:'Annual branch license',billingCycle:'Annual',setupFee:'0',recurringFee:'24000',paymentTerms:'Net 30'};
const row={querySelector:s=>({value:s==='[data-module-name]'?'Core capability':'One clear module scope'})};
const form={id:'product-catalog-form',dataset:{id:''},values,elements:Object.fromEntries(Object.entries(values).map(([key,value])=>[key,{value}])),querySelector:s=>s==='.form-error'?error:s==='.catalog-commercial-fields'?fields:s==='.catalog-usage-fields'?usageFields:null,querySelectorAll:()=>[row]};
nodes.set('#product-catalog-form',form);
sandbox.FormData=class{constructor(form){this.values=form.values;}entries(){return Object.entries(this.values)[Symbol.iterator]();}[Symbol.iterator](){return this.entries();}getAll(name){return [].concat(this.values[name]||[]);}};
run("openForm('product')");const markup=nodes.get('#modal-root').innerHTML;for(const label of ['Product identity','Modules &amp; capabilities','Commercial defaults','data-catalog-add'])assert.ok(markup.includes(label.replace('&amp;','&')),label);
const submit=()=>listeners.submit.at(-1)({target:form,preventDefault(){}}),before=run('state.products.length');
simulateQuota=true;submit();simulateQuota=false;assert.match(error.textContent,/storage is full/);assert.equal(run('state.products.length'),before);
const saved=store.get('orbit-crm-idsspl-preview-v1');store.set('orbit-crm-idsspl-preview-v1',saved+' ');submit();assert.match(error.textContent,/workspace changed/);store.set('orbit-crm-idsspl-preview-v1',saved);
const agreed=run('JSON.stringify(state.deployments)');submit();assert.equal(error.textContent,'');assert.equal(run('state.products.length'),before+1);assert.equal(run('state.products.at(-1).defaultCommercial.recurringFee'),24000);assert.equal(run('JSON.stringify(state.deployments)'),agreed);assert.equal(run('view'),'productDetail');
const newProduct=run('state.products.at(-1).id');assert.equal(JSON.parse(store.get('orbit-crm-idsspl-preview-v1')).products.at(-1).id,newProduct);
form.dataset.id=newProduct;run('openProductEditor()');values.description='Updated product scope';submit();assert.equal(run('state.products.length'),before+1);assert.equal(run('state.products.at(-1).description'),'Updated product scope');
const client=run('state.clients[0].id'),branch=run('state.branches.find(b=>b.clientId===state.clients[0].id).id');
const deploymentForm={dataset:{type:'deployment'},values:{clientId:client,branchId:branch,productId:newProduct,modules:['Core capability'],status:'Implementation',renewal:''}};
sandbox.deploymentForm=deploymentForm;run('formSubmit({preventDefault(){},target:deploymentForm})');assert.equal(run('state.deployments.at(-1).commercial'),null);
nodes.set('#entity-form',{elements:{model:{},billingCycle:{},paymentTerms:{}}});run('openCommercialEditor(state.deployments.at(-1).id)');assert.match(nodes.get('#modal-root').innerHTML,/value="24000"/);assert.equal(run('state.deployments.at(-1).commercial'),null);
console.log('Product form passed: create/edit, storage rollback, stale changes, persistence, preserved client prices, unpriced assignment and reference terms prefill.');

// Exercise the actual delegated trigger/action handlers without accessing a browser.
const actionTarget=dataset=>({dataset,closest(selector){
 if(selector==='#client-row-menu')return this.inMenu?this:null;
 return selector.split(',').some(part=>{const match=part.trim().match(/^\[data-([\w-]+)(?:="([^"]*)")?\]$/);if(!match)return false;const key=match[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return Object.hasOwn(dataset,key)&&(match[2]===undefined||dataset[key]===match[2]);})?this:null;
}});
const click=target=>{for(const listener of listeners.click)listener({target,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});};
run("var testedMenu=null;toggleRowActionMenu=(trigger,label,content)=>{testedMenu={label,content};};var testedActions=[];opsContactForm=id=>testedActions.push(['contact',id]);opsDeleteContact=id=>testedActions.push(['contact-delete',id]);openBranchEditor=id=>testedActions.push(['branch',id]);coreEditInvoice=id=>testedActions.push(['invoice',id]);openLeadEditor=id=>testedActions.push(['prospect',id]);openRecordDelete=(kind,id)=>testedActions.push(['delete',kind,id]);");
const kinds={client:'clients',deployment:'deployments',contact:'contacts',branch:'branches',prospect:'leads',invoice:'invoices',ticket:'tickets'};
for(const [kind,collection] of Object.entries(kinds)){
 const id=run(`state.${collection}[0].id`),beforeView=run('view');
 click(actionTarget({action:'toggle-record-menu',kind,id}));
 assert.match(run('testedMenu.content'),/role="menuitem"/,kind+' opens a usable menu');assert.ok(run('testedMenu.content').includes(id),kind+' correct record');assert.equal(run('view'),beforeView,kind+' opening menu does not navigate');
}
const draftInvoice=run("state.invoices.find(i=>i.status==='Draft').id"),paidInvoice=run("state.invoices.find(i=>i.status==='Paid').id");
assert.match(run(`recordRowMenu('invoice',${JSON.stringify(draftInvoice)}).content`),/edit-invoice/);
assert.doesNotMatch(run(`recordRowMenu('invoice',${JSON.stringify(paidInvoice)}).content`),/edit-invoice/);
assert.equal(run("recordRowMenu('contact','missing-record')"),null);
for(const [kind,collection,attribute,action,expected] of [
 ['contact','contacts','opsAction','contact-edit','contact'],['contact','contacts','opsAction','contact-delete','contact-delete'],
 ['branch','branches','action','edit-branch','branch'],['invoice','invoices','action','edit-invoice','invoice'],['prospect','leads','action','edit-lead','prospect']
]){const id=run(`state.${collection}[0].id`),target=actionTarget({[attribute]:action,id});target.inMenu=true;const before=run('testedActions.length');click(target);assert.equal(run('testedActions.length'),before+1,kind+' dispatches once');assert.equal(JSON.stringify(run('testedActions.at(-1)')),JSON.stringify([expected,id]));}
console.log('Table actions passed: every action cell uses one menu; record identity, no trigger navigation, existing action handlers and invoice status restrictions verified.');
