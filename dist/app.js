const STORE_KEY = 'orbit-crm-idsspl-preview-v1';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const icon = (name, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const ambientVideo = (name, cls, poster = name) => `<video class="${cls}" data-ambient src="assets/${name}.mp4" poster="assets/${poster}.jpg" muted loop playsinline preload="metadata" ${matchMedia('(prefers-reduced-motion: reduce)').matches?'':'autoplay'} aria-hidden="true"></video>`;
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localDate = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'); };
const prettyDate = (s) => s ? new Date(s + 'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';
const money = (n, currency = 'INR') => new Intl.NumberFormat('en-IN',{style:'currency',currency,maximumFractionDigits:0}).format(Number(n)||0);
const uid = prefix => prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2,5);

function seed() {
  const wordsA=['Amber','Blue','Cedar','Cobalt','Coral','Evergreen','Golden','Indigo'];
  const wordsB=['Harbor','Valley','Ridge','Grove','Horizon','Crest'];
  const types=['Co-operative bank','Credit society','NBFC','Payments bank'];
  const suffixes=['Co-operative Bank','Urban Credit Society','Finance','Payments Bank'];
  const cities=['Pune','Mumbai','Nashik','Nagpur','Bengaluru','Hyderabad','Ahmedabad','Jaipur'];
  const contacts=['Aarav Mehta','Neha Kulkarni','Ishita Rao','Dev Shah','Kavya Desai','Arjun Nair'];
  const demoClients=wordsA.flatMap(a=>wordsB.map(b=>`${a} ${b}`)).slice(0,46).map((base,i)=>({id:'cx'+(i+1),name:`${base} ${suffixes[i%4]}`,type:types[i%4],contact:contacts[i%contacts.length],email:`contact${i+1}@demo.example`,phone:'',city:cities[i%cities.length],owner:'Account team',status:i%9===0?'Onboarding':'Active'}));
  return {
    clients:[
      {id:'c1',name:'Sahyadri Co-operative Bank',type:'Co-operative bank',contact:'Ananya Patil',email:'ananya@sahyadri.example',phone:'+91 90000 00001',city:'Pune',owner:'Account team',status:'Active'},
      {id:'c2',name:'Aster Urban Credit Society',type:'Credit society',contact:'Rohan Shah',email:'rohan@aster.example',phone:'+91 90000 00002',city:'Mumbai',owner:'Account team',status:'Active'},
      {id:'c3',name:'Northline Finance',type:'NBFC',contact:'Meera Rao',email:'meera@northline.example',phone:'+91 90000 00003',city:'Bengaluru',owner:'Account team',status:'Onboarding'},
      {id:'c4',name:'Riverbend Payments Bank',type:'Payments bank',contact:'Kabir Desai',email:'kabir@riverbend.example',phone:'+91 90000 00004',city:'Hyderabad',owner:'Account team',status:'Active'},
      ...demoClients
    ],
    leads:[
      {id:'lead1',name:'Crescent Cooperative Bank',type:'Co-operative bank',contact:'Priya Mehta',email:'priya@crescent.example',city:'Ahmedabad',stage:'Discovery',owner:'Sales team',source:'Referral',nextFollowUp:localDate(2),nextAction:'Schedule solution discovery call',interestedProducts:['p1','p3'],notes:'Interested in core banking and digital channels.'},
      {id:'lead2',name:'Harbor Credit Union',type:'Credit society',contact:'Vikram Kulkarni',email:'vikram@harbor.example',city:'Nashik',stage:'Proposal',owner:'Sales team',source:'Website',nextFollowUp:localDate(5),nextAction:'Send proposal and pricing',interestedProducts:['p2'],notes:'Requested NPCI product catalog and pricing discussion.'}
    ],
    templates:[
      {id:'tpl1',name:'Product Catalog Introduction',subject:'IDSSPL solutions for {institution}',body:'Hello {contact},\n\nThank you for your interest in IDSSPL. Based on our discussion, the following solutions may be relevant for {institution}: {products}.\n\nYou can explore the product catalog at https://idsspl.com/products. I would be glad to arrange a walkthrough and understand your requirements.\n\nRegards,\nIDSSPL Team'},
      {id:'tpl2',name:'Follow-Up After Discussion',subject:'Following up on {institution} requirements',body:'Hello {contact},\n\nThank you for speaking with us about {institution}. We discussed {products}. Please share any additional requirements so we can prepare the right solution scope and next steps.\n\nRegards,\nIDSSPL Team'}
    ],
    branches:[
      {id:'b1',clientId:'c1',name:'Pune Head Office',code:'SAH-HO',city:'Pune',status:'Live'},
      {id:'b2',clientId:'c1',name:'Kolhapur Branch',code:'SAH-KOP',city:'Kolhapur',status:'Live'},
      {id:'b3',clientId:'c2',name:'Mumbai Central',code:'AST-MUM',city:'Mumbai',status:'Live'},
      {id:'b4',clientId:'c2',name:'Thane Branch',code:'AST-THN',city:'Thane',status:'Setup'},
      {id:'b5',clientId:'c3',name:'Bengaluru Head Office',code:'NOR-BLR',city:'Bengaluru',status:'Setup'},
      {id:'b6',clientId:'c4',name:'Hyderabad Operations',code:'RIV-HYD',city:'Hyderabad',status:'Live'},
      ...demoClients.map((c,i)=>({id:'bx'+(i+1),clientId:c.id,name:c.city+' Head Office',code:'DEMO-'+String(i+1).padStart(3,'0'),city:c.city,status:c.status==='Active'?'Live':'Setup'}))
    ],
    products:[
      {id:'p1',name:'Next Gen AI Core Banking',family:'Core banking',description:'Core banking platform for connected institutional operations.',subproducts:['Core Banking Platform','Integrated Banking Modules','AI Management Dashboard','Merchant Analytics'],source:'https://idsspl.com/products/next-gen-ai-core-banking'},
      {id:'p2',name:'NPCI Products',family:'Payments',description:'Integrated rails for secure real-time digital transactions.',subproducts:['IMPS','AEPS','BBPS','NACH','APBS','NFS ATM Switch','UPI','CTS','E-Mandate'],source:'https://idsspl.com/products/npci-products'},
      {id:'p3',name:'Digital Banking Products',family:'Digital channels',description:'Web, mobile, messaging, and self-service customer journeys.',subproducts:['Internet Banking','Mobile Banking','SMS Banking','WhatsApp Banking','Merchant App','Customer Self Service Portal','Corporate Internet Banking','Digital Onboarding','Digital Account Opening'],source:'https://idsspl.com/products/digital-banking-products'},
      {id:'p4',name:'Enterprise Solution',family:'Enterprise',description:'Automation and control across banking operations.',subproducts:['Treasury Management','E-KYC','C-KYC','Reconciliation','DEM','LOS','LMS','LCS','EFRM'],source:'https://idsspl.com/products/enterprise-solution'},
      {id:'p5',name:'Merchant Management Solution',family:'Merchant',description:'Merchant onboarding, QR operations, servicing, and settlement.',subproducts:['Merchant Onboarding & Approval Workflow','Merchant KYC Management','QR Code Management','Transaction Dashboard','DEM','Merchant Analytics','User & Role Management','LCS','EFRM'],source:'https://idsspl.com/products/merchant-management-solution'},
      {id:'p6',name:'Card Management',family:'Cards',description:'Card issuance, controls, monitoring, and lifecycle operations.',subproducts:['Debit Card Issuance','Virtual Card','Card Personalization','PIN Generation','PIN Reset','Merchant Analytics','User & Role Management','LCS','EFRM'],source:'https://idsspl.com/products/card-management'}
    ],
    deployments:[
      {id:'d1',clientId:'c1',branchId:'b1',productId:'p1',modules:['Core Banking Platform','AI Management Dashboard'],status:'Live',renewal:localDate(45)},
      {id:'d2',clientId:'c1',branchId:'b2',productId:'p3',modules:['Mobile Banking','Internet Banking'],status:'Live',renewal:localDate(45)},
      {id:'d3',clientId:'c2',branchId:'b3',productId:'p2',modules:['UPI','IMPS'],status:'Live',renewal:localDate(28)},
      {id:'d4',clientId:'c3',branchId:'b5',productId:'p4',modules:['Reconciliation','LOS'],status:'Implementation',renewal:localDate(180)},
      {id:'d5',clientId:'c4',branchId:'b6',productId:'p5',modules:['QR Code Management','Merchant Analytics'],status:'Live',renewal:localDate(62)},
      {id:'d6',clientId:'c1',branchId:'b2',productId:'p1',modules:['Core Banking Platform'],status:'Implementation',renewal:localDate(120)},
      {id:'d7',clientId:'c2',branchId:'b4',productId:'p2',modules:['UPI'],status:'Implementation',renewal:localDate(150)},
      ...demoClients.map((c,i)=>({id:'dx'+(i+1),clientId:c.id,branchId:'bx'+(i+1),productId:'p'+(i%6+1),modules:[['Core Banking Platform'],['UPI'],['Mobile Banking'],['Reconciliation'],['QR Code Management'],['Debit Card Issuance']][i%6],status:c.status==='Active'?'Live':'Implementation',renewal:localDate(90+i)}))
    ],
    invoices:[
      {id:'inv1',number:'INV-2026-1042',clientId:'c1',branchId:'b1',productId:'p1',amount:185000,tax:0,currency:'INR',due:localDate(3),status:'Sent'},
      {id:'inv2',number:'INV-2026-1041',clientId:'c2',branchId:'b3',productId:'p2',amount:92000,tax:0,currency:'INR',due:localDate(-5),status:'Sent'},
      {id:'inv3',number:'INV-2026-1040',clientId:'c4',branchId:'b6',productId:'p5',amount:67500,tax:0,currency:'INR',due:localDate(-1),status:'Paid'},
      {id:'inv4',number:'INV-2026-1043',clientId:'c3',branchId:'b5',productId:'p4',amount:115000,tax:0,currency:'INR',due:localDate(12),status:'Draft'}
    ],
    tickets:[
      {id:'t1',number:'HD-2481',clientId:'c1',branchId:'b2',subject:'Branch login access review',priority:'High',status:'Open',owner:'Support team',created:localDate(-1)},
      {id:'t2',number:'HD-2478',clientId:'c2',branchId:'b3',subject:'Settlement report clarification',priority:'Medium',status:'In progress',owner:'Support team',created:localDate(-2)},
      {id:'t3',number:'HD-2470',clientId:'c4',branchId:'b6',subject:'QR onboarding checklist',priority:'Low',status:'Resolved',owner:'Support team',created:localDate(-4)}
    ],
    messages:[
      {id:'m1',clientId:'c1',from:'Ananya Patil',email:'ananya@sahyadri.example',subject:'Branch access approval',snippet:'Could you share the updated access checklist for our Kolhapur branch?',body:'Hello team,\n\nCould you share the updated access checklist for our Kolhapur branch? We are reviewing the roles before the next rollout.\n\nThank you,\nAnanya',at:'Today · 10:42 AM'},
      {id:'m2',clientId:'c2',from:'Rohan Shah',email:'rohan@aster.example',subject:'Settlement reporting',snippet:'We have one question about the daily reconciliation output.',body:'Hi,\n\nWe have one question about the daily reconciliation output. Can someone from your team walk us through the report columns?\n\nRegards,\nRohan',at:'Today · 9:18 AM'},
      {id:'m3',clientId:'c3',from:'Meera Rao',email:'meera@northline.example',subject:'Implementation timeline',snippet:'Please confirm the next milestone for our head office setup.',body:'Hello,\n\nPlease confirm the next milestone for our head office setup and the documents required from our team.\n\nThanks,\nMeera',at:'Yesterday · 4:15 PM'},
      {id:'m4',clientId:'c1',from:'Ananya Patil',email:'ananya@sahyadri.example',subject:'Mobile banking rollout plan',snippet:'Our Kolhapur team is ready to review the proposed module schedule.',body:'Hello team,\n\nOur Kolhapur team is ready to review the proposed mobile banking module schedule. Please share the rollout checkpoints and owners.\n\nRegards,\nAnanya',at:'Yesterday · 2:20 PM',read:true},
      {id:'m5',clientId:'c4',from:'Kabir Desai',email:'kabir@riverbend.example',subject:'Merchant onboarding walkthrough',snippet:'Could we schedule a walkthrough of the QR approval flow?',body:'Hi,\n\nCould we schedule a walkthrough of the merchant QR approval flow for our operations team?\n\nThanks,\nKabir',at:'Mon · 11:04 AM'},
      {id:'m6',clientId:'c2',from:'Rohan Shah',email:'rohan@aster.example',subject:'NDA review comments',snippet:'We have added a few comments to the agreement draft.',body:'Hello,\n\nWe have added a few comments to the agreement draft. Please let us know when your legal team has reviewed them.\n\nRegards,\nRohan',at:'Mon · 9:32 AM',read:true},
      {id:'m7',clientId:'c3',from:'Meera Rao',email:'meera@northline.example',subject:'UAT document checklist',snippet:'Please confirm which test cases and signoffs you need from us.',body:'Hello team,\n\nPlease confirm which UAT test cases and signoffs you need from us before the next milestone.\n\nThanks,\nMeera',at:'Fri · 3:28 PM',starred:true},
      {id:'m8',clientId:'c1',from:'Ananya Patil',email:'ananya@sahyadri.example',subject:'Invoice approval status',snippet:'Our finance team is reviewing the latest invoice.',body:'Hello,\n\nOur finance team is reviewing the latest invoice and will share the approval update shortly.\n\nThank you,\nAnanya',at:'Fri · 10:15 AM'},
      {id:'m9',clientId:'c4',from:'Kabir Desai',email:'kabir@riverbend.example',subject:'QR settlement report',snippet:'The sample settlement report looks good for our pilot.',body:'Hi,\n\nThe sample settlement report looks good for our pilot. We will share feedback after the next reconciliation cycle.\n\nRegards,\nKabir',at:'Thu · 4:46 PM',read:true}
    ],
    reminders:[
      {id:'r1',title:'Review Sahyadri branch access',clientId:'c1',due:localDate(0),done:false},
      {id:'r2',title:'Follow up on Aster settlement report',clientId:'c2',due:localDate(0),done:false},
      {id:'r3',title:'Confirm Northline onboarding milestone',clientId:'c3',due:localDate(1),done:false}
    ],
    chats:[],mailDrafts:[],
    documents:[
      {id:'doc1',clientId:'c1',category:'NDA',name:'Mutual Non-Disclosure Agreement',version:'1.0',status:'Approved',uploadedAt:localDate(-14),fileName:'NDA - Sahyadri.pdf',sampleText:'Sample NDA record for the fictional bank. The signed agreement, effective date and authorized signatories would be kept here.'},
      {id:'doc2',clientId:'c1',category:'Business Requirements',name:'Branch Access Requirements',version:'1.2',status:'In Review',uploadedAt:localDate(-5),fileName:'Sahyadri BRD.pdf',sampleText:'Sample business requirements: confirm branch roles, approval workflow, access review and rollout acceptance criteria.'},
      {id:'doc3',clientId:'c2',category:'Statement of Work',name:'Settlement Reporting Scope',version:'1.0',status:'Requested',uploadedAt:localDate(-2),fileName:'Aster SOW.pdf',sampleText:'Sample statement of work placeholder. Upload the actual file to replace this demo record.'}
    ],
    activity:[],
    requirements:[
      {id:'req1',clientId:'c1',branchId:'b2',productId:'p3',documentId:'doc2',title:'Review branch user access and approval roles',details:'Confirm operations and administrator access before the Kolhapur rollout.',stage:'In Review',owner:'Account team'},
      {id:'req2',clientId:'c2',branchId:'b3',productId:'p2',title:'Daily settlement report fields',details:'Agree the reconciliation fields required by the finance team.',stage:'Discovery',owner:'Account team'},
      {id:'req3',clientId:'c3',branchId:'b5',productId:'p4',title:'Head office implementation scope',details:'Confirm modules, dependencies and target rollout milestones.',stage:'Discovery',owner:'Account team'},
      {id:'req4',clientId:'c4',branchId:'b6',productId:'p5',title:'Merchant QR approval workflow',details:'Document QR onboarding, operations approval and settlement reporting for the pilot branch.',stage:'Approved',owner:'Account team'},
      ...demoClients.map((c,i)=>({id:'rx'+(i+1),clientId:c.id,branchId:'bx'+(i+1),productId:'p'+(i%6+1),title:`${['Core banking','Payments','Digital banking','Enterprise operations','Merchant services','Card services'][i%6]} rollout requirements`,details:`Document selected modules, access roles, branch readiness, review owners and acceptance criteria for ${c.name}.`,stage:c.status==='Active'?'In Delivery':'Discovery',owner:'Account team'}))
    ]
  };
}
let state;
try { state = JSON.parse(localStorage.getItem(STORE_KEY)) || seed(); } catch { state = seed(); }
if(!state.requirements)state.requirements=seed().requirements;
if(!state.documents)state.documents=seed().documents;
if(!state.activity)state.activity=[];
if(!state.workflowCanvases)state.workflowCanvases={};
if(!state.mailDrafts)state.mailDrafts=[];
if(!state.leads)state.leads=seed().leads;
for(const l of state.leads){const sample=seed().leads.find(x=>x.id===l.id);if(l.nextAction===undefined&&sample)l.nextAction=sample.nextAction;}
if(!state.templates)state.templates=seed().templates;
if(!state.deletedSeedIds)state.deletedSeedIds=[];
const deletedSeedIds=new Set(state.deletedSeedIds);
for(const sample of seed().messages)if(!deletedSeedIds.has(sample.id)&&!deletedSeedIds.has(sample.clientId)&&!state.messages.some(m=>m.id===sample.id))state.messages.push(sample);
const demoSeed=seed();
for(const c of demoSeed.clients.filter(c=>c.id.startsWith('cx')))if(!deletedSeedIds.has(c.id)&&!state.clients.some(x=>x.id===c.id))state.clients.push(c);
for(const b of demoSeed.branches.filter(b=>b.id.startsWith('bx')))if(!deletedSeedIds.has(b.id)&&!deletedSeedIds.has(b.clientId)&&state.clients.some(c=>c.id===b.clientId)&&!state.branches.some(x=>x.id===b.id))state.branches.push(b);
for(const d of demoSeed.deployments.filter(d=>d.id.startsWith('dx')||['d6','d7'].includes(d.id)))if(!deletedSeedIds.has(d.id)&&!deletedSeedIds.has(d.clientId)&&!deletedSeedIds.has(d.branchId)&&state.clients.some(c=>c.id===d.clientId)&&state.branches.some(b=>b.id===d.branchId)&&!state.deployments.some(x=>x.id===d.id||(x.clientId===d.clientId&&x.branchId===d.branchId&&x.productId===d.productId)))state.deployments.push(d);
for(const r of demoSeed.requirements.filter(r=>r.id==='req4'||r.id.startsWith('rx')))if(!deletedSeedIds.has(r.id)&&!deletedSeedIds.has(r.clientId)&&!deletedSeedIds.has(r.branchId)&&state.clients.some(c=>c.id===r.clientId)&&state.branches.some(b=>b.id===r.branchId)&&!state.requirements.some(x=>x.id===r.id))state.requirements.push(r);
for(const r of state.requirements){if(!r.branchId||!r.productId){const preset=demoSeed.requirements.find(x=>x.id===r.id),deployment=state.deployments.find(d=>d.clientId===r.clientId&&(!preset?.branchId||d.branchId===preset.branchId));if(deployment){r.branchId=deployment.branchId;r.productId=deployment.productId;}}if(r.id==='req1'&&!r.documentId)r.documentId='doc2';}
let reminderHistoryBaseline=typeof ReminderNotes==='undefined'?null:ReminderNotes.capture(state);
const save = (source='Workspace') => {
 const previousHistory=state.noteHistory;
 if(typeof ReminderNotes!=='undefined')state.noteHistory=ReminderNotes.historyFor(state,reminderHistoryBaseline,source);
 try{localStorage.setItem(STORE_KEY,JSON.stringify(state));if(typeof ReminderNotes!=='undefined')reminderHistoryBaseline=ReminderNotes.capture(state);}
 catch(error){if(previousHistory===undefined)delete state.noteHistory;else state.noteHistory=previousHistory;throw error;}
};
const byId = (type,id) => state[type].find(x => x.id === id);
const nameOf = (type,id) => byId(type,id)?.name || 'Unassigned';
const commercialPlans={
 p1:{model:'Annual branch license',setupFee:180000,recurringFee:420000,billingCycle:'Annual'},
 p2:{model:'Platform + transaction',setupFee:95000,recurringFee:42000,billingCycle:'Monthly',usageRate:.22,usageUnit:'transaction'},
 p3:{model:'Digital channel subscription',setupFee:110000,recurringFee:260000,billingCycle:'Annual'},
 p4:{model:'Annual enterprise license',setupFee:140000,recurringFee:320000,billingCycle:'Annual'},
 p5:{model:'Merchant platform + volume',setupFee:70000,recurringFee:35000,billingCycle:'Monthly',usageRate:2.5,usageUnit:'active merchant'},
 p6:{model:'Card platform + issuance',setupFee:90000,recurringFee:240000,billingCycle:'Annual',usageRate:5,usageUnit:'issued card'}
};
function sampleCommercialFor(d){
 const plan=commercialPlans[d.productId]||{model:'Annual subscription',setupFee:60000,recurringFee:180000,billingCycle:'Annual'};
 const clientNumber=Number(String(d.clientId).replace(/\D/g,''))||1,productNumber=Number(String(d.productId).replace(/\D/g,''))||1;
 const branch=byId('branches',d.branchId),branchWeight=/head office|operations|central/i.test(branch?.name||'')?1:.7;
 const variation=1+((clientNumber+productNumber)%5)*.08;
 const roundThousand=n=>Math.round(n/1000)*1000;
 return {model:plan.model,setupFee:roundThousand(plan.setupFee*variation*branchWeight),recurringFee:roundThousand(plan.recurringFee*variation*branchWeight),billingCycle:plan.billingCycle,usageRate:plan.usageRate?Number((plan.usageRate*(1+(clientNumber%3)*.04)).toFixed(2)):0,usageUnit:plan.usageUnit||'',paymentTerms:['Net 15','Net 30','Net 45'][clientNumber%3],sample:true};
}
for(const d of state.deployments)if(!d.commercial&&demoSeed.deployments.some(sample=>sample.id===d.id))d.commercial=sampleCommercialFor(d);
const commercialMoney=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n)||0);
const commercialPeriod=c=>c?.billingCycle==='Monthly'?'month':'year';
const commercialAmount=c=>c?`${money(c.recurringFee)} / ${commercialPeriod(c)}`:'Not recorded';
const commercialAnnualValue=c=>Number(c?.recurringFee||0)*(c?.billingCycle==='Monthly'?12:1);
function commercialCell(d){
 const c=d.commercial;if(!c)return '<span class="commercial-empty">No terms yet</span>';
 const extra=Object.keys(d.moduleCommercials||{}).filter(module=>(d.modules||[]).includes(module)).length;
 return `<strong class="commercial-amount">${commercialAmount(c)}</strong><span class="sub-cell">${esc(c.model)} · Setup ${money(c.setupFee)}</span>${c.usageRate?`<span class="sub-cell">+ ${commercialMoney(c.usageRate)} / ${esc(c.usageUnit)}</span>`:''}${extra?`<span class="sub-cell commercial-module-note">${extra} separately priced module${extra===1?'':'s'}</span>`:''}`;
}
function renderDeploymentModules(deployment,only=''){
 const modules=(deployment.modules||[]).filter(module=>!only||module===only);
 return `<div class="deployment-module-list">${modules.map(module=>`<span>${esc(module)}${deployment.moduleCommercials?.[module]?'<b>+</b>':''}</span>`).join('')||'<span>No modules selected</span>'}</div>`;
}
const statusClass = s => ({'Active':'active','Live':'active','Paid':'paid','Resolved':'resolved','Converted':'active','Lost':'overdue','Onboarding':'pending','Setup':'pending','Draft':'draft','Open':'open','High':'urgent','Overdue':'overdue','Sent':'sent','Proposal':'sent','Qualified':'progress','Negotiation':'progress','In progress':'progress','Implementation':'progress'}[s] || 'pending');
const tag = s => `<span class="status ${statusClass(s)}">${esc(s)}</span>`;
const avatarTone = i => ['teal','gold','blue','purple'][i%4];
const initials = s => String(s).split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
function clientLogo(c,i=0){
 if(c.logo)return `<span class="client-logo uploaded"><img src="${esc(c.logo)}" alt=""></span>`;
 const demoImages={c1:'sahyadri.png',c2:'aster.png',c3:'northline.png',c4:'riverbend.png'};
 if(demoImages[c.id])return `<span class="client-logo uploaded"><img src="assets/${demoImages[c.id]}" alt=""></span>`;
 const marks={c1:'<path d="M5 17 12 6l7 11H5Z"/><path d="M8 17 12 11l4 6"/>',c2:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',c3:'<circle cx="12" cy="12" r="8"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',c4:'<path d="M3 10c3-3 5 3 9 0s6-1 9-1M3 15c3-3 5 3 9 0s6-1 9-1"/>'};
 if(!marks[c.id])return `<span class="client-logo demo-wordmark ${avatarTone(i)}">${esc(initials(c.name))}</span>`;
 return `<span class="client-logo ${avatarTone(i)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${marks[c.id]||'<circle cx="12" cy="12" r="8"/><path d="M12 7v10M7 12h10"/>'}</svg></span>`;
}
const clientCell = (c,i=0) => c ? `<div class="record-identity">${clientLogo(c,i)}<span class="strong-cell">${esc(c.name)}</span></div>` : '—';
const overdue = i => i.status !== 'Paid' && i.status !== 'Draft' && i.due < localDate(0);
const invoiceStatus = i => overdue(i) ? 'Overdue' : i.status;
const outstanding = () => state.invoices.filter(i=>i.currency==='INR'&&i.status!=='Paid'&&i.status!=='Draft').reduce((sum,i)=>sum+Number(i.amount)+Number(i.tax),0);
const openTickets = () => state.tickets.filter(Helpdesk.active);
const pendingReminders = () => state.reminders.filter(r=>!r.done && r.due<=localDate(0));
const pageNames = {overview:'Overview',clients:'Clients',profile:'Client Profile',workflowCanvas:'Workflow Canvas',onboarding:'Client Onboarding',prospects:'Prospects',leadDetail:'Prospect Profile',pipeline:'Pipeline',contacts:'Contacts',tasks:'Task manager',insights:'Reports',products:'Products',productDetail:'Product Details',documentPreview:'Document Preview',billing:'Billing',inbox:'Client Inbox',helpdesk:'Helpdesk',ticketDetail:'Helpdesk Case',assistant:'AI Assistant',reminders:'Reminder board',settings:'Admin panel',admin:'Admin panel',roles:'Roles & access'};
let view='overview', filter='', selectedMail='', mailFolder='Inbox', mailFilter='All', mailClientFilter='all', selectedClientId='c1', selectedLeadId='lead1', selectedProductId='p1', selectedTicketId='t1', selectedDocumentId='doc1', profileTab='overview', workflowBranchFilter='all', workflowProductFilter='all', leadStageFilter='all', leadOwnerFilter='all', leadFollowupFilter='all', toastTimer;
let clientPage=1,clientPageSize=10,clientTypeFilter='all',clientStatusFilter='all',clientCityFilter='all',assistantReminderFilter='open';
let onboarding=null, onboardingStep=0, selectedWorkflowDeploymentId='';

function toast(message){ $('#toast-root').innerHTML=`<div class="toast">${esc(message)}</div>`; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast-root').innerHTML='',3500); }
function logActivity(clientId,title,detail){state.activity.unshift({id:uid('log'),clientId,title,detail,at:new Date().toLocaleString('en-IN')});}
function setView(next){view=next;filter=''; $$('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.view===(next==='profile'||next==='workflowCanvas'||next==='onboarding'||next==='documentPreview'?'clients':next==='leadDetail'?'prospects':next==='productDetail'?'products':next==='ticketDetail'?'helpdesk':next))); $('#current-view-name').textContent=pageNames[next]; $('#sidebar').classList.remove('open'); render(); $('#main-content').focus({preventScroll:true}); window.scrollTo(0,0);}
function header(){return '';}
function banner(){return '';}
function table(headers,rows,empty='No records found.',settings={}){const hasActions=headers.at(-1)===''||headers.at(-1)==='Actions';return `<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(settings.label||'Scrollable records')}" ><table class="data-table${hasActions?' has-row-actions':''}${settings.className?' '+esc(settings.className):''}"><thead><tr>${headers.map((h,index)=>`<th scope="col">${hasActions&&index===headers.length-1?'<span class="sr-only">Actions</span>':h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="${headers.length}" class="empty-state"><strong>${esc(empty)}</strong>Try another search or add a new record.</td></tr>`}</tbody></table></div>`;}
function toolbar(placeholder, options=[], value=''){
 const actions={clients:['Onboard Client','onboard-client'],prospects:['Add Prospect','add-lead'],products:['Add Product','add-product'],billing:['Create Draft','add-invoice'],helpdesk:['New Ticket','add-ticket']};
 const action=actions[view];
 return `<div class="toolbar list-toolbar"><input id="list-search" type="search" placeholder="${esc(placeholder)}" value="${esc(filter)}" aria-label="Filter list">${options.length?`<select id="list-filter" aria-label="Filter status"><option value="">All statuses</option>${options.map(o=>`<option value="${esc(o)}" ${value===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`:''}${action?`<button class="btn btn-primary" data-action="${action[1]}">${icon('plus')}${action[0]}</button>`:''}</div>`;
}
function renderQuickActions(){
 const actions=[['Onboard Client','client','users'],['New Prospect','prospect','users'],['New Ticket','ticket','help'],['Invoice Draft','invoice','bill'],['Email Draft','email','mail'],['New Reminder','reminder','calendar']];
 return `<section class="card overview-quick-actions"><div class="card-head"><div><h2>Quick Actions</h2></div></div><div class="assistant-action-grid">${actions.map(([label,target,glyph])=>`<button data-assistant-action="${target}"><span>${icon(glyph)}</span><strong>${label}</strong></button>`).join('')}</div></section>`;
}
function renderOverview(){
  const today = new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const late=state.invoices.filter(overdue), urgent=openTickets().filter(t=>t.priority==='High');
  const alerts=[
    ...late.slice(0,2).map(i=>({title:`${i.number} is overdue`,sub:`${nameOf('clients',i.clientId)} · ${money(i.amount,i.currency)}`,kind:'red',action:'billing'})),
    ...urgent.slice(0,2).map(t=>({title:t.subject,sub:`${nameOf('clients',t.clientId)} · high-priority ticket`,kind:'orange',action:'helpdesk'})),
    ...pendingReminders().slice(0,2).map(r=>({title:r.title,sub:'Reminder due today',kind:'teal',action:'assistant'}))
  ];
  const bars=[state.deployments.length, state.branches.filter(b=>b.status==='Live').length, state.invoices.filter(i=>i.status==='Sent').length,openTickets().length,state.reminders.filter(r=>!r.done).length];
  const max=Math.max(...bars,1);
  return `
  <div class="overview-top"><section class="greeting"><div class="abstract-orb hero-orb" aria-hidden="true"><span></span><i></i></div><h2>Every client conversation,<br>one connected workspace.</h2><span>Track the work that needs attention across branches, billing and support.</span><div class="greeting-actions"><button data-view="clients">Explore Clients</button><button data-view="assistant">Ask Assistant →</button></div></section>
  <section class="card today-card"><div class="today-top">${icon('calendar')}</div><h3>${new Date().toLocaleDateString('en-IN',{weekday:'long'})}</h3><span class="day-date">${esc(today)}</span><div class="today-divider"></div><div class="today-stat"><span class="bubble">${icon('bell')}</span><strong>${pendingReminders().length} reminders due</strong><span>Today</span></div><div class="today-stat"><span class="bubble orange">${icon('help')}</span><strong>${openTickets().length} open tickets</strong><span>Review</span></div></section></div>
  <div class="stats-grid"><div class="card stat-card"><div class="stat-top">Total clients <span class="stat-icon">${icon('users')}</span></div><strong class="stat-number">${state.clients.length}</strong><div class="stat-foot"><strong>${state.clients.filter(c=>c.status==='Active').length} active</strong> institutions</div></div><div class="card stat-card"><div class="stat-top">Branches <span class="stat-icon blue">${icon('branch')}</span></div><strong class="stat-number">${state.branches.length}</strong><div class="stat-foot"><strong>${state.branches.filter(b=>b.status==='Live').length} live</strong> locations</div></div><div class="card stat-card"><div class="stat-top">Outstanding <span class="stat-icon gold">${icon('bill')}</span></div><strong class="stat-number">${money(outstanding())}</strong><div class="stat-foot"><strong>${late.length} overdue</strong> sample invoice${late.length===1?'':'s'}</div></div><div class="card stat-card"><div class="stat-top">Open tickets <span class="stat-icon purple">${icon('help')}</span></div><strong class="stat-number">${openTickets().length}</strong><div class="stat-foot"><strong>${urgent.length} high priority</strong> support item${urgent.length===1?'':'s'}</div></div></div>
  ${renderQuickActions()}
  <div class="content-grid"><div class="stack"><section class="card portfolio-card"><div class="card-head"><div><h2>Workspace activity</h2><p>Snapshot of sample records by workflow</p></div><button data-view="clients">View records →</button></div><div class="portfolio-body"><div class="portfolio-bars">${bars.map((v,i)=>`<div class="bar-group"><div class="bar" style="height:${Math.max(18,Math.round(v/max*125))}px"></div><span class="bar-label">${['Products','Live','Invoices','Tickets','Tasks'][i]}</span></div>`).join('')}</div><div class="portfolio-legend"><div class="legend-row"><span class="legend-dot"></span><span>Product deployments</span><span>${state.deployments.length}</span></div><div class="legend-row"><span class="legend-dot"></span><span>Live branches</span><span>${state.branches.filter(b=>b.status==='Live').length}</span></div><div class="legend-row"><span class="legend-dot"></span><span>Open support cases</span><span>${openTickets().length}</span></div></div></div></section><section class="card"><div class="card-head"><div><h2>Recent billing</h2><p>Drafts, sent invoices and payment status</p></div><button data-view="billing">View all →</button></div>${table(['Invoice','Client','Amount','Due','Status'],state.invoices.slice(0,3).map(i=>`<tr><td><button class="row-action" data-detail="invoice:${i.id}">${esc(i.number)}</button></td><td class="strong-cell">${esc(nameOf('clients',i.clientId))}</td><td>${money(i.amount,i.currency)}</td><td>${prettyDate(i.due)}</td><td>${tag(invoiceStatus(i))}</td></tr>`))}</section></div>
  <div class="stack"><section class="card"><div class="card-head"><div><h2>Needs your attention</h2><p>Priorities across billing and support</p></div><button data-view="assistant">See all →</button></div><div class="alert-list">${alerts.length?alerts.map(a=>`<div class="alert-row"><span class="alert-mark ${a.kind}">${icon(a.action==='billing'?'bill':a.action==='helpdesk'?'help':'bell')}</span><div><strong>${esc(a.title)}</strong><p>${esc(a.sub)}</p></div><button data-view="${a.action}">View</button></div>`).join(''):'<div class="empty-state">Nothing urgent right now.</div>'}</div></section></div></div>`;
}
let overviewPeriod = 'all';
function overviewBillingChart(invoices) {
  if (!invoices.length) return '<div class="overview-chart-empty">No issued invoices in this range.</div>';
  const ordered = [...invoices].sort((a,b) => String(a.due).localeCompare(String(b.due)));
  const total = ordered.reduce((sum, invoice) => sum + Number(invoice.amount || 0) + Number(invoice.tax || 0), 0);
  let running = 0;
  const points = [{x:20,y:132}, ...ordered.map((invoice,index) => {
    running += Number(invoice.amount || 0) + Number(invoice.tax || 0);
    return {x:20 + (index + 1) * 296 / ordered.length, y:132 - (running / Math.max(total,1)) * 104};
  })];
  const line = points.slice(1).reduce((path,point,index) => {
    const previous = points[index];
    const middle = (previous.x + point.x) / 2;
    return `${path} C ${middle} ${previous.y}, ${middle} ${point.y}, ${point.x} ${point.y}`;
  },`M ${points[0].x} ${points[0].y}`);
  const area = `${line} L 316 132 L 20 132 Z`;
  const markers = points.slice(1).map(point => `<circle cx="${point.x}" cy="${point.y}" r="3.5"/>`).join('');
  return `<svg class="overview-chart" viewBox="0 0 336 160" preserveAspectRatio="none" role="img" aria-label="Issued invoice value rises to ${esc(money(total))} across ${ordered.length} invoice${ordered.length===1?'':'s'}"><defs><linearGradient id="billing-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9CCDBD" stop-opacity=".48"/><stop offset="1" stop-color="#9CCDBD" stop-opacity="0"/></linearGradient></defs><path class="overview-chart-grid" d="M20 28H316 M20 80H316 M20 132H316"/><path class="overview-chart-area" d="${area}"/><path class="overview-chart-line" d="${line}"/><g class="overview-chart-markers">${markers}</g></svg>`;
}

function renderPremiumOverview() {
  const activeProspects = state.leads.filter(lead => !['Lost','Converted'].includes(lead.stage));
  const convertedProspects = state.leads.filter(lead => lead.stage === 'Converted');
  const liveDeployments = state.deployments.filter(deployment => deployment.status === 'Live');
  const sentInvoices = state.invoices.filter(invoice => invoice.status !== 'Draft' && invoice.currency === 'INR');
  const outstandingValue = outstanding();
  const dueReminders = pendingReminders();
  const openCases = openTickets();
  const overdueInvoices = state.invoices.filter(overdue);
  const activeClients = state.clients.filter(client => client.status === 'Active').length;
  const workItems = typeof taskManagerRows==='function'?taskManagerRows():(state.tasks||[]).filter(task=>!task.deleted);
  const openWork = workItems.filter(item=>!item.done);
  const overdueWork = openWork.filter(item=>item.due&&item.due<localDate(0));
  const todayWork = openWork.filter(item=>item.due===localDate(0));
  const upcomingWork = openWork.filter(item=>item.due&&item.due>localDate(0)&&item.due<=localDate(7));
  const completedWork = workItems.filter(item=>item.done);
  const teamWorkload = typeof workspaceReportSnapshot==='function'?workspaceReportSnapshot().workload.map(item=>({...((state.teamMembers||[]).find(m=>m.id===item.id)||{}),...item})):[];
  const periodDays = Number(overviewPeriod);
  const chartInvoices = sentInvoices.filter(invoice => !periodDays || invoice.due >= localDate(0) && invoice.due <= localDate(periodDays));
  const periodIssuedValue = chartInvoices.reduce((sum,invoice) => sum + Number(invoice.amount || 0) + Number(invoice.tax || 0), 0);
  const periodPaidValue = chartInvoices.filter(invoice => invoice.status === 'Paid').reduce((sum,invoice) => sum + Number(invoice.amount || 0) + Number(invoice.tax || 0), 0);
  const periodCollectedRate = periodIssuedValue ? Math.round(periodPaidValue / periodIssuedValue * 100) : 0;
  const stages = ['New','Contacted','Discovery','Qualified','Proposal','Negotiation','Converted'];
  const stageCounts = stages.map(stage => ({stage,count:state.leads.filter(lead => lead.stage === stage).length}));
  const stageMax = Math.max(1,...stageCounts.map(item => item.count));
  const attention = [
    ...overdueInvoices.slice(0,2).map(invoice => ({type:'Overdue invoice',title:invoice.number,detail:`${nameOf('clients',invoice.clientId)} · ${money(Number(invoice.amount||0)+Number(invoice.tax||0),invoice.currency)}`,iconName:'bill',tone:'overdue',kind:'invoice',id:invoice.id})),
    ...openCases.filter(ticket => ticket.priority==='High'||ticket.due&&ticket.due<localDate(0)).slice(0,2).map(ticket => ({type:'Support case',title:ticket.subject,detail:`${nameOf('clients',ticket.clientId)} · ${ticket.number}`,iconName:'help',tone:'urgent',kind:'ticket',id:ticket.id})),
    ...dueReminders.slice(0,2).map(reminder => ({type:'Due follow-up',title:reminder.title,detail:reminder.clientId?nameOf('clients',reminder.clientId):prettyDate(reminder.due),iconName:'calendar',tone:'today',kind:'reminder',id:reminder.id})),
    ...state.deployments.filter(deployment => deployment.renewal && deployment.renewal>=localDate(0) && deployment.renewal<=localDate(30)).slice(0,1).map(deployment => ({type:'Renewal coming up',title:nameOf('products',deployment.productId),detail:`${nameOf('clients',deployment.clientId)} · ${prettyDate(deployment.renewal)}`,iconName:'box',tone:'soon',kind:'client',id:deployment.clientId}))
  ].slice(0,5);
  const kpis = [
    {label:'Clients',value:state.clients.length,detail:`${activeClients} active institutions`,icon:'users',view:'clients'},
    {label:'Active prospects',value:activeProspects.length,detail:`${convertedProspects.length} converted`,icon:'users',view:'prospects'},
    {label:'Live deployments',value:liveDeployments.length,detail:`${state.deployments.length} assigned in total`,icon:'box',view:'clients'},
    {label:'Open cases',value:openCases.length,detail:`${openCases.filter(ticket=>ticket.priority==='High').length} high priority`,icon:'help',view:'helpdesk'},
    {label:'Outstanding',value:money(outstandingValue),detail:`${overdueInvoices.length} overdue invoices`,icon:'bill',view:'billing'}
  ];

  return `<div class="premium-overview">
    <div class="overview-hero-grid">
      <section class="overview-welcome" aria-label="Workspace summary">
        <div class="overview-welcome-copy"><span class="overview-hello">Good ${new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}, IDSSPL team</span><h1>Let's build stronger<br>client relationships<br>today.</h1><p>Your clients, prospects, and delivery work in one connected view.</p></div>
        ${ambientVideo('abstract-folds','overview-welcome-video')}
      </section>
      <section class="overview-billing card" aria-label="Billing overview"><div class="overview-card-top"><span class="overview-card-title">${icon('bill')} Billing overview</span><label class="overview-period-label"><span class="sr-only">Invoice period</span><select id="overview-period" aria-label="Invoice period"><option value="all" ${overviewPeriod==='all'?'selected':''}>All invoices</option><option value="30" ${overviewPeriod==='30'?'selected':''}>Next 30 days</option><option value="90" ${overviewPeriod==='90'?'selected':''}>Next 90 days</option></select></label></div><strong class="overview-billing-value">${money(periodIssuedValue)}</strong><div class="overview-billing-meta"><span>INR issued invoice value</span><strong>${periodCollectedRate}% collected</strong></div>${overviewBillingChart(chartInvoices)}<div class="overview-chart-axis"><span>Earliest due</span><span>Latest due</span></div></section>
      <section class="overview-ai">${ambientVideo('lime-ribbon','overview-ai-video')}<div class="overview-ai-top"><span class="overview-ai-mark">${icon('spark')}</span><strong>AI Assistant</strong><span class="overview-ai-tag">PREVIEW</span></div><h2>Work with<br>your context.</h2><p>Ask about clients, invoices, support cases and next actions.</p><button class="overview-ai-main" data-view="assistant">Open assistant <span aria-hidden="true">↗</span></button></section>
    </div>
    <div class="overview-kpi-grid">${kpis.map(kpi => `<button class="overview-kpi card" data-view="${kpi.view}"><span class="overview-kpi-top"><span class="overview-kpi-icon">${icon(kpi.icon)}</span><span class="overview-kpi-label">${esc(kpi.label)}</span><span class="overview-kpi-arrow" aria-hidden="true">↗</span></span><strong>${esc(kpi.value)}</strong><small>${esc(kpi.detail)}</small></button>`).join('')}</div>
    <section class="overview-quick-strip" aria-label="Quick actions"><strong>Quick actions</strong><button data-assistant-action="client">${icon('users')} Onboard client</button><button data-assistant-action="prospect">${icon('users')} New prospect</button><button data-assistant-action="ticket">${icon('help')} New ticket</button><button data-assistant-action="invoice">${icon('bill')} Invoice draft</button><button data-assistant-action="reminder">${icon('calendar')} Reminder</button></section>
    <section class="overview-task-focus card"><div class="overview-section-heading"><div><span class="overview-section-kicker">TEAM MOMENTUM</span><h2>Follow-up focus</h2><p>One view of the work that keeps clients and prospects moving.</p></div><button data-view="tasks">Open task manager <span aria-hidden="true">↗</span></button></div><div class="overview-task-focus-body"><div class="overview-task-stats"><button data-view="tasks" data-task-scope="overdue"><small>OVERDUE</small><strong>${overdueWork.length}</strong><span>Needs attention</span></button><button data-view="tasks" data-task-scope="today"><small>TODAY</small><strong>${todayWork.length}</strong><span>Due before close</span></button><button data-view="tasks" data-task-scope="upcoming"><small>UPCOMING</small><strong>${upcomingWork.length}</strong><span>Next 7 days</span></button><button data-view="tasks" data-task-scope="completed"><small>COMPLETED</small><strong>${completedWork.length}</strong><span>Closed work</span></button></div><div class="overview-team-workload"><div class="overview-team-workload-head"><strong>Team workload</strong><span>${openWork.length} open actions</span></div>${teamWorkload.map(member=>{const max=Math.max(1,...teamWorkload.map(item=>item.count)),roleName=(state.roles||[]).find(role=>role.id===member.roleId)?.name||'Team member';return `<button data-view="tasks" data-task-scope="all" data-task-owner="${esc(member.id)}" class="overview-team-person">${typeof adminMemberAvatar==='function'?adminMemberAvatar(member):''}<span><strong>${esc(member.name)}</strong><small>${esc(roleName)}</small></span><i><b style="width:${Math.round(member.count/max*100)}%"></b></i><em>${member.count}</em></button>`}).join('')||'<p class="overview-team-empty">Add team members in Roles & access to see workload here.</p>'}</div></div></section>
    ${renderMaharashtraMap()}
    <div class="overview-content-grid">
      <section class="card overview-pipeline"><div class="overview-section-heading"><div><h2>Prospect pipeline</h2><p>One record follows each institution from first contact to conversion.</p></div><button data-view="prospects">View pipeline <span aria-hidden="true">↗</span></button></div><div class="overview-stage-row">${stageCounts.map((item,index) => `<button data-view="prospects" class="overview-stage"><span class="overview-stage-bar"><i style="width:${item.count?Math.max(22,Math.round(item.count/stageMax*100)):0}%"></i></span><strong>${esc(item.stage)}</strong><b>${item.count}</b><small>${index===stages.length-1?'Now clients':'Prospects'}</small></button>`).join('')}</div><div class="overview-pipeline-foot"><span>${activeProspects.length} active prospects</span><span>${convertedProspects.length} converted to clients</span></div></section>
      <section class="card overview-attention"><div class="overview-section-heading"><div><h2>Needs attention</h2><p>Billing, support and follow-ups that need action.</p></div></div><div class="overview-attention-list">${attention.map(item => `<button class="overview-attention-row" ${item.kind==='invoice'?`data-detail="invoice:${esc(item.id)}"`:item.kind==='ticket'?`data-ticket="${esc(item.id)}"`:item.kind==='client'?`data-profile="${esc(item.id)}"`:'data-view="assistant"'}><span class="overview-attention-icon ${esc(item.tone)}">${icon(item.iconName)}</span><span class="overview-attention-copy"><small>${esc(item.type)}</small><strong>${esc(item.title)}</strong><span>${esc(item.detail)}</span></span><span class="overview-attention-arrow" aria-hidden="true">↗</span></button>`).join('')||'<div class="overview-empty">Nothing needs attention right now.</div>'}</div></section>
    </div>
  </div>`;
}

function renderClients(){
 const q=filter.toLowerCase();
 const list=state.clients.filter(c=>[c.name,c.type,c.city,c.contact,c.email].some(v=>String(v||'').toLowerCase().includes(q)))
  .filter(c=>clientTypeFilter==='all'||c.type===clientTypeFilter)
  .filter(c=>clientStatusFilter==='all'||c.status===clientStatusFilter)
  .filter(c=>clientCityFilter==='all'||c.city===clientCityFilter);
 const pageCount=Math.max(1,Math.ceil(list.length/clientPageSize));clientPage=Math.min(clientPage,pageCount);
 const start=(clientPage-1)*clientPageSize, visible=list.slice(start,start+clientPageSize);
 const typeOptions=[...new Set(state.clients.map(c=>c.type))].sort();
 const cityOptions=[...new Set(state.clients.map(c=>c.city).filter(Boolean))].sort();
 const controls=`<div class="client-list-toolbar"><input id="list-search" type="search" placeholder="Search clients, contacts or city" value="${esc(filter)}" aria-label="Search clients"><select id="client-type-filter" aria-label="Filter institution type"><option value="all">All Types</option>${typeOptions.map(x=>`<option value="${esc(x)}" ${clientTypeFilter===x?'selected':''}>${esc(x)}</option>`).join('')}</select><select id="client-status-filter" aria-label="Filter status"><option value="all">All Statuses</option>${['Active','Onboarding','Inactive'].map(x=>`<option value="${x}" ${clientStatusFilter===x?'selected':''}>${x}</option>`).join('')}</select><select id="client-city-filter" aria-label="Filter city"><option value="all">All Cities</option>${cityOptions.map(x=>`<option value="${esc(x)}" ${clientCityFilter===x?'selected':''}>${esc(x)}</option>`).join('')}</select><button class="btn btn-primary" data-action="onboard-client">${icon('plus')}Onboard client</button></div>`;
 const rows=visible.map((c,i)=>`<tr class="client-open-row" data-profile="${esc(c.id)}" tabindex="0" aria-label="Open ${esc(c.name)} profile"><td>${clientCell(c,start+i)}</td><td>${esc(c.type)}</td><td>${state.branches.filter(b=>b.clientId===c.id).length}</td><td>${state.deployments.filter(d=>d.clientId===c.id).length}</td><td><span class="strong-cell">${esc(c.contact||'—')}</span><span class="sub-cell">${esc(c.email||'')}</span></td><td>${tag(c.status)}</td><td>${renderRecordRowActions('client',c.id,c.name)}</td></tr>`);
 const pagination=`<div class="client-pagination"><span>Showing ${list.length?start+1:0}–${Math.min(start+clientPageSize,list.length)} of ${list.length} clients</span><div><label for="client-page-size">Rows</label><select id="client-page-size" aria-label="Rows per page">${[10,20,50].map(n=>`<option value="${n}" ${clientPageSize===n?'selected':''}>${n}</option>`).join('')}</select><button data-client-page="${clientPage-1}" ${clientPage===1?'disabled':''} aria-label="Previous page">‹</button>${Array.from({length:pageCount},(_,i)=>`<button data-client-page="${i+1}" class="${clientPage===i+1?'current':''}" aria-label="Page ${i+1}">${i+1}</button>`).join('')}<button data-client-page="${clientPage+1}" ${clientPage===pageCount?'disabled':''} aria-label="Next page">›</button></div></div>`;
 return `<section class="card client-list-card">${controls}${table(['Institution','Type','Branches','Products','Primary Contact','Status',''],rows,'No matching clients.')}${pagination}</section>`;
}
function closeClientRowMenu(){
 const menu=document.getElementById('client-row-menu');
 if(!menu)return;
 menu.trigger?.setAttribute('aria-expanded','false');
 menu.remove();
}
document.addEventListener('scroll',e=>{
 const menu=document.getElementById('client-row-menu');
 if(menu&&!menu.contains(e.target))closeClientRowMenu();
},true);
window.addEventListener('resize',closeClientRowMenu);
function toggleClientRowMenu(trigger,id){
 const client=byId('clients',id);if(!client)return;
 toggleRowActionMenu(trigger,`Actions for ${client.name}`,`<button type="button" role="menuitem" data-profile="${esc(id)}">Open profile <span aria-hidden="true">↗</span></button><button type="button" role="menuitem" data-action="edit-client" data-id="${esc(id)}">Edit details</button><button type="button" role="menuitem" data-action="toggle-client-status" data-id="${esc(id)}">${client.status==='Inactive'?'Reactivate':'Mark inactive'}</button><div class="client-row-menu-divider" role="separator"></div><button type="button" role="menuitem" class="client-row-menu-danger" data-action="delete-client" data-id="${esc(id)}">Delete client</button>`);
}
function renderProductRowActions(d){
 return renderRecordRowActions('deployment',d.id,`${nameOf('clients',d.clientId)}, ${nameOf('branches',d.branchId)}, ${nameOf('products',d.productId)}`);
}
// Every record table uses this trigger and the same menu portal; actions keep their existing review flows.
function renderRecordRowActions(kind,id,label){
 return `<button class="client-menu-trigger" type="button" data-action="toggle-record-menu" data-kind="${esc(kind)}" data-id="${esc(id)}" aria-label="Actions for ${esc(label)}" aria-haspopup="menu" aria-expanded="false">⋯</button>`;
}
function recordRowMenu(kind,id){
 const collection={member:'teamMembers',task:'tasks',contact:'contacts',branch:'branches',prospect:'leads',invoice:'invoices',draft:'mailDrafts',ticket:'tickets'}[kind];
 const record=collection&&byId(collection,id);if(!record||record.deleted)return null;
 const item=(label,attributes,danger=false)=>`<button type="button" role="menuitem"${danger?' class="client-row-menu-danger"':''} ${Object.entries(attributes).map(([key,value])=>`data-${key}="${esc(value)}"`).join(' ')}>${esc(label)}</button>`;
 const action=(label,name,danger=false)=>item(label,{action:name,id},danger);
 const remove=(label,name,namespace='action')=>`<div class="client-row-menu-divider" role="separator"></div>${item(label,{[namespace]:name,id},true)}`;
 let content='';
 if(kind==='member')content=item('Manage access',{'admin-action':'edit-member',id})+item(record.status==='Inactive'?'Reactivate user':'Deactivate user',{'admin-action':'toggle-member',id},record.status!=='Inactive');
 if(kind==='task')content=item(record.done?'Reopen task':'Mark complete',{'task-manager-action':'complete',id})+item('Edit task',{'task-manager-action':'edit',id})+remove('Delete task','delete','task-manager-action');
 if(kind==='contact')content=item('Edit contact',{'ops-action':'contact-edit',id})+remove('Delete contact','contact-delete','ops-action');
 if(kind==='branch')content=item('View branch',{detail:`branch:${id}`})+action('Edit branch','edit-branch')+remove('Delete branch','delete-branch');
 if(kind==='prospect')content=item('Open profile',{lead:id})+(record.stage==='Converted'?item('Open client profile',{profile:record.convertedClientId}):action('Edit prospect','edit-lead'))+remove('Delete prospect','delete-prospect');
 if(kind==='invoice')content=item('Review invoice',{detail:`invoice:${id}`})+(record.status==='Draft'?action('Edit draft','edit-invoice'):'')+remove('Delete record','delete-invoice');
 if(kind==='draft')content=action('Edit draft','edit-draft')+remove('Delete draft','delete-draft');
 if(kind==='ticket')content=item('Open case',{ticket:id});
 return {label:`Actions for ${record.name||record.title||record.number||record.subject||'record'}`,content};
}
function toggleRecordRowMenu(trigger,kind,id){
 if(kind==='client'){toggleClientRowMenu(trigger,id);return;}
 if(kind==='deployment'){toggleProductRowMenu(trigger,id);return;}
 const menu=recordRowMenu(kind,id);if(menu)toggleRowActionMenu(trigger,menu.label,menu.content);
}
function toggleProductRowMenu(trigger,id){
 const d=byId('deployments',id);if(!d)return;
 toggleRowActionMenu(trigger,`Actions for ${nameOf('products',d.productId)} at ${nameOf('branches',d.branchId)}`,`<button type="button" role="menuitem" data-action="module-breakdown" data-id="${esc(id)}">Module details</button><button type="button" role="menuitem" data-action="edit-modules" data-id="${esc(id)}">Edit selected modules</button><button type="button" role="menuitem" data-action="edit-commercial" data-id="${esc(id)}">${d.commercial?'Edit terms':'Add terms'}</button><button type="button" role="menuitem" data-action="open-workflow-canvas" data-id="${esc(id)}">Canvas <span aria-hidden="true">↗</span></button>`);
}
function toggleRowActionMenu(trigger,label,content){
 const previous=document.getElementById('client-row-menu');
 if(previous?.trigger===trigger){closeClientRowMenu();trigger.focus();return;}
 closeClientRowMenu();
 const menu=document.createElement('div');
 menu.id='client-row-menu';menu.className='client-row-menu';menu.trigger=trigger;menu.setAttribute('role','menu');menu.setAttribute('aria-label',label);
 menu.innerHTML=content;
 menu.addEventListener('keydown',e=>{
  if(e.key==='Escape'||e.key==='Tab'){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();}closeClientRowMenu();trigger.focus();return;}
  if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
  e.preventDefault();
  const items=[...menu.querySelectorAll('[role="menuitem"]:not(:disabled)')],index=items.indexOf(document.activeElement);
  items[e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();
 });
 document.body.append(menu);
 const rect=trigger.getBoundingClientRect(),width=menu.offsetWidth,height=menu.offsetHeight;
 menu.style.left=`${Math.max(8,Math.min(innerWidth-width-8,rect.right-width))}px`;
 menu.style.top=`${rect.bottom+height+8<=innerHeight?rect.bottom+5:Math.max(8,rect.top-height-5)}px`;
 trigger.setAttribute('aria-expanded','true');
 menu.querySelector('button')?.focus();
}
document.addEventListener('keydown',e=>{
 const trigger=e.target.closest?.('.client-menu-trigger');
 if(!trigger||!['ArrowDown','ArrowUp'].includes(e.key))return;
 e.preventDefault();
 if(trigger.getAttribute('aria-expanded')!=='true')trigger.click();
 const items=document.getElementById('client-row-menu')?.querySelectorAll('[role="menuitem"]:not(:disabled)');
 if(items?.length)items[e.key==='ArrowUp'?items.length-1:0].focus();
});
const leadStages=['New','Contacted','Discovery','Qualified','Proposal','Negotiation','Lost'];
function mergeLeadTemplate(value,lead){return String(value||'').replaceAll('{institution}',lead.name).replaceAll('{contact}',lead.contact?.split(' ')[0]||'there').replaceAll('{products}',lead.interestedProducts.map(pid=>nameOf('products',pid)).join(', ')||'IDSSPL products');}
function renderProspects(){
 const q=filter.toLowerCase(),today=localDate(0),week=localDate(7),owners=[...new Set(state.leads.map(l=>l.owner).filter(Boolean))].sort();
 const list=state.leads.filter(l=>[l.name,l.contact,l.email,l.city,l.stage,l.owner,...(l.interestedProducts||[]).map(pid=>nameOf('products',pid))].some(v=>String(v||'').toLowerCase().includes(q)))
  .filter(l=>leadStageFilter==='all'||l.stage===leadStageFilter)
  .filter(l=>leadOwnerFilter==='all'||l.owner===leadOwnerFilter)
  .filter(l=>leadFollowupFilter==='all'||leadFollowupFilter==='overdue'&&l.nextFollowUp&&l.nextFollowUp<today&&!['Lost','Converted'].includes(l.stage)||leadFollowupFilter==='today'&&l.nextFollowUp===today||leadFollowupFilter==='week'&&l.nextFollowUp>=today&&l.nextFollowUp<=week||leadFollowupFilter==='missing'&&!l.nextFollowUp&&!['Lost','Converted'].includes(l.stage));
 list.sort((a,b)=>prospectListSort==='name'?a.name.localeCompare(b.name):prospectListSort==='stage'?leadStages.indexOf(a.stage)-leadStages.indexOf(b.stage):String(a.nextFollowUp||'9999').localeCompare(b.nextFollowUp||'9999'));
 const pageCount=Math.max(1,Math.ceil(list.length/prospectListPageSize));prospectListPage=Math.min(prospectListPage,pageCount);
 const visible=list.slice((prospectListPage-1)*prospectListPageSize,prospectListPage*prospectListPageSize);
 const rows=visible.map((l,i)=>`<tr><td>${clientCell(l,i)}</td><td><div class="prospect-interest-list">${(l.interestedProducts||[]).map(pid=>`<span class="prospect-interest">${esc(nameOf('products',pid))}</span>`).join('')||'<span class="prospect-interest-empty">No products selected</span>'}</div></td><td><span class="strong-cell">${esc(l.contact||'—')}</span><span class="sub-cell">${esc(l.email||'')}</span></td><td>${tag(l.stage)}</td><td>${esc(l.owner||'—')}</td><td>${l.nextFollowUp?prettyDate(l.nextFollowUp):'Not scheduled'}${l.nextFollowUp&&l.nextFollowUp<today&&!['Lost','Converted'].includes(l.stage)?'<span class="sub-cell prospect-overdue">Overdue</span>':''}</td><td>${renderRecordRowActions('prospect',l.id,l.name)}</td></tr>`);
 const filters=`<div class="prospect-filters"><select id="lead-stage-filter" aria-label="Filter prospects by stage"><option value="all">All stages</option>${[...leadStages,'Converted'].map(s=>`<option value="${s}" ${leadStageFilter===s?'selected':''}>${s}</option>`).join('')}</select><select id="lead-owner-filter" aria-label="Filter prospects by owner"><option value="all">All owners</option>${owners.map(o=>`<option value="${esc(o)}" ${leadOwnerFilter===o?'selected':''}>${esc(o)}</option>`).join('')}</select><select id="lead-followup-filter" aria-label="Filter prospects by follow-up"><option value="all">All follow-ups</option><option value="overdue" ${leadFollowupFilter==='overdue'?'selected':''}>Overdue</option><option value="today" ${leadFollowupFilter==='today'?'selected':''}>Today</option><option value="week" ${leadFollowupFilter==='week'?'selected':''}>Next 7 days</option><option value="missing" ${leadFollowupFilter==='missing'?'selected':''}>Not scheduled</option></select><span>${list.length} prospect${list.length===1?'':'s'}</span></div>`;
 return `<section class="card prospect-list-card">${toolbar('Search prospects, contacts or products')}${filters}<div class="prospect-list-controls"><select data-prospect-change="list-sort" aria-label="Sort prospect list">${[['followup','Follow-up date'],['name','Institution A–Z'],['stage','Pipeline stage']].map(([a,b])=>`<option value="${a}" ${prospectListSort===a?'selected':''}>${b}</option>`).join('')}</select><select data-prospect-change="list-size" aria-label="Prospects per page">${[10,20,50].map(size=>`<option value="${size}" ${prospectListPageSize===size?'selected':''}>${size} per page</option>`).join('')}</select></div>${table(['Institution','Interested Products','Contact','Stage','Owner','Next Follow-Up',''],rows,'No prospects match these filters.')}<div class="ops-pagination"><span>Showing ${list.length?(prospectListPage-1)*prospectListPageSize+1:0}–${Math.min(prospectListPage*prospectListPageSize,list.length)} of ${list.length}</span><button data-prospect-action="list-prev" ${prospectListPage===1?'disabled':''}>Previous</button><strong>${prospectListPage} / ${pageCount}</strong><button data-prospect-action="list-next" ${prospectListPage===pageCount?'disabled':''}>Next</button></div></section><section class="card section-card"><div class="card-head"><div><h2>Outreach Templates</h2><p>Reusable drafts for product catalog introductions and follow-ups</p></div><button data-action="new-template">New Template +</button></div><div class="template-list">${state.templates.map(t=>`<div><span class="template-icon">${icon('mail')}</span><div><strong>${esc(t.name)}</strong><small>${esc(t.subject)}</small></div><button data-action="edit-template" data-id="${t.id}">Edit →</button></div>`).join('')}</div></section>`;
}
function renderLeadDetail(){
 const l=byId('leads',selectedLeadId);if(!l)return renderProspects();const tpl=state.templates[0],drafts=state.mailDrafts.filter(d=>d.leadId===l.id);
 const subject=mergeLeadTemplate(tpl?.subject,l),body=mergeLeadTemplate(tpl?.body,l);
 const closed=l.stage==='Converted'||l.stage==='Lost';
 const actions=l.stage==='Converted'?`<button class="btn" data-profile="${l.convertedClientId}">Open Client Profile ${icon('arrow')}</button>`:`<button class="btn" data-action="edit-lead" data-id="${l.id}">Edit Prospect</button>${l.stage!=='Lost'?`<button class="btn btn-primary" data-action="convert-lead" data-id="${l.id}">Convert to Client ${icon('arrow')}</button>`:''}`;
 const stageForm=l.stage==='Converted'?'<div class="form-note">This prospect is now a client. Manage delivery and contacts in the client profile.</div>':`<form id="lead-stage-form"><div class="form-grid">${select('Pipeline Stage','stage',leadStages.map(s=>({value:s,label:s})))}${field('Next Follow-Up','nextFollowUp','date',false,'',l.nextFollowUp||'')}</div>${field('Next Action','nextAction','text',false,'e.g. Send product proposal',l.nextAction||'')}<div class="field"><label for="lead-loss-reason">Reason if marking Lost</label><textarea name="lossReason" id="lead-loss-reason" placeholder="Why is this opportunity closing?">${esc(l.lossReason||'')}</textarea></div><div class="field"><label for="lead-notes">Relationship Notes</label><textarea name="notes" id="lead-notes">${esc(l.notes||'')}</textarea></div><div class="form-error" id="lead-error"></div><button class="btn btn-soft" type="submit">Save Prospect Update</button></form>`;
 const outreach=closed?`<div class="lead-closed-note">${l.stage==='Lost'?'Reopen this prospect by changing its stage before preparing new outreach.':'Outreach for this institution now belongs in its client profile.'}</div>`:`<form id="lead-compose-form"><div class="field"><label for="lead-template">Template</label><select id="lead-template" name="templateId">${state.templates.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></div><div class="field"><label for="lead-to">To</label><input id="lead-to" name="to" type="email" required value="${esc(l.email)}"></div><div class="field"><label for="lead-subject">Subject</label><input id="lead-subject" name="subject" required value="${esc(subject)}"></div><div class="field"><label for="lead-body">Message</label><textarea id="lead-body" name="body" required>${esc(body)}</textarea></div><div class="mail-compose-note">The message is saved as a draft. Microsoft 365 sending is not connected.</div><button class="btn btn-primary" type="submit">Save Email Draft ${icon('arrow')}</button></form>`;
 const history=(l.history||[]).slice().reverse();
 return `<button class="profile-back" data-view="prospects">← Back to Prospects</button><div class="lead-hero"><div><h1>${esc(l.name)}</h1><p>${esc(l.type)} · ${esc(l.city)} · ${tag(l.stage)}</p></div><div class="lead-hero-actions">${actions}</div></div><div class="lead-detail-grid"><section class="card lead-profile-card"><div class="card-head"><div><h2>Relationship Details</h2></div></div><dl class="detail-dl"><dt>Contact</dt><dd>${esc(l.contact)}</dd><dt>Email</dt><dd>${esc(l.email)}</dd><dt>Owner</dt><dd>${esc(l.owner)}</dd><dt>Source</dt><dd>${esc(l.source)}</dd><dt>Next Follow-Up</dt><dd>${prettyDate(l.nextFollowUp)}</dd><dt>Next Action</dt><dd>${esc(l.nextAction||'Not set')}</dd>${l.stage==='Lost'?`<dt>Lost Reason</dt><dd>${esc(l.lossReason||'Not recorded')}</dd>`:''}<dt>Notes</dt><dd>${esc(l.notes||'—')}</dd></dl><div class="lead-products"><strong>Interested Products</strong>${(l.interestedProducts||[]).map(pid=>`<span>${esc(nameOf('products',pid))}</span>`).join('')||'<p>No products selected yet.</p>'}</div>${stageForm}</section><section class="card lead-outreach-card"><div class="card-head"><div><h2>Prepare Product Catalog Email</h2></div></div>${outreach}</section></div><section class="card section-card"><div class="card-head"><div><h2>Outreach Drafts</h2></div></div>${table(['Subject','To','Saved',''],drafts.map(d=>`<tr><td class="strong-cell">${esc(d.subject)}</td><td>${esc(d.to)}</td><td>${esc(d.savedAt)}</td><td>${renderRecordRowActions('draft',d.id,d.subject)}</td></tr>`),'No draft emails yet.')}</section>${history.length?`<section class="card section-card"><div class="card-head"><div><h2>Prospect Activity</h2></div></div><div class="prospect-history">${history.map(h=>`<div><strong>${esc(h.text)}</strong><span>${esc(h.at)}</span></div>`).join('')}</div></section>`:''}`;
}
function renderProfile(){
 const c=byId('clients',selectedClientId);if(!c)return renderClients();
 const branches=state.branches.filter(b=>b.clientId===c.id),deployments=state.deployments.filter(d=>d.clientId===c.id),invoices=state.invoices.filter(i=>i.clientId===c.id),tickets=state.tickets.filter(t=>t.clientId===c.id),messages=state.messages.filter(m=>m.clientId===c.id);
 const requirements=state.requirements.filter(r=>r.clientId===c.id);
 const documents=state.documents.filter(d=>d.clientId===c.id);
 const tabs=[['overview','Overview'],['branches','Branches',branches.length],['products','Products',deployments.length],['issues','Issues',tickets.length],['workflow','Workflow',requirements.length],['billing','Billing',invoices.length],['documents','Documents',documents.length],['logs','360° Timeline']];
 const summary=`<div class="profile-summary"><span class="profile-avatar">${c.logo?`<img src="${esc(c.logo)}" alt="">`:clientLogo(c,state.clients.indexOf(c))}</span><div><p class="eyebrow">CLIENT PROFILE</p><h1>${esc(c.name)}</h1><p>${esc(c.type)} · ${esc(c.city||'Location not set')} · ${tag(c.status)}</p></div><div class="profile-record-actions"><button class="btn" data-action="edit-client">${icon('settings')}Edit profile</button><button class="btn" data-action="toggle-client-status" data-id="${esc(c.id)}">${c.status==='Inactive'?'Reactivate':'Mark inactive'}</button><button class="btn btn-danger" data-action="delete-client" data-id="${esc(c.id)}">Delete client</button></div></div><div class="profile-tabs" role="tablist" aria-label="Client profile sections">${tabs.map(([key,label,count])=>`<button role="tab" aria-selected="${profileTab===key}" class="${profileTab===key?'active':''}" data-profile-tab="${key}">${label}${count!==undefined?` <span>${count}</span>`:''}</button>`).join('')}</div>`;
 let content='';
 if(profileTab==='overview')content=`<div class="profile-overview"><section class="card profile-info"><div class="card-head"><div><h2>Institution Details</h2><p>One source of context for this client</p></div></div><dl class="detail-dl"><dt>Primary Contact</dt><dd>${esc(c.contact||'—')}</dd><dt>Work Email</dt><dd>${esc(c.email||'—')}</dd><dt>Phone</dt><dd>${esc(c.phone||'—')}</dd><dt>Account Owner</dt><dd>${esc(c.owner||'Account team')}</dd><dt>Institution Type</dt><dd>${esc(c.type)}</dd><dt>City</dt><dd>${esc(c.city||'—')}</dd></dl></section><section class="card profile-info"><div class="card-head"><div><h2>Relationship Snapshot</h2><p>Linked work at a glance</p></div></div><div class="profile-metrics"><div><strong>${branches.length}</strong><span>Branches</span></div><div><strong>${deployments.length}</strong><span>Products</span></div><div><strong>${tickets.filter(Helpdesk.active).length}</strong><span>Open Tickets</span></div><div><strong>${invoices.filter(i=>i.status!=='Paid').length}</strong><span>Billing Items</span></div></div><div class="profile-next"><strong>Relationship Stage</strong><p>${esc(c.status)}</p><button data-profile-tab="logs">View Activity Log →</button></div></section></div><div class="profile-overview"><section class="card"><div class="card-head"><div><h2>Branches</h2><p>Locations belonging to this institution</p></div><button data-profile-tab="branches">View All →</button></div><div class="profile-list">${branches.slice(0,3).map(b=>`<div><span class="cell-avatar teal">${icon('branch')}</span><strong>${esc(b.name)}</strong><small>${esc(b.city)}</small></div>`).join('')||'<p>No branches yet.</p>'}</div></section><section class="card"><div class="card-head"><div><h2>Selected Products</h2><p>Current sample deployments</p></div><button data-profile-tab="products">View All →</button></div><div class="profile-list">${deployments.slice(0,3).map(d=>`<div><span class="cell-avatar blue">${icon('box')}</span><strong>${esc(nameOf('products',d.productId))}</strong><small>${esc(d.status)}</small></div>`).join('')||'<p>No products selected yet.</p>'}</div></section></div>`;
 if(profileTab==='branches')content=`<section class="card"><div class="card-head"><div><h2>${esc(c.name)} branches</h2><p>Locations and product links for this client.</p></div><button data-action="add-branch">Add branch +</button></div>${table(['Branch','Code','City','Products','Status',''],branches.map(b=>`<tr><td class="strong-cell">${esc(b.name)}</td><td>${esc(b.code)}</td><td>${esc(b.city)}</td><td>${deployments.filter(d=>d.branchId===b.id).length}</td><td>${tag(b.status)}</td><td>${renderRecordRowActions('branch',b.id,b.name)}</td></tr>`),'No branches for this client yet.')}</section>`;
 if(profileTab==='products')content=`<section class="card"><div class="card-head"><div><h2>Products for ${esc(c.name)}</h2><p>Track modules and commercial terms for each branch.</p></div><button data-action="add-deployment">Assign Product +</button></div>${table(['Product','Branch','Selected Modules','Commercial','Status',''],deployments.map(d=>`<tr><td><button class="row-action" data-product="${d.productId}">${esc(nameOf('products',d.productId))}</button></td><td>${esc(nameOf('branches',d.branchId))}</td><td>${renderDeploymentModules(d)}</td><td>${commercialCell(d)}</td><td>${tag(d.status)}<span class="sub-cell">${prettyDate(d.renewal)}</span></td><td class="product-actions-cell">${renderProductRowActions(d)}</td></tr>`),'No products assigned yet.',{className:'deployment-list-table',label:'Branch product assignments'})}</section>`;
 if(profileTab==='issues')content=window.renderClientIssueTracker?window.renderClientIssueTracker(c):`<section class="card"><div class="card-head"><div><h2>Issue tracker</h2><p>Loading client issues…</p></div></div></section>`;
 if(profileTab==='workflow')content=renderClientWorkflow(c,branches,deployments,requirements,documents);
 if(profileTab==='billing')content=`<section class="card"><div class="card-head"><div><h2>Billing for ${esc(c.name)}</h2><p>Draft, sent and paid sample records.</p></div><button data-action="add-invoice">Create draft +</button></div>${table(['Invoice','Branch','Product','Amount','Due','Status',''],invoices.map(i=>`<tr><td class="strong-cell">${esc(i.number)}</td><td>${esc(nameOf('branches',i.branchId))}</td><td>${esc(nameOf('products',i.productId))}</td><td>${money(i.amount,i.currency)}</td><td>${prettyDate(i.due)}</td><td>${tag(invoiceStatus(i))}</td><td>${renderRecordRowActions('invoice',i.id,i.number)}</td></tr>`),'No billing records yet.')}</section>`;
 if(profileTab==='documents')content=`<div class="document-page-head"><div><h2>Client Documents</h2><p>${documents.length} document${documents.length===1?'':'s'} for ${esc(c.name)}</p></div><button class="btn btn-primary" data-action="add-document">${icon('plus')}Add Document</button></div><div class="document-card-grid">${documents.map(renderDocumentCard).join('')||'<div class="card document-empty"><h3>No documents yet</h3><p>Add an NDA, business requirement, agreement or delivery record.</p><button class="btn btn-primary" data-action="add-document">Add Document</button></div>'}</div>`;
 if(profileTab==='logs'){const entries=[...state.activity.filter(a=>a.clientId===c.id),...tickets.map(t=>({id:'log-'+t.id,at:t.created,title:'Support case '+t.number,detail:t.subject})),...invoices.map(i=>({id:'log-'+i.id,at:i.due,title:'Billing record '+i.number,detail:money(i.amount,i.currency)+' · '+i.status})),...messages.map(m=>({id:'log-'+m.id,at:m.at,title:'Client mail',detail:m.subject})),...documents.map(d=>({id:'log-'+d.id,at:d.uploadedAt,title:'Document: '+d.category,detail:d.name}))];content=`<section class="card"><div class="card-head"><div><h2>Client Activity Log</h2><p>Documents, support, billing, mail and changes for this institution.</p></div></div><div class="client-log">${entries.map(a=>`<div><span class="log-icon">${icon('calendar')}</span><div><strong>${esc(a.title)}</strong><p>${esc(a.detail||'')}</p></div><small>${esc(a.at||'')}</small></div>`).join('')||'<p class="empty-state">No activity yet.</p>'}</div></section>`;}
 return `<button class="profile-back" data-view="clients">← Back to all clients</button>${summary}${banner()}${content}`;
}
function renderDocumentCard(d){
 const sample=!d.dataUrl;
 return `<article class="card document-card"><div class="document-card-top"><span class="document-card-icon">${icon('bill')}</span>${tag(d.status)}</div><span class="document-card-category">${esc(d.category)}</span><h3>${esc(d.name)}</h3><p class="document-card-file">${esc(d.fileName||'Document record')}</p><div class="document-card-meta"><span>Version ${esc(d.version||'1.0')}</span><span>${prettyDate(d.uploadedAt)}</span></div><div class="document-card-actions"><button data-document="${d.id}">Preview</button><button data-action="download-document" data-id="${d.id}">${icon('download')}${sample?'Download sample':'Download'}</button><button data-action="edit-document" data-id="${d.id}">Edit</button><button class="record-delete" data-action="delete-document" data-id="${esc(d.id)}">Delete</button></div></article>`;
}
function renderClientWorkflow(c,branches,deployments,requirements,documents){
 const visible=deployments.filter(d=>(workflowBranchFilter==='all'||d.branchId===workflowBranchFilter)&&(workflowProductFilter==='all'||d.productId===workflowProductFilter));
 const products=[...new Set(deployments.map(d=>d.productId))];
 const filters=`<div class="workflow-filters"><select id="workflow-branch-filter" aria-label="Filter workflow by branch"><option value="all">All branches</option>${branches.map(b=>`<option value="${b.id}" ${workflowBranchFilter===b.id?'selected':''}>${esc(b.name)}</option>`).join('')}</select><select id="workflow-product-filter" aria-label="Filter workflow by product"><option value="all">All products</option>${products.map(pid=>`<option value="${pid}" ${workflowProductFilter===pid?'selected':''}>${esc(nameOf('products',pid))}</option>`).join('')}</select></div>`;
 const cards=visible.map(d=>{
  const steps=requirements.filter(r=>r.branchId===d.branchId&&r.productId===d.productId);
  const linked=steps.map(r=>documents.find(doc=>doc.id===r.documentId)).filter(Boolean);
  return `<section class="card workflow-deployment"><div class="workflow-deployment-head"><div><span class="workflow-branch-name">${icon('branch')}${esc(nameOf('branches',d.branchId))}</span><h3>${esc(nameOf('products',d.productId))}</h3></div>${tag(d.status)}</div><div class="workflow-module-row"><strong>Selected modules</strong><div>${(d.modules||[]).map(m=>`<span>${esc(m)}</span>`).join('')||'<span>No modules recorded</span>'}</div></div><div class="workflow-step-head"><strong>Documented workflow</strong><span>${steps.length} step${steps.length===1?'':'s'}</span></div><div class="workflow-step-list">${steps.map(r=>{const doc=documents.find(x=>x.id===r.documentId);return `<article class="workflow-step"><div class="workflow-step-top"><strong>${esc(r.title)}</strong>${tag(r.stage)}</div><p>${esc(r.details||'No scope notes recorded.')}</p><div class="workflow-step-meta"><span>Owner: ${esc(r.owner||'Account team')}</span>${doc?`<button data-document="${doc.id}">${icon('bill')}${esc(doc.name)}</button>`:'<span>No supporting document linked</span>'}</div><div class="workflow-step-actions"><button data-action="edit-requirement" data-id="${r.id}">Edit step</button><button data-action="advance-requirement" data-id="${r.id}" ${r.stage==='Complete'?'disabled':''}>${r.stage==='Complete'?'Completed':'Move to next stage →'}</button></div></article>`;}).join('')||'<p class="workflow-no-steps">No workflow steps documented for this branch and product.</p>'}</div><button class="workflow-add-step" data-action="add-requirement" data-branch-id="${d.branchId}" data-product-id="${d.productId}">${icon('plus')}Add workflow step</button>${linked.length?`<div class="workflow-linked-docs"><strong>Supporting documents</strong>${linked.map(doc=>`<button data-document="${doc.id}">${icon('bill')}${esc(doc.name)}</button>`).join('')}</div>`:''}</section>`;
 }).join('');
 return `<div class="workflow-profile-head"><div><h2>Branch & Product Workflows</h2><p>Document the requirements and delivery steps for each branch’s selected product.</p></div><button class="btn btn-primary" data-action="add-requirement">${icon('plus')}Add Workflow Step</button></div>${filters}<div class="workflow-deployment-grid">${cards||'<div class="card workflow-empty">No branch and product combination matches these filters. Assign a product in this client’s Products tab first.</div>'}</div>`;
}
function renderBranches(){
 const q=filter.toLowerCase();const list=state.branches.filter(b=>[b.name,b.code,b.city,nameOf('clients',b.clientId)].some(v=>v.toLowerCase().includes(q)));
 return header('Branches','Manage each client location and its live product footprint.','Add branch','add-branch','CLIENT NETWORK')+banner()+`<section class="card">${toolbar('Search branch, code, city or client')}${table(['Branch','Code','Client','City','Products','Status',''],list.map((b,i)=>`<tr><td>${clientCell({name:b.name},i)}</td><td>${esc(b.code)}</td><td class="strong-cell">${esc(nameOf('clients',b.clientId))}</td><td>${esc(b.city)}</td><td>${state.deployments.filter(d=>d.branchId===b.id).length}</td><td>${tag(b.status)}</td><td>${renderRecordRowActions('branch',b.id,b.name)}</td></tr>`),'No matching branches.')}</section>`;
}
let productModuleFilter='all';
function renderProducts(){
 const q=filter.toLowerCase(); const list=state.products.filter(p=>[p.name,p.family,p.description,...(p.subproducts||[])].some(v=>v.toLowerCase().includes(q)));
 return header('Product Catalog','Explore IDSSPL product families, modules and branch commercials.','Add Product','add-product','YOUR SOLUTIONS')+`<section class="card" style="margin-bottom:17px">${toolbar('Search product family or module')}</section><div class="product-grid">${list.map(p=>{const terms=state.deployments.filter(d=>d.productId===p.id&&d.commercial).map(d=>d.commercial).sort((a,b)=>commercialAnnualValue(a)-commercialAnnualValue(b));return `<article class="card product-card" data-product-id="${esc(p.id)}"><span class="product-card-art" aria-hidden="true"></span><span class="product-icon">${icon('box')}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p>${terms.length?`<div class="product-card-commercial"><small>Branch terms from</small><strong>${commercialAmount(terms[0])}</strong></div>`:''}<div class="product-footer"><span>${(p.subproducts||[]).length} modules</span><button data-product="${p.id}">View Full Details →</button></div></article>`}).join('')||'<div class="empty-state">No matching products.</div>'}</div>`;
}
function renderProductModuleFilter(modules,deployments){
 return `<div class="product-module-filter"><label for="product-module-filter">Module</label><select id="product-module-filter"><option value="all" ${productModuleFilter==='all'?'selected':''}>All modules</option>${modules.map(module=>`<option value="${esc(module)}" ${productModuleFilter===module?'selected':''}>${esc(module)} · ${deployments.filter(d=>(d.modules||[]).includes(module)).length} branches</option>`).join('')}</select></div>`;
}
function renderProductDetail(){
 const p=byId('products',selectedProductId);if(!p)return renderProducts();
 const modules=p.subproducts||[],deployments=state.deployments.filter(d=>d.productId===p.id),clientIds=[...new Set(deployments.map(d=>d.clientId))],live=deployments.filter(d=>d.status==='Live');
 const requirements=state.requirements.filter(r=>!r.archived&&r.productId===p.id),invoices=state.invoices.filter(i=>i.productId===p.id),documentIds=new Set(requirements.map(r=>r.documentId).filter(Boolean));
 const documents=state.documents.filter(d=>documentIds.has(d.id)),commercialModels=[...new Set(deployments.map(d=>d.commercial?.model).filter(Boolean))],commercialTerms=deployments.map(d=>d.commercial).filter(Boolean).sort((a,b)=>commercialAnnualValue(a)-commercialAnnualValue(b));
 const stages=[['01','Business requirements','Scope, owners and acceptance criteria'],['02','Solution design','Modules, integrations and data'],['03','Configuration','Branch-specific setup'],['04','Validation & UAT','Review, testing and sign-off'],['05','Go-live & support','Handover and ongoing service']];
 const metrics=[['Clients',clientIds.length],['Branch deployments',deployments.length],['Live branches',live.length],['Workflow steps',requirements.length]];
 const shownDeployments=productModuleFilter==='all'?deployments:deployments.filter(d=>(d.modules||[]).includes(productModuleFilter)); const clientRows=shownDeployments.slice().sort((a,b)=>nameOf('clients',a.clientId).localeCompare(nameOf('clients',b.clientId))||nameOf('branches',a.branchId).localeCompare(nameOf('branches',b.branchId))).map(d=>`<tr><td><button class="product-client-link" data-profile="${esc(d.clientId)}">${esc(nameOf('clients',d.clientId))}</button><span class="sub-cell">${esc(byId('clients',d.clientId)?.type||'Client')}</span></td><td class="strong-cell">${esc(nameOf('branches',d.branchId))}</td><td>${renderDeploymentModules(d,productModuleFilter==='all'?'':productModuleFilter)}</td><td>${commercialCell(d)}<span class="sub-cell">${d.commercial?`${esc(d.commercial.paymentTerms)} · ${d.commercial.sample?'Sample terms':'Saved locally'}`:''}</span></td><td>${tag(d.status)}<span class="sub-cell">${d.renewal?`Renews ${prettyDate(d.renewal)}`:'No renewal date'}</span></td><td class="product-actions-cell">${renderProductRowActions(d)}</td></tr>`);
 return `<button class="profile-back" data-view="products">← Back to Product Catalog</button><div class="product-detail-hero" data-product-id="${esc(p.id)}"><div><p class="eyebrow">IDSSPL PRODUCT / ${esc(p.family)}</p><h1>${esc(p.name)}</h1><p>${esc(p.description)}</p><div class="product-detail-actions"><button class="btn btn-primary" data-action="add-deployment">Assign to client</button><button class="btn btn-soft" data-action="edit-product">Edit product</button><button class="btn btn-soft" data-action="delete-product">Delete product</button>${p.source?`<a class="btn btn-soft" href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">Product overview ↗</a>`:''}</div></div>${ambientVideo('login-waves','product-detail-motion','login-waves-poster')}<span class="product-detail-art" aria-hidden="true"></span></div>${typeof productCatalogSummary==='function'?productCatalogSummary(p):''}<div class="product-detail-metrics">${metrics.map(([label,value])=>`<div><strong>${value}</strong><span>${label}</span></div>`).join('')}</div><div class="product-detail-columns"><div class="product-detail-stack"><section class="card product-detail-section"><div class="card-head"><div><h2>Modules & coverage</h2><p>See what is available and where it is deployed.</p></div><span class="count-pill">${modules.length} modules</span></div><div class="module-catalog">${modules.map((m,i)=>{const count=deployments.filter(d=>(d.modules||[]).includes(m)).length;return `<div class="module-catalog-item"><span class="module-number">${String(i+1).padStart(2,'0')}</span><div class="catalog-module-copy"><strong>${esc(m)}</strong>${p.moduleDetails?.find(item=>item.name===m)?.description?`<p>${esc(p.moduleDetails.find(item=>item.name===m).description)}</p>`:''}</div><small>${count} ${count===1?'branch':'branches'}</small></div>`}).join('')||'<p class="empty-state">No modules listed. Add them when this product is assigned.</p>'}</div></section><section class="card product-detail-section"><div class="card-head"><div><h2>Business requirements & canvas</h2><p>Actual steps linked to clients and branches.</p></div><span class="count-pill">${requirements.length} steps</span></div><div class="product-detail-list">${requirements.slice(0,6).map(r=>{const d=deployments.find(d=>d.clientId===r.clientId&&d.branchId===r.branchId);return `<div><div><strong>${esc(r.title)}</strong><small>${esc(nameOf('clients',r.clientId))} · ${esc(nameOf('branches',r.branchId))}</small></div><span>${tag(r.stage)}</span>${d?`<button data-action="open-workflow-canvas" data-id="${esc(d.id)}">Canvas →</button>`:''}</div>`}).join('')||'<p class="product-detail-empty">No requirements recorded yet. Open a client canvas to define the first workflow.</p>'}</div></section></div><div class="product-detail-stack"><section class="card product-detail-section"><div class="card-head"><div><h2>Delivery path</h2><p>Standard stages; each client has its own documented workflow.</p></div></div><div class="workflow-list">${stages.map(([n,title,description])=>`<div class="workflow-item"><span>${n}</span><div><strong>${title}</strong><p>${description}</p></div></div>`).join('')}</div></section><section class="card product-detail-section"><div class="card-head"><div><h2>Commercial overview & documents</h2><p>Sample terms vary by client and branch. Billing records remain separate.</p></div></div><div class="product-detail-commercial"><div class="product-detail-commercial-summary"><span><strong>${commercialTerms.length}</strong><small>Branch terms</small></span><span class="product-detail-starting"><strong>${commercialTerms.length?commercialAmount(commercialTerms[0]):'—'}</strong><small>Starting rate</small></span></div><div class="product-detail-document-list">${documents.slice(0,3).map(d=>`<button data-document="${esc(d.id)}"><strong>${esc(d.name)}</strong><small>${esc(d.category)} · ${esc(d.status)}</small><span>↗</span></button>`).join('')||'<p>No product-linked documents yet.</p>'}</div><div class="product-detail-models"><strong>Commercial models in use</strong><p>${commercialModels.length?commercialModels.map(esc).join(' · '):'No branch commercial terms recorded yet.'}</p><small>${invoices.length?`${invoices.filter(i=>invoiceStatus(i)==='Draft').length} draft · ${invoices.filter(i=>invoiceStatus(i)==='Paid').length} paid`:'Billing starts from each client and branch.'}</small></div></div></section></div></div><section class="card product-detail-clients"><div class="product-list-header"><div class="card-head"><div><h2>Client & branch commercials</h2><p>Illustrative terms for each branch; edit a row to record its agreement.</p></div><span class="count-pill">${new Set(shownDeployments.map(d=>d.clientId)).size} clients</span></div>${renderProductModuleFilter(modules,deployments)}</div>${table(['Client','Branch','Modules','Branch commercial','Status',''],clientRows,'No clients use this product yet.',{className:'deployment-list-table',label:'Client and branch commercials'})}</section>`;
}
function openProductEditor(){
 const p=byId('products',selectedProductId);if(!p)return;
 const body=`<form id="entity-form" data-type="edit-product" data-id="${esc(p.id)}">${field('Product name','name','text',true,'',p.name)}${field('Family','family','text',true,'',p.family)}<div class="field"><label for="product-description">Description</label><textarea id="product-description" name="description" required>${esc(p.description||'')}</textarea></div><div class="field"><label for="product-modules">Modules · one per line</label><textarea id="product-modules" name="modules" required>${esc((p.subproducts||[]).join('\n'))}</textarea></div><div class="form-error" id="form-error"></div></form>`;
 modal('Edit product','Changes to modules are checked against active branch deployments.',body,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="entity-form">Save product</button>`);
}
function renderDocumentPreview(){
 const d=byId('documents',selectedDocumentId);if(!d)return renderClients();
 const client=byId('clients',d.clientId);let preview='';
 if(d.dataUrl&&d.mime==='application/pdf')preview=`<iframe class="document-frame" src="${esc(d.dataUrl)}" title="Preview of ${esc(d.name)}"></iframe>`;
 else if(d.dataUrl&&d.mime.startsWith('image/'))preview=`<div class="document-image"><img src="${esc(d.dataUrl)}" alt="Preview of ${esc(d.name)}"></div>`;
 else if(d.dataUrl&&d.mime==='text/plain')preview=`<iframe class="document-frame" src="${esc(d.dataUrl)}" title="Preview of ${esc(d.name)}"></iframe>`;
 else if(d.sampleText)preview=`<div class="sample-document"><p class="eyebrow">SAMPLE DOCUMENT PREVIEW</p><h2>${esc(d.name)}</h2><p>${esc(d.sampleText)}</p><small>Fictional sample record. Upload the signed or approved file for the actual client.</small></div>`;
 else preview='<div class="empty-state">Preview is unavailable for this file type. Download it to review.</div>';
 return `<button class="profile-back" data-action="back-to-documents">← Back to ${esc(client?.name||'Client')} Documents</button><div class="document-preview-head"><div><p class="eyebrow">CLIENT DOCUMENT / ${esc(d.category)}</p><h1>${esc(d.name)}</h1><p>${esc(client?.name||'Client')} · Version ${esc(d.version||'1.0')} · ${esc(d.status)}</p></div><div class="document-preview-actions"><button class="btn" data-action="edit-document" data-id="${d.id}">Edit</button><button class="btn btn-primary" data-action="download-document" data-id="${d.id}">${icon('download')}${d.dataUrl?'Download':'Download Sample'}</button></div></div><section class="card document-preview-card">${preview}</section>`;
}
function renderBilling(){
 const q=filter.toLowerCase(); const list=state.invoices.filter(i=>[i.number,nameOf('clients',i.clientId),nameOf('branches',i.branchId),nameOf('products',i.productId),invoiceStatus(i)].some(v=>v.toLowerCase().includes(q)));
 return header('Billing','Start billing from a client, branch and product; review before anything is sent.','Create draft','add-invoice','FINANCE')+banner()+`<section class="card">${toolbar('Search invoice, client or product')}${table(['Invoice','Institution / branch','Product','Amount','Due date','Status',''],list.map(i=>`<tr><td><span class="strong-cell">${esc(i.number)}</span></td><td><span class="strong-cell">${esc(nameOf('clients',i.clientId))}</span><span class="sub-cell">${esc(nameOf('branches',i.branchId))}</span></td><td>${esc(nameOf('products',i.productId))}</td><td class="strong-cell">${money(i.amount,i.currency)}</td><td>${prettyDate(i.due)}</td><td>${tag(invoiceStatus(i))}</td><td>${renderRecordRowActions('invoice',i.id,i.number)}</td></tr>`),'No matching invoices.')}</section>`;
}
function inboxReplyPlan(message){
 const text=`${message.subject||''} ${message.body||''}`.toLowerCase();
 const client=byId('clients',message.clientId),firstName=String(message.from||'there').trim().split(/\s+/)[0];
 const branch=state.branches.find(item=>item.clientId===message.clientId&&[item.name,item.city].some(value=>value&&text.includes(value.toLowerCase())));
 const place=branch?.name||client?.name||'your team';
 const subject=String(message.subject||'your request').replace(/^re:\s*/i,'');
 let intent='General request',summary='Acknowledge the message and confirm the next step.',paragraph=`Thank you for your message about ${subject}. We have noted your request and will review it with the relevant team. Please share any deadline or additional details that would help us respond accurately.`;
 if(/nda|agreement|legal|contract/.test(text)){intent='Agreement review';summary='The client has review comments. Route them for legal review before confirming changes.';paragraph='Thank you for sharing your comments on the agreement. We will review them with the appropriate team and come back with a consolidated response. Please flag any point that needs a time-sensitive decision.';}
 else if(/invoice|payment|finance team|billing/.test(text)){intent='Billing update';summary='The client is discussing invoice approval or payment. Avoid claiming a payment has been received.';paragraph='Thank you for the update on the invoice review. Please let us know when your finance team has completed its approval, or if it needs any supporting details from us. We will check the billing record before confirming the next step.';}
 else if(/uat|test case|signoff|sign-off/.test(text)){intent='UAT checklist';summary='The client wants test cases and sign-off requirements for the next milestone.';paragraph='Thank you for checking on the UAT requirements. We will confirm the applicable test cases, owners and sign-off steps for your implementation. Please let us know if you have a target review date so we can align the checklist.';}
 else if(/access|role|permission|checklist/.test(text)){intent='Access request';summary=`The client is asking about access roles or a checklist${branch?' for '+branch.name:''}.`;paragraph=`Thank you for your note about access for ${place}. We are checking the roles and approval steps before sharing the updated checklist. Could you confirm which team members or roles need to be included?` ;}
 else if(/settlement|reconciliation|report|column/.test(text)){intent='Reporting question';summary='The client needs clarity on a report or reconciliation output.';paragraph='Thank you for your question about the reporting output. Could you share the report version and the specific fields you would like us to walk through? We can then prepare an accurate explanation and arrange a short review with your team.';}
 else if(/timeline|milestone|implementation date|document.*required/.test(text)){intent='Implementation timeline';summary='The client wants a verified milestone and document list.';paragraph='Thank you for asking about the implementation timeline. We will confirm the next milestone and the documents required for your team before sharing dates. Please let us know if there is a deadline we should plan around.';}
 else if(/walkthrough|onboarding|qr approval/.test(text)){intent='Walkthrough request';summary='The client is asking for a product or process walkthrough.';paragraph='Thank you for your interest in a walkthrough. We can review the relevant flow with your operations team and capture any questions for follow-up. Could you share two convenient time slots and the people who should join?';}
 else if(/rollout|schedule|checkpoint|owner/.test(text)){intent='Rollout planning';summary=`The client is ready to review rollout steps${branch?' for '+branch.name:''}.`;paragraph=`Thank you for the update on the ${subject.toLowerCase()}. We will prepare the proposed checkpoints and owners for review${branch?' with the '+branch.name+' team':''}. Could you share a suitable time to go through the plan together?`;}
 const greeting=`Hello ${firstName},\n\n`,signoff='\n\nRegards,\nIDSSPL Team';
 const recommended=greeting+paragraph+signoff;
 const acknowledge=greeting+`Thank you for your email about ${subject}. We have received your request and will review it with the relevant team before confirming the next step.`+signoff;
 const details=greeting+`Thank you for your message about ${subject}. To help us respond accurately, could you share any supporting document, the affected branch or product, and the date by which you need an answer?`+signoff;
 const meeting=greeting+`Thank you for your note about ${subject}. A short discussion may be the quickest way to align on the next step. Could you share two suitable time slots and the colleagues who should attend?`+signoff;
 return {intent,summary,branch,templates:{recommended,acknowledge,details,meeting}};
}
function inboxReplyTemplate(message,template='recommended'){const plan=inboxReplyPlan(message);return plan.templates[template]||plan.templates.recommended;}
function renderMailAttachments(attachments){
 if(!attachments?.length)return '<section class="mail-attachments mail-attachments-empty" aria-label="Attachments"><strong>Attachments <span>0</span></strong><p>No files attached to this message.</p></section>';
 return `<section class="mail-attachments" aria-label="Attachments"><strong>Attachments <span>${attachments.length}</span></strong><div>${attachments.map(file=>`<a href="${String(file.dataUrl||'').startsWith('data:')?esc(file.dataUrl):'#'}" download="${esc(file.name)}">${icon('bill')}<span>${esc(file.name)}<small>${Math.ceil(Number(file.size||0)/1024)} KB</small></span>↧</a>`).join('')}</div></section>`;
}
function renderInbox(){
 const isDrafts=mailFolder==='Drafts', q=filter.toLowerCase();
 const clientName=m=>m.clientId?nameOf('clients',m.clientId):(state.leads.find(l=>l.id===m.leadId)?.name||'Unlinked');
 const source=(isDrafts?state.mailDrafts:state.messages.filter(m=>mailFolder==='Archive'?m.archived:mailFolder==='Starred'?m.starred:!m.archived))
  .filter(m=>mailClientFilter==='all'||(mailClientFilter==='unlinked'?!m.clientId:m.clientId===mailClientFilter));
 const messages=source.filter(m=>[m.subject,m.from,m.to,m.email,clientName(m),m.snippet,m.body].some(v=>String(v||'').toLowerCase().includes(q)))
  .filter(m=>isDrafts||mailFilter==='All'||mailFilter==='Unread'&&!m.read||mailFilter==='Starred'&&m.starred);
 const m=messages.find(x=>x.id===selectedMail)||(window.innerWidth>850?messages[0]:null);selectedMail=m?.id||'';
 const counts={Inbox:state.messages.filter(x=>!x.archived).length,Starred:state.messages.filter(x=>x.starred).length,Drafts:state.mailDrafts.length,Archive:state.messages.filter(x=>x.archived).length};
 const unread=state.messages.filter(x=>!x.archived&&!x.read).length;
 const folders=Object.entries(counts).map(([folder,count])=>`<button class="${mailFolder===folder?'active':''}" data-mail-folder="${folder}">${icon(folder==='Drafts'?'mail':folder==='Archive'?'box':'mail')}<span>${folder}</span><em>${count}</em></button>`).join('');
 const rows=messages.map(x=>`<div class="mail-row ${selectedMail===x.id?'selected':''} ${!x.read&&!isDrafts?'unread':''}"><button class="mail-star" data-action="mail-star" data-id="${x.id}" aria-label="${x.starred?'Remove star':'Star message'}" ${isDrafts?'disabled':''}>${x.starred?'★':'☆'}</button><button class="mail-row-main" data-mail="${x.id}"><span class="mail-row-line"><strong>${esc(isDrafts?'To: '+x.to:x.email||x.from)}</strong><small>${esc(x.at||x.savedAt||'Draft')}</small></span><span class="mail-row-subject">${esc(x.subject)}${x.attachments?.length?'<span class="mail-attachment-indicator" title="Has attachments">⌁</span>':''}</span><span class="mail-row-snippet">${esc(x.snippet||x.body||'')}</span><span class="mail-client-chip">${esc(clientName(x))}</span></button></div>`).join('');
 const plan=m&&!isDrafts?inboxReplyPlan(m):null;
 const reader=m?`<div class="mail-reader-actions"><button data-action="close-mail">← Back to inbox</button><span>${isDrafts?'Saved Draft':m.read?'Read':'Unread'}</span></div><h2>${esc(m.subject)}</h2><div class="mail-address"><span class="mail-avatar">${esc(initials(isDrafts?m.to:m.from))}</span><div><strong>${esc(isDrafts?'To: '+m.to:m.from)}</strong><small>${esc(isDrafts?'Draft':m.email)}</small></div></div><div class="mail-body">${esc(m.body)}</div>${renderMailAttachments(m.attachments)}${plan?`<section class="mail-intent-card" aria-label="Suggested reply"><div class="mail-intent-head"><span>SMART REPLY · PREVIEW</span><strong>${esc(plan.intent)}</strong></div><p>${esc(plan.summary)}</p><button type="button" data-action="reply-mail" data-id="${esc(m.id)}">Prepare reply draft ${icon('arrow')}</button></section>`:''}<div class="mail-reader-footer">${isDrafts?`<button class="btn btn-primary" data-action="edit-draft" data-id="${m.id}">Edit Draft</button>`:`<button class="btn" data-action="mail-read" data-id="${m.id}">${m.read?'Mark Unread':'Mark Read'}</button><button class="btn" data-action="mail-archive" data-id="${m.id}">${m.archived?'Move to Inbox':'Archive'}</button>`}</div>`
  :`<div class="mail-reader-empty"><strong>No message selected</strong><span>Choose a message from the list to read it here.</span></div>`;
 const mailClients=state.clients.filter(c=>state.messages.some(message=>message.clientId===c.id)||state.mailDrafts.some(draft=>draft.clientId===c.id));
 return `<div class="mail-console"><div class="mail-workspace ${m?'has-selection':''}"><div class="mail-appbar"><strong>${icon('mail')} IDSSPL Mail</strong><nav class="mail-folder-tabs" aria-label="Mail folders">${folders}</nav><div class="mail-appbar-actions"><button class="mail-templates-button" data-action="manage-mail-templates">Templates</button><button class="mail-compose-button" data-action="open-compose">${icon('plus')}New Mail</button></div></div><section class="mail-list-panel"><div class="mail-list-head"><div><h2>${esc(mailFolder)}</h2><small>${messages.length} message${messages.length===1?'':'s'}</small></div><span class="mail-list-indicator">${unread} unread</span></div><div class="mail-search"><input id="list-search" type="search" placeholder="Search mail" aria-label="Search mail" value="${esc(filter)}"><select id="mail-client-filter" aria-label="Filter mail by client"><option value="all" ${mailClientFilter==='all'?'selected':''}>All clients</option>${mailClients.map(c=>`<option value="${esc(c.id)}" ${mailClientFilter===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}<option value="unlinked" ${mailClientFilter==='unlinked'?'selected':''}>Prospects and unlinked</option></select><select id="mail-filter" aria-label="Mail filter"><option value="All" ${mailFilter==='All'?'selected':''}>All Mail</option><option value="Unread" ${mailFilter==='Unread'?'selected':''}>Unread</option><option value="Starred" ${mailFilter==='Starred'?'selected':''}>Starred</option></select></div><div class="mail-scroll">${rows||'<div class="mail-empty">No mail matches these filters.</div>'}</div></section><aside class="mail-reader">${reader}</aside></div></div>`;
}

function renderHelpdesk(){
 const q=filter.toLowerCase();const list=state.tickets.filter(t=>[t.number,t.subject,t.priority,t.status,nameOf('clients',t.clientId)].some(v=>v.toLowerCase().includes(q)));
 const active=state.tickets.filter(t=>!['Resolved','Closed'].includes(t.status));const due=active.filter(t=>t.due&&t.due<localDate(0));
 return header('Helpdesk','Manage client cases from intake through resolution, with branch, module and activity context.','New Ticket','add-ticket','SERVICE DESK')+banner()+`<section class="card">${toolbar('Search case, client, branch or issue')}${table(['Case','Issue','Client / Branch','Product / Module','Priority','Owner','Due','Status',''],list.map(t=>`<tr><td class="strong-cell">${esc(t.number)}</td><td class="strong-cell">${esc(t.subject)}</td><td>${esc(nameOf('clients',t.clientId))}<span class="sub-cell">${t.branchId?esc(nameOf('branches',t.branchId)):'Institution-wide'}</span></td><td>${t.productId?esc(nameOf('products',t.productId)):'General'}<span class="sub-cell">${esc(t.module||'')}</span></td><td>${tag(t.priority)}</td><td>${esc(t.owner)}</td><td>${t.due?prettyDate(t.due):'—'}</td><td>${tag(t.status)}</td><td>${renderRecordRowActions('ticket',t.id,t.number)}</td></tr>`),'No matching cases.')}</section>`;
}
function renderTicketDetail(){
 const t=byId('tickets',selectedTicketId);if(!t)return renderHelpdesk();
 const history=t.history?.length?t.history:[{at:t.created||localDate(0),by:'Support team',text:'Case created',status:t.status}];
 const stages=['Open','In progress','Waiting on Client','Waiting on IDSSPL','Escalated','Resolved','Closed','Reopened'];
 return `<button class="profile-back" data-view="helpdesk">← Back to Helpdesk</button><div class="ticket-hero"><div><p class="eyebrow">HELPDESK CASE / ${esc(t.number)}</p><h1>${esc(t.subject)}</h1><p>${esc(nameOf('clients',t.clientId))} · ${t.branchId?esc(nameOf('branches',t.branchId)):'Institution-wide'}</p></div><div>${tag(t.status)} ${tag(t.priority)}</div></div>${banner()}<div class="ticket-detail-grid"><section class="card ticket-main"><div class="card-head"><div><h2>Case Details</h2><p>Full context for the support team</p></div></div><dl class="detail-dl"><dt>Client</dt><dd>${esc(nameOf('clients',t.clientId))}</dd><dt>Branch</dt><dd>${t.branchId?esc(nameOf('branches',t.branchId)):'Institution-wide'}</dd><dt>Product</dt><dd>${t.productId?esc(nameOf('products',t.productId)):'General Support'}</dd><dt>Module</dt><dd>${esc(t.module||'—')}</dd><dt>Category</dt><dd>${esc(t.category||'General')}</dd><dt>Impact</dt><dd>${esc(t.impact||'Not specified')}</dd><dt>Source</dt><dd>${esc(t.source||'Internal')}</dd><dt>Owner</dt><dd>${esc(t.owner)}</dd><dt>Due Date</dt><dd>${prettyDate(t.due)}</dd><dt>Opened</dt><dd>${prettyDate(t.created)}</dd></dl><div class="ticket-description"><h3>Issue Description</h3><p>${esc(t.description||t.subject)}</p></div><div class="ticket-description"><h3>Resolution</h3><p>${esc(t.resolution||'Pending resolution.')}</p></div></section><section class="card ticket-update"><div class="card-head"><div><h2>Update Case</h2><p>Changes are recorded in the activity log</p></div></div><form id="ticket-update-form"><div class="form-grid">${select('Status','status',stages.map(x=>({value:x,label:x})))}${select('Priority','priority',['Low','Medium','High'].map(x=>({value:x,label:x})))}</div>${field('Owner','owner','text',true,'Assigned team member',t.owner)}${field('Due Date','due','date',false,'',t.due||'')}<div class="field"><label for="ticket-note">Update Note / Resolution</label><textarea id="ticket-note" name="note" placeholder="Record what changed, the next step, or the resolution."></textarea></div><div class="form-error" id="ticket-error"></div><button class="btn btn-primary" type="submit">Save Update ${icon('arrow')}</button></form></section></div><section class="card ticket-history"><div class="card-head"><div><h2>Activity History</h2><p>Every case update in this browser</p></div></div><div class="ticket-timeline">${[...history].reverse().map(h=>`<div><span></span><div><strong>${esc(h.status||'Update')}</strong><p>${esc(h.text)}</p><small>${esc(h.by||'Team')} · ${esc(h.at)}</small></div></div>`).join('')}</div></section>`;
}
function answerQuestion(question){
 const q=question.toLowerCase();
 const result=(text,sources=[])=>({text,sources:sources.slice(0,5)});
 const source=(kind,id,label)=>({kind,id,label});
 const matchedClient=state.clients.find(c=>q.includes(c.name.toLowerCase()))||state.clients.find(c=>q.includes((c.id.startsWith('cx')?c.name.split(' ').slice(0,2):c.name.split(' ').slice(0,1)).join(' ').toLowerCase()));
 const cityMatches=state.branches.filter(b=>q.includes(b.city.toLowerCase()));
 const matchedBranch=state.branches.find(b=>q.includes(b.name.toLowerCase())||q.includes(b.code.toLowerCase()))||(cityMatches.length===1?cityMatches[0]:null);
 const aliases={p1:['core banking'],p2:['npci','upi'],p3:['digital banking','mobile banking'],p4:['enterprise solution'],p5:['merchant management'],p6:['card management']};
 const matchedProduct=state.products.find(p=>q.includes(p.name.toLowerCase())||(aliases[p.id]||[]).some(alias=>q.includes(alias)));
 const late=state.invoices.filter(overdue),activeCases=openTickets(),today=localDate(0);
 if(/what can you do|help me|commands|capabilities/.test(q))return result('I can summarize clients, branches, products, invoices, support cases and today’s priorities from this CRM. I can add a reminder from a short request, prepare a client email draft, or open a support case, invoice, prospect or client form. Give me a name and the details you have.');
 if(/trained|training|my data|your data|where.*data/.test(q))return result('In this preview I read the CRM records stored in this browser when you ask a question. I am not training a model on them. Uploaded document content, live billing, helpdesk and Microsoft 365 mail need secure connections before I can use them.');
 if(matchedBranch&&!matchedClient){
  const b=matchedBranch,deployments=state.deployments.filter(d=>d.branchId===b.id),cases=activeCases.filter(t=>t.branchId===b.id),invoices=state.invoices.filter(i=>i.branchId===b.id);
  return result(`${b.name} · ${nameOf('clients',b.clientId)} · ${b.status}\n${deployments.map(d=>`${nameOf('products',d.productId)} · ${(d.modules||[]).length} modules · ${d.commercial?commercialAmount(d.commercial):'terms not recorded'}`).join('\n')||'No products deployed.'}\n${cases.length} open case${cases.length===1?'':'s'} · ${invoices.length} billing record${invoices.length===1?'':'s'}.`,[source('branch',b.id,b.name),source('client',b.clientId,nameOf('clients',b.clientId)),...cases.map(t=>source('ticket',t.id,t.number))]);
 }
 if(matchedClient){
  const c=matchedClient,branches=state.branches.filter(b=>b.clientId===c.id),deployments=state.deployments.filter(d=>d.clientId===c.id),invoices=state.invoices.filter(i=>i.clientId===c.id),cases=activeCases.filter(t=>t.clientId===c.id),documents=state.documents.filter(d=>d.clientId===c.id),messages=state.messages.filter(m=>m.clientId===c.id);
  const base=[source('client',c.id,c.name),...(matchedBranch?[source('branch',matchedBranch.id,matchedBranch.name)]:[])];
  if(/mail|inbox|message|email/.test(q))return result(`${c.name}: ${messages.length} linked sample messages. ${messages.slice(0,3).map(m=>`${m.subject} (${m.at})`).join('; ')||'No messages recorded.'} Open the inbox to read or draft a reply.`,[...base,source('view','inbox','Client inbox')]);
  if(/invoice|billing|payment|overdue/.test(q))return result(`${c.name}: ${invoices.length} billing record${invoices.length===1?'':'s'}. ${invoices.map(i=>`${i.number} · ${money(i.amount,i.currency)} · ${invoiceStatus(i)} · due ${prettyDate(i.due)}`).join('; ')||'No invoices recorded.'}`,[...base,...invoices.map(i=>source('invoice',i.id,i.number))]);
  if(/ticket|support|case|helpdesk/.test(q))return result(`${c.name}: ${cases.length} open support case${cases.length===1?'':'s'}. ${cases.map(t=>`${t.number} · ${t.subject} · ${t.priority} priority · ${t.status}`).join('; ')||'No open cases.'}`,[...base,...cases.map(t=>source('ticket',t.id,t.number))]);
  if(/document|requirement|scope/.test(q)){const steps=state.requirements.filter(r=>r.clientId===c.id).length;return result(`${c.name}: ${documents.length} linked document${documents.length===1?'':'s'}. ${documents.map(d=>`${d.name} · ${d.status}`).join('; ')||'No documents recorded.'} ${steps} workflow step${steps===1?'':'s'} recorded.`,[...base,...documents.map(d=>source('document',d.id,d.name))]);}
  const selected=deployments.filter(d=>(!matchedProduct||d.productId===matchedProduct.id)&&(!matchedBranch||d.branchId===matchedBranch.id));
  if(matchedProduct||/commercial|pricing|product|module|branch|coverage|deploy/.test(q))return result(`${c.name}${matchedProduct?' · '+matchedProduct.name:''}\n${selected.length?selected.slice(0,7).map(d=>`${nameOf('branches',d.branchId)}: ${nameOf('products',d.productId)} · ${(d.modules||[]).length} modules · ${d.commercial?commercialAmount(d.commercial)+' + '+money(d.commercial.setupFee)+' setup':'terms not recorded'} · ${d.status}`).join('\n'):'No matching branch deployment.'}`,[...base,...new Set(selected.map(d=>d.productId))].map(x=>typeof x==='string'?source('product',x,nameOf('products',x)):x));
  const unpaid=invoices.filter(i=>!['Paid','Draft'].includes(i.status));
  return result(`${c.name} · ${c.status}\n${branches.length} branch${branches.length===1?'':'es'} · ${deployments.length} product deployment${deployments.length===1?'':'s'} · ${cases.length} open case${cases.length===1?'':'s'} · ${unpaid.length} unpaid invoice${unpaid.length===1?'':'s'} (${money(unpaid.reduce((sum,i)=>sum+Number(i.amount||0),0))}).\nPrimary contact: ${c.contact||'not recorded'}. ${documents.length} linked document${documents.length===1?'':'s'} and ${messages.length} sample message${messages.length===1?'':'s'}.`,[...base,...cases.slice(0,2).map(t=>source('ticket',t.id,t.number)),...unpaid.slice(0,2).map(i=>source('invoice',i.id,i.number))]);
 }
 if(/today|daily|priority|focus|attention|brief/.test(q)&&!/(invoice|billing|payment|support|ticket|helpdesk|case|renew)/.test(q)){
  const reminders=pendingReminders(),high=activeCases.filter(t=>t.priority==='High'),renewals=state.deployments.filter(d=>d.renewal&&d.renewal>=today&&d.renewal<=localDate(30)).sort((a,b)=>a.renewal.localeCompare(b.renewal));
  return result(`Today’s CRM brief\n${reminders.length} reminder${reminders.length===1?'':'s'} due: ${reminders.slice(0,3).map(r=>r.title).join('; ')||'none'}.\n${late.length} overdue invoice${late.length===1?'':'s'} worth ${money(late.reduce((sum,i)=>sum+Number(i.amount||0),0))}.\n${high.length} high-priority open case${high.length===1?'':'s'}${high.length?': '+high.slice(0,2).map(t=>t.number+' '+t.subject).join('; '):''}.\n${renewals.length} branch renewal${renewals.length===1?'':'s'} in the next 30 days.`,[...late.slice(0,2).map(i=>source('invoice',i.id,i.number)),...high.slice(0,2).map(t=>source('ticket',t.id,t.number)),source('view','assistant','Reminders')]);
 }
 if(/renew|expir|contract/.test(q)){
  const days=/60/.test(q)?60:30,items=state.deployments.filter(d=>d.renewal&&d.renewal>=today&&d.renewal<=localDate(days)).sort((a,b)=>a.renewal.localeCompare(b.renewal));
  return result(`${items.length} branch renewal${items.length===1?'':'s'} in the next ${days} days.\n${items.slice(0,6).map(d=>`${prettyDate(d.renewal)} · ${nameOf('clients',d.clientId)} / ${nameOf('branches',d.branchId)} · ${nameOf('products',d.productId)}`).join('\n')||'No renewals in this window.'}`,items.map(d=>source('client',d.clientId,nameOf('clients',d.clientId))));
 }
 if(/invoice|billing|payment|overdue|outstanding/.test(q))return result(`${late.length} overdue invoice${late.length===1?'':'s'} worth ${money(late.reduce((sum,i)=>sum+Number(i.amount||0),0))}; ${state.invoices.filter(i=>i.status==='Draft').length} drafts.\n${late.map(i=>`${i.number} · ${nameOf('clients',i.clientId)} · ${money(i.amount,i.currency)} · due ${prettyDate(i.due)}`).join('\n')||'No overdue invoices.'}`,late.map(i=>source('invoice',i.id,i.number)));
 if(/ticket|support|helpdesk|case|triage/.test(q))return result(`${activeCases.length} open cases; ${activeCases.filter(t=>t.priority==='High').length} high priority.\n${activeCases.slice().sort((a,b)=>(a.priority==='High'?0:1)-(b.priority==='High'?0:1)).slice(0,6).map(t=>`${t.number} · ${nameOf('clients',t.clientId)} / ${t.branchId?nameOf('branches',t.branchId):'Institution-wide'} · ${t.subject} · ${t.priority} · ${t.status}`).join('\n')||'No open cases.'}`,activeCases.map(t=>source('ticket',t.id,t.number)));
 if(/prospect|pipeline|lead/.test(q)){
  const leads=state.leads.filter(l=>!['Converted','Lost'].includes(l.stage));
  return result(`${leads.length} active prospects.\n${leads.slice(0,5).map(l=>`${l.name} · ${l.stage} · next: ${l.nextAction||'follow up not recorded'}${l.nextFollowUp?' ('+prettyDate(l.nextFollowUp)+')':''}`).join('\n')||'No active prospects.'}`,leads.map(l=>source('lead',l.id,l.name)));
 }
 if(/document|requirement|scope/.test(q))return result(`${state.documents.length} sample documents are linked to client records. ${state.requirements.length} workflow steps are recorded. Ask for a named client to see its documents and scope.`,[source('view','clients','Client records')]);
 if(/mail|email|reply|inbox|outlook/.test(q))return result(`${state.messages.length} sample messages are linked to clients in this preview. I can show client-specific threads and open an email draft. A live mailbox is not connected.`,[source('view','inbox','Client inbox')]);
 if(matchedProduct||/commercial|pricing|product|module|coverage/.test(q)){
  const items=state.deployments.filter(d=>!matchedProduct||d.productId===matchedProduct.id),active=items.filter(d=>d.status==='Live');
  return result(`${matchedProduct?matchedProduct.name:'Product catalog'}: ${items.length} branch deployments, ${active.length} live.\n${items.slice(0,5).map(d=>`${nameOf('clients',d.clientId)} / ${nameOf('branches',d.branchId)} · ${d.commercial?commercialAmount(d.commercial):'terms not recorded'}`).join('\n')||'No deployments recorded.'}`,[...(matchedProduct?[source('product',matchedProduct.id,matchedProduct.name)]:[source('view','products','Products')]),...items.slice(0,4).map(d=>source('client',d.clientId,nameOf('clients',d.clientId)))]);
 }
 if(/client|bank|branch/.test(q))return result(`${state.clients.length} institutions, ${state.branches.length} branches and ${state.deployments.length} product deployments are recorded here. Ask for a client by name to see its full brief.`,[source('view','clients','Clients')]);
 return result('I could not match that request yet. Try a client name, “what needs my attention today?”, “email a contact about a topic”, “remind me to follow up tomorrow”, or ask about invoices, renewals or support.');
}
function assistantSourceButton(item){
 if(!item||!item.id)return '';
 const id=esc(item.id),attrs={client:`data-profile="${id}"`,branch:`data-detail="branch:${id}"`,invoice:`data-detail="invoice:${id}"`,ticket:`data-ticket="${id}"`,document:`data-document="${id}"`,product:`data-product="${id}"`,lead:`data-lead="${id}"`,view:`data-view="${id}"`};
 return attrs[item.kind]?`<button class="assistant-source" ${attrs[item.kind]}>${esc(item.label||'View record')} <span aria-hidden="true">↗</span></button>`:'';
}
function renderAssistant(){
 const open=state.reminders.filter(r=>!r.done).sort((a,b)=>a.due.localeCompare(b.due));
 const completed=state.reminders.filter(r=>r.done);
 const shown=assistantReminderFilter==='done'?completed:open;
 const suggestions=['What needs my attention today?','Draft an email','Add a reminder','Create a support ticket'];
 const home=`<div class="assistant-empty"><span class="assistant-orbit assistant-orbit-video">${ambientVideo('assistant-orbit','assistant-orbit-media')}</span><h2>What can I help you move forward?</h2><p>Ask about your CRM, draft a client email, create a reminder or start another action. Give me a name and a few details to prepare it.</p></div>`;
 const chat=state.chats.length?state.chats.map(c=>`<div class="assistant-message ${c.role==='user'?'user':'bot'}">${c.role==='bot'?`<span class="assistant-message-icon">${icon('spark')}</span>`:''}<div class="assistant-message-body"><p>${esc(c.text)}</p>${c.role==='bot'&&c.sources?.length?`<div class="assistant-sources"><span>From your CRM</span>${c.sources.map(assistantSourceButton).join('')}</div>`:''}</div></div>`).join(''):home;
 const actions=[['New reminder','reminder','calendar'],['Support case','ticket','help'],['Invoice draft','invoice','bill'],['Email draft','email','mail']];
 return `<div class="assistant-workspace"><section class="card assistant-chat"><div class="assistant-head"><div class="assistant-head-mark">${icon('spark')}</div><div><h1>IDSSPL Assistant</h1><p>Your workspace assistant</p></div><button class="assistant-clear" data-action="clear-chat" ${state.chats.length?'':'disabled'}>Clear chat</button></div><div class="assistant-prompt-row">${suggestions.map(s=>`<button data-prompt="${esc(s)}">${esc(s)}</button>`).join('')}</div><div class="chat-log" id="chat-log">${chat}</div><form class="chat-compose" id="chat-form"><input id="chat-input" placeholder="Try: Email Ananya about the rollout, or remind me to call Aster tomorrow" autocomplete="off" required aria-label="Ask assistant"><button aria-label="Send question">${icon('send')}</button></form><div class="assistant-trust-note">Uses demo CRM records in this browser. Emails are saved as drafts; live AI and Microsoft 365 are not connected.</div></section><aside class="assistant-rail"><section class="card assistant-reminders"><div class="assistant-panel-head"><div><h2>Reminders</h2><small>${open.length} open · ${completed.length} completed</small><button class="assistant-board-link" type="button" data-view="reminders">Open sticky note board ↗</button></div><button data-action="add-reminder">+ Add</button></div><div class="assistant-reminder-tabs"><button class="${assistantReminderFilter==='open'?'active':''}" data-reminder-filter="open">Open</button><button class="${assistantReminderFilter==='done'?'active':''}" data-reminder-filter="done">Completed</button></div><div class="assistant-reminder-list">${shown.map(r=>`<div class="assistant-reminder-item"><span class="assistant-reminder-dot ${r.done?'done':''}">${icon('calendar')}</span><div><strong>${esc(r.title)}</strong><small>${prettyDate(r.due)}${r.clientId?' · '+esc(nameOf('clients',r.clientId)):''}</small><div class="assistant-reminder-actions"><button data-action="${r.done?'reopen-reminder':'complete-reminder'}" data-id="${r.id}">${r.done?'Reopen':'Done'}</button><button data-action="edit-reminder" data-id="${r.id}">Edit</button><button data-action="delete-reminder" data-id="${r.id}">Delete</button></div></div></div>`).join('')||'<div class="assistant-reminder-empty">No reminders in this view.</div>'}</div></section><section class="card assistant-actions"><div class="assistant-panel-head"><div><h2>Start work</h2><small>Open a draft or form to review</small></div></div><div class="assistant-action-grid">${actions.map(([label,target,glyph])=>`<button data-assistant-action="${target}"><span>${icon(glyph)}</span><strong>${label}</strong></button>`).join('')}</div></section></aside></div>`;
}

function renderSettings(){
 return header('Settings & setup','A practical plan for turning this preview into your internal CRM.','','','FOUNDATIONS')+banner()+`<div class="setup-grid"><article class="card setup-card"><div class="setup-card-top"><span class="setup-icon">${icon('mail')}</span><h3>Microsoft 365 / Outlook</h3><span class="setup-label">NEXT</span></div><p>Connect approved mailboxes, match client domains and contacts, filter noise, and link threads to the correct institution. Replies should remain drafts until a team member approves them.</p><button class="btn" data-action="setup-note" data-id="outlook">Define inbox rules ${icon('arrow')}</button></article><article class="card setup-card"><div class="setup-card-top"><span class="setup-icon">${icon('users')}</span><h3>Team roles</h3><span class="setup-label">NEXT</span></div><p>Design access for administrators, account managers, billing, support and read-only reviewers, with institution-level boundaries and an audit trail.</p><button class="btn" data-action="setup-note" data-id="roles">Review roles ${icon('arrow')}</button></article><article class="card setup-card"><div class="setup-card-top"><span class="setup-icon">${icon('bill')}</span><h3>Billing rules</h3><span class="setup-label">NEEDS INPUT</span></div><p>Confirm billing entity, tax treatment, cycles, contracts, approval flow, invoice numbering, credits, renewals and payment reconciliation before live invoices.</p><button class="btn" data-action="setup-note" data-id="billing">Review questions ${icon('arrow')}</button></article><article class="card setup-card"><div class="setup-card-top"><span class="setup-icon">${icon('spark')}</span><h3>Assistant & alerts</h3><span class="setup-label">NEXT</span></div><p>Give the assistant approved access to CRM and Outlook, daily briefs, reminders and draft generation. Human review should gate outbound messages and billing actions.</p><button class="btn" data-action="setup-note" data-id="assistant">See assistant scope ${icon('arrow')}</button></article></div><section class="card roadmap"><h3>Suggested build sequence</h3>${[['01','Secure team database','Move records out of browser storage; add identity, roles and audit history.'],['02','Client operations','Client, branch, contacts, contracts, products and support workflows.'],['03','Outlook integration','Mailbox permissions, matching rules, filtered inbox and draft replies.'],['04','Billing controls','Invoice drafts, approvals, tax and reconciliation after business rules are confirmed.'],['05','AI assistant','Grounded daily brief, reminders and approved actions.']].map(s=>`<div class="roadmap-step"><span class="step-number">${s[0]}</span><div><strong>${s[1]}</strong><p>${s[2]}</p></div></div>`).join('')}</section><section class="card section-card"><div class="card-head"><div><h2>Prototype data</h2><p>Keep a copy of this demo or start fresh</p></div></div><div style="display:flex;gap:9px;padding:0 20px 20px"><button class="btn" data-action="export-data">${icon('download')}Export JSON</button><button class="btn" data-action="reset-demo">Reset demo data</button></div></section>`;
}
let reportRange='7';
function workspaceReportSnapshot(){
 const active=items=>(items||[]).filter(item=>!item.deleted&&!item.archived);
 const clients=active(state.clients),leads=active(state.leads).filter(l=>!['Lost','Converted'].includes(l.stage));
 const deployments=active(state.deployments).filter(d=>d.status!=='Retired'),tickets=active(state.tickets).filter(t=>Helpdesk.active(t));
 const tasks=typeof taskManagerRows==='function'?taskManagerRows():active(state.tasks),openTasks=tasks.filter(t=>!t.done);
 const today=localDate(0),end=localDate(Number(reportRange)),members=state.teamMembers||[];
 const workload=members.map(m=>({id:m.id,name:m.name,status:m.status,count:openTasks.filter(t=>t.assigneeId===m.id).length})).filter(m=>m.status!=='Inactive'||m.count).sort((a,b)=>b.count-a.count);
 const unassigned=openTasks.filter(t=>!members.some(m=>m.id===t.assigneeId)).length;
 if(unassigned)workload.push({id:'unassigned',name:'Unassigned',count:unassigned});
 return {clients,leads,deployments,tickets,tasks,openTasks,workload,
 dueTasks:openTasks.filter(t=>t.due>=today&&t.due<=end),overdueTasks:openTasks.filter(t=>t.due&&t.due<today),
 overdueInvoices:active(state.invoices).filter(i=>invoiceStatus(i)==='Overdue'),
 completedTasks:tasks.filter(t=>t.done),liveDeployments:deployments.filter(d=>d.status==='Live'),
 stageCounts:['New','Contacted','Discovery','Qualified','Proposal','Negotiation'].map(stage=>({label:stage,count:leads.filter(l=>l.stage===stage).length})),
 productCounts:[...new Set(deployments.map(d=>d.productId))].map(id=>({label:nameOf('products',id),count:deployments.filter(d=>d.productId===id).length})).sort((a,b)=>b.count-a.count)};
}
function workspaceReportRows(s=workspaceReportSnapshot()){
 return [['Section','Metric','Value'],['Workspace','Active clients',s.clients.filter(c=>c.status==='Active').length],
 ['Workspace','Open prospects',s.leads.length],['Workspace','Live deployments',s.liveDeployments.length],
 ['Workspace','Open support cases',s.tickets.length],['Workspace','Open tasks including prospect follow-ups',s.openTasks.length],
 ['Health','Overdue tasks',s.overdueTasks.length],['Health','Tasks due in next '+reportRange+' days',s.dueTasks.length],
 ['Health','Overdue issued invoices',s.overdueInvoices.length],['Health','Completed tasks',s.completedTasks.length],
 ...s.stageCounts.map(x=>['Pipeline',x.label,x.count]),...s.productCounts.map(x=>['Product adoption',x.label,x.count]),
 ...s.workload.map(x=>['Team workload',x.name,x.count])];
}
function renderReports(){
 const s=workspaceReportSnapshot();
 const bars=(rows,tone='')=>{const max=Math.max(1,...rows.map(x=>x.count));return rows.map(x=>'<div class="reports-bar-row"><span title="'+esc(x.label)+'">'+esc(x.label)+'</span><i aria-hidden="true"><b class="'+tone+'" style="width:'+Math.round(x.count/max*100)+'%"></b></i><strong>'+x.count+'</strong></div>').join('');};
 const kpis=[['users','Active clients',s.clients.filter(c=>c.status==='Active').length,s.clients.length+' institutions'],
 ['branch','Open pipeline',s.leads.length,'Across all active stages'],['box','Live deployments',s.liveDeployments.length,s.deployments.length+' assigned in total'],
 ['help','Open support',s.tickets.length,'Cases needing follow-up'],['task','Open tasks',s.openTasks.length,'Includes prospect follow-ups']];
 return '<div class="ops-page reports-page"><header class="ops-heading"><div><span class="followup-eyebrow">WORKSPACE PERFORMANCE</span><h1>Reports</h1><p>A current view of your clients, delivery, support and team workload.</p></div><button class="btn btn-primary" type="button" data-action="export-reports">'+icon('download')+'Export report</button></header>'+
 '<div class="ops-metrics reports-kpis">'+kpis.map(([symbol,label,count,detail])=>'<article><div class="report-kpi-label">'+icon(symbol)+'<small>'+label+'</small></div><strong>'+count+'</strong><span>'+detail+'</span></article>').join('')+'</div>'+
 '<div class="reports-grid"><section class="ops-surface"><div class="ops-section-head"><div><h2>Prospect pipeline</h2><span>'+s.leads.length+' active prospects · current stages</span></div>'+icon('branch')+'</div><div class="reports-bars">'+(s.leads.length?bars(s.stageCounts):'<p class="reports-empty">No active prospects yet.</p>')+'</div></section>'+
 '<section class="ops-surface"><div class="ops-section-head"><div><h2>Product adoption</h2><span>Assigned branch deployments by product</span></div>'+icon('box')+'</div><div class="reports-bars">'+(bars(s.productCounts,'is-blue')||'<p class="reports-empty">No product deployments recorded yet.</p>')+'</div></section></div>'+
 '<div class="reports-grid"><section class="ops-surface"><div class="ops-section-head"><div><h2>Team workload</h2><span>Open tasks and prospect follow-ups</span></div><button type="button" data-view="tasks" data-task-scope="all">View tasks '+icon('arrow')+'</button></div><div class="reports-workload">'+
 (s.workload.map(x=>'<button type="button" class="reports-workload-row" data-view="tasks" data-task-owner="'+esc(x.id)+'" data-task-scope="all"><span>'+esc(x.name)+(x.status==='Inactive'?' · Inactive':'')+'</span><i aria-hidden="true"><b style="width:'+Math.round(x.count/Math.max(1,...s.workload.map(x=>x.count))*100)+'%"></b></i><strong>'+x.count+'</strong></button>').join('')||'<p class="reports-empty">Add team members to see workload.</p>')+'</div></section>'+
 '<section class="ops-surface reports-health"><div class="ops-section-head"><div><h2>Operational health</h2><span>Due soon excludes overdue work</span></div><label class="report-window"><span class="sr-only">Upcoming task window</span><select id="reports-range" aria-label="Upcoming task window">'+['7','30','90'].map(n=>'<option value="'+n+'" '+(reportRange===n?'selected':'')+'>Next '+n+' days</option>').join('')+'</select></label></div><div class="reports-health-list">'+
 '<div><span class="health-dot is-red"></span><strong>'+s.overdueTasks.length+'</strong><small>overdue tasks</small></div><div><span class="health-dot is-amber"></span><strong>'+s.dueTasks.length+'</strong><small>tasks due in '+reportRange+' days</small></div><div><span class="health-dot is-red"></span><strong>'+s.overdueInvoices.length+'</strong><small>overdue issued invoices</small></div><div><span class="health-dot is-green"></span><strong>'+s.completedTasks.length+'</strong><small>completed tasks</small></div></div></section></div>'+
 '<p class="reports-footnote">'+icon('download')+'Export includes every metric shown above, with pipeline, product and team breakdowns.</p></div>';
}
function timelineTimestamp(value){
 if(!value)return 0;
 const raw=String(value).trim(),local=raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?/i);
 if(local){let hour=Number(local[4]||0);if(local[7])hour=hour%12+(local[7].toLowerCase()==='pm'?12:0);return new Date(+local[3],+local[2]-1,+local[1],hour,+local[5]||0,+local[6]||0).getTime();}
 return /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(raw)?Date.parse(raw.length===10?raw+'T12:00:00':raw)||0:0;
}
function clientTimelineEntries(clientId){
 const linked=key=>(state[key]||[]).filter(x=>x.clientId===clientId&&!x.deleted),due=value=>value?' · Due '+prettyDate(value):'';
 const entries=[
 ...linked('activity').map(a=>({kind:'Activity',title:a.title,detail:a.detail,at:a.at})),
 ...linked('branches').map(b=>({kind:'Branch',title:b.name,detail:b.city||'City not set',at:b.createdAt})),
 ...linked('deployments').map(d=>({kind:'Product',title:nameOf('products',d.productId),detail:nameOf('branches',d.branchId)+' · '+d.status,at:d.updatedAt||d.createdAt})),
 ...linked('tasks').map(t=>({kind:'Task',title:t.title,detail:(t.done?'Completed':'Open')+' · '+(t.owner||'Unassigned')+due(t.due),at:t.completedAt||t.updatedAt||t.createdAt})),
 ...linked('reminders').map(r=>({kind:'Reminder',title:r.title,detail:(r.done?'Completed':'Open')+due(r.due),at:r.updatedAt||r.createdAt})),
 ...linked('tickets').map(t=>({kind:'Helpdesk',title:t.number+' · '+t.subject,detail:t.status+(t.archived?' · Archived':'')+' · '+(t.owner||'Unassigned'),at:t.updatedAt||t.createdAt||t.created})),
 ...linked('invoices').map(i=>({kind:'Billing',title:'Invoice '+i.number,detail:money(Number(i.amount||0)+Number(i.tax||0),i.currency)+' · '+invoiceStatus(i)+due(i.due),at:i.updatedAt||i.issuedAt||i.createdAt})),
 ...linked('messages').map(m=>({kind:'Mail',title:m.subject,detail:'From '+(m.from||'Client contact')+(m.at?' · '+m.at:''),at:m.receivedAt||m.createdAt||m.at})),
 ...linked('documents').map(d=>({kind:'Document',title:d.name,detail:d.category+' · '+d.status,at:d.uploadedAt})),
 ...linked('requirements').map(r=>({kind:'Workflow',title:r.title,detail:r.stage+(r.archived?' · Archived':'')+' · '+(r.owner||'Account team'),at:r.updatedAt||r.createdAt}))
 ];
 return entries.map((entry,index)=>({...entry,index,timestamp:timelineTimestamp(entry.at)})).sort((a,b)=>b.timestamp-a.timestamp||a.index-b.index);
}
function enhanceClientTimeline(){
 const c=byId('clients',selectedClientId),wrap=$('.client-log');if(!c||!wrap)return;
 const entries=clientTimelineEntries(c.id),symbols={Activity:'history',Branch:'branch',Product:'box',Task:'task',Reminder:'calendar',Helpdesk:'help',Billing:'bill',Mail:'mail',Document:'bill',Workflow:'branch'};
 const heading=wrap.closest('.card')?.querySelector('.card-head');
 if(heading){heading.querySelector('h2').textContent='Client 360° timeline';heading.querySelector('p').textContent='Latest recorded activity first. Records without a date appear at the end.';}
 wrap.innerHTML=entries.map(entry=>'<article class="client-timeline-entry"><span class="client-timeline-icon '+entry.kind.toLowerCase()+'" aria-hidden="true">'+icon(symbols[entry.kind]||'history')+'</span><div><small>'+esc(entry.kind)+'</small><strong>'+esc(entry.title||'Untitled record')+'</strong>'+(entry.detail?'<p>'+esc(entry.detail)+'</p>':'')+'</div><time'+(entry.timestamp?' datetime="'+new Date(entry.timestamp).toISOString()+'"':'')+'>'+(entry.timestamp?esc(new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric'}).format(entry.timestamp)):'Date not recorded')+'</time></article>').join('')||'<p class="empty-state">No client activity yet. Tasks, cases, invoices and messages will appear here.</p>';
}
function enhanceWorkflowActions(){
 $$('.workflow-step-actions').forEach(actions=>{if(actions.querySelector('[data-action="create-task-from-requirement"]'))return;const edit=actions.querySelector('[data-action="edit-requirement"]');if(edit)actions.insertAdjacentHTML('beforeend',`<button type="button" data-action="create-task-from-requirement" data-id="${esc(edit.dataset.id)}">Create task</button>`);});
}
function render(){ closeClientRowMenu(); window.disposeClientStreetMap?.(); document.querySelectorAll('video[data-ambient]').forEach(video=>video.pause()); $('#main-content').innerHTML=({overview:renderPremiumOverview,clients:renderClients,profile:renderProfile,workflowCanvas:renderWorkflowCanvas,onboarding:renderOnboarding,prospects:renderProspectHub,leadDetail:renderLeadDetail,contacts:renderContacts,tasks:renderTasks,insights:renderReports,products:renderProducts,productDetail:renderProductDetail,documentPreview:renderDocumentPreview,billing:renderBilling,inbox:renderInbox,helpdesk:renderHelpdesk,ticketDetail:renderTicketDetail,assistant:renderAssistant,reminders:()=>renderReminderBoard(),settings:renderAdmin,admin:renderAdmin,roles:renderRolesPage}[view]||renderPremiumOverview)(); $('#nav-clients').textContent=state.clients.length; if(view==='overview')bindOverviewMap(); if(view==='assistant')$('#chat-log').scrollTop=$('#chat-log').scrollHeight; if(view==='onboarding'&&onboardingStep===0)$('#f-type').value=onboarding.type; if(view==='leadDetail'&&$('#lead-stage-form'))$('#lead-stage-form').elements.stage.value=byId('leads',selectedLeadId).stage; if(view==='ticketDetail'&&$('#ticket-update-form')){const t=byId('tickets',selectedTicketId);$('#ticket-update-form').elements.status.value=t.status;$('#ticket-update-form').elements.priority.value=t.priority;} if(view==='profile'&&profileTab==='logs')enhanceClientTimeline(); if(view==='profile'&&profileTab==='workflow')enhanceWorkflowActions(); enhanceCrudControls(); }
function enhanceCrudControls(){
 const add=(selector,html)=>$(selector)?.insertAdjacentHTML('beforeend',html);
 if(view==='leadDetail'&&selectedLeadId)add('.lead-hero-actions',`<button class="btn btn-danger" data-action="delete-prospect" data-id="${esc(selectedLeadId)}">Delete prospect</button>`);
 if(view==='ticketDetail'&&selectedTicketId&&!window.helpdeskReady)add('.ticket-hero',`<div class="ticket-record-actions"><button class="btn" data-action="edit-ticket-details" data-id="${esc(selectedTicketId)}">Edit case details</button><button class="btn btn-danger" data-action="delete-ticket" data-id="${esc(selectedTicketId)}">Delete case</button></div>`);
 if(view==='documentPreview'&&selectedDocumentId)add('.document-preview-actions',`<button class="btn btn-danger" data-action="delete-document" data-id="${esc(selectedDocumentId)}">Delete document</button>`);
 if(view==='inbox'&&selectedMail)add('.mail-reader-footer',`<button class="btn btn-danger" data-action="delete-${mailFolder==='Drafts'?'draft':'mail'}" data-id="${esc(selectedMail)}">Delete ${mailFolder==='Drafts'?'draft':'message'}</button>`);
 if(view==='tasks')$$('.ops-task-list [data-ops-action="task-edit"]').forEach(button=>button.insertAdjacentHTML('afterend',`<button class="record-delete" data-action="delete-task" data-id="${esc(button.dataset.id)}">Delete</button>`));
}

let modalReturnFocus=null;
function modal(title,subtitle,body,footer=''){ if(!$('#modal-root').querySelector('[role="dialog"]'))modalReturnFocus=document.activeElement; $('#modal-root').innerHTML=`<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-header"><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">${icon('close')}</button></div><div class="modal-body">${body}</div><div class="modal-footer">${footer||'<button class="btn" data-action="close-modal">Close</button>'}</div></div></div>`; $('.modal-body input:not([type="hidden"]), .modal-body select, .modal-body textarea, .modal button')?.focus(); }
function openDeleteReview(kind,id){
 if(state.tickets.some(t=>kind==='client'?t.clientId===id:Helpdesk.affects(t,id))){toast('Support history is linked to this record. Keep it for case traceability; mark the client inactive if needed.');return;}
 const record=byId(kind==='client'?'clients':'branches',id);if(!record)return;
 const counts=CrmCrud.linked(state,kind,id),phrase=kind==='client'?record.name:record.code;
 const labels={branches:'branches',products:'product assignments',invoices:'billing records',cases:'support cases',requirements:'workflow steps',documents:'documents',contacts:'contacts',mail:'messages and drafts',followUps:'reminders and tasks'};
 const affected=Object.entries(counts).filter(([,count])=>count).map(([key,count])=>`<li><strong>${count}</strong> ${labels[key]}</li>`).join('');
 const body=`<p>Deleting <strong>${esc(record.name)}</strong> also deletes its linked records in this browser.</p>${affected?`<ul class="delete-impact-list">${affected}</ul>`:'<p>No linked records.</p>'}<label class="delete-confirm-label" for="delete-confirm-text">Type <strong>${esc(phrase)}</strong> to confirm</label><input id="delete-confirm-text" type="text" autocomplete="off" spellcheck="false" aria-label="Type the exact name to confirm deletion"><p id="delete-confirm-error" class="form-error" role="alert"></p>`;
 modal(`Delete ${kind}`, 'Review the linked records before deleting.',body,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-danger" data-action="confirm-delete-${kind}" data-id="${esc(id)}">Delete ${kind}</button>`);
 $('#delete-confirm-text')?.focus();
}
function openBranchEditor(id){
 const branch=byId('branches',id);if(!branch)return;
 const body=`<form id="entity-form" data-type="edit-branch" data-id="${esc(id)}"><div class="form-note">${esc(nameOf('clients',branch.clientId))}</div>${field('Branch name','name','text',true,'',branch.name)}<div class="form-grid">${field('Branch code','code','text',true,'',branch.code)}${field('City','city','text',true,'',branch.city)}</div>${select('Status','status',['Setup','Live'].map(x=>({value:x,label:x})))}<div class="form-grid">${field('Exact latitude','mapLat','number',false,'Optional',branch.mapLat??'')}${field('Exact longitude','mapLon','number',false,'Optional',branch.mapLon??'')}</div><div class="form-error" id="form-error"></div></form>`;
 modal('Edit branch','Update this location and its map pin.',body,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="entity-form">Save branch</button>`);
 $('#entity-form').elements.status.value=branch.status;
}
function openTicketDetailsEditor(id){
 const ticket=byId('tickets',id);if(!ticket)return;
 const body=`<form id="entity-form" data-type="edit-ticket-details" data-id="${esc(id)}"><div class="form-note">${esc(nameOf('clients',ticket.clientId))} · ${ticket.branchId?esc(nameOf('branches',ticket.branchId)):'Institution-wide'}</div>${field('Issue summary','subject','text',true,'',ticket.subject)}<div class="form-grid">${select('Category','category',['Access','Incident','Service Request','Change Request','Billing','Other'].map(x=>({value:x,label:x})))}${select('Impact','impact',['Single User','Branch','Multiple Branches','Institution-Wide'].map(x=>({value:x,label:x})))}</div>${select('Source','source',['Email','Phone','Portal','Internal'].map(x=>({value:x,label:x})))}<div class="field"><label for="f-description">Issue description <span>*</span></label><textarea id="f-description" name="description" required>${esc(ticket.description||ticket.subject)}</textarea></div><div class="form-error" id="form-error"></div></form>`;
 modal('Edit case details','Update the issue while keeping its client and branch links.',body,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="entity-form">Save case</button>`);
 const form=$('#entity-form');form.elements.category.value=ticket.category||'Other';form.elements.impact.value=ticket.impact||'Branch';form.elements.source.value=ticket.source||'Internal';
}
function openRecordDelete(kind,id){
 const collections={document:'documents',invoice:'invoices',ticket:'tickets',requirement:'requirements',prospect:'leads',draft:'mailDrafts',mail:'messages',task:'tasks'};
 const record=byId(collections[kind],id);if(!record)return;
 const label=record.name||record.number||record.title||record.subject||'this draft';
 const affected=kind==='document'?state.requirements.filter(item=>item.documentId===id).length:kind==='prospect'?state.mailDrafts.filter(item=>item.leadId===id).length:0;
 const note=kind==='document'&&affected?`${affected} workflow step${affected===1?'':'s'} will lose this document link.`:kind==='prospect'&&affected?`${affected} outreach draft${affected===1?'':'s'} will be deleted too.`:kind==='invoice'?'This removes the billing record from this browser.':'This record will be removed from this browser.';
 modal(`Delete ${kind}`,`Review ${label} before deleting.`,`<p><strong>${esc(label)}</strong></p><p>${esc(note)}</p>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-danger" data-action="confirm-delete-record" data-kind="${kind}" data-id="${esc(id)}">Delete ${kind}</button>`);
}
function deleteRecord(kind,id){
 const collections={document:'documents',invoice:'invoices',ticket:'tickets',requirement:'requirements',prospect:'leads',draft:'mailDrafts',mail:'messages',task:'tasks'};
 const key=collections[kind],record=key&&byId(key,id);if(!record)return;
 if(kind==='document'){
  for(const requirement of state.requirements)if(requirement.documentId===id)requirement.documentId='';
  for(const canvas of Object.values(state.workflowCanvases||{}))for(const node of canvas.nodes||[])if(node.documentId===id)node.documentId='';
 }
 if(kind==='requirement')for(const canvas of Object.values(state.workflowCanvases||{}))for(const node of canvas.nodes||[])if(node.requirementId===id)delete node.requirementId;
 if(kind==='prospect'){
  state.mailDrafts=state.mailDrafts.filter(draft=>draft.leadId!==id);
  if(state.deals)state.deals=state.deals.filter(deal=>deal.leadId!==id);
 }
 if(kind==='mail')state.deletedSeedIds=[...new Set([...(state.deletedSeedIds||[]),id])];
 state[key]=state[key].filter(item=>item.id!==id);
 if(record.clientId)logActivity(record.clientId,`${kind[0].toUpperCase()+kind.slice(1)} Deleted`,record.name||record.title||record.subject||record.number||'');
 save();$('#modal-root').innerHTML='';
 if(kind==='document'&&view==='documentPreview'){selectedClientId=record.clientId;profileTab='documents';setView('profile');}
 else if(kind==='prospect'&&view==='leadDetail'){selectedLeadId='';setView('prospects');}
 else if(kind==='ticket'&&view==='ticketDetail'){selectedTicketId='';setView('helpdesk');}
  else{if(kind==='draft'||kind==='mail')selectedMail='';render();}
 toast(`${kind[0].toUpperCase()+kind.slice(1)} deleted.`);
}
function openOnboardingChoice(){
 const body=`<div class="onboarding-choice-grid"><button class="onboarding-choice-card" type="button" data-action="onboard-single"><span class="onboarding-choice-art"><img src="assets/onboarding-single-3d.png" alt="" aria-hidden="true"></span><span class="onboarding-choice-copy"><strong>Single client</strong><small>Add one company, then configure branches, products and requirements.</small></span><span class="onboarding-choice-arrow" aria-hidden="true">↗</span></button><button class="onboarding-choice-card" type="button" data-bulk-action="open"><span class="onboarding-choice-art"><img src="assets/onboarding-bulk-3d.png" alt="" aria-hidden="true"></span><span class="onboarding-choice-copy"><strong>Bulk upload</strong><small>Download the Excel template, upload companies and review before import.</small></span><span class="onboarding-choice-arrow" aria-hidden="true">↗</span></button></div>`;
 modal('Onboard clients','Choose how you want to add companies.',body,'<button class="btn" data-action="close-modal">Cancel</button>');
 $('#modal-root .modal')?.classList.add('onboarding-choice-modal');
 $('#modal-root .onboarding-choice-card')?.focus();
}
const field=(label,name,type='text',required=true,placeholder='',value='')=>`<div class="field"><label for="f-${name}">${esc(label)} ${required?'<span>*</span>':''}</label><input id="f-${name}" name="${name}" type="${type}" placeholder="${esc(placeholder)}" value="${esc(value)}" ${required?'required':''}></div>`;
const select=(label,name,items,required=true)=>`<div class="field"><label for="f-${name}">${esc(label)} ${required?'<span>*</span>':''}</label><select id="f-${name}" name="${name}" ${required?'required':''}><option value="">Choose...</option>${items.map(x=>`<option value="${esc(x.value)}">${esc(x.label)}</option>`).join('')}</select></div>`;
const options=(type)=>state[type].map(x=>({value:x.id,label:x.name}));
function startOnboarding(){
 onboarding={name:'',type:'',city:'',registration:'',logo:'',contact:'',email:'',phone:'',contactRole:'',billingContact:'',billingEmail:'',selectedProducts:[],branches:[{name:'',code:'',city:'',modules:{},requirements:{}}],billingModels:[],targetGoLive:'',notes:''};
 onboardingStep=0;setView('onboarding');
}
function renderOnboardingRequirements(){
 const entries=onboarding.branches.flatMap((branch,index)=>Object.keys(branch.modules||{}).map(productId=>({branch,index,productId})));
 return '<div class="wizard-divider">REQUIREMENTS BY BRANCH & PRODUCT</div>' + entries.map(({branch,index,productId})=>`<div class="branch-requirement"><strong>${esc(branch.name||'Branch '+(index+1))} · ${esc(nameOf('products',productId))}</strong><p>Scope, dependencies, approvals and acceptance criteria for this deployment.</p><textarea name="requirement__${index}__${esc(productId)}" placeholder="Add the first requirement or scope note for this branch and product.">${esc(branch.requirements?.[productId]||'')}</textarea></div>`).join('');
}
function renderOnboarding(){
 const steps=['Institution','People','Products','Branches','Commercial'];
 const progress=`<div class="wizard-progress">${steps.map((s,i)=>`<div class="${i===onboardingStep?'current':i<onboardingStep?'complete':''}"><span>${i<onboardingStep?'✓':i+1}</span><small>${s}</small></div>`).join('')}</div>`;
 let body='';
 if(onboardingStep===0)body=`<div class="wizard-intro"><h3>Institution Profile</h3><p>Start with the legal client record. Branches, requirements and products will be linked to this bank.</p></div>`+`<div class="logo-upload"><span class="logo-preview" id="logo-preview">${onboarding.logo?`<img src="${esc(onboarding.logo)}" alt="Selected bank logo">`:icon('branch')}</span><div><strong>Bank Logo</strong><p>Optional · PNG, JPG or WebP · up to 500 KB</p><label class="btn btn-soft" for="bank-logo">Choose Logo</label><input id="bank-logo" type="file" accept="image/png,image/jpeg,image/webp" hidden><small id="logo-error"></small></div></div>`+field('Institution Name','name','text',true,'e.g. Sunrise Co-operative Bank',onboarding.name)+`<div class="form-grid">${select('Institution Type','type',['Co-operative bank','Credit society','NBFC','Payments bank','Other'].map(x=>({value:x,label:x})))}${field('Head Office City','city','text',true,'e.g. Pune',onboarding.city)}</div>`+field('Registration / Institution ID','registration','text',false,'Optional',onboarding.registration);
 if(onboardingStep===1)body=`<div class="wizard-intro"><h3>Key people</h3><p>Record the main relationship contact and a billing contact if different.</p></div>`+`<div class="form-grid">${field('Primary contact','contact','text',true,'Full name',onboarding.contact)}${field('Contact role','contactRole','text',true,'e.g. Operations Head',onboarding.contactRole)}</div>`+field('Work email','email','email',true,'name@bank.com',onboarding.email)+field('Phone','phone','tel',false,'Optional',onboarding.phone)+`<div class="wizard-divider">BILLING CONTACT (OPTIONAL)</div><div class="form-grid">${field('Billing contact','billingContact','text',false,'Full name',onboarding.billingContact)}${field('Billing email','billingEmail','email',false,'billing@bank.com',onboarding.billingEmail)}</div>`;
 if(onboardingStep===2)body=`<div class="wizard-intro"><h3>Select IDSSPL Products</h3><p>Choose the product families for this client. You can assign different modules to every branch next.</p></div><div class="choice-grid">${state.products.map(p=>`<label class="choice-card"><input type="checkbox" name="selectedProducts" value="${esc(p.id)}" ${onboarding.selectedProducts.includes(p.id)?'checked':''}><span><strong>${esc(p.name)}</strong><small>${esc(p.family)} · ${(p.subproducts||[]).length} modules</small></span></label>`).join('')}</div>`;
 if(onboardingStep===3)body=`<div class="wizard-intro"><h3>Branch Network & Modules</h3><p>Set up each location and choose its exact modules. Branches in the same bank can have different configurations.</p></div>`+onboarding.branches.map((b,i)=>`<div class="branch-editor"><div class="branch-editor-head"><strong>Branch ${i+1}</strong>${i>0?`<button type="button" data-action="onboarding-remove-branch" data-index="${i}">Remove</button>`:''}</div><div class="form-grid">${field('Branch Name','branchName'+i,'text',true,'e.g. Pune Head Office',b.name)}${field('Branch Code','branchCode'+i,'text',true,'e.g. SUN-PUN',b.code)}</div>${field('City','branchCity'+i,'text',true,'e.g. Pune',b.city)}<div class="branch-product-label">MODULES FOR THIS BRANCH</div>${onboarding.selectedProducts.map(pid=>{const p=byId('products',pid);const modules=p?.subproducts?.length?p.subproducts:['Full Product'];return `<div class="module-family"><div class="module-family-head"><strong>${esc(p?.name||'Product')}</strong><small>${modules.length} available</small></div><div class="module-grid">${modules.map(m=>`<label class="module-choice"><input type="checkbox" name="branchModule${i}__${esc(pid)}" value="${esc(m)}" ${(b.modules?.[pid]||[]).includes(m)?'checked':''}><span>${esc(m)}</span></label>`).join('')}</div></div>`}).join('')}</div>`).join('')+`<button type="button" class="btn btn-soft add-branch-button" data-action="onboarding-add-branch">${icon('plus')}Add Another Branch</button>`;
 if(onboardingStep===4)body=`<div class="wizard-intro"><h3>Commercial Setup & Requirements</h3><p>Capture billing models, delivery dates and the first business requirements.</p></div><div class="choice-grid">${['One-time setup','Recurring subscription','Support / AMC','Usage / transaction'].map(m=>`<label class="choice-card compact"><input type="checkbox" name="billingModels" value="${esc(m)}" ${onboarding.billingModels.includes(m)?'checked':''}><span><strong>${esc(m)}</strong></span></label>`).join('')}</div><div style="height:16px"></div>${field('Target Go-Live Date','targetGoLive','date',true,'',onboarding.targetGoLive)}${renderOnboardingRequirements()}<div class="field"><label for="f-notes">Implementation Notes</label><textarea name="notes" id="f-notes" placeholder="Dependencies, approvals, integrations, or handover notes">${esc(onboarding.notes)}</textarea></div><div class="review-box"><strong>Ready to Create</strong><p>${esc(onboarding.name)} · ${onboarding.selectedProducts.length} products · ${onboarding.branches.length} branches · ${esc(onboarding.contact)}</p></div>`;
 const footer=`<button class="btn" type="button" data-action="${onboardingStep===0?'onboarding-cancel':'onboarding-back'}">${onboardingStep===0?'Cancel':'Back'}</button><button class="btn btn-primary" type="submit" form="onboarding-form">${onboardingStep===4?'Create Client Profile':'Continue'} ${icon('arrow')}</button>`;
 return `<div class="onboarding-compact-head"><button class="profile-back" data-view="clients">← Back to Clients</button><div class="onboarding-title"><span class="onboarding-title-icon">${icon('users')}</span><h1>Onboard a New Client</h1></div></div><div class="onboarding-full"><div class="card onboarding-progress">${progress}</div><section class="card onboarding-form-card"><div class="onboarding-card-top"><span>0${onboardingStep+1} / 05</span><strong>${esc(steps[onboardingStep])}</strong></div><form id="onboarding-form" data-step="${onboardingStep}">${body}<div class="form-error" id="form-error"></div></form><div class="onboarding-footer">${footer}</div></section></div>`;
}
function captureOnboarding(validate=true){
 const form=$('#onboarding-form');if(!form)return false;
 const fd=new FormData(form);const data=Object.fromEntries(fd.entries());const error=$('#form-error');if(error)error.textContent='';
 if(onboardingStep===0){
  onboarding.name=String(data.name||'').trim();onboarding.type=data.type||'';onboarding.city=String(data.city||'').trim();onboarding.registration=String(data.registration||'').trim();
  if(validate&&state.clients.some(c=>c.name.toLowerCase()===onboarding.name.toLowerCase())){error.textContent='This institution already has a profile. Open it from Clients.';return false;}
 }
 if(onboardingStep===1){for(const key of ['contact','contactRole','email','phone','billingContact','billingEmail'])onboarding[key]=String(data[key]||'').trim();}
 if(onboardingStep===2){
  onboarding.selectedProducts=fd.getAll('selectedProducts');
  if(validate&&!onboarding.selectedProducts.length){error.textContent='Select at least one product to continue.';return false;}
  onboarding.branches.forEach(b=>{b.modules=Object.fromEntries(Object.entries(b.modules||{}).filter(([pid])=>onboarding.selectedProducts.includes(pid)));});
 }
 if(onboardingStep===3){
  onboarding.branches=onboarding.branches.map((b,i)=>({name:String(data['branchName'+i]||'').trim(),code:String(data['branchCode'+i]||'').trim().toUpperCase(),city:String(data['branchCity'+i]||'').trim(),modules:Object.fromEntries(onboarding.selectedProducts.map(pid=>[pid,fd.getAll(`branchModule${i}__${pid}`)]).filter(([,modules])=>modules.length)),requirements:b.requirements||{}}));
  if(validate&&onboarding.branches.some(b=>!Object.keys(b.modules).length)){error.textContent='Select at least one module for every branch.';return false;}
  if(validate&&new Set(onboarding.branches.map(b=>b.code)).size!==onboarding.branches.length){error.textContent='Each branch needs a unique code.';return false;}
 }
 if(onboardingStep===4){
  onboarding.billingModels=fd.getAll('billingModels');onboarding.targetGoLive=data.targetGoLive||'';onboarding.notes=String(data.notes||'').trim();
  onboarding.branches.forEach((b,i)=>{b.requirements=Object.fromEntries(Object.keys(b.modules||{}).map(pid=>[pid,String(data[`requirement__${i}__${pid}`]||'').trim()]));});
  if(validate&&!onboarding.billingModels.length){error.textContent='Select at least one billing model.';return false;}
 }
 return true;
}
function finishOnboarding(){
 const id=uid('c');
 state.clients.unshift({id,name:onboarding.name,type:onboarding.type,city:onboarding.city,registration:onboarding.registration,logo:onboarding.logo,contact:onboarding.contact,contactRole:onboarding.contactRole,email:onboarding.email,phone:onboarding.phone,billingContact:onboarding.billingContact,billingEmail:onboarding.billingEmail,owner:'Account team',status:'Onboarding',onboarding:{stage:'Product implementation',billingModels:onboarding.billingModels,targetGoLive:onboarding.targetGoLive,notes:onboarding.notes,createdAt:localDate(0)}});
 onboarding.branches.forEach(b=>{const branchId=uid('b');state.branches.push({id:branchId,clientId:id,name:b.name,code:b.code,city:b.city,status:'Setup'});Object.entries(b.modules).forEach(([productId,modules])=>{const deployment={id:uid('d'),clientId:id,branchId,productId,modules,status:'Implementation',renewal:''};deployment.commercial=null;state.deployments.push(deployment);const details=String(b.requirements?.[productId]||'').trim();if(details)state.requirements.unshift({id:uid('req'),clientId:id,branchId,productId,title:'Initial Business Requirements',details,stage:'Discovery',owner:'Account team'});});});
 if(onboarding.leadId){const lead=byId('leads',onboarding.leadId);if(lead){lead.stage='Converted';lead.convertedClientId=id;lead.nextFollowUp='';lead.nextAction='';(lead.history||(lead.history=[])).push({at:new Date().toLocaleString('en-IN'),text:'Converted to client'});logActivity(id,'Prospect Converted',`${lead.name} moved from prospect pipeline to client onboarding.`);}}
 logActivity(id,'Client Onboarded',`${onboarding.branches.length} branches and ${onboarding.selectedProducts.length} product families recorded.`);
 save();onboarding=null;selectedClientId=id;profileTab='overview';setView('profile');toast('Client profile created with branch modules.');
}
function submitOnboarding(e){
 e.preventDefault();
 if(!captureOnboarding(true))return;
 if(onboardingStep===4){finishOnboarding();return;}
 onboardingStep++;render();
}
function openForm(type){
 const commonFooter='<button class="btn" type="button" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="entity-form">Save record</button>';
 let body='';
 if(type==='edit-client'){const c=byId('clients',selectedClientId);body=field('Institution Name','name','text',true,'',c.name)+`<div class="form-grid">${select('Institution Type','type',['Co-operative bank','Credit society','NBFC','Payments bank','Other'].map(x=>({value:x,label:x})))}${select('Status','status',['Active','Onboarding','Inactive'].map(x=>({value:x,label:x})))}</div><div class="form-grid">${field('Head Office City','city','text',true,'',c.city)}${field('Registration / Institution ID','registration','text',false,'',c.registration||'')}</div><div class="form-grid">${field('Primary Contact','contact','text',true,'',c.contact||'')}${field('Contact Role','contactRole','text',false,'',c.contactRole||'')}</div><div class="form-grid">${field('Work Email','email','email',true,'',c.email||'')}${field('Phone','phone','tel',false,'',c.phone||'')}</div><div class="form-grid">${field('Billing Contact','billingContact','text',false,'',c.billingContact||'')}${field('Billing Email','billingEmail','email',false,'',c.billingEmail||'')}</div>${field('Account Owner','owner','text',true,'',c.owner||'Account team')}<div class="field"><label for="f-logo">Replace Bank Logo</label><input id="f-logo" type="file" name="logo" accept="image/png,image/jpeg,image/webp"><small>Optional · PNG, JPG or WebP · up to 500 KB</small></div>`;}
 if(type==='lead')body=field('Institution Name','name','text',true,'e.g. Crescent Cooperative Bank')+`<div class="form-grid">${select('Institution Type','type',['Co-operative bank','Credit society','NBFC','Payments bank','Other'].map(x=>({value:x,label:x})))}${field('City','city','text',true,'e.g. Pune')}</div><div class="form-grid">${field('Contact Name','contact','text',true,'Full name')}${field('Email','email','email',true,'name@bank.com')}</div><div class="form-grid">${select('Source','source',['Referral','Website','Event','Inbound Email','Outbound','Other'].map(x=>({value:x,label:x})))}${field('Owner','owner','text',true,'Sales team','Sales team')}</div>${field('Next Follow-Up','nextFollowUp','date',true,'',localDate(3))+field('Next Action','nextAction','text',true,'e.g. Schedule discovery call')}<div class="branch-product-label">INTERESTED PRODUCTS</div><div class="module-grid">${state.products.map(p=>`<label class="module-choice"><input type="checkbox" name="products" value="${esc(p.id)}"><span>${esc(p.name)}</span></label>`).join('')}</div><div class="field"><label for="f-notes">Notes</label><textarea name="notes" id="f-notes" placeholder="What does the institution need?"></textarea></div>`;
 if(type==='client')body=field('Institution name','name','text',true,'e.g. Sunrise Co-operative Bank')+`<div class="form-grid">${select('Institution type','type',['Co-operative bank','Credit society','NBFC','Payments bank','Other'].map(x=>({value:x,label:x})))}${select('Status','status',['Active','Onboarding','Inactive'].map(x=>({value:x,label:x})))}</div>`+field('Primary contact','contact','text',false,'Full name')+field('Work email','email','email',false,'name@institution.com')+`<div class="form-grid">${field('City','city','text',false)}${field('Phone','phone','tel',false)}</div>`;
 if(type==='branch')body=select('Client','clientId',options('clients'))+field('Branch name','name','text',true,'e.g. Pune Head Office')+`<div class="form-grid">${field('Branch code','code','text',true,'e.g. SUN-PUN')}${field('City','city','text',true)}</div>`+select('Status','status',['Setup','Live'].map(x=>({value:x,label:x})));
 if(type==='product')body=field('Product name','name','text',true)+field('Family','family','text',true)+`<div class="field"><label for="f-description">Description</label><textarea name="description" id="f-description" required></textarea></div><div class="field"><label for="f-product-modules">Modules · one per line</label><textarea name="modules" id="f-product-modules" required placeholder="Core platform&#10;Reporting&#10;Access controls"></textarea></div>`;
 if(type==='deployment')body='<div class="form-note">Choose the client, branch and modules. Record agreed prices in Branch commercial after assignment; any catalog reference price will be available there.</div>'+select('Client','clientId',options('clients'))+select('Branch','branchId',options('branches'))+select('Product','productId',options('products'))+'<div id="deployment-modules"></div>'+select('Status','status',['Implementation','Live','Paused'].map(x=>({value:x,label:x})))+field('Renewal date','renewal','date',false,'',localDate(365));
 if(type==='requirement')body=select('Client','clientId',options('clients'))+`<div class="form-grid">${select('Branch','branchId',[])}${select('Product','productId',[])}</div>`+field('Workflow Step','title','text',true,'e.g. Approve branch user roles')+`<div class="field"><label for="f-details">Requirement & Acceptance Notes <span>*</span></label><textarea name="details" id="f-details" required placeholder="Document scope, decisions, dependencies and acceptance criteria."></textarea></div>`+`<div class="form-grid">${field('Owner','owner','text',true,'Account team','Account team')}${select('Stage','stage',['Discovery','In Review','Approved','In Delivery','Complete'].map(x=>({value:x,label:x})))}</div>`+select('Supporting Document','documentId',[],false);
 if(type==='document')body=select('Client','clientId',options('clients'))+select('Document Category','category',['NDA','Business Requirements','Proposal','Purchase Order','Statement of Work','Master Agreement','UAT Signoff','Go-Live Signoff','Other'].map(x=>({value:x,label:x})))+field('Document Name','name','text',true,'e.g. Signed NDA')+`<div class="form-grid">${field('Version','version','text',true,'1.0','1.0')}${select('Review Status','status',['Requested','Received','In Review','Approved','Rejected'].map(x=>({value:x,label:x})))}</div><div class="field"><label for="f-document-file">File <span>*</span></label><input id="f-document-file" name="file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp,text/plain,.docx" required><small>PDF, image, text or DOCX · max 750 KB. PDF, images and text can be previewed here.</small></div>`;
 if(type==='invoice')body='<div class="form-note">This creates an internal draft only. No invoice is issued and no email is sent.</div>'+select('Client','clientId',options('clients'))+select('Branch','branchId',options('branches'))+select('Product','productId',options('products'))+`<div class="form-grid">${field('Amount before tax','amount','number',true,'0')}${field('Tax amount','tax','number',true,'0','0')}</div>`+`<div class="form-grid">${select('Currency','currency',['INR','USD','EUR','GBP'].map(x=>({value:x,label:x})))}${field('Due date','due','date',true,'',localDate(30))}</div>`;
 if(type==='ticket')body=select('Client','clientId',options('clients'))+select('Branch','branchId',options('branches'),false)+select('Product','productId',[],false)+'<div id="ticket-module-wrap"></div>'+field('Issue Summary','subject','text',true,'What needs help?')+`<div class="form-grid">${select('Category','category',['Access','Incident','Service Request','Change Request','Billing','Other'].map(x=>({value:x,label:x})))}${select('Priority','priority',['Low','Medium','High'].map(x=>({value:x,label:x})))}</div>`+`<div class="form-grid">${select('Impact','impact',['Single User','Branch','Multiple Branches','Institution-Wide'].map(x=>({value:x,label:x})))}${select('Source','source',['Email','Phone','Portal','Internal'].map(x=>({value:x,label:x})))}</div>`+field('Owner','owner','text',true,'Support team','Support team')+field('Due Date','due','date',false,'',localDate(2))+`<div class="field"><label for="f-description">Issue Description <span>*</span></label><textarea name="description" id="f-description" required placeholder="What happened, who is affected, expected behavior and any troubleshooting already done?"></textarea></div>`;
 if(type==='reminder')body=field('Reminder','title','text',true,'What needs follow-up?')+select('Client','clientId',options('clients'),false)+field('Due date','due','date',true,'',localDate(0));
 modal(type==='lead'?'Add Prospect':'Add '+type,type==='lead'?'Create a prospect and set its next follow-up.':'Create a sample '+type+' in this browser.',`<form id="entity-form" data-type="${type}">${body}<div class="form-error" id="form-error"></div></form>`,commonFooter);
 if(type==='edit-client'){const c=byId('clients',selectedClientId);$('#entity-form').elements.type.value=c.type;$('#entity-form').elements.status.value=c.status;$('.modal-header h2').textContent='Edit Client Profile';$('.modal-header p').textContent='Update institution details and contacts.';}
 if(view==='profile'&&selectedClientId&&$('#entity-form')?.elements.clientId){$('#entity-form').elements.clientId.value=selectedClientId;updateBranchSelect();}
 if(view==='productDetail'&&type==='deployment')$('#entity-form').elements.productId.value=selectedProductId;
 if(['invoice','ticket','deployment','requirement'].includes(type))updateBranchSelect();
 if(type==='deployment')updateModuleSelect();
 if(type==='ticket')updateTicketProductSelect();
 if(type==='requirement'){updateRequirementOptions();$('#entity-form').elements.stage.value='Discovery';}
}
function openReminderEditor(id){
 const r=byId('reminders',id);if(!r)return;
 modal('Edit Reminder','Update this workspace reminder.',`<form id="entity-form" data-type="edit-reminder" data-id="${esc(id)}">${field('Reminder','title','text',true,'',r.title)}${select('Client','clientId',options('clients'),false)}${field('Due Date','due','date',true,'',r.due)}<div class="form-error" id="form-error"></div></form>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="entity-form">Save Reminder</button>`);
 $('#entity-form').elements.clientId.value=r.clientId||'';
}
function openLeadEditor(id){
 const l=byId('leads',id);if(!l||l.stage==='Converted')return;
 const types=['Co-operative bank','Credit society','NBFC','Payments bank','Other'];
 const sources=['Referral','Website','Event','Inbound Email','Outbound','Other'];
 const products=state.products.map(p=>`<label class="module-choice"><input type="checkbox" name="products" value="${esc(p.id)}" ${(l.interestedProducts||[]).includes(p.id)?'checked':''}><span>${esc(p.name)}</span></label>`).join('');
 const body=`<form id="entity-form" data-type="edit-lead" data-id="${esc(id)}">${field('Institution Name','name','text',true,'',l.name)}<div class="form-grid">${select('Institution Type','type',types.map(x=>({value:x,label:x})))}${field('City','city','text',true,'',l.city)}</div><div class="form-grid">${field('Contact Name','contact','text',true,'',l.contact)}${field('Email','email','email',true,'',l.email)}</div><div class="form-grid">${select('Source','source',sources.map(x=>({value:x,label:x})))}${field('Owner','owner','text',true,'',l.owner)}</div><div class="branch-product-label">INTERESTED PRODUCTS</div><div class="module-grid">${products}</div><div class="form-error" id="form-error"></div></form>`;
 modal('Edit Prospect','Update the institution, contact and product interest.',body,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="entity-form">Save Prospect</button>`);
 $('#entity-form').elements.type.value=l.type;$('#entity-form').elements.source.value=l.source;
}
function updateRequirementOptions(){
 const form=$('#entity-form');if(!form||!['requirement','edit-requirement'].includes(form.dataset.type))return;
 const clientId=form.elements.clientId.value,branchId=form.elements.branchId.value;
 const product=form.elements.productId,selectedProduct=product.value;
 const ids=[...new Set(state.deployments.filter(d=>d.clientId===clientId&&d.branchId===branchId).map(d=>d.productId))];
 product.innerHTML='<option value="">Choose...</option>'+ids.map(pid=>`<option value="${esc(pid)}">${esc(nameOf('products',pid))}</option>`).join('');
 if(ids.includes(selectedProduct))product.value=selectedProduct;
 const documentSelect=form.elements.documentId,selectedDocument=documentSelect.value;
 const docs=state.documents.filter(d=>d.clientId===clientId);
 documentSelect.innerHTML='<option value="">None yet</option>'+docs.map(d=>`<option value="${esc(d.id)}">${esc(d.name)} · v${esc(d.version||'1.0')}</option>`).join('');
 if(docs.some(d=>d.id===selectedDocument))documentSelect.value=selectedDocument;
}
function openRequirementEditor(id){
 const r=byId('requirements',id);if(!r)return;
 const body=`<form id="entity-form" data-type="edit-requirement" data-id="${esc(id)}"><input type="hidden" name="clientId" value="${esc(r.clientId)}"><div class="form-note">${esc(nameOf('clients',r.clientId))}</div><div class="form-grid">${select('Branch','branchId',[])}${select('Product','productId',[])}</div>${field('Workflow Step','title','text',true,'',r.title)}<div class="field"><label for="f-details">Requirement & Acceptance Notes <span>*</span></label><textarea name="details" id="f-details" required>${esc(r.details||'')}</textarea></div><div class="form-grid">${field('Owner','owner','text',true,'',r.owner||'Account team')}${select('Stage','stage',['Discovery','In Review','Approved','In Delivery','Complete'].map(x=>({value:x,label:x})))}</div>${select('Supporting Document','documentId',[],false)}<div class="form-error" id="form-error"></div></form>`;
 modal('Edit Workflow Step','Update the documented branch and product workflow.',body,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="entity-form">Save Step</button>`);
 updateBranchSelect();$('#entity-form').elements.branchId.value=r.branchId||'';updateRequirementOptions();$('#entity-form').elements.productId.value=r.productId||'';$('#entity-form').elements.documentId.value=r.documentId||'';$('#entity-form').elements.stage.value=r.stage;
}
function updateTicketProductSelect(){
 const form=$('#entity-form');if(!form||form.dataset.type!=='ticket')return;
 const branchId=form.elements.branchId.value,selectEl=form.elements.productId,previous=selectEl.value;
 const productIds=[...new Set(state.deployments.filter(d=>d.branchId===branchId).map(d=>d.productId))];
 selectEl.innerHTML='<option value="">General support / no product</option>'+productIds.map(pid=>`<option value="${esc(pid)}">${esc(nameOf('products',pid))}</option>`).join('');
 if(productIds.includes(previous))selectEl.value=previous;updateTicketModuleSelect();
}
function updateTicketModuleSelect(){
 const form=$('#entity-form');if(!form||form.dataset.type!=='ticket')return;
 const d=state.deployments.find(x=>x.branchId===form.elements.branchId.value&&x.productId===form.elements.productId.value);
 $('#ticket-module-wrap').innerHTML=select('Module','module',(d?.modules||[]).map(x=>({value:x,label:x})),false);
}
function updateModuleSelect(){
 const form=$('#entity-form');if(!form||form.dataset.type!=='deployment')return;
 const product=byId('products',form.elements.productId.value);const modules=product?.subproducts?.length?product.subproducts:['Full Product'];
 $('#deployment-modules').innerHTML=`<div class="branch-product-label">MODULES FOR THIS BRANCH</div><div class="module-grid">${modules.map(m=>`<label class="module-choice"><input type="checkbox" name="modules" value="${esc(m)}"><span>${esc(m)}</span></label>`).join('')}</div>`;
}
function editModules(id){
 const d=byId('deployments',id);if(!d)return;const p=byId('products',d.productId);const modules=p?.subproducts?.length?p.subproducts:['Full Product'];
 modal('Edit Branch Modules',`${nameOf('clients',d.clientId)} · ${nameOf('branches',d.branchId)}`,`<form id="entity-form" data-type="modules" data-id="${esc(id)}"><div class="form-note">Choose the modules active for this product at this branch.</div><div class="module-grid">${modules.map(m=>`<label class="module-choice"><input type="checkbox" name="modules" value="${esc(m)}" ${(d.modules||[]).includes(m)?'checked':''}><span>${esc(m)}</span></label>`).join('')}</div><div class="form-error" id="form-error"></div></form>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="entity-form">Save Modules</button>`);
}
function openCommercialEditor(id){
 const d=byId('deployments',id);if(!d)return;const c=d.commercial||byId('products',d.productId)?.defaultCommercial||{model:'Custom agreement',setupFee:'',recurringFee:'',billingCycle:'Annual',paymentTerms:'Net 30',usageRate:0,usageUnit:''};
 const models=[...new Set([...Object.values(commercialPlans).map(plan=>plan.model),c.model,'Custom agreement'])].map(value=>({value,label:value}));
 const body=`<form id="entity-form" data-type="edit-commercial" data-id="${esc(d.id)}"><div class="form-note">Terms belong to this product at this client branch. Saving them does not create an invoice.</div>${select('Commercial model','model',models)}<div class="form-grid">${field('One-time setup · INR','setupFee','number',true,'0',c.setupFee)}${field('Recurring fee · INR','recurringFee','number',true,'0',c.recurringFee)}</div><div class="form-grid">${select('Billing cycle','billingCycle',['Monthly','Annual'].map(value=>({value,label:value})))}${select('Payment terms','paymentTerms',['Net 15','Net 30','Net 45','Due on receipt'].map(value=>({value,label:value})))}</div><div class="form-grid">${field('Usage rate · INR','usageRate','number',false,'Optional',c.usageRate||'')}${field('Usage unit','usageUnit','text',false,'e.g. transaction',c.usageUnit||'')}</div><div class="form-error" id="form-error"></div></form>`;
 modal('Branch commercial',`${nameOf('clients',d.clientId)} · ${nameOf('branches',d.branchId)} · ${nameOf('products',d.productId)}`,body,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="entity-form">Save terms</button>`);
 const form=$('#entity-form');form.elements.model.value=c.model;form.elements.billingCycle.value=c.billingCycle;form.elements.paymentTerms.value=c.paymentTerms;
}
function openModuleBreakdown(id){
 const d=byId('deployments',id);if(!d)return;
 const product=byId('products',d.productId),selected=new Set(d.modules||[]);
 const rows=(product?.subproducts||[]).map(module=>{
  const terms=d.moduleCommercials?.[module],active=selected.has(module);
  return `<div class="module-breakdown-row"><div><strong>${esc(module)}</strong><small>${active?'Active at this branch':'Not selected at this branch'}</small></div><div>${active?terms?`<strong>${commercialAmount(terms)}</strong><small>Setup ${money(terms.setupFee)} · ${esc(terms.notes||'Separate module charge')}</small>`:'<small>Included in branch product terms</small>':'<small>—</small>'}</div>${active?`<button data-action="edit-module-commercial" data-id="${esc(id)}" data-module="${esc(module)}">${terms?'Edit terms':'Add terms'}</button>`:'<span></span>'}</div>`;
 }).join('');
 const linked=state.invoices.some(item=>item.branchId===d.branchId&&item.productId===d.productId)||state.tickets.some(item=>Helpdesk.affects(item,d.branchId)&&item.productId===d.productId)||state.requirements.some(item=>!item.archived&&item.branchId===d.branchId&&item.productId===d.productId);
 modal('Branch module breakdown',`${nameOf('clients',d.clientId)} · ${nameOf('branches',d.branchId)} · ${nameOf('products',d.productId)}`,`<div class="module-breakdown"><div class="module-breakdown-base"><strong>Branch product terms</strong><span>${d.commercial?commercialAmount(d.commercial):'No commercial terms recorded'}</span><button data-action="edit-commercial" data-id="${esc(id)}">Edit base terms</button></div>${rows||'<p>No modules in this product yet.</p>'}<p>Separate module charges are added to the branch product terms. Billing records remain independent.</p></div>`,`<button class="btn" data-action="close-modal">Close</button><button class="btn btn-soft" data-action="edit-modules" data-id="${esc(id)}">Edit selected modules</button><button class="btn btn-danger" data-action="remove-deployment" data-id="${esc(id)}" ${linked?'disabled title="Linked billing, support or workflow records must be handled first"':''}>Remove assignment</button>`);
}
function openModuleTermsEditor(id,module){
 const d=byId('deployments',id);if(!d||(d.modules||[]).includes(module)===false)return;
 const existing=d.moduleCommercials?.[module]||{};
 const body=`<form id="entity-form" data-type="module-commercial" data-id="${esc(id)}" data-module="${esc(module)}"><div class="form-note">This charge is additional to the branch product terms. It does not create an invoice.</div><div class="form-grid">${field('One-time setup · INR','setupFee','number',true,'0',existing.setupFee??0)}${field('Recurring fee · INR','recurringFee','number',true,'0',existing.recurringFee??0)}</div>${select('Billing cycle','billingCycle',['Monthly','Annual'].map(value=>({value,label:value})))}${field('Term notes','notes','text',false,'e.g. per branch',existing.notes||'')}<div class="form-error" id="form-error"></div></form>`;
 modal('Module commercial',`${nameOf('products',d.productId)} · ${module} · ${nameOf('branches',d.branchId)}`,body,`<button class="btn" data-action="module-breakdown" data-id="${esc(id)}">Back</button>${existing.recurringFee!==undefined?`<button class="btn btn-danger" data-action="delete-module-commercial" data-id="${esc(id)}" data-module="${esc(module)}">Remove charge</button>`:''}<button class="btn btn-primary" type="submit" form="entity-form">Save module terms</button>`);
 $('#entity-form').elements.billingCycle.value=existing.billingCycle||'Annual';
}
function updateBranchSelect(){
 const form=$('#entity-form');if(!form)return;const clientId=form.elements.clientId?.value;const branch=form.elements.branchId;if(!branch)return;const previous=branch.value;branch.innerHTML='<option value="">Choose...</option>'+state.branches.filter(b=>!clientId||b.clientId===clientId).map(b=>`<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('');if([...branch.options].some(x=>x.value===previous))branch.value=previous;
}
function formSubmit(e){
 e.preventDefault();const form=e.target;const type=form.dataset.type;const data=Object.fromEntries(new FormData(form).entries());const error=$('#form-error'); if(error)error.textContent='';
 if(type==='module-commercial'){
  const d=byId('deployments',form.dataset.id),module=form.dataset.module;
  if(!d||!(d.modules||[]).includes(module)){error.textContent='This module is no longer assigned to the branch.';return;}
  const setupFee=Number(data.setupFee),recurringFee=Number(data.recurringFee);
  if(!Number.isFinite(setupFee)||!Number.isFinite(recurringFee)||setupFee<0||recurringFee<0){error.textContent='Enter amounts of zero or more.';return;}
  d.moduleCommercials||={};d.moduleCommercials[module]={setupFee,recurringFee,billingCycle:data.billingCycle,notes:String(data.notes||'').trim()};
  logActivity(d.clientId,'Module Commercial Updated',`${nameOf('branches',d.branchId)} · ${nameOf('products',d.productId)} · ${module}`);
  save();openModuleBreakdown(d.id);render();toast('Module terms saved.');return;
 }
 if(type==='edit-commercial'){
  const d=byId('deployments',form.dataset.id);if(!d)return;
  const setupFee=Number(data.setupFee),recurringFee=Number(data.recurringFee),usageRate=data.usageRate===''?0:Number(data.usageRate),usageUnit=String(data.usageUnit||'').trim();
  if(!data.model||!data.billingCycle||!data.paymentTerms||![setupFee,recurringFee,usageRate].every(Number.isFinite)||setupFee<0||recurringFee<0||usageRate<0){error.textContent='Enter a model, billing terms and amounts of zero or more.';return;}
  if(usageRate>0&&!usageUnit){error.textContent='Add a unit for the usage rate, such as transaction or active merchant.';return;}
  d.commercial={model:data.model,setupFee,recurringFee,billingCycle:data.billingCycle,usageRate,usageUnit:usageRate?usageUnit:'',paymentTerms:data.paymentTerms,sample:false};
  logActivity(d.clientId,'Commercial Terms Updated',`${nameOf('branches',d.branchId)} · ${nameOf('products',d.productId)}`);
  save();$('#modal-root').innerHTML='';render();toast('Branch commercial updated.');return;
 }
 if(type==='map-pin'){
  const [kind,id]=String(form.dataset.id||'').split(':'),record=byId(kind==='client'?'clients':'branches',id);
  if(!record)return;
  const lat=String(data.mapLat||'').trim(),lon=String(data.mapLon||'').trim();
  if(Boolean(lat)!==Boolean(lon)){error.textContent='Enter both latitude and longitude, or leave both blank to return to city-level placement.';return;}
  if(lat&&(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lon))||Number(lat)<-85||Number(lat)>85||Number(lon)<-180||Number(lon)>180)){error.textContent='Enter a valid latitude from −85 to 85 and longitude from −180 to 180.';return;}
  try{commitMapPin(kind,id,lat?{lat:Number(lat),lng:Number(lon)}:null,mapPinEditSnapshot);}catch(problem){error.textContent=problem.message;return;}
  $('#modal-root').innerHTML='';if(window.refreshClientStreetMap)window.refreshClientStreetMap();else render();toast(lat?'Exact map pin saved.':'Office pin removed.');return;
 }
 if(type==='edit-reminder'){const r=byId('reminders',form.dataset.id);if(!r)return;r.title=String(data.title||'').trim();r.clientId=data.clientId||'';r.due=data.due;save();$('#modal-root').innerHTML='';render();toast('Reminder updated.');return;}
 if(type==='edit-client'){saveEditedClient(form);return;}
 if(type==='edit-branch'){
  const branch=byId('branches',form.dataset.id);if(!branch)return;
  const name=String(data.name||'').trim(),code=String(data.code||'').trim().toUpperCase(),city=String(data.city||'').trim();
  if(!name||!code||!city){error.textContent='Add a branch name, code and city.';return;}
  if(state.branches.some(item=>item.id!==branch.id&&item.clientId===branch.clientId&&item.code.toUpperCase()===code)){error.textContent='This branch code is already used by the client.';return;}
  const lat=String(data.mapLat||'').trim(),lon=String(data.mapLon||'').trim();
  if(Boolean(lat)!==Boolean(lon)||lat&&(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lon))||Number(lat)<-85||Number(lat)>85||Number(lon)<-180||Number(lon)>180)){error.textContent='Enter a valid latitude and longitude together, or leave both blank.';return;}
  Object.assign(branch,{name,code,city,status:data.status,mapLat:lat?Number(lat):'',mapLon:lon?Number(lon):''});
  syncHeadOfficePin('branch',branch);
  logActivity(branch.clientId,'Branch Updated',`${name} · ${city}`);save();$('#modal-root').innerHTML='';render();toast('Branch updated.');return;
 }
 if(type==='edit-ticket-details'){
  const ticket=byId('tickets',form.dataset.id);if(!ticket)return;
  const subject=String(data.subject||'').trim(),description=String(data.description||'').trim();
  if(!subject||!description){error.textContent='Add an issue summary and description.';return;}
  Object.assign(ticket,{subject,description,category:data.category,impact:data.impact,source:data.source});
  (ticket.history||(ticket.history=[])).push({at:new Date().toLocaleString('en-IN'),by:ticket.owner||'Support team',text:'Case details updated',status:ticket.status});
  logActivity(ticket.clientId,'Support Case Updated',ticket.number+' · '+subject);
  save();$('#modal-root').innerHTML='';render();toast('Case details updated.');return;
 }
 if(type==='edit-product'){
  const p=byId('products',form.dataset.id);if(!p)return;
  const name=String(data.name||'').trim(),family=String(data.family||'').trim(),description=String(data.description||'').trim();
  const modules=[...new Set(String(data.modules||'').split(/\r?\n/).map(item=>item.trim()).filter(Boolean))];
  if(!name||!family||!description||!modules.length){error.textContent='Enter a name, family, description and at least one module.';return;}
  if(state.products.some(other=>other.id!==p.id&&other.name.toLowerCase()===name.toLowerCase())){error.textContent='Another product has this name.';return;}
  const inUse=[...new Set(state.deployments.filter(d=>d.productId===p.id).flatMap(d=>d.modules||[]))].filter(item=>!modules.includes(item));
  if(inUse.length){error.textContent=`Keep deployed modules: ${inUse.join(', ')}.`;return;}
  Object.assign(p,{name,family,description,subproducts:modules});save();$('#modal-root').innerHTML='';render();toast('Product updated.');return;
 }
 if(type==='edit-document'){saveEditedDocument(form);return;}
 if(type==='document'){saveDocument(form);return;}
 if(type==='edit-lead'){
  const lead=byId('leads',form.dataset.id);if(!lead||lead.stage==='Converted')return;
  const name=String(data.name||'').trim(),email=String(data.email||'').trim().toLowerCase();
  if([...state.leads.filter(x=>x.id!==lead.id),...state.clients].some(x=>x.name.toLowerCase()===name.toLowerCase()||x.email?.toLowerCase()===email)){error.textContent='This institution name or email already belongs to another prospect or client.';return;}
  Object.assign(lead,{name,type:data.type,city:String(data.city||'').trim(),contact:String(data.contact||'').trim(),email,source:data.source,owner:String(data.owner||'').trim(),interestedProducts:new FormData(form).getAll('products')});
  (lead.history||(lead.history=[])).push({at:new Date().toLocaleString('en-IN'),text:'Prospect profile updated'});
  save();$('#modal-root').innerHTML='';render();toast('Prospect updated.');return;
 }
 if(['requirement','edit-requirement'].includes(type)){
  const deployment=state.deployments.find(d=>d.clientId===data.clientId&&d.branchId===data.branchId&&d.productId===data.productId);
  if(!deployment){error.textContent='Choose a product assigned to this branch.';return;}
  if(data.documentId&&state.documents.find(d=>d.id===data.documentId)?.clientId!==data.clientId){error.textContent='The supporting document must belong to this client.';return;}
  const title=String(data.title||'').trim(),details=String(data.details||'').trim(),owner=String(data.owner||'').trim();
  if(!title||!details||!owner){error.textContent='Add a title, acceptance notes and owner.';return;}
  const existing=type==='edit-requirement'?byId('requirements',form.dataset.id):null;
  if(state.requirements.some(r=>r.id!==existing?.id&&r.clientId===data.clientId&&r.branchId===data.branchId&&r.productId===data.productId&&r.title.toLowerCase()===title.toLowerCase())){error.textContent='This workflow step already exists for the branch and product.';return;}
  const values={clientId:data.clientId,branchId:data.branchId,productId:data.productId,documentId:data.documentId||'',title,details,owner,stage:data.stage};
  if(existing)Object.assign(existing,values);else state.requirements.unshift({id:uid('req'),...values});
  logActivity(data.clientId,existing?'Workflow Step Edited':'Workflow Step Added',`${nameOf('branches',data.branchId)} · ${nameOf('products',data.productId)} · ${title}`);
  save();$('#modal-root').innerHTML='';render();toast(existing?'Workflow step updated.':'Workflow step added.');return;
 }
 if(type==='lead'){
  const name=String(data.name||'').trim(),email=String(data.email||'').trim().toLowerCase();
  if([...state.leads,...state.clients].some(x=>x.name.toLowerCase()===name.toLowerCase()||x.email?.toLowerCase()===email)){error.textContent='This institution or contact email is already in Prospects or Clients.';return;}
  if(!data.nextFollowUp||data.nextFollowUp<localDate(0)||!String(data.nextAction||'').trim()){error.textContent='Set a next action and a follow-up date from today onward.';return;}
  const lead={id:uid('lead'),name,type:data.type,contact:String(data.contact||'').trim(),email,city:String(data.city||'').trim(),stage:'New',owner:String(data.owner||'').trim(),source:data.source,nextFollowUp:data.nextFollowUp||'',nextAction:String(data.nextAction||'').trim(),interestedProducts:new FormData(form).getAll('products'),notes:String(data.notes||'').trim(),history:[{at:new Date().toLocaleString('en-IN'),text:'Prospect created'}]};
  state.leads.unshift(lead);save();$('#modal-root').innerHTML='';selectedLeadId=lead.id;setView('leadDetail');toast('Prospect added.');return;
 }
 if(['invoice','deployment'].includes(type)||type==='ticket'&&data.branchId){const branch=byId('branches',data.branchId);if(!branch||branch.clientId!==data.clientId){error.textContent='Choose a branch that belongs to the selected client.';return;}}
 if(type==='deployment'&&state.deployments.some(d=>d.clientId===data.clientId&&d.branchId===data.branchId&&d.productId===data.productId)){error.textContent='This product is already assigned to that branch. Open its existing terms instead.';return;}
 if(type==='ticket'&&data.productId&&!state.deployments.some(d=>d.branchId===data.branchId&&d.productId===data.productId&&(!data.module||(d.modules||[]).includes(data.module)))){error.textContent='Choose a product and module deployed at this branch.';return;}
 if(type==='client'&&state.clients.some(c=>c.name.toLowerCase()===data.name.trim().toLowerCase())){error.textContent='This institution already exists. Open its record instead.';return;}
 if(type==='branch'&&state.branches.some(b=>b.clientId===data.clientId&&b.code.toLowerCase()===data.code.trim().toLowerCase())){error.textContent='This branch code already exists for the client.';return;}
 if(type==='product'&&state.products.some(product=>product.name.toLowerCase()===String(data.name||'').trim().toLowerCase())){error.textContent='A product with this name already exists.';return;}
 if(type==='product'&&!String(data.modules||'').split(/\r?\n/).some(module=>module.trim())){error.textContent='Add at least one module.';return;}
 if(type==='invoice'&&(!Number.isFinite(Number(data.amount))||Number(data.amount)<=0||Number(data.tax)<0)){error.textContent='Enter a positive amount and a tax amount of zero or more.';return;}
 if(type==='client')state.clients.push({id:uid('c'),name:data.name.trim(),type:data.type,status:data.status,contact:data.contact.trim(),email:data.email.trim(),phone:data.phone.trim(),city:data.city.trim(),owner:'Account team'});
 if(type==='branch')state.branches.push({id:uid('b'),clientId:data.clientId,name:data.name.trim(),code:data.code.trim().toUpperCase(),city:data.city.trim(),status:data.status});
 if(type==='product')state.products.push({id:uid('p'),name:data.name.trim(),family:data.family.trim(),description:data.description.trim(),subproducts:[...new Set(data.modules.split(/\r?\n/).map(module=>module.trim()).filter(Boolean))]});
 if(type==='deployment'){const modules=new FormData(form).getAll('modules');if(!modules.length){error.textContent='Select at least one module for this branch.';return;}const deployment={id:uid('d'),clientId:data.clientId,branchId:data.branchId,productId:data.productId,modules,status:data.status,renewal:data.renewal};deployment.commercial=null;state.deployments.push(deployment);}
 if(type==='modules'){
  const modules=new FormData(form).getAll('modules'),d=byId('deployments',form.dataset.id);
  if(!modules.length){error.textContent='Select at least one module.';return;}
  const linked=state.tickets.filter(ticket=>Helpdesk.affects(ticket,d.branchId)&&ticket.productId===d.productId&&ticket.module&&!modules.includes(ticket.module)&&Helpdesk.active(ticket));
  if(linked.length){error.textContent=`Keep ${[...new Set(linked.map(ticket=>ticket.module))].join(', ')} until linked active support cases are resolved.`;return;}
  d.modules=modules;d.moduleCommercials=Object.fromEntries(Object.entries(d.moduleCommercials||{}).filter(([module])=>modules.includes(module)));
  logActivity(d.clientId,'Branch Modules Updated',`${nameOf('branches',d.branchId)} · ${nameOf('products',d.productId)}`);
 }
 if(type==='invoice')state.invoices.unshift({id:uid('inv'),number:'DRAFT-'+(state.invoices.length+1).toString().padStart(4,'0'),clientId:data.clientId,branchId:data.branchId,productId:data.productId,amount:Number(data.amount),tax:Number(data.tax),currency:data.currency,due:data.due,status:'Draft'});
 if(type==='ticket')state.tickets.unshift({id:uid('t'),number:'HD-'+String(2482+state.tickets.length),clientId:data.clientId,branchId:data.branchId||'',productId:data.productId||'',module:data.module||'',subject:data.subject.trim(),category:data.category,priority:data.priority,impact:data.impact,source:data.source,description:data.description.trim(),status:'Open',owner:data.owner.trim(),due:data.due||'',created:localDate(0),history:[{at:new Date().toLocaleString('en-IN'),by:data.owner.trim(),text:'Case created',status:'Open'}]});
 if(type==='reminder')state.reminders.unshift({id:uid('r'),title:data.title.trim(),clientId:data.clientId,due:data.due,done:false});
 save();$('#modal-root').innerHTML='';render();toast('Sample '+type+' saved in this browser.');
}
function readFileAsDataUrl(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Could not read the file.'));reader.readAsDataURL(file);});}
function openDocumentEditor(id){
 const d=byId('documents',id);if(!d)return;
 const categories=['NDA','Business Requirements','Proposal','Purchase Order','Statement of Work','Master Agreement','UAT Signoff','Go-Live Signoff','Other'];
 const statuses=['Requested','Received','In Review','Approved','Rejected'];
 const body=`<form id="entity-form" data-type="edit-document" data-id="${esc(id)}"><div class="form-note">${esc(nameOf('clients',d.clientId))} · ${esc(d.fileName||'Sample record')}</div>${select('Document Category','category',categories.map(x=>({value:x,label:x})))}${field('Document Name','name','text',true,'',d.name)}<div class="form-grid">${field('Version','version','text',true,'',d.version||'1.0')}${select('Review Status','status',statuses.map(x=>({value:x,label:x})))}</div><div class="field"><label for="f-document-file">Replace File (optional)</label><input id="f-document-file" name="file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp,text/plain,.docx"><small>PDF, image, text or DOCX · max 750 KB. Leave empty to keep the current file.</small></div><div class="form-error" id="form-error"></div></form>`;
 modal('Edit Document','Update the document details or replace its file.',body,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="entity-form">Save Document</button>`);
 $('#entity-form').elements.category.value=d.category;
 $('#entity-form').elements.status.value=d.status;
}
function downloadDocument(id){
 const d=byId('documents',id);if(!d)return;
 const link=document.createElement('a');let url;
 if(d.dataUrl){link.href=d.dataUrl;link.download=d.fileName||`${d.name}.pdf`;}
 else{const body=`SAMPLE DOCUMENT — ${d.category}\n${d.name}\nVersion ${d.version||'1.0'} · ${d.status}\n\n${d.sampleText||'No file has been uploaded for this sample record.'}\n\nThis is fictional preview content, not an approved client document.`;url=URL.createObjectURL(new Blob([body],{type:'text/plain'}));link.href=url;link.download=`${d.name.replace(/[^a-z0-9-]+/gi,'-')}-sample.txt`;}
 document.body.appendChild(link);link.click();link.remove();if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function saveEditedDocument(form){
 const d=byId('documents',form.dataset.id);if(!d)return;
 const data=Object.fromEntries(new FormData(form).entries()),error=$('#form-error'),file=form.elements.file.files?.[0];
 const name=String(data.name||'').trim(),version=String(data.version||'').trim();
 if(state.documents.some(x=>x.id!==d.id&&x.clientId===d.clientId&&x.name.toLowerCase()===name.toLowerCase()&&x.version===version)){error.textContent='This document name and version already exist for the client.';return;}
 const allowed=['application/pdf','image/png','image/jpeg','image/webp','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
 const mime=file&&(file.type||(/\.docx$/i.test(file.name)?allowed[5]:''));
 if(file&&(!allowed.includes(mime)||file.size>750000)){error.textContent='Choose a PDF, image, text or DOCX file under 750 KB.';return;}
 let dataUrl;
 try{if(file)dataUrl=await readFileAsDataUrl(file);}catch{error.textContent='Could not read the document.';return;}
 const previous={...d};
 Object.assign(d,{category:data.category,name,version,status:data.status});
 if(file)Object.assign(d,{fileName:file.name,mime,dataUrl,sampleText:undefined,uploadedAt:localDate(0)});
 logActivity(d.clientId,'Document Edited',`${d.category}: ${d.name} (v${d.version})`);
 try{save();}catch{Object.assign(d,previous);state.activity.shift();error.textContent='Browser storage is full. Try a smaller file or export the demo data.';return;}
 $('#modal-root').innerHTML='';render();toast('Document updated.');
}
async function saveEditedClient(form){
 const data=Object.fromEntries(new FormData(form).entries()),error=$('#form-error'),c=byId('clients',selectedClientId),file=form.elements.logo.files?.[0];
 if(state.clients.some(x=>x.id!==c.id&&x.name.toLowerCase()===String(data.name).trim().toLowerCase())){error.textContent='Another client has this institution name.';return;}
 if(file&&(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>500000)){error.textContent='Choose a PNG, JPG or WebP logo under 500 KB.';return;}
 try{if(file)c.logo=await readFileAsDataUrl(file);}catch{error.textContent='Could not read the logo.';return;}
 if((mapCityKey(c.city)||String(c.city).toLowerCase())!==(mapCityKey(data.city)||String(data.city).trim().toLowerCase())){c.mapLat='';c.mapLon='';}
 for(const key of ['name','type','status','city','registration','contact','contactRole','email','phone','billingContact','billingEmail','owner'])c[key]=String(data[key]||'').trim();
 logActivity(c.id,'Profile Edited','Institution and contact details updated.');save();$('#modal-root').innerHTML='';render();toast('Client profile updated.');
}
async function saveDocument(form){
 const data=Object.fromEntries(new FormData(form).entries()),error=$('#form-error'),file=form.elements.file.files?.[0];
 if(!file){error.textContent='Choose a document file.';return;}
 const allowed=['application/pdf','image/png','image/jpeg','image/webp','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
 const mime=file.type||(/\.docx$/i.test(file.name)?allowed[5]:'');
 if(!allowed.includes(mime)||file.size>750000){error.textContent='Choose a PDF, image, text or DOCX file under 750 KB.';return;}
 if(state.documents.some(d=>d.clientId===data.clientId&&d.name.toLowerCase()===String(data.name).trim().toLowerCase()&&d.version===String(data.version).trim())){error.textContent='This document name and version already exist for the client.';return;}
 let dataUrl;try{dataUrl=await readFileAsDataUrl(file);}catch{error.textContent='Could not read the document.';return;}
 const d={id:uid('doc'),clientId:data.clientId,category:data.category,name:String(data.name).trim(),version:String(data.version).trim(),status:data.status,uploadedAt:localDate(0),fileName:file.name,mime,dataUrl};
 state.documents.unshift(d);logActivity(d.clientId,'Document Added',`${d.category}: ${d.name} (v${d.version})`);
 try{save();}catch{state.documents.shift();state.activity.shift();error.textContent='Browser storage is full. Try a smaller file or export the demo data.';return;}
 $('#modal-root').innerHTML='';selectedClientId=d.clientId;profileTab='documents';setView('profile');toast('Document saved with preview.');
}
function showDetail(type,id){
 const x=byId(({client:'clients',branch:'branches',product:'products',invoice:'invoices',ticket:'tickets'})[type],id);if(!x)return;
 if(type==='client'){
 const branches=state.branches.filter(b=>b.clientId===id),deployments=state.deployments.filter(d=>d.clientId===id),invoices=state.invoices.filter(i=>i.clientId===id),tickets=state.tickets.filter(t=>t.clientId===id);
 modal(x.name,'Fictional institution · client record',`<div>${tag(x.status)}</div><dl class="detail-dl"><dt>Institution type</dt><dd>${esc(x.type)}</dd><dt>Primary contact</dt><dd>${esc(x.contact||'—')}</dd><dt>Email</dt><dd>${esc(x.email||'—')}</dd><dt>Phone</dt><dd>${esc(x.phone||'—')}</dd><dt>City</dt><dd>${esc(x.city||'—')}</dd></dl><div class="detail-section"><h3>Branches · ${branches.length}</h3>${branches.map(b=>`<span class="detail-chip">${esc(b.name)}</span>`).join('')||'—'}</div><div class="detail-section"><h3>Products deployed · ${deployments.length}</h3>${deployments.map(d=>`<span class="detail-chip">${esc(nameOf('products',d.productId))}</span>`).join('')||'—'}</div><div class="detail-section"><h3>Related work</h3><p style="font-size:11px;color:#7d949b">${invoices.length} invoices · ${tickets.length} tickets · ${state.messages.filter(m=>m.clientId===id).length} mail threads</p></div>`);
 }
 if(type==='branch')modal(x.name,'Fictional branch · linked client record',`<div>${tag(x.status)}</div><dl class="detail-dl"><dt>Client</dt><dd>${esc(nameOf('clients',x.clientId))}</dd><dt>Branch code</dt><dd>${esc(x.code)}</dd><dt>City</dt><dd>${esc(x.city)}</dd></dl><div class="detail-section"><h3>Products & Modules</h3>${state.deployments.filter(d=>d.branchId===id).map(d=>`<p><strong>${esc(nameOf('products',d.productId))}</strong><br><small>${esc((d.modules||[]).join(', ')||'No modules recorded')}</small></p>`).join('')||'No product deployments yet.'}</div>`);
 if(type==='product')modal(x.name,'IDSSPL product catalog',`<div class="detail-section"><h3>${esc(x.family)}</h3><p style="font-size:11px;color:#789099;line-height:1.7">${esc(x.description)}</p></div><div class="detail-section"><h3>Listed capabilities</h3>${(x.subproducts||[]).map(s=>`<span class="detail-chip">${esc(s)}</span>`).join('')||'<p style="font-size:11px;color:#9aadb1">No capabilities listed yet.</p>'}</div><div class="detail-section"><h3>Sample deployments</h3>${state.deployments.filter(d=>d.productId===id).map(d=>`<p style="font-size:11px;color:#66818a">${esc(nameOf('clients',d.clientId))} · ${esc(nameOf('branches',d.branchId))}</p>`).join('')||'<p style="font-size:11px;color:#9aadb1">None yet.</p>'}</div>${x.source?`<div class="detail-section"><a href="${esc(x.source)}" target="_blank" rel="noopener noreferrer" style="color:#0b9d8c;font-size:11px;font-weight:800">Official product overview →</a></div>`:''}`);
 if(type==='invoice')modal(x.number,'Sample billing record',`<div>${tag(invoiceStatus(x))}</div><dl class="detail-dl"><dt>Client</dt><dd>${esc(nameOf('clients',x.clientId))}</dd><dt>Branch</dt><dd>${esc(nameOf('branches',x.branchId))}</dd><dt>Product</dt><dd>${esc(nameOf('products',x.productId))}</dd><dt>Base amount</dt><dd>${money(x.amount,x.currency)}</dd><dt>Tax amount</dt><dd>${money(x.tax,x.currency)}</dd><dt>Total</dt><dd>${money(Number(x.amount)+Number(x.tax),x.currency)}</dd><dt>Due date</dt><dd>${prettyDate(x.due)}</dd>${x.paidAt?`<dt>Payment recorded</dt><dd>${prettyDate(x.paidAt)}</dd>`:''}</dl><div class="form-note">This is a sample record. No legal invoice document, payment or email is generated.</div>`,x.status==='Paid'?'<button class="btn" data-action="close-modal">Close</button>':`<button class="btn" data-action="close-modal">Close</button>${x.status==='Draft'?`<button class="btn" data-action="edit-invoice" data-id="${x.id}">Edit draft</button><button class="btn btn-primary" data-action="mark-sent" data-id="${x.id}">Mark sent in demo</button>`:`<button class="btn btn-primary" data-action="mark-paid" data-id="${x.id}">Record payment in demo</button>`}`);
 if(type==='ticket')modal(x.number,'Sample support case',`<div>${tag(x.status)} ${tag(x.priority)}</div><dl class="detail-dl"><dt>Issue</dt><dd>${esc(x.subject)}</dd><dt>Client</dt><dd>${esc(nameOf('clients',x.clientId))}</dd><dt>Branch</dt><dd>${esc(nameOf('branches',x.branchId))}</dd><dt>Owner</dt><dd>${esc(x.owner)}</dd><dt>Created</dt><dd>${prettyDate(x.created)}</dd></dl>`,x.status==='Resolved'?'<button class="btn" data-action="close-modal">Close</button>':`<button class="btn" data-action="close-modal">Close</button><button class="btn btn-primary" data-action="resolve-ticket" data-id="${x.id}">Resolve in demo</button>`);
 if(type==='branch')$('.modal-footer').innerHTML=`<button class="btn" data-action="close-modal">Close</button><button class="btn" data-action="edit-branch" data-id="${esc(id)}">Edit branch</button><button class="btn btn-danger" data-action="delete-branch" data-id="${esc(id)}">Delete branch</button>`;
 if(type==='invoice')$('.modal-footer').insertAdjacentHTML('beforeend',`<button class="btn btn-danger" data-action="delete-invoice" data-id="${esc(id)}">Delete record</button>`);
 if(type==='ticket')$('.modal-footer').insertAdjacentHTML('beforeend',`<button class="btn btn-danger" data-action="delete-ticket" data-id="${esc(id)}">Delete case</button>`);
}
function setupNote(topic){
 const notes={
  outlook:['Outlook integration','We need the Microsoft 365 tenant and mailbox model: shared mailbox or individual inboxes, which team members can read each one, client domain/contact matching rules, what to do with forwarded mail, aliases, unknown senders and attachments, and who can approve a reply.'],
  roles:['Team roles','Proposed roles: Admin, Account Manager, Billing, Support and Viewer. We need to confirm whether users can see every institution or only assigned clients, and who can change billing, resolve tickets and connect mailboxes.'],
  billing:['Billing discovery','Please confirm your billing entity and currency, product pricing method, one-time versus recurring charges, GST/tax rules, invoice numbering, approval steps, credit notes, renewals, payment methods and reconciliation source.'],
  assistant:['Assistant scope','The first assistant can summarize today’s tasks, overdue invoices and tickets, then draft Outlook replies for review. Later actions can be added with role checks, activity history and explicit approval for outbound messages or financial changes.']
 }[topic];modal(notes[0],'Questions to settle before the live integration',`<p style="font-size:12px;color:#6b848c;line-height:1.8">${esc(notes[1])}</p>`);
}
let composingAttachments=[];
function mailTemplateText(template,message,clientId){
 const client=byId('clients',clientId),lead=state.leads.find(item=>item.id===message?.leadId);
 const contact=message?.from||client?.contact||lead?.contact||'there';
 const products=client?state.deployments.filter(item=>item.clientId===client.id).map(item=>nameOf('products',item.productId)):lead?.interestedProducts?.map(id=>nameOf('products',id))||[];
 const replacements={institution:client?.name||lead?.name||'your institution',contact:contact.split(' ')[0],products:[...new Set(products)].join(', ')||'IDSSPL products',branch:inboxReplyPlan(message||{}).branch?.name||'your branch'};
 return String(template||'').replace(/\{(institution|contact|products|branch)\}/gi,(_,key)=>replacements[key.toLowerCase()]);
}
function renderComposeAttachments(){
 const list=$('#compose-attachment-list');if(!list)return;
 list.innerHTML=composingAttachments.length?composingAttachments.map((file,index)=>`<div><span>${icon('bill')}<strong>${esc(file.name)}</strong><small>${Math.ceil(file.size/1024)} KB</small></span><button type="button" data-action="remove-compose-attachment" data-index="${index}" aria-label="Remove ${esc(file.name)}">Remove</button></div>`).join(''):'<small>No files attached.</small>';
}
function openMailTemplateManager(){
 const rows=state.templates.map(template=>`<div class="mail-template-row"><span><strong>${esc(template.name)}</strong><small>${esc(template.subject)}</small></span><div><button data-action="edit-template" data-id="${esc(template.id)}">Edit</button><button data-action="delete-template" data-id="${esc(template.id)}">Delete</button></div></div>`).join('');
 modal('Mail templates','Reusable drafts for client mail and prospect outreach. Insert {institution}, {contact}, {products} or {branch} where needed.',`<div class="mail-template-list">${rows||'<p>No saved templates yet.</p>'}</div>`,`<button class="btn" data-action="close-modal">Close</button><button class="btn btn-primary" data-action="new-template">New template</button>`);
}
function openMailComposer(messageId='',draftId='',prefill={}){
 const m=messageId?byId('messages',messageId):null,d=draftId?byId('mailDrafts',draftId):null;
 const to=prefill.to||d?.to||m?.email||'',subject=prefill.subject||d?.subject||(m?`Re: ${m.subject}`:''),body=prefill.body||d?.body||(m?inboxReplyTemplate(m):''),clientId=prefill.clientId||d?.clientId||m?.clientId||'';
 composingAttachments=(d?.attachments||[]).map(file=>({...file}));
 const options=`${m?'<optgroup label="For this message"><option value="recommended">Suggested for this email</option><option value="acknowledge">Acknowledge request</option><option value="details">Ask for details</option><option value="meeting">Arrange discussion</option></optgroup>':''}<optgroup label="Saved templates">${state.templates.map(t=>`<option value="saved:${esc(t.id)}">${esc(t.name)}</option>`).join('')}</optgroup>`;
 const picker=`<div class="mail-template-picker"><label for="mail-reply-template">Template</label><div><select id="mail-reply-template">${options}</select><button type="button" data-action="apply-mail-template" data-id="${esc(m?.id||'')}">Use template</button></div><small>Manage templates from the Inbox toolbar. Review facts and commitments before saving.</small></div>`;
 modal(d?'Edit Mail Draft':m?'Reply Draft':'Compose Mail Draft','Saved locally · Outlook sending is not connected',`<form id="mail-compose-form" data-draft-id="${esc(draftId)}" data-client-id="${esc(clientId)}" data-reply-to="${esc(m?.id||d?.replyToId||'')}"><div class="field"><label for="compose-to">To</label><input id="compose-to" name="to" type="email" required value="${esc(to)}" placeholder="recipient@bank.com"></div><div class="field"><label for="compose-subject">Subject</label><input id="compose-subject" name="subject" required value="${esc(subject)}" placeholder="Subject"></div>${picker}<div class="field"><label for="compose-body">Message</label><textarea id="compose-body" name="body" required style="min-height:260px" placeholder="Write your message...">${esc(body)}</textarea></div><div class="field"><label for="compose-attachments">Attachments</label><input id="compose-attachments" type="file" multiple><small>Up to 3 files, 300 KB each. Stored with this draft in your browser.</small><div id="compose-attachment-list" class="compose-attachment-list"></div></div><div class="mail-compose-note">This demo saves a draft in your browser. It cannot send mail until Microsoft 365 is connected.</div><div class="form-error" id="form-error"></div></form>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="mail-compose-form">Save Draft</button>`);
 $('#modal-root .modal').classList.add('mail-compose-modal');
 renderComposeAttachments();
}
function saveMailDraft(e){
 e.preventDefault();const form=e.target,data=Object.fromEntries(new FormData(form).entries()),existing=byId('mailDrafts',form.dataset.draftId);
 const previous=existing?{...existing}:null;let created=null;
 if(existing){existing.to=data.to.trim();existing.subject=data.subject.trim();existing.body=data.body.trim();existing.attachments=composingAttachments.map(file=>({...file}));existing.savedAt=new Date().toLocaleString('en-IN');}
 else{created={id:uid('draft'),to:data.to.trim(),subject:data.subject.trim(),body:data.body.trim(),attachments:composingAttachments.map(file=>({...file})),clientId:form.dataset.clientId||'',replyToId:form.dataset.replyTo||'',savedAt:new Date().toLocaleString('en-IN')};state.mailDrafts.unshift(created);}
 try{save();}catch{if(existing)Object.assign(existing,previous);else state.mailDrafts=state.mailDrafts.filter(draft=>draft!==created);const error=$('#form-error');if(error)error.textContent='Browser storage is full. Remove an attachment and try again.';return;}
 mailFolder='Drafts';mailFilter='All';selectedMail=existing?.id||state.mailDrafts[0].id;$('#modal-root').innerHTML='';setView('inbox');toast('Draft saved. Outlook sending is not connected.');
}
function openTemplateEditor(id=''){
 const t=byId('templates',id);
 modal(t?'Edit Mail Template':'New Mail Template','Use {institution}, {contact}, {products} and {branch} to personalize.',`<form id="template-form" data-id="${esc(id)}">${field('Template Name','name','text',true,'e.g. Product catalog follow-up',t?.name||'')}${field('Subject','subject','text',true,'Subject with {institution}',t?.subject||'')}<div class="field"><label for="template-body">Message</label><textarea id="template-body" name="body" required style="min-height:250px" placeholder="Write the reusable message...">${esc(t?.body||'')}</textarea></div><div class="form-error" id="form-error"></div></form>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="template-form">Save Template</button>`);
}
function saveTemplate(e){
 e.preventDefault();const form=e.target,data=Object.fromEntries(new FormData(form).entries()),t=byId('templates',form.dataset.id),name=data.name.trim();
 if(state.templates.some(x=>x.id!==t?.id&&x.name.toLowerCase()===name.toLowerCase())){$('#form-error').textContent='A template with this name already exists.';return;}
 if(t){t.name=name;t.subject=data.subject.trim();t.body=data.body.trim();}else state.templates.push({id:uid('tpl'),name,subject:data.subject.trim(),body:data.body.trim()});
 save();$('#modal-root').innerHTML='';render();toast('Mail template saved.');
}
function updateLead(e){
 e.preventDefault();const l=byId('leads',selectedLeadId),data=Object.fromEntries(new FormData(e.target).entries()),error=$('#lead-error');if(!l||l.stage==='Converted')return;error.textContent='';
 const nextAction=String(data.nextAction||'').trim(),lossReason=String(data.lossReason||'').trim();
 if(data.stage==='Lost'&&!lossReason){error.textContent='Record why the prospect was lost.';return;}
 if(data.stage!=='Lost'&&(!data.nextFollowUp||!nextAction)){error.textContent='Active prospects need a next action and follow-up date.';return;}
 if(data.stage!=='Lost'&&data.nextFollowUp<localDate(0)){error.textContent='Choose a follow-up date from today onward.';return;}
 const previous=l.stage;l.stage=data.stage;l.nextFollowUp=data.stage==='Lost'?'':data.nextFollowUp;l.nextAction=data.stage==='Lost'?'':nextAction;l.lossReason=data.stage==='Lost'?lossReason:'';l.notes=String(data.notes||'').trim();
 (l.history||(l.history=[])).push({at:new Date().toLocaleString('en-IN'),text:previous===l.stage?'Follow-up and notes updated':`${previous} → ${l.stage}`});
 save();render();toast('Prospect updated.');
}
function saveLeadDraft(e){
 e.preventDefault();const l=byId('leads',selectedLeadId),data=Object.fromEntries(new FormData(e.target).entries());
 state.mailDrafts.unshift({id:uid('draft'),to:data.to.trim(),subject:data.subject.trim(),body:data.body.trim(),leadId:l.id,savedAt:new Date().toLocaleString('en-IN')});save();render();toast('Product catalog email draft saved.');
}
function convertLead(id){
 const l=byId('leads',id);if(!l||l.stage==='Converted')return;
 if(l.stage==='Lost'){toast('Reopen this prospect before conversion.');return;}
 if(state.clients.some(c=>c.name.toLowerCase()===l.name.toLowerCase()||c.email?.toLowerCase()===l.email.toLowerCase())){toast('A matching client already exists. Review the client before conversion.');return;}
 if(!['Proposal','Negotiation','Qualified'].includes(l.stage)){toast('Move the prospect to Proposal, Negotiation or Qualified before conversion.');return;}
 if(!(l.interestedProducts||[]).length){toast('Select at least one interested product before conversion.');return;}
 startOnboarding();onboarding.leadId=l.id;onboarding.name=l.name;onboarding.type=l.type;onboarding.city=l.city;onboarding.contact=l.contact;onboarding.email=l.email;onboarding.selectedProducts=[...l.interestedProducts];onboarding.notes=l.notes;render();
}
document.addEventListener('click',e=>{
 const inClientMenu=e.target.closest('#client-row-menu');
 if(inClientMenu||!e.target.closest('[data-action="toggle-client-menu"], [data-action="toggle-product-menu"], [data-action="toggle-record-menu"]'))closeClientRowMenu();
 const mapMarker=e.target.closest('[data-map-city]');if(mapMarker){showMapCity(mapMarker.dataset.mapCity,true);return;}
 const nav=e.target.closest('[data-view]');if(nav){e.preventDefault();setView(nav.dataset.view);return;}
 const profile=e.target.closest('[data-profile]');if(profile&&!e.target.closest('[data-action]')){selectedClientId=profile.dataset.profile;profileTab='overview';workflowBranchFilter='all';workflowProductFilter='all';setView('profile');return;}
 const lead=e.target.closest('[data-lead]');if(lead){selectedLeadId=lead.dataset.lead;setView('leadDetail');return;}
 const product=e.target.closest('[data-product]');if(product){selectedProductId=product.dataset.product;productModuleFilter='all';setView('productDetail');return;}
 const ticket=e.target.closest('[data-ticket]');if(ticket){selectedTicketId=ticket.dataset.ticket;setView('ticketDetail');return;}
 const documentButton=e.target.closest('[data-document]');if(documentButton){selectedDocumentId=documentButton.dataset.document;setView('documentPreview');return;}
 const tabButton=e.target.closest('[data-profile-tab]');if(tabButton){profileTab=tabButton.dataset.profileTab;render();return;}
 const d=e.target.closest('[data-detail]');if(d){const [type,id]=d.dataset.detail.split(':');showDetail(type,id);return;}
 const folder=e.target.closest('[data-mail-folder]');if(folder){mailFolder=folder.dataset.mailFolder;mailFilter='All';selectedMail='';render();return;}
 const clientPageButton=e.target.closest('[data-client-page]');if(clientPageButton){clientPage=Number(clientPageButton.dataset.clientPage);render();return;}
 const mailView=e.target.closest('[data-mail-view]');if(mailView){mailFolder='Inbox';mailFilter=mailView.dataset.mailView;selectedMail='';render();return;}
 const mail=e.target.closest('[data-mail]');if(mail){selectedMail=mail.dataset.mail;const m=byId('messages',selectedMail);if(m){m.read=true;save();}render();return;}
 const reminderFilter=e.target.closest('[data-reminder-filter]');if(reminderFilter){assistantReminderFilter=reminderFilter.dataset.reminderFilter;render();return;}
 const assistantAction=e.target.closest('[data-assistant-action]');if(assistantAction){const target=assistantAction.dataset.assistantAction;if(target==='client')openOnboardingChoice();else if(target==='prospect')openForm('lead');else if(target==='email')openMailComposer();else openForm(target==='invoice'?'invoice':target==='ticket'?'ticket':'reminder');return;}
 const prompt=e.target.closest('[data-prompt]');if(prompt){ask(prompt.dataset.prompt);return;}
 const a=e.target.closest('[data-action]');if(!a)return;
 const action=a.dataset.action,id=a.dataset.id;
 if(action==='toggle-record-menu'){toggleRecordRowMenu(a,a.dataset.kind,id);return;}
 if(action==='toggle-client-menu'){toggleClientRowMenu(a,id);return;}
 if(action==='toggle-product-menu'){toggleProductRowMenu(a,id);return;}
 if(action==='onboard-client'){openOnboardingChoice();return;}
 if(action==='onboard-single'){$('#modal-root').innerHTML='';startOnboarding();return;}
 if(action==='edit-client'){if(id)selectedClientId=id;openForm('edit-client');return;}
 if(action==='toggle-client-status'){const client=byId('clients',id||selectedClientId);if(!client)return;client.status=client.status==='Inactive'?'Active':'Inactive';logActivity(client.id,'Client Status Changed',client.status);save();render();toast(client.status==='Inactive'?'Client marked inactive.':'Client reactivated.');return;}
 if(action==='delete-client'||action==='delete-branch'){openDeleteReview(action==='delete-client'?'client':'branch',id);return;}
 if(action==='confirm-delete-client'||action==='confirm-delete-branch'){
  const kind=action.endsWith('client')?'client':'branch',record=byId(kind==='client'?'clients':'branches',id),typed=$('#delete-confirm-text')?.value.trim();
  if(!record)return;
  if(typed!==(kind==='client'?record.name:record.code)){$('#delete-confirm-error').textContent=`Type the exact ${kind==='client'?'client name':'branch code'} to continue.`;return;}
  const clientId=kind==='client'?id:record.clientId;
  if(!CrmCrud.remove(state,kind,id)){$('#delete-confirm-error').textContent='This record has linked support history and cannot be permanently deleted.';return;}if(kind==='branch')logActivity(clientId,'Branch Deleted',record.name);
  save();$('#modal-root').innerHTML='';
  if(kind==='client'){selectedClientId='';profileTab='overview';setView('clients');}
  else if(view==='workflowCanvas'){selectedClientId=clientId;profileTab='branches';setView('profile');}
  else render();
  toast(`${kind==='client'?'Client':'Branch'} and linked records deleted.`);return;
 }
 if(action==='edit-branch'){openBranchEditor(id);return;}
 if(action==='edit-ticket-details'){openTicketDetailsEditor(id);return;}
 if(['delete-document','delete-invoice','delete-ticket','delete-requirement','delete-prospect','delete-draft','delete-mail','delete-task'].includes(action)){openRecordDelete(action.slice(7),id);return;}
 if(action==='confirm-delete-record'){deleteRecord(a.dataset.kind,id);return;}
 if(action==='edit-lead'){openLeadEditor(id);return;}
 if(action==='edit-product'){openProductEditor();return;}
 if(action==='delete-product'){
  const product=byId('products',selectedProductId);if(!product)return;
  const linked=state.deployments.some(item=>item.productId===product.id)||state.invoices.some(item=>item.productId===product.id)||state.tickets.some(item=>item.productId===product.id)||state.requirements.some(item=>item.productId===product.id);
  if(linked){toast('This product has linked records. Remove or reassign them first.');return;}
  modal('Delete product',`Delete ${product.name} from the catalog?`,'<p>This product has no linked client records.</p>',`<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-danger" data-action="confirm-delete-product" data-id="${esc(product.id)}">Delete product</button>`);return;
 }
 if(action==='confirm-delete-product'){
  const product=byId('products',id);if(!product)return;
  if(state.deployments.some(item=>item.productId===id)||state.invoices.some(item=>item.productId===id)||state.tickets.some(item=>item.productId===id)||state.requirements.some(item=>item.productId===id)){toast('Linked records prevent deletion.');return;}
  state.products=state.products.filter(item=>item.id!==id);save();$('#modal-root').innerHTML='';setView('products');toast('Product deleted.');return;
 }
 if(action==='edit-document'){openDocumentEditor(id);return;}
 if(action==='download-document'){downloadDocument(id);return;}
 if(action==='edit-requirement'){openRequirementEditor(id);return;}
 if(action==='open-workflow-canvas'){selectedWorkflowDeploymentId=id;setView('workflowCanvas');return;}
 if(action==='add-requirement'){openForm('requirement');const form=$('#entity-form');if(a.dataset.branchId){form.elements.branchId.value=a.dataset.branchId;updateRequirementOptions();}if(a.dataset.productId)form.elements.productId.value=a.dataset.productId;return;}
 if(action==='new-template'){openTemplateEditor();return;}
 if(action==='edit-template'){openTemplateEditor(id);return;}
 if(action==='manage-mail-templates'){openMailTemplateManager();return;}
 if(action==='delete-template'){state.templates=state.templates.filter(template=>template.id!==id);save();openMailTemplateManager();render();toast('Template deleted.');return;}
 if(action==='convert-lead'){convertLead(id);return;}
 if(action==='back-to-documents'){const d=byId('documents',selectedDocumentId);selectedClientId=d.clientId;profileTab='documents';setView('profile');return;}
 if(action==='open-compose'){openMailComposer();return;}
 if(action==='clear-chat'){state.chats=[];save();render();return;}
 if(action==='edit-reminder'){openReminderEditor(id);return;}
 if(action==='delete-reminder'){state.reminders=state.reminders.filter(r=>r.id!==id);save();render();toast('Reminder deleted.');return;}
 if(action==='reopen-reminder'){const r=byId('reminders',id);if(r){r.done=false;save();render();toast('Reminder reopened.');}return;}
 if(action==='close-mail'){selectedMail='';render();return;}
 if(action==='reply-mail'){openMailComposer(id);return;}
 if(action==='apply-mail-template'){
  const message=byId('messages',id),body=$('#compose-body'),choice=$('#mail-reply-template'),subject=$('#compose-subject'),clientId=$('#mail-compose-form')?.dataset.clientId;
  if(body&&choice){
   if(choice.value.startsWith('saved:')){const template=byId('templates',choice.value.slice(6));if(template){body.value=mailTemplateText(template.body,message,clientId);if(!message&&subject)subject.value=mailTemplateText(template.subject,message,clientId);}}
   else if(message)body.value=inboxReplyTemplate(message,choice.value);
   body.focus();
  }return;
 }
 if(action==='remove-compose-attachment'){composingAttachments.splice(Number(a.dataset.index),1);renderComposeAttachments();return;}
 if(action==='edit-draft'){openMailComposer('',id);return;}
 if(action==='mail-star'){const m=byId('messages',id);m.starred=!m.starred;save();render();return;}
 if(action==='mail-read'){const m=byId('messages',id);m.read=!m.read;save();render();return;}
 if(action==='mail-archive'){const m=byId('messages',id);m.archived=!m.archived;save();selectedMail='';render();return;}
 if(action==='onboarding-cancel'){onboarding=null;setView('clients');return;}
 if(action==='onboarding-back'){captureOnboarding(false);onboardingStep=Math.max(0,onboardingStep-1);render();return;}
 if(action==='onboarding-add-branch'){captureOnboarding(false);onboarding.branches.push({name:'',code:'',city:'',modules:{}});render();return;}
 if(action==='onboarding-remove-branch'){captureOnboarding(false);onboarding.branches.splice(Number(a.dataset.index),1);render();return;}
 if(action==='edit-modules'){editModules(id);return;}
 if(action==='edit-commercial'){openCommercialEditor(id);return;}
 if(action==='module-breakdown'){openModuleBreakdown(id);return;}
 if(action==='edit-module-commercial'){openModuleTermsEditor(id,a.dataset.module);return;}
 if(action==='delete-module-commercial'){const d=byId('deployments',id);if(d?.moduleCommercials?.[a.dataset.module]){delete d.moduleCommercials[a.dataset.module];logActivity(d.clientId,'Module Commercial Removed',`${nameOf('branches',d.branchId)} · ${a.dataset.module}`);save();openModuleBreakdown(id);render();toast('Module charge removed.');}return;}
 if(action==='remove-deployment'){
  const d=byId('deployments',id);if(!d)return;
  const linked=state.invoices.some(item=>item.branchId===d.branchId&&item.productId===d.productId)||state.tickets.some(item=>Helpdesk.affects(item,d.branchId)&&item.productId===d.productId)||state.requirements.some(item=>!item.archived&&item.branchId===d.branchId&&item.productId===d.productId);
  if(linked){toast('Linked billing, support or workflow records must be handled first.');return;}
  state.deployments=state.deployments.filter(item=>item.id!==id);
  state.requirements=state.requirements.filter(item=>!(item.archived&&item.clientId===d.clientId&&item.branchId===d.branchId&&item.productId===d.productId));
  delete state.workflowCanvases?.[id];
  logActivity(d.clientId,'Product Assignment Removed',`${nameOf('branches',d.branchId)} · ${nameOf('products',d.productId)}`);save();$('#modal-root').innerHTML='';render();toast('Product assignment removed.');return;
 }
 if(action==='advance-requirement'){const r=byId('requirements',id);const stages=['Discovery','In Review','Approved','In Delivery','Complete'];r.stage=stages[Math.min(stages.indexOf(r.stage)+1,stages.length-1)];save();render();toast('Requirement moved to '+r.stage+'.');return;}
 if(action==='close-modal'){$('#modal-root').innerHTML='';return;}
 if(action.startsWith('add-')){openForm(action.slice(4));return;}
 if(action==='complete-reminder'){byId('reminders',id).done=true;save();render();toast('Reminder completed.');return;}
 if(action==='mark-sent'||action==='mark-paid'){const i=byId('invoices',id);if(!i||action==='mark-sent'&&i.status!=='Draft'||action==='mark-paid'&&i.status!=='Sent'){toast('Open the invoice and follow its next available step.');return;}if(action==='mark-sent'){i.status='Sent';i.sentAt=localDate(0);const year=new Date().getFullYear(),prefix=`INV-${year}-`;const highest=Math.max(year===2026?1043:1000,...state.invoices.map(item=>item.number.startsWith(prefix)?Number(item.number.slice(prefix.length))||0:0));i.number=`${prefix}${highest+1}`;}else{i.status='Paid';i.paidAt=localDate(0);}save();$('#modal-root').innerHTML='';render();toast(action==='mark-sent'?'Invoice marked sent in this demo.':'Payment recorded in this demo.');return;}
 if(action==='resolve-ticket'){byId('tickets',id).status='Resolved';save();$('#modal-root').innerHTML='';render();toast('Sample ticket resolved.');return;}
 if(action==='setup-note'){setupNote(id);return;}
 if(action==='draft-mail'){const m=byId('messages',id);modal('Reply draft','Local draft only · nothing is sent',`<div class="field"><label>To</label><input value="${esc(m.email)}" readonly></div><div class="field"><label>Subject</label><input value="Re: ${esc(m.subject)}" readonly></div><div class="field"><label>Message</label><textarea id="reply-text" style="min-height:180px">Hello ${esc(m.from.split(' ')[0])},\n\nThank you for your message. I will review this with the team and follow up shortly.\n\nRegards,\nIDSSPL Team</textarea></div><div class="form-note">You can edit and copy this draft. Outlook sending is not connected.</div>`,'<button class="btn" data-action="close-modal">Close</button><button class="btn btn-primary" data-action="copy-reply">Copy draft</button>');return;}
 if(action==='copy-reply'){navigator.clipboard.writeText($('#reply-text').value).then(()=>toast('Draft copied to clipboard.')).catch(()=>toast('Clipboard unavailable. Select and copy the text.'));return;}
 if(action==='export-data'){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='orbit-crm-demo-data.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);return;}
 if(action==='reset-demo'){if(confirm('Reset all sample changes in this browser?')){state=seed();save();render();toast('Demo reset.');}return;}
});
document.addEventListener('input',e=>{if(e.target.id==='list-search'){const cursor=e.target.selectionStart;filter=e.target.value;if(view==='clients')clientPage=1;if(view==='prospects')prospectListPage=1;const focused=document.activeElement===e.target;render();const newInput=$('#list-search');if(focused&&newInput){newInput.focus();newInput.setSelectionRange(cursor,cursor);}}});
document.addEventListener('change',e=>{if(e.target.name==='clientId'&&e.target.closest('#entity-form')){updateBranchSelect();updateTicketProductSelect();}if(e.target.name==='branchId'&&e.target.closest('#entity-form'))updateTicketProductSelect();if(e.target.name==='productId'&&e.target.closest('#entity-form')){updateModuleSelect();updateTicketModuleSelect();}if(e.target.id==='mail-filter'){mailFilter=e.target.value;selectedMail='';render();}if(e.target.id==='mail-client-filter'){mailClientFilter=e.target.value;selectedMail='';render();}if(e.target.id==='client-type-filter'){clientTypeFilter=e.target.value;clientPage=1;render();}if(e.target.id==='client-status-filter'){clientStatusFilter=e.target.value;clientPage=1;render();}if(e.target.id==='client-city-filter'){clientCityFilter=e.target.value;clientPage=1;render();}if(e.target.id==='client-page-size'){clientPageSize=Number(e.target.value);clientPage=1;render();}if(e.target.id==='lead-template'){const l=byId('leads',selectedLeadId),t=byId('templates',e.target.value);$('#lead-subject').value=mergeLeadTemplate(t.subject,l);$('#lead-body').value=mergeLeadTemplate(t.body,l);}});
document.addEventListener('change',e=>{if(e.target.id==='workflow-branch-filter'){workflowBranchFilter=e.target.value;workflowProductFilter='all';render();return;}if(e.target.id==='workflow-product-filter'){workflowProductFilter=e.target.value;render();return;}if(e.target.closest('#entity-form')&&['clientId','branchId'].includes(e.target.name))updateRequirementOptions();});
document.addEventListener('change',e=>{if(e.target.id==='lead-stage-filter'){leadStageFilter=e.target.value;prospectListPage=1;render();}if(e.target.id==='lead-owner-filter'){leadOwnerFilter=e.target.value;prospectListPage=1;render();}if(e.target.id==='lead-followup-filter'){leadFollowupFilter=e.target.value;prospectListPage=1;render();}});
document.addEventListener('change',e=>{if(e.target.id!=='bank-logo'||!onboarding)return;const file=e.target.files?.[0];if(!file)return;const error=$('#logo-error');if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>500000){error.textContent='Choose a PNG, JPG or WebP under 500 KB.';e.target.value='';return;}const reader=new FileReader();reader.onload=()=>{onboarding.logo=String(reader.result);$('#logo-preview').innerHTML=`<img src="${esc(onboarding.logo)}" alt="Selected bank logo">`;error.textContent='';};reader.readAsDataURL(file);});
document.addEventListener('submit',e=>{if(e.target.id==='entity-form')formSubmit(e);if(e.target.id==='onboarding-form')submitOnboarding(e);if(e.target.id==='ticket-update-form')updateTicket(e);if(e.target.id==='mail-compose-form')saveMailDraft(e);if(e.target.id==='template-form')saveTemplate(e);if(e.target.id==='lead-stage-form')updateLead(e);if(e.target.id==='lead-compose-form')saveLeadDraft(e);if(e.target.id==='chat-form'){e.preventDefault();const input=$('#chat-input');ask(input.value);}});
function updateTicket(e){
 e.preventDefault();const t=byId('tickets',selectedTicketId),data=Object.fromEntries(new FormData(e.target).entries()),error=$('#ticket-error');error.textContent='';
 const note=String(data.note||'').trim(),next=data.status;
 if(['Resolved','Closed'].includes(next)&&!note&&!t.resolution){error.textContent='Add a resolution note before resolving or closing a case.';return;}
 if(next==='Closed'&&!['Resolved','Closed'].includes(t.status)){error.textContent='Resolve the case before closing it.';return;}
 if(next==='Reopened'&&!['Resolved','Closed'].includes(t.status)){error.textContent='Only resolved or closed cases can be reopened.';return;}
 if(next!==t.status&&!note){error.textContent='Add an update note when changing status.';return;}
 if(!note&&next===t.status&&data.priority===t.priority&&data.owner.trim()===t.owner&&data.due===(t.due||'')){error.textContent='Change a field or add an update note.';return;}
 const changes=[];if(next!==t.status)changes.push(`Status: ${t.status} → ${next}`);if(data.priority!==t.priority)changes.push(`Priority: ${t.priority} → ${data.priority}`);if(data.owner.trim()!==t.owner)changes.push(`Owner: ${t.owner} → ${data.owner.trim()}`);if(data.due!==(t.due||''))changes.push(`Due: ${t.due||'none'} → ${data.due||'none'}`);
 if(['Resolved','Closed'].includes(next)&&note)t.resolution=note;t.status=next;t.priority=data.priority;t.owner=data.owner.trim();t.due=data.due||'';
 (t.history||(t.history=[])).push({at:new Date().toLocaleString('en-IN'),by:t.owner,text:[...changes,note].join(' · ')||'Case updated',status:next});save();render();toast('Case updated.');
}
function assistantClientFor(text){
 const q=text.toLowerCase(),institutions=state.clients.filter(c=>q.includes(c.name.toLowerCase())||c.email&&q.includes(c.email.toLowerCase()));
 if(institutions.length===1)return institutions[0];
 if(institutions.length>1)return null;
 const contacts=state.clients.filter(c=>c.contact&&q.includes(c.contact.toLowerCase()));
 if(contacts.length===1)return contacts[0];
 if(contacts.length>1)return null;
 const words=q.split(/[^a-z0-9]+/),matches=state.clients.filter(c=>[c.name.split(' ')[0],c.contact?.split(' ')[0]].some(value=>value&&value.length>3&&words.includes(value.toLowerCase())));
 return matches.length===1?matches[0]:null;
}
function assistantMailRequest(question){
 if(!/^(?:please\s+|can you\s+|could you\s+)?(?:(?:draft|write|compose|send)\s+(?:an?\s+)?(?:email|mail|message)|(?:email|mail)\b)/i.test(question))return null;
 const matchedClient=assistantClientFor(question),explicitEmail=question.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0]||'';
 const client=explicitEmail&&matchedClient?.email?.toLowerCase()!==explicitEmail.toLowerCase()?null:matchedClient,email=explicitEmail||client?.email||'';
 const topic=question.match(/\b(?:about|regarding|subject:?)\s+(.+?)(?=\s+(?:saying|with message|that says)\b|$)/i)?.[1]?.replace(/[.!?]+$/,'').trim()||'';
 const message=question.match(/\b(?:saying|with message|that says)\s+(.+)$/i)?.[1]?.trim()||'';
 const greeting=client?.contact?.split(' ')[0]||'there';
 const body=message?`Hello ${greeting},\n\n${message}\n\nRegards,\nIDSSPL Team`:topic?`Hello ${greeting},\n\nI am following up about ${topic}. Please share an update when convenient.\n\nRegards,\nIDSSPL Team`:'';
 return {to:email,subject:topic?`Regarding ${topic}`:'',body,clientId:client?.id||'',client};
}
function assistantPrefillForm(type,prefill={}){
 if(type==='ticket'&&window.openHelpdeskForm){window.openHelpdeskForm('',prefill);return;}
 const form=$('#entity-form');if(!form)return;
 if(prefill.clientId&&form.elements.clientId){form.elements.clientId.value=prefill.clientId;updateBranchSelect();if(type==='ticket')updateTicketProductSelect();}
 for(const [key,value] of Object.entries(prefill))if(key!=='clientId'&&form.elements[key]&&value)form.elements[key].value=value;
}
function ask(question){
 question=question.trim();if(!question)return;
 const q=question.toLowerCase(),client=assistantClientFor(question);let reply={text:'',sources:[]},action='',prefill={};
 const reminder=question.match(/^(?:remind me(?:\s+to)?|(?:add|create)(?:\s+a)?\s+(?:reminder|task|to-do)(?:\s+to)?)\s+(.+?)(?:\s+(today|tomorrow|next week|on \d{4}-\d{2}-\d{2}))?[.!?]*$/i);
 const complete=q.match(/^(?:complete|mark done) (.+)$/i);
 const remove=q.match(/^delete reminder (.+)$/i);
 const mail=assistantMailRequest(question);
 const ticket=question.match(/^(?:create|add|open|log)(?:\s+a|\s+new)?\s+(?:support\s+)?(?:ticket|case)\s+(?:for|about)\s+(.+)$/i);
 const create=q.match(/^(?:create|new|add|draft|start)(?:\s+a|\s+an)?\s+(client|prospect|ticket|support ticket|invoice|email|mail|reminder|task)(?:\s+draft)?(?:\s+for\s+.+)?$/i);
 if(reminder){
  const title=reminder[1].trim().replace(/[.!?]+$/,''),when=reminder[2]?.toLowerCase()||'today';
  const due=when==='tomorrow'?localDate(1):when==='next week'?localDate(7):when.startsWith('on ')?when.slice(3):localDate(0);
  if(!title||when.startsWith('on ')&&(!/^\d{4}-\d{2}-\d{2}$/.test(due)||Number.isNaN(Date.parse(due))||due<localDate(0)))reply.text='Please give a reminder and a valid future date, for example: remind me to call Aster tomorrow.';
  else{state.reminders.unshift({id:uid('r'),title,clientId:client?.id||'',due,done:false});reply.text=`Reminder added for ${prettyDate(due)}: ${title}.${client?' Linked to '+client.name+'.':''}`;}
 }
 else if(complete||remove){const phrase=(complete||remove)[1].toLowerCase(),matches=state.reminders.filter(r=>r.title.toLowerCase().includes(phrase));if(matches.length===1){if(complete){matches[0].done=true;reply.text=`Marked “${matches[0].title}” complete.`;}else{state.reminders=state.reminders.filter(r=>r.id!==matches[0].id);reply.text=`Deleted reminder “${matches[0].title}”.`;}}else reply.text=matches.length?'More than one reminder matches. Use a more specific title.':'I could not find that reminder.';}
 else if(mail){action='email';prefill=mail;reply.text=mail.to?`I prepared an email draft to ${mail.to}${mail.subject?' about '+mail.subject.replace(/^Regarding /,''):''}. Review the wording, then save it. Sending is not connected in this preview.`:'I opened an email draft. Add the recipient, subject and message before saving; I could not identify a unique contact from that request.';}
 else if(ticket){action='ticket';const subject=ticket[1].replace(/^.+?\s+about\s+/i,'').replace(/[.!?]+$/,'').trim();prefill={clientId:client?.id||'',subject:subject||'',description:subject||'',category:'Service Request',priority:'Medium',impact:'Institution-Wide',source:'Internal'};reply.text=`Opening a support case${client?' for '+client.name:''}. Review the details before saving.`;}
 else if(create){action=create[1].toLowerCase().replace('support ticket','ticket').replace('task','reminder');reply.text=`Opening ${action==='email'||action==='mail'?'an email draft':'the '+action+' form'}${client?' for '+client.name:''}.`;prefill={clientId:client?.id||''};}
 else reply=answerQuestion(question);
 state.chats.push({role:'user',text:question},{role:'bot',text:reply.text,sources:reply.sources||[]});save('Assistant');render();
 if(action==='client')startOnboarding();else if(action==='prospect')openForm('lead');else if(action==='email'||action==='mail')openMailComposer('','',prefill);else if(action){openForm(action);assistantPrefillForm(action,prefill);}
 else $('#chat-input')?.focus();
}
$('#mobile-menu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#alerts-button').addEventListener('click',()=>setView('assistant'));
$('#global-search').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.value.trim()){const q=e.target.value.trim().toLowerCase();
  const branchMatch=state.branches.find(b=>[b.name,b.code,b.city].some(v=>v.toLowerCase().includes(q)));if(branchMatch){selectedClientId=branchMatch.clientId;profileTab='branches';setView('profile');return;}
  const destinations=[
  ['clients',state.clients,c=>[c.name,c.contact,c.email,c.city]],
  ['products',state.products,p=>[p.name,p.family,...(p.subproducts||[])]],
  ['billing',state.invoices,i=>[i.number,nameOf('clients',i.clientId),nameOf('products',i.productId)]],
  ['helpdesk',state.tickets,t=>[t.number,t.subject,nameOf('clients',t.clientId)]],
  ['inbox',state.messages,m=>[m.subject,m.from,nameOf('clients',m.clientId)]]
 ];const found=destinations.find(([_,items,values])=>items.some(item=>values(item).some(v=>String(v||'').toLowerCase().includes(q))));setView(found?.[0]||'clients');filter=q;render();}});
document.addEventListener('keydown',e=>{if(e.target.matches?.('.client-open-row')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();selectedClientId=e.target.dataset.profile;profileTab='overview';workflowBranchFilter='all';workflowProductFilter='all';setView('profile');return;}const marker=e.target.closest?.('[data-map-city]');if(marker&&(e.key==='Enter'||e.key===' ')){e.preventDefault();showMapCity(marker.dataset.mapCity,true);return;}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#global-search').focus();}if(e.key==='Escape'){closeClientRowMenu();$('#modal-root').innerHTML='';$('#sidebar').classList.remove('open');}});
document.addEventListener('change',e=>{if(e.target.id==='overview-period'){overviewPeriod=e.target.value;render();}});
document.addEventListener('change',e=>{if(e.target.id==='reports-range'&&['7','30','90'].includes(e.target.value)){reportRange=e.target.value;render();$('#reports-range')?.focus();}});
document.addEventListener('click',e=>{
 const action=e.target.closest?.('[data-action]')?.dataset.action;
 if(action==='create-task-from-canvas'||action==='create-task-from-requirement'){
  openWorkflowTaskForm(e.target.closest('[data-action]').dataset.id);return;
 }
 if(action==='export-reports'){
  const rows=workspaceReportRows();const csv=rows.map(row=>row.map(value=>{const text=String(value??'');return '"'+(/^[=+@\t\r-]/.test(text)?"'":'')+text.replace(/"/g,'""')+'"';}).join(',')).join('\r\n');const link=document.createElement('a');link.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));link.download='orbit-crm-report.csv';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);toast('Report exported.');return;
 }
},true);
document.addEventListener('DOMContentLoaded',render);
document.addEventListener('change',event=>{if(event.target.id==='product-module-filter'){productModuleFilter=event.target.value;render();}});
document.addEventListener('change',async event=>{
 if(event.target.id!=='compose-attachments')return;
 const input=event.target,error=$('#form-error'),files=[...input.files];if(error)error.textContent='';
 if(composingAttachments.length+files.length>3||files.some(file=>file.size>300_000)||composingAttachments.reduce((n,file)=>n+file.size,0)+files.reduce((n,file)=>n+file.size,0)>900_000){
  if(error)error.textContent='Attach up to 3 files of 300 KB each.';input.value='';return;
 }
 try{for(const file of files)composingAttachments.push({name:file.name,size:file.size,type:file.type,dataUrl:await readFileAsDataUrl(file)});renderComposeAttachments();}
 catch{if(error)error.textContent='Could not read one of the selected files.';}
 input.value='';
});


document.addEventListener('keydown',event=>{
 if(event.key!=='Tab')return;
 const dialog=document.querySelector('#modal-root [role="dialog"]');if(!dialog)return;
 const focusable=[...dialog.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length);
 if(!focusable.length){event.preventDefault();return;}
 const first=focusable[0],last=focusable.at(-1),active=document.activeElement;
 if(event.shiftKey&&(active===first||!dialog.contains(active))){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&(active===last||!dialog.contains(active))){event.preventDefault();first.focus();}
},true);
document.addEventListener('DOMContentLoaded',()=>{
 if(typeof MutationObserver==='undefined')return;
 const root=document.getElementById('modal-root');if(!root)return;
 new MutationObserver(()=>{
  if(root.querySelector('[role="dialog"]')||!modalReturnFocus)return;
  const target=modalReturnFocus.isConnected?modalReturnFocus:document.getElementById('main-content');
  modalReturnFocus=null;target?.focus({preventScroll:true});
 }).observe(root,{childList:true});
});
