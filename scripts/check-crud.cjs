const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../dist/crud-model.js'),'utf8');
const context={module:{exports:{}},Date};
vm.runInNewContext(source,context);
const Crud=context.module.exports;

const sample = () => ({
  clients:[{id:'c1',name:'One'},{id:'c2',name:'Two'}],
  branches:[{id:'b1',clientId:'c1',name:'One Head Office',city:'Pune'},{id:'b2',clientId:'c1',name:'One Branch',city:'Mumbai'},{id:'b3',clientId:'c2',name:'Two Head Office',city:'Delhi'}],
  deployments:[{id:'d1',clientId:'c1',branchId:'b1'},{id:'d2',clientId:'c1',branchId:'b2'},{id:'d3',clientId:'c2',branchId:'b3'}],
  invoices:[{id:'i1',clientId:'c1',branchId:'b1'},{id:'i2',clientId:'c2',branchId:'b3'}],
  tickets:[{id:'t1',clientId:'c1',branchId:'b2'},{id:'t2',clientId:'c2',branchId:'b3'}],
  requirements:[{id:'r1',clientId:'c1',branchId:'b2'},{id:'r2',clientId:'c2',branchId:'b3'}],
  documents:[{id:'doc1',clientId:'c1'},{id:'doc2',clientId:'c2'}],
  contacts:[{id:'p1',clientId:'c1'},{id:'p2',clientId:'c2'}],
  messages:[{id:'m1',clientId:'c1'},{id:'m2',clientId:'c2'}],
  mailDrafts:[{id:'draft1',clientId:'c1'},{id:'draft2',clientId:'c2'}],
  reminders:[{id:'rem1',clientId:'c1'},{id:'rem2',clientId:'c2'}],
  tasks:[{id:'task1',clientId:'c1'},{id:'task2',clientId:'c2'}],
  activity:[{id:'a1',clientId:'c1'},{id:'a2',clientId:'c2'}],
  leads:[{id:'lead1',stage:'Converted',convertedClientId:'c1'}],
  workflowCanvases:{d1:{nodes:[]},d2:{nodes:[]},d3:{nodes:[]}}
});

const clientData=sample();
assert.deepEqual(JSON.parse(JSON.stringify(Crud.linked(clientData,'client','c1'))),{branches:2,products:2,invoices:1,cases:1,requirements:1,documents:1,contacts:1,mail:2,followUps:2});
assert.equal(Crud.remove(clientData,'client','c1'),false,'Client support history blocks permanent deletion');
clientData.tickets=clientData.tickets.filter(t=>t.clientId!=='c1');
assert.equal(Crud.remove(clientData,'client','c1'),true);
for(const key of ['clients','branches','deployments','invoices','tickets','requirements','documents','contacts','messages','mailDrafts','reminders','tasks','activity']){
  assert.ok(clientData[key].every(item=>item.clientId!=='c1'&&item.id!=='c1'),`${key} has orphaned c1 record`);
  assert.ok(clientData[key].some(item=>item.clientId==='c2'||item.id==='c2'),`${key} lost unrelated c2 record`);
}
assert.deepEqual(Object.keys(clientData.workflowCanvases),['d3']);
assert.equal(clientData.leads[0].stage,'Qualified');
assert.equal(clientData.leads[0].convertedClientId,undefined);
assert.ok(['c1','b1','b2'].every(id=>clientData.deletedSeedIds.includes(id)));
assert.equal(Crud.remove(clientData,'client','c1'),false);

const branchData=sample();
assert.equal(Crud.remove(branchData,'branch','b2'),false,'Branch support history blocks permanent deletion');
branchData.tickets=branchData.tickets.filter(t=>t.branchId!=='b2');
assert.equal(Crud.remove(branchData,'branch','b2'),true);
assert.deepEqual(branchData.clients.map(x=>x.id),['c1','c2']);
assert.deepEqual(branchData.deployments.map(x=>x.id),['d1','d3']);
assert.deepEqual(branchData.requirements.map(x=>x.id),['r2']);
assert.deepEqual(branchData.tickets.map(x=>x.id),['t2']);
assert.deepEqual(Object.keys(branchData.workflowCanvases),['d1','d3']);
assert.deepEqual(branchData.messages.map(x=>x.id),['m1','m2']);
assert.ok(branchData.deletedSeedIds.includes('b2'));
const shared=sample();shared.tickets=[{id:'shared',clientId:'c1',branchId:'',branchIds:['b1','b2'],status:'Closed',archivedAt:'2026-10-17'}];
assert.equal(Crud.remove(shared,'branch','b2'),false,'Archived multi-branch cases retain branch history');
assert.equal(Crud.linked(shared,'branch','b2').cases,1);
console.log('CRUD checks passed: support history protection, deletion without cases, linked records, unrelated records, and refresh tombstones.');
