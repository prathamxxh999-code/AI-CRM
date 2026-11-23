/* Helpdesk rules are independent of the screen so every entry point uses them. */
const Helpdesk = (() => {
 'use strict';
 const terminal = ['Resolved','Closed','Cancelled'];
 const categories = ['Access','Incident','Service Request','Change Request','Billing','Other'];
 const priorities = ['High','Medium','Low'];
 const transitions = {
  Open:['In progress','Waiting on Client','Waiting on IDSSPL','Escalated','Resolved','Cancelled'],
  'In progress':['Waiting on Client','Waiting on IDSSPL','Escalated','Resolved','Cancelled'],
  'Waiting on Client':['In progress','Waiting on IDSSPL','Escalated','Resolved','Cancelled'],
  'Waiting on IDSSPL':['In progress','Waiting on Client','Escalated','Resolved','Cancelled'],
  Escalated:['In progress','Waiting on Client','Waiting on IDSSPL','Resolved','Cancelled'],
  Resolved:['Closed','Reopened'], Closed:['Reopened'], Cancelled:['Reopened'],
  Reopened:['In progress','Waiting on Client','Waiting on IDSSPL','Escalated','Resolved','Cancelled']
 };
 const defaults = () => ({calendar:{offset:330,start:9,end:18,days:[1,2,3,4,5],holidays:[]},targets:{High:{response:60,resolution:480},Medium:{response:240,resolution:1440},Low:{response:480,resolution:2880}},pauseOnClient:true,closeAfter:1620});
 const clone = x => JSON.parse(JSON.stringify(x));
 const clean = x => String(x||'').trim();
 const iso = x => new Date(x).toISOString();
 const fail = message => {throw new Error(message);};
 const active = t => !t.archivedAt&&!terminal.includes(t.status);
 const affects = (t,branchId) => (t.branchIds||[t.branchId]).includes(branchId);
 const stamp = (t,actor,text,now,type='update') => {t.history ||= [];t.history.push({at:iso(now),actorId:actor.id,by:actor.name,text,status:t.status,type});t.updatedAt=iso(now);if(t.serviceRules&&t.cycleStartedAt)t.due=new Date(Date.parse(deadlines(t,now).resolutionDue)+t.serviceRules.calendar.offset*60000).toISOString().slice(0,10);};
 function actor(s){const a=s.supportUsers.find(u=>u.id===s.helpdesk.actorId&&u.active);if(!a)fail('Choose an active workspace operator in Helpdesk settings.');return a;}
 function dayWindow(time,c){
  const d=new Date(time+c.offset*60000),day=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())-c.offset*60000;
  const date=new Date(day+c.offset*60000).toISOString().slice(0,10);
  return {start:day+c.start*3600000,end:day+c.end*3600000,next:day+86400000,working:c.days.includes(d.getUTCDay())&&!c.holidays.includes(date)};
 }
 function minutes(from,to,c){
  let p=new Date(from).getTime(),end=new Date(to).getTime(),total=0;
  if(!Number.isFinite(p)||!Number.isFinite(end)||end<=p)return 0;
  while(p<end){const d=dayWindow(p,c);if(d.working)total+=Math.max(0,Math.min(end,d.end)-Math.max(p,d.start))/60000;p=d.next;}
  return total;
 }
 function addMinutes(from,amount,c){
  let p=new Date(from).getTime(),remaining=Math.max(0,amount);
  for(let day=0;day<20000;day++){
   const d=dayWindow(p,c);if(d.working){p=Math.max(p,d.start);const room=Math.max(0,(d.end-p)/60000);if(remaining<=room&&p<=d.end)return iso(p+remaining*60000);remaining-=room;}p=d.next;
  }
  fail('Service calendar cannot calculate this deadline.');
 }
 function deadlines(t,now=Date.now()){
  const rules=t.serviceRules||defaults(),c=rules.calendar,target=rules.targets[t.priority]||rules.targets.Medium;
  const end=t.resolvedAt||t.cancelledAt||now,start=t.cycleStartedAt||t.createdAt;
  const pauses=(t.pauses||[]).reduce((n,p)=>n+minutes(p.start,p.end||end,c),0);
  const paused=!!(t.pauses||[]).find(p=>!p.end);
  const responseDue=addMinutes(start,target.response,c),resolutionDue=addMinutes(start,target.resolution+pauses,c);
  return {responseDue,resolutionDue,paused,responseLate:!t.firstResponseAt&&active(t)&&new Date(responseDue)<now,resolutionLate:active(t)&&!paused&&minutes(start,now,c)-pauses>target.resolution};
 }
 function normalize(s,now=Date.now()){
  s.helpdesk ||= {sequence:2481,actorId:'support-demo',rules:defaults()};s.helpdesk.rules ||= defaults();
  s.supportUsers ||= [{id:'support-demo',name:'IDSSPL Demo',team:'Support',active:true}];
  s.tickets ||= [];const seen=new Set();
  s.helpdesk.sequence=Math.max(s.helpdesk.sequence||2481,...s.tickets.map(t=>Number(/^HD-(\d+)$/.exec(t.number||'')?.[1])||0));
  for(const t of s.tickets){
   if(!t.number||seen.has(t.number)){const old=t.number;t.number='HD-'+(++s.helpdesk.sequence);stamp(t,{id:'migration',name:'Workspace migration'},`Case number corrected${old?' from '+old:''} to ${t.number}.`,now,'migration');}seen.add(t.number);
   if(t.helpdeskVersion===1)continue;
   t.branchIds=[...new Set(t.branchIds||[t.branchId].filter(Boolean))];t.scope=t.branchIds.length>1?'Selected branches':t.branchIds.length?'Single branch':'Whole client';t.productId ||= '';t.module ||= '';t.revision ||= 1;
   if(t.scope==='Whole client')t.branchIds=s.branches.filter(b=>b.clientId===t.clientId).map(b=>b.id);
   t.createdAt=t.createdAt||(/^[\d-]{10}$/.test(t.created||'')?iso(t.created+'T09:00:00+05:30'):iso(now));
   t.cycleStartedAt=iso(now);t.trackingStartedAt=iso(now);t.serviceRules=clone(s.helpdesk.rules);t.legacyOwner=t.owner||'';
   t.ownerId=s.supportUsers.find(u=>u.name===t.owner)?.id||'';t.team='Support';
   const c=s.clients.find(c=>c.id===t.clientId);t.requester=t.requester||{name:c?.contact||'',email:c?.email||'',phone:c?.phone||''};
   t.coverage=t.coverage||'Unverified';t.agreementRef=t.agreementRef||'';t.source=t.source||'Internal';t.category=t.category||'Other';
   t.messages ||= [];t.attachments ||= [];t.pauses ||= [];t.sourceMessageIds ||= [];t.sourceThreadIds ||= t.sourceThreadId?[t.sourceThreadId]:[];t.cycles ||= [];
   if(t.status==='Waiting on Client'&&t.serviceRules.pauseOnClient)t.pauses.push({start:iso(now)});
   if(t.status==='Resolved'||t.status==='Closed')t.resolvedAt=t.resolvedAt||iso(now);
   if(t.status==='Cancelled')t.cancelledAt=t.cancelledAt||iso(now);
   stamp(t,{id:'migration',name:'Workspace migration'},'Existing case retained. Service tracking begins now; earlier response times are unknown.',now,'migration');t.helpdeskVersion=1;
  }
  return s;
 }
 function linkedCase(s,message){
  if(!message)return null;
  return s.tickets.find(t=>t.clientId===message.clientId&&((t.sourceMessageIds||[]).includes(message.id)||(message.threadId&&[...(t.sourceThreadIds||[]),t.sourceThreadId].includes(message.threadId))));
 }
 function context(s,input){
  const c=s.clients.find(c=>c.id===input.clientId);if(!c)fail('Select an existing client.');
  if(!['Single branch','Selected branches','Whole client'].includes(input.scope))fail('Choose the affected scope.');
  let ids=[...new Set(input.branchIds||[])];const owned=s.branches.filter(b=>b.clientId===c.id);
  if(ids.some(id=>!owned.some(b=>b.id===id)))fail('Every affected branch must belong to the selected client.');
  if(input.scope==='Whole client')ids=owned.filter(b=>!input.productId||s.deployments.some(d=>d.branchId===b.id&&d.productId===input.productId&&(!input.module||(d.modules||[]).includes(input.module)))).map(b=>b.id);
  if(input.scope==='Single branch'&&ids.length!==1)fail('Choose exactly one affected branch.');
  if(input.scope==='Selected branches'&&ids.length<2)fail('Choose at least two affected branches, or use Single branch.');
  if(input.module&&!input.productId)fail('Choose a product before a module.');
  if(input.productId&&(!s.products.some(p=>p.id===input.productId)||!ids.length||ids.some(id=>!s.deployments.some(d=>d.clientId===c.id&&d.branchId===id&&d.productId===input.productId&&(!input.module||(d.modules||[]).includes(input.module))))))fail('The selected product and module must be deployed at every affected branch.');
  return {clientId:c.id,scope:input.scope,branchIds:ids,branchId:ids.length===1?ids[0]:'',productId:input.productId||'',module:input.module||''};
 }
 function fields(s,input){
  const subject=clean(input.subject),description=clean(input.description),requester={name:clean(input.requester?.name),email:clean(input.requester?.email),phone:clean(input.requester?.phone)};
  if(!subject||subject.length>160||!description||description.length>10000)fail('Add a summary (up to 160 characters) and description (up to 10,000).');
  if(!requester.name||(!requester.email&&!requester.phone))fail('Add the requester’s name and email or phone.');
  if(requester.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requester.email))fail('Enter a valid requester email.');
  if(!categories.includes(input.category)||!priorities.includes(input.priority))fail('Choose a valid category and priority.');
  if(!['Email','Phone','Portal','Internal'].includes(input.source))fail('Choose the request source.');
  const user=s.supportUsers.find(u=>u.id===input.ownerId&&u.active);if(input.ownerId&&!user)fail('Choose an active team member.');
  if(!['Unverified','Covered support','Quotation required','Chargeable approved'].includes(input.coverage))fail('Choose the support coverage.');
  if(['Covered support','Chargeable approved'].includes(input.coverage)&&!clean(input.agreementRef))fail('Add the support agreement or approved quotation reference.');
  if(input.category==='Change Request'&&input.coverage==='Covered support'&&!clean(input.agreementRef))fail('Confirm the agreement covering this change.');
  return {...context(s,input),subject,description,requester,category:input.category,priority:input.priority,source:input.source,ownerId:user?.id||'',owner:user?.name||'Unassigned',team:user?.team||'Support',coverage:input.coverage,agreementRef:clean(input.agreementRef)};
 }
 function create(s,input,now=Date.now()){
  if(!input.id||s.tickets.some(t=>t.id===input.id))fail('A unique case identifier is required.');
  const a=actor(s),data=fields(s,input),message=input.sourceMessageId?s.messages.find(m=>m.id===input.sourceMessageId):null;
  if(input.sourceMessageId&&(!message||message.clientId!==data.clientId))fail('The source email must belong to this client.');
  const linked=linkedCase(s,message);if(linked)fail(`This conversation already belongs to ${linked.number}. Open that case instead.`);
  const duplicate=s.tickets.find(t=>active(t)&&t.clientId===data.clientId&&t.subject.toLowerCase()===data.subject.toLowerCase()&&t.productId===data.productId&&JSON.stringify([...t.branchIds].sort())===JSON.stringify([...data.branchIds].sort()));
  if(duplicate&&!clean(input.duplicateReason))fail(`Possible duplicate: ${duplicate.number}. Add a reason if this is a separate issue.`);
  const t={...data,id:input.id,number:'HD-'+(++s.helpdesk.sequence),status:'Open',created:iso(now).slice(0,10),createdAt:iso(now),cycleStartedAt:iso(now),trackingStartedAt:iso(now),serviceRules:clone(s.helpdesk.rules),helpdeskVersion:1,history:[],messages:[],attachments:[],pauses:[],cycles:[],sourceMessageIds:[],sourceThreadIds:[],revision:1};
  if(message){t.source='Email';t.sourceMessageIds=[message.id];t.sourceThreadIds=message.threadId?[message.threadId]:[];t.messages.push({id:message.id,at:iso(now),direction:'incoming',visibility:'client',text:message.body||message.snippet||'',by:message.from||message.email,sourceMessageId:message.id});copyEmailFiles(t,message,now);}
  stamp(t,a,'Case created.'+(input.duplicateReason?' Separate issue: '+clean(input.duplicateReason):''),now,'created');s.tickets.unshift(t);return t;
 }
 function editable(s,id,revision){const t=s.tickets.find(t=>t.id===id);if(!t)fail('This case no longer exists.');if(t.archivedAt)fail('Restore this case before changing it.');if(revision!==undefined&&Number(revision)!==Number(t.revision||1))fail('This case changed. Reopen the form to review the latest version.');return t;}
 function edit(s,id,input,now=Date.now()){
  const t=editable(s,id,input.revision),a=actor(s);if(terminal.includes(t.status))fail('Reopen this case before editing its details.');
  const data=fields(s,input);if(data.clientId!==t.clientId)fail('A case cannot move to another client. Create a separate case.');
  if(t.status!=='Open'&&!data.ownerId)fail('Keep an assigned owner while this case is in progress.');
  if(t.sourceMessageIds.length&&data.source!=='Email')fail('Keep Email as the source of a linked conversation.');
  if(!clean(input.reason))fail('Explain the correction for the case history.');
  const changes=Object.keys(data).filter(k=>JSON.stringify(t[k])!==JSON.stringify(data[k]));if(!changes.length)fail('No case details changed.');
  const before=clone(t);Object.assign(t,data);t.revision=(t.revision||1)+1;
  stamp(t,a,'Case details corrected: '+clean(input.reason),now,'details');t.history.at(-1).changes=Object.fromEntries(changes.map(k=>[k,{from:before[k],to:data[k]}]));return t;
 }
 function transition(s,id,input,now=Date.now()){
  const t=editable(s,id,input.revision),a=actor(s),next=input.status,note=clean(input.note),same=next===t.status;
  if(!same&&!(transitions[t.status]||[]).includes(next))fail(`Move ${t.status} cases through the permitted next step.`);
  if(!same&&!note)fail('Add a reason or update when changing status.');
  const owner=s.supportUsers.find(u=>u.id===input.ownerId&&u.active);if(input.ownerId&&!owner)fail('Select an active owner.');
  if(!priorities.includes(input.priority))fail('Choose a valid priority.');
  if(!['Open','Cancelled','Closed'].includes(next)&&!owner)fail('Assign an owner before progressing this case.');
  if(terminal.includes(t.status)&&same)fail('Reopen the case before making further updates.');
  if(next==='Resolved'&&!same&&note.length<10)fail('Describe the solution in at least 10 characters.');
  if(next==='Closed'){
   if(!t.resolution)fail('Record a resolution before closing.');
   if(input.closure==='Client confirmed'){if(!clean(input.confirmedBy))fail('Record who confirmed the solution.');}
   else if(input.closure==='No-response policy'){
    if(!t.resolutionCommunicatedAt)fail('Record the resolution sent to the client before using the no-response policy.');
    const since=[t.resolvedAt,t.resolutionCommunicatedAt,t.lastIncomingAt].filter(Boolean).sort().at(-1);
    if(minutes(since,now,t.serviceRules.calendar)<t.serviceRules.closeAfter)fail('The no-response waiting period has not elapsed.');
   }else fail('Choose client confirmation or the no-response closure policy.');
  }
  const changed=next!==t.status||input.ownerId!==t.ownerId||input.priority!==t.priority;if(!changed&&!note)fail('Change a field or add an update.');
  const before={status:t.status,owner:t.owner,priority:t.priority};
  if(next!==t.status){for(const pause of t.pauses)if(!pause.end)pause.end=iso(now);}
  if(next==='Reopened'&&!same){t.cycles.push({startedAt:t.cycleStartedAt,resolvedAt:t.resolvedAt,closedAt:t.closedAt,firstResponseAt:t.firstResponseAt,resolution:t.resolution,pauses:clone(t.pauses)});t.cycleStartedAt=iso(now);t.firstResponseAt=null;t.resolvedAt=null;t.closedAt=null;t.cancelledAt=null;t.resolutionCommunicatedAt=null;t.resolution='';t.pauses=[];t.escalatedAt=null;}
  if(next==='Waiting on Client'&&!same&&t.serviceRules.pauseOnClient)t.pauses.push({start:iso(now)});
  if(next==='Resolved'&&!same){t.resolution=note;t.resolvedAt=iso(now);}
  if(next==='Cancelled'&&!same)t.cancelledAt=iso(now);
  if(next==='Closed'&&!same){t.closedAt=iso(now);t.closure={method:input.closure,confirmedBy:clean(input.confirmedBy),reason:note};}
  t.status=next;t.ownerId=owner?.id||'';t.owner=owner?.name||'Unassigned';t.team=owner?.team||'Support';t.priority=input.priority;t.revision=(t.revision||1)+1;
  stamp(t,a,`${before.status} → ${next}; owner: ${before.owner} → ${t.owner}; priority: ${before.priority} → ${t.priority}. ${note}`,now,'status');return t;
 }
 function addMessage(s,id,input,now=Date.now()){
  let t=editable(s,id,input.revision);const a=actor(s),text=clean(input.text);
  if(!text||text.length>10000)fail('Add a message of up to 10,000 characters.');
  if(!['internal','incoming','outgoing'].includes(input.direction))fail('Choose the message type.');
  if(input.direction==='outgoing'&&!input.sentConfirmed)fail('Confirm this message was already sent outside the CRM. Saving a draft does not count as a response.');
  if(input.direction==='incoming'&&terminal.includes(t.status)){
   if(!t.ownerId)fail('Assign an active owner using Reopen before recording this client follow-up.');
   t=transition(s,id,{status:'Reopened',ownerId:t.ownerId,priority:t.priority,note:'Client follow-up: '+text},now);
  }else if(input.direction==='incoming'&&t.status==='Waiting on Client')t=transition(s,id,{status:'In progress',ownerId:t.ownerId,priority:t.priority,note:'Client replied: '+text},now);
  t.messages.push({id:input.id,at:iso(now),direction:input.direction,visibility:input.direction==='internal'?'internal':'client',text,by:input.direction==='incoming'?t.requester.name:a.name,recordedBy:a.name,actorId:a.id});
  if(input.direction==='incoming')t.lastIncomingAt=iso(now);
  if(input.direction==='outgoing'){t.firstResponseAt ||= iso(now);if(t.status==='Resolved')t.resolutionCommunicatedAt=iso(now);}
  t.revision=(t.revision||1)+1;stamp(t,a,input.direction==='internal'?'Internal note added.':input.direction==='incoming'?'Client reply recorded.':'Previously sent client response recorded.',now,'message');return t;
 }
 function archive(s,id,reason,restore=false,now=Date.now()){
  const t=s.tickets.find(t=>t.id===id),a=actor(s);if(!t)fail('Case not found.');if(!clean(reason))fail('Add a reason.');
  if(!restore&&!['Closed','Cancelled'].includes(t.status))fail('Close or cancel this case before archiving.');
  if(restore&&!t.archivedAt)fail('This case is already available.');if(!restore&&t.archivedAt)fail('This case is already archived.');
  t.archivedAt=restore?null:iso(now);t.revision=(t.revision||1)+1;stamp(t,a,(restore?'Restored: ':'Archived: ')+clean(reason),now,'archive');return t;
 }
 function copyEmailFiles(t,message,now){
  for(const [i,file] of (message.attachments||[]).entries()){
   try{validateAttachment(file);if(!/^data:[^,]*;base64,/.test(file.dataUrl||''))continue;if(t.attachments.length>=10||t.attachments.reduce((n,f)=>n+f.size,0)+file.size>2000000)continue;t.attachments.push({...clone(file),id:`mail-${message.id}-${i}`,visibility:'client',sourceMessageId:message.id,at:iso(now)});}catch{/* Unsupported evidence stays accessible from its original email. */}
  }
 }
 function linkMail(s,id,messageId,now=Date.now()){
  const t=editable(s,id),message=s.messages.find(m=>m.id===messageId);if(!message||message.clientId!==t.clientId)fail('Choose an email from the same client.');
  if(t.sourceMessageIds.includes(messageId))return t;
  const linked=linkedCase(s,message);if(linked&&linked.id!==id)fail(`This conversation already belongs to ${linked.number}.`);
  addMessage(s,id,{id:'mail-'+messageId,direction:'incoming',text:message.body||message.snippet||message.subject},now);
  t.sourceMessageIds.push(messageId);t.sourceThreadIds=[...new Set([...(t.sourceThreadIds||[]),...(message.threadId?[message.threadId]:[])])];
  t.messages.at(-1).sourceMessageId=messageId;t.messages.at(-1).by=message.from||message.email||t.requester.name;copyEmailFiles(t,message,now);
  stamp(t,actor(s),'Linked email: '+message.subject,now,'email');return t;
 }
 function escalate(s,now=Date.now()){
  let changed=false;
  for(const t of s.tickets){if(!active(t)||t.escalatedAt)continue;const due=deadlines(t,now);if(!due.responseLate&&!due.resolutionLate)continue;t.escalatedAt=iso(now);stamp(t,{id:'service-clock',name:'Service clock'},`${due.responseLate?'First response':'Resolution'} target exceeded. Support lead review required.`,now,'escalation');changed=true;}
  return changed;
 }
 function validateAttachment(file){
  if(!file||!clean(file.name)||file.name.length>180)fail('Choose a file with a valid name.');
  if(!/\.(pdf|png|jpe?g|webp|txt|csv|docx|xlsx|log)$/i.test(file.name))fail('Use PDF, PNG, JPG, WebP, text, CSV, DOCX, XLSX or log files.');
  if(!Number.isFinite(file.size)||file.size<=0||file.size>750000)fail('Each attachment must be between 1 byte and 750 KB.');
 }
 return {defaults,categories,priorities,transitions,terminal,active,affects,actor,normalize,minutes,addMinutes,deadlines,linkedCase,linkMail,context,fields,create,edit,transition,addMessage,archive,escalate,stamp,validateAttachment};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=Helpdesk;
