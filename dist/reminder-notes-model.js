/* Shared reminder records; the board only adds presentation and note details. */
const ReminderNotes=(()=>{
 const width=1120,noteWidth=240,noteHeight=258,padding=30,colors=['lime','butter','mint','peach','lilac'];
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
 function position(value,index=0){
  const fallback={x:padding+(index%4)*272,y:padding+Math.floor(index/4)*292};
  return {x:clamp(Number.isFinite(value?.x)?value.x:fallback.x,padding,width-noteWidth-padding),y:clamp(Number.isFinite(value?.y)?value.y:fallback.y,padding,20000)};
 }
 function color(record,index=0){return colors.includes(record.noteColor)?record.noteColor:colors[index%colors.length];}
 function height(records){return Math.max(640,...records.map((r,i)=>position(r.notePosition,i).y+noteHeight+120));}
 function validate(values,clients){
  const title=String(values.title||'').trim(),details=String(values.details||'').trim(),due=String(values.due||''),clientId=String(values.clientId||'');
  if(!title||title.length>160)throw new Error('Add a reminder title of 1–160 characters.');
  if(details.length>2000)throw new Error('Keep the note details within 2,000 characters.');
  const date=new Date(due+'T12:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(due)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==due)throw new Error('Choose a valid due date.');
  if(clientId&&!clients.some(c=>c.id===clientId))throw new Error('This client is no longer available. Choose another client.');
  if(!colors.includes(values.noteColor))throw new Error('Choose a note color.');
  if(!['Normal','High','Low'].includes(values.priority))throw new Error('Choose a valid priority.');
  return {title,details,due,clientId,noteColor:values.noteColor,priority:values.priority};
 }
 function matches(record,filter,query,today,clientName=''){
  const status=filter==='all'||(filter==='done'?record.done:filter==='due'?!record.done&&record.due<=today:!record.done);
  return status&&[record.title,record.details,clientName].some(v=>String(v||'').toLowerCase().includes(query.toLowerCase().trim()));
 }
 function vacant(records){
  const used=records.map((r,i)=>position(r.notePosition,i));
  for(let index=0;index<records.length*8+4;index++){
   const p=position(null,index);
   if(used.every(q=>Math.abs(q.x-p.x)>=noteWidth+12||Math.abs(q.y-p.y)>=noteHeight+12))return p;
  }
  return position({x:padding,y:Math.max(...used.map(p=>p.y),0)+292});
 }
 const copy=value=>JSON.parse(JSON.stringify(value));
 function capture(data){
  return (data.reminders||[]).map((r,index)=>({record:copy(r),clientName:(data.clients||[]).find(c=>c.id===r.clientId)?.name||'Personal reminder',color:color(r,index),position:position(r.notePosition,index)}));
 }
 // Runs at the shared save boundary, so assistant commands and linked-record changes are recorded too.
 // Returns a new history value. Failed persistence can restore the original without losing any events.
 function historyFor(data,before,source='Workspace',at=new Date().toISOString()){
  const existing=data.noteHistory,history=existing?{...existing,entries:[...existing.entries],deleted:[...existing.deleted]}:{version:1,startedAt:at,entries:[],deleted:[],sequence:0};
  const after=capture(data),old=new Map((before||[]).map(r=>[r.record.id,r])),current=new Map(after.map(r=>[r.record.id,r]));
  function add(type,r,changes=[]){history.sequence=(history.sequence||0)+1;history.entries.push({id:'note-event-'+history.sequence,noteId:r.id,title:r.title,type,at,source,changes});}
  if(!existing){after.forEach(({record})=>add('tracked',record));return history;}
  for(const next of after){
   const r=next.record,previous=old.get(r.id),deleted=history.deleted.find(d=>d.record.id===r.id);
   if(!previous){add(deleted?'restored':'created',r,deleted&&deleted.record.clientId&&!r.clientId?[{label:'Linked client',before:deleted.clientName,after:'Personal reminder'}]:[]);history.deleted=history.deleted.filter(d=>d.record.id!==r.id);continue;}
   const p=previous.record,changes=[];
   for(const [field,label,fallback] of [['title','Title',''],['details','Details',''],['due','Due date',''],['priority','Priority','Normal']])if((p[field]||fallback)!==(r[field]||fallback))changes.push({label,before:p[field]||fallback,after:r[field]||fallback});
   if((p.clientId||'')!==(r.clientId||''))changes.push({label:'Linked client',before:previous.clientName,after:next.clientName});
   if(r.noteColor&&previous.color!==next.color)changes.push({label:'Paper color',before:previous.color,after:next.color});
   if(changes.length)add('edited',r,changes);
   if(!!p.done!==!!r.done)add(r.done?'completed':'reopened',r);
   if(r.notePosition&&(previous.position.x!==next.position.x||previous.position.y!==next.position.y))add('moved',r);
  }
  for(const previous of before||[]){
   const r=previous.record;if(current.has(r.id))continue;
   add('deleted',r);history.deleted=history.deleted.filter(d=>d.record.id!==r.id);history.deleted.push({record:copy(r),clientName:previous.clientName,deletedAt:at});
  }
  return history;
 }
 return {width,noteWidth,noteHeight,padding,colors,position,color,height,validate,matches,vacant,capture,historyFor};
})();
