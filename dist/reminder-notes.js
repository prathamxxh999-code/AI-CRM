(() => {
 'use strict';
 const N=ReminderNotes;
 const defaultZoom=1.2,seenNotes=new Set();
 let noteFilter='open',query='',zoom=defaultZoom,editorSnapshot=null,deleteReview=null,undoRecord=null,drag=null,externalChange=false;
 let historyScope='',historyTab='notes',historyQuery='',historyPage=1,historySnapshot=null;
 const get=id=>byId('reminders',id);
 const stamp=()=>localStorage.getItem(STORE_KEY);
 function commit(change,expected){
  const current=stamp(),latest=JSON.parse(current||'null');
  if(externalChange||(expected!==undefined&&current!==expected)||(latest?.helpdesk?.changeVersion||0)>(state.helpdesk?.changeVersion||0))throw new Error('The workspace changed in another view or tab. Reload and reopen this note before saving.');
  const before=JSON.stringify(state);
  try{state.reminders.forEach((r,i)=>{r.notePosition=N.position(r.notePosition,i);r.noteColor=N.color(r,i);});change();if(state.helpdesk)state.helpdesk.changeVersion=(state.helpdesk.changeVersion||0)+1;save('Reminder board');}
  catch(error){state=JSON.parse(before);if(error.name==='QuotaExceededError')throw new Error('Browser storage is full. Your change was not saved. Free some space and try again.');throw error;}
 }
 function feedback(error){const target=$('#modal-root .form-error');if(target)target.textContent=error.message;else toast(error.message);}
 function refresh(message){$('#modal-root').innerHTML='';render();if(message)toast(message);}
 function dueLabel(r){return r.done?'Completed':r.due===localDate(0)?'Due today':r.due<localDate(0)?'Overdue · '+prettyDate(r.due):prettyDate(r.due);}
 function card(r,index){
  const p=N.position(r.notePosition,index),client=byId('clients',r.clientId),color=N.color(r,index),entering=!seenNotes.has(r.id);seenNotes.add(r.id);
  return `<article class="sticky-note${r.done?' is-done':''}${entering?' is-entering':''}" data-note-id="${esc(r.id)}" data-color="${color}" style="left:${p.x}px;top:${p.y}px;--note-rotation:${[-1.2,1.1,-.6,.8][index%4]}deg;--note-delay:${Math.min(index,8)*45}ms" aria-label="${esc(r.title)}">
   <div class="note-top"><button class="note-grip" type="button" data-note-drag="${esc(r.id)}" aria-label="Move ${esc(r.title)}. Use arrow keys to move, Shift for larger steps." title="Drag the pin or top edge to move · arrow keys also work"><span class="note-pin" aria-hidden="true"><i></i></span>${r.done?'ALL DONE':'REMINDER'}</button><button class="note-menu" type="button" data-note-action="menu" data-id="${esc(r.id)}" aria-label="Actions for ${esc(r.title)}" aria-haspopup="menu" aria-expanded="false">⋯</button></div>
   <button class="note-content" type="button" data-note-action="read" data-id="${esc(r.id)}"><h2>${esc(r.title)}</h2>${r.details?`<p>${esc(r.details)}</p>`:''}<span class="note-client">${esc(client?.name||'Personal reminder')}</span></button>
   <div class="note-footer"><button class="note-check" type="button" data-note-action="toggle" data-id="${esc(r.id)}" aria-label="${r.done?'Reopen':'Complete'} ${esc(r.title)}" aria-pressed="${!!r.done}">${icon('check')}</button><span class="note-date${!r.done&&r.due<localDate(0)?' is-overdue':''}">${dueLabel(r)}</span>${r.priority==='High'?'<span class="note-priority">HIGH</span>':''}</div>
  </article>`;
 }
 window.renderReminderBoard=function(){
  const all=state.reminders,today=localDate(0),shown=all.map((r,i)=>({r,i})).filter(({r})=>N.matches(r,noteFilter,query,today,nameOf('clients',r.clientId)));
  const counts={all:all.length,open:all.filter(r=>!r.done).length,due:all.filter(r=>!r.done&&r.due<=today).length,done:all.filter(r=>r.done).length},height=N.height(all);
  return `<div class="notes-page"><header class="notes-heading"><div class="notes-heading-copy"><span class="notes-eyebrow">A LITTLE SPACE FOR WHAT’S NEXT</span><h1>Reminder board</h1><p>Your follow-ups, ideas and little things to remember. Make room for what matters.</p></div></header>
   <section class="notes-workbench" aria-label="Reminder sticky notes"><div class="notes-toolbar"><div class="notes-tabs" role="group" aria-label="Filter reminders">${[['open','Open'],['due','Due now'],['done','Completed'],['all','All notes']].map(([value,label])=>`<button type="button" data-note-filter="${value}" aria-pressed="${noteFilter===value}">${label}<span>${counts[value]}</span></button>`).join('')}</div><div class="notes-tools"><label class="notes-search">${icon('search')}<input id="notes-search" type="search" value="${esc(query)}" placeholder="Find a note…" aria-label="Search reminder notes"></label><button class="notes-arrange" type="button" data-note-action="arrange" title="Arrange all notes into a tidy grid">Arrange notes ↗</button><button class="notes-history-trigger" type="button" data-note-action="history">${icon('calendar')} History</button><button class="btn notes-new-reminder" type="button" data-note-action="new">${icon('plus')} New Reminder</button></div></div>
   <div class="notes-scroll" tabindex="0" role="region" aria-label="Sticky note canvas. Scroll to see more notes."><div class="notes-scaled" style="width:${N.width*zoom}px;height:${height*zoom}px"><div class="notes-canvas" style="width:${N.width}px;height:${height}px;transform:scale(${zoom})">${shown.map(({r,i})=>card(r,i)).join('')||`<div class="notes-empty"><span class="notes-eyebrow">A LITTLE BREATHING ROOM</span><h2>${query?'No matching notes':noteFilter==='done'?'Your wins will live here':noteFilter==='due'?'You’re all caught up':'A fresh space for your next idea'}</h2><p>${query?'Try another title, detail or client name.':noteFilter==='done'?'Mark a reminder complete and find it here.':'Add a note, choose a color and keep your next step in sight.'}</p><small>Use New Reminder above to add a note.</small></div>`}</div></div></div>
   <footer class="notes-footer"><span>Drag the pin or top edge to move · Click a note to open</span><div class="notes-zoom"><button type="button" data-note-action="zoom-out" aria-label="Zoom out" ${zoom<=.6?'disabled':''}>−</button><span>${Math.round(zoom*100)}%</span><button type="button" data-note-action="zoom-in" aria-label="Zoom in" ${zoom>=1.4?'disabled':''}>+</button><button type="button" data-note-action="zoom-reset" aria-label="Reset to default note size">Reset</button></div><span>${shown.length} ${shown.length===1?'note':'notes'} · Saved in this browser</span></footer></section></div>`;
 };
 function openEditor(id=''){
  const r=id?get(id):null;if(id&&!r){toast('This reminder no longer exists.');return;}
  try{editorSnapshot=stamp();}catch(error){feedback(error);return;}
  const color=N.color(r||{},r?state.reminders.indexOf(r):state.reminders.length);
  const body=`<form id="note-editor-form" data-id="${esc(id)}"><div class="field"><label for="note-title">Reminder *</label><input id="note-title" name="title" value="${esc(r?.title||'')}" maxlength="160" required placeholder="What do you want to remember?"></div><div class="field"><label for="note-details">Details</label><textarea id="note-details" name="details" maxlength="2000" placeholder="A little context, a checklist or the next step…">${esc(r?.details||'')}</textarea></div><div class="form-grid"><div class="field"><label for="note-due">Due date *</label><input id="note-due" type="date" name="due" value="${esc(r?.due||localDate(0))}" required></div><div class="field"><label for="note-priority">Priority</label><select id="note-priority" name="priority">${['Normal','High','Low'].map(value=>`<option ${r?.priority===value?'selected':''}>${value}</option>`).join('')}</select></div></div><div class="field"><label for="note-client">Linked client</label><select id="note-client" name="clientId"><option value="">Personal reminder</option>${state.clients.map(c=>`<option value="${esc(c.id)}" ${r?.clientId===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><fieldset class="note-color-options"><legend>Paper color</legend>${N.colors.map(value=>`<label title="${value}"><input type="radio" name="noteColor" value="${value}" ${color===value?'checked':''} aria-label="${value} paper"><span class="note-color-${value}"></span></label>`).join('')}</fieldset><p class="form-error" role="alert"></p></form>`;
  modal(id?'Edit note':'A new little reminder','Add the detail you need, then give it a place on your board.',body,`<button class="btn" type="button" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="note-editor-form">${id?'Save note':'Add to board'}</button>`);
  $('#modal-root .modal')?.classList.add('note-editor-modal');$('#note-title')?.focus();
 }
 function readNote(id){
  const r=get(id);if(!r)return;
  modal(r.title,'Reminder note',`<div class="note-detail-meta"><span>${esc(dueLabel(r))}</span><span>${esc(r.priority||'Normal')} priority</span><span>${esc(byId('clients',r.clientId)?.name||'Personal reminder')}</span></div><div class="note-detail-text">${esc(r.details||'No extra details yet.')}</div><button class="note-detail-history" type="button" data-note-action="history" data-id="${esc(id)}">${icon('calendar')} View note history ↗</button>${r.clientId?`<button class="btn" type="button" data-note-action="client" data-id="${esc(r.id)}">Open client profile ↗</button>`:''}`,`<button class="btn" type="button" data-note-action="delete" data-id="${esc(id)}">Delete</button><button class="btn" type="button" data-note-action="edit" data-id="${esc(id)}">Edit note</button><button class="btn btn-primary" type="button" data-note-action="toggle" data-id="${esc(id)}">${r.done?'Reopen reminder':'Mark complete'}</button>`);
 }
 function removeReview(id){
  const r=get(id);if(!r)return;deleteReview={id,snapshot:stamp()};
  modal('Delete this note?',r.title,'<p>This removes the note from the board and your assistant’s reminders. Its history is kept, and you can restore it from History → Deleted notes.</p><p class="form-error" role="alert"></p>',`<button class="btn" type="button" data-action="close-modal">Keep note</button><button class="btn btn-danger" type="button" data-note-action="confirm-delete" data-id="${esc(id)}">Delete note</button>`);
 }
 const eventLabels={tracked:'History tracking started',created:'Created note',edited:'Edited note',completed:'Completed reminder',reopened:'Reopened reminder',deleted:'Deleted note',restored:'Restored note',moved:'Moved on board'};
 const historyTime=value=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'Time not recorded';
 function historyEntry(entry){
  return `<li class="note-history-event" data-event-type="${esc(entry.type)}"><span class="note-history-dot" aria-hidden="true"></span><div><div class="note-history-event-heading"><strong>${esc(eventLabels[entry.type]||'Updated note')}</strong><time datetime="${esc(entry.at)}">${esc(historyTime(entry.at))}</time></div>${historyScope?'':`<button class="note-history-title" type="button" data-note-action="history" data-id="${esc(entry.noteId)}">${esc(entry.title)}</button>`}<small>${esc(entry.source||'Workspace')}${entry.type==='tracked'?' · Earlier activity was not recorded':''}</small>${entry.changes?.length?`<details class="note-history-changes"><summary>View ${entry.changes.length===1?'change':entry.changes.length+' changes'}</summary>${entry.changes.map(change=>`<div class="note-history-change"><strong>${esc(change.label)}</strong><div><span>Before</span><p>${esc(change.before||'Not set')}</p></div><div><span>After</span><p>${esc(change.after||'Not set')}</p></div></div>`).join('')}</details>`:''}</div></li>`;
 }
 function historyNote(record){
  const client=byId('clients',record.clientId)?.name||'Personal reminder',status=record.done?'Completed':record.due<localDate(0)?'Overdue':'Open';
  return `<button class="note-history-deleted-item note-history-existing" type="button" data-note-action="read" data-id="${esc(record.id)}" aria-label="Open ${esc(record.title)}"><span>${icon('note')}</span><div><div class="note-history-note-heading"><strong>${esc(record.title)}</strong><span class="note-history-status ${record.done?'is-completed':status==='Overdue'?'is-overdue':''}">${status}</span></div><small>${esc(client)} · Due ${esc(prettyDate(record.due))}${record.createdAt?' · Created '+esc(historyTime(record.createdAt)):''}</small>${record.details?`<p>${esc(record.details)}</p>`:''}</div><span aria-hidden="true">↗</span></button>`;
 }
 function openHistory(id=historyScope,tab=historyTab){
  historyScope=id;historyTab=tab;historySnapshot=stamp();
  const history=state.noteHistory||{entries:[],deleted:[]},archived=history.deleted.find(d=>d.record.id===id),record=id?(get(id)||archived?.record):null;
  const entries=history.entries.filter(e=>(!id||e.noteId===id)),deleted=history.deleted.filter(d=>!id||d.record.id===id),notes=state.reminders.filter(r=>!id||r.id===id),q=historyQuery.trim().toLowerCase();
  const matches=value=>String(value||'').toLowerCase().includes(q);
  const noteList=tab==='notes'||tab==='completed';
  const rows=noteList?notes.filter(r=>(tab!=='completed'||r.done)&&(matches(r.title)||matches(r.details)||matches(byId('clients',r.clientId)?.name))).slice().sort((a,b)=>String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||''))):tab==='deleted'?deleted.filter(d=>matches(d.record.title)||matches(d.record.details)||matches(d.clientName)).slice().reverse():entries.filter(e=>matches(e.title)||matches(eventLabels[e.type])||e.changes?.some(c=>matches(c.before)||matches(c.after))).slice().reverse();
  const pages=Math.max(1,Math.ceil(rows.length/20));historyPage=Math.min(pages,Math.max(1,historyPage));
  const shown=rows.slice((historyPage-1)*20,historyPage*20);
  const content=noteList?`<div class="note-history-deleted">${shown.map(historyNote).join('')}</div>`:tab==='deleted'?`<div class="note-history-deleted">${shown.map(d=>`<button class="note-history-deleted-item" type="button" data-note-action="history" data-id="${esc(d.record.id)}"><span>${icon('note')}</span><div><strong>${esc(d.record.title)}</strong><small>Deleted ${esc(historyTime(d.deletedAt))} · ${esc(d.clientName)}</small><p>${esc(d.record.details||'Open to see history and restore this note.')}</p></div><span aria-hidden="true">↗</span></button>`).join('')}</div>`:`<ol class="note-history-timeline">${shown.map(historyEntry).join('')}</ol>`;
  const tabs=id?[['activity','Activity',entries.length],['deleted','Deleted notes',deleted.length]]:[['notes','All notes',notes.length],['completed','Completed',notes.filter(r=>r.done).length],['deleted','Deleted',deleted.length],['activity','Activity',entries.length]];
  const notice=noteList?'All existing notes are included here, including notes added before activity tracking. Open a note to view its details and history.':tab==='deleted'?'Deleted notes kept in this workspace can be restored here.':`Activity recorded since ${esc(historyTime(history.startedAt))}. Earlier changes and previously deleted notes aren’t available.`;
  const body=`<div class="note-history-controls"><div class="note-history-tabs" role="group" aria-label="History views">${tabs.map(([value,label,count])=>`<button type="button" data-note-action="history-tab" data-tab="${value}" aria-pressed="${tab===value}">${label} <span>${count}</span></button>`).join('')}</div><input id="note-history-search" type="search" placeholder="${noteList?'Search all notes…':'Search history…'}" value="${esc(historyQuery)}" aria-label="Search note history"></div>${record?`<div class="note-history-record"><strong>${esc(record.title)}</strong><span>${archived?'Deleted · available to restore':record.done?'Completed reminder':'Open reminder'}</span></div>`:''}<p class="note-history-notice">${notice}</p>${shown.length?content:`<div class="note-history-empty">${q?'No matching notes or activity. Try another search.':tab==='completed'?'No completed notes yet.':tab==='notes'?'No notes yet. Add your first reminder from the board.':tab==='deleted'?'No deleted notes. Deleted notes will be kept here for restoration.':'No activity recorded for this note yet.'}</div>`}<div class="note-history-pagination"><span>${rows.length?`${(historyPage-1)*20+1}–${Math.min(historyPage*20,rows.length)} of ${rows.length}`:'0 records'}</span><button class="btn" type="button" data-note-action="history-prev" ${historyPage===1?'disabled':''}>Previous</button><button class="btn" type="button" data-note-action="history-next" ${historyPage===pages?'disabled':''}>Next</button></div><p class="form-error" role="alert"></p>`;
  modal(id?'Note history':'Reminder history',id?'Recorded activity for this note.':'All your existing notes, including open and completed reminders.',body,`${id?'<button class="btn" type="button" data-note-action="history">All notes</button>':''}<button class="btn" type="button" data-action="close-modal">Close</button>${record?`<button class="btn btn-primary" type="button" data-note-action="${archived?'restore':'read'}" data-id="${esc(id)}">${archived?'Restore note':'Open note'}</button>`:''}`);
  $('#modal-root .modal')?.classList.add('note-history-modal');
 }
 function restoreNote(id,expected){
  let restored;
  commit(()=>{
   if(get(id))throw new Error('This note is already on the board.');
   const archived=state.noteHistory?.deleted.find(d=>d.record.id===id);if(!archived)throw new Error('This deleted note is no longer available. Reopen History.');
   restored=JSON.parse(JSON.stringify(archived.record));
   if(restored.clientId&&!byId('clients',restored.clientId))restored.clientId='';
   const p=restored.notePosition&&N.position(restored.notePosition),overlaps=!p||state.reminders.some((r,i)=>{const q=N.position(r.notePosition,i);return Math.abs(p.x-q.x)<N.noteWidth+12&&Math.abs(p.y-q.y)<N.noteHeight+12;});
   restored.notePosition=overlaps?N.vacant(state.reminders):p;state.reminders.push(restored);
  },expected);
  undoRecord=null;noteFilter=restored.done?'done':'open';query='';refresh('Note restored. Its history is preserved.');
 }
 function menu(trigger,id){
  const r=get(id);if(!r)return;
  toggleRowActionMenu(trigger,`Actions for ${r.title}`,`${[['read','Open note'],['edit','Edit note'],['history','View history'],['toggle',r.done?'Reopen reminder':'Mark complete'],['delete','Delete note']].map(([action,label])=>`<button type="button" role="menuitem" data-note-action="${action}" data-id="${esc(id)}"${action==='delete'?' class="client-row-menu-danger"':''}>${label}</button>`).join('')}`);
 }
 const originalOpenForm=openForm;
 openForm=function(type){if(type==='reminder')return openEditor();return originalOpenForm(type);};
 openReminderEditor=openEditor;
 document.addEventListener('submit',event=>{
  const form=event.target;if(form.id!=='note-editor-form')return;event.preventDefault();
  try{
   const values=N.validate(Object.fromEntries(new FormData(form)),state.clients),id=form.dataset.id,newId=id||uid('r');
   commit(()=>{if(id){const r=get(id);if(!r)throw new Error('This reminder was deleted. Close the form and refresh.');Object.assign(r,values,{updatedAt:new Date().toISOString()});}else state.reminders.push({id:newId,...values,done:false,notePosition:N.vacant(state.reminders),createdAt:new Date().toISOString()});},editorSnapshot);
   if(!id){noteFilter='open';query='';}refresh(id?'Note updated.':'Reminder added to your board.');
   if(view==='reminders')$(`[data-note-id="${CSS.escape(newId)}"]`)?.scrollIntoView({block:'nearest',inline:'nearest'});
  }catch(error){feedback(error);}
 });
 document.addEventListener('click',event=>{
  const filterButton=event.target.closest('[data-note-filter]');if(filterButton){noteFilter=filterButton.dataset.noteFilter;render();return;}
  let button=event.target.closest('[data-note-action]'),action=button?.dataset.noteAction,id=button?.dataset.id;
  const legacy=event.target.closest('[data-action="delete-reminder"], [data-action="complete-reminder"], [data-action="reopen-reminder"]');
  if(legacy){button=legacy;id=legacy.dataset.id;action=legacy.dataset.action==='delete-reminder'?'delete':'toggle';}
  if(!button)return;event.preventDefault();event.stopImmediatePropagation();
  if(action!=='menu')closeClientRowMenu();
  try{
   if(action==='new')openEditor();
   else if(action==='edit')openEditor(id);
   else if(action==='read')readNote(id);
   else if(action==='history'){historyQuery='';historyPage=1;openHistory(id||'',id?'activity':'notes');}
   else if(action==='history-tab'){historyQuery='';historyPage=1;openHistory(historyScope,button.dataset.tab);}
   else if(action==='history-prev'||action==='history-next'){historyPage+=action==='history-prev'?-1:1;openHistory();}
   else if(action==='restore')restoreNote(id,historySnapshot);
   else if(action==='menu')menu(button,id);
   else if(action==='delete')removeReview(id);
   else if(action==='toggle'){const r=get(id);if(!r)return;const completed=!r.done;commit(()=>{r.done=completed;r.completedAt=completed?new Date().toISOString():null;});refresh(completed?'Reminder completed. Find it under Completed.':'Reminder reopened.');}
   else if(action==='confirm-delete'){
    if(deleteReview?.id!==id)return;
    let removed;commit(()=>{const r=get(id);if(!r)throw new Error('This note was already deleted.');removed=JSON.parse(JSON.stringify(r));state.reminders=state.reminders.filter(r=>r.id!==id);},deleteReview.snapshot);
    undoRecord=removed;deleteReview=null;refresh('Note deleted.');$('#toast-root .toast')?.insertAdjacentHTML('beforeend',' <button type="button" data-note-action="undo">Undo</button>');
   }else if(action==='undo'&&undoRecord)restoreNote(undoRecord.id);
   else if(action==='client'){const r=get(id);if(r&&byId('clients',r.clientId)){$('#modal-root').innerHTML='';selectedClientId=r.clientId;profileTab='overview';setView('profile');}}
   else if(action==='arrange'){commit(()=>{state.reminders.forEach((r,i)=>r.notePosition=N.position(null,i));});render();toast('Notes arranged.');}
   else if(action.startsWith('zoom-')){zoom=action==='zoom-reset'?defaultZoom:Math.max(.6,Math.min(1.4,Math.round((zoom+(action==='zoom-in'?0.1:-0.1))*10)/10));render();}
  }catch(error){feedback(error);}
 },true);
 document.addEventListener('input',event=>{if(event.target.id!=='notes-search')return;const cursor=event.target.selectionStart;query=event.target.value;render();const input=$('#notes-search');input?.focus();input?.setSelectionRange(cursor,cursor);});
 document.addEventListener('input',event=>{if(event.target.id!=='note-history-search')return;const cursor=event.target.selectionStart;historyQuery=event.target.value;historyPage=1;openHistory();const input=$('#note-history-search');input?.focus();input?.setSelectionRange(cursor,cursor);});
 function cancelDrag(){if(!drag)return;const current=drag;drag=null;current.card.style.left=current.start.x+'px';current.card.style.top=current.start.y+'px';current.card.classList.remove('is-dragging');if(current.handle.hasPointerCapture?.(current.pointerId))current.handle.releasePointerCapture(current.pointerId);}
 document.addEventListener('pointerdown',event=>{
  const handle=event.target.closest('[data-note-drag]');if(!handle||event.button!==0||event.isPrimary===false)return;
  const r=get(handle.dataset.noteDrag),card=handle.closest('.sticky-note'),scroll=handle.closest('.notes-scroll');if(!r||!card||!scroll)return;
  try{const start=N.position(r.notePosition,state.reminders.indexOf(r));drag={id:r.id,card,handle,scroll,start,current:start,x:event.clientX,y:event.clientY,scrollX:scroll.scrollLeft,scrollY:scroll.scrollTop,zoom,snapshot:stamp(),pointerId:event.pointerId,maxY:N.height(state.reminders)-N.noteHeight-N.padding,moved:false};card.classList.remove('is-entering','is-settling');handle.setPointerCapture(event.pointerId);handle.focus({preventScroll:true});event.preventDefault();}catch(error){drag=null;feedback(error);}
 });
 document.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.pointerId)return;
  if(!drag.card.isConnected){cancelDrag();return;}
  const d=drag,rect=d.scroll.getBoundingClientRect();
  if(event.clientY>rect.bottom-32)d.scroll.scrollTop+=14;else if(event.clientY<rect.top+32)d.scroll.scrollTop-=14;
  if(event.clientX>rect.right-32)d.scroll.scrollLeft+=14;else if(event.clientX<rect.left+32)d.scroll.scrollLeft-=14;
  const dx=event.clientX-d.x+d.scroll.scrollLeft-d.scrollX,dy=event.clientY-d.y+d.scroll.scrollTop-d.scrollY;
  if(!d.moved&&Math.abs(dx)+Math.abs(dy)<4)return;d.moved=true;closeClientRowMenu();d.card.classList.add('is-dragging');
  d.current=N.position({x:d.start.x+dx/d.zoom,y:Math.min(d.maxY,d.start.y+dy/d.zoom)});
  d.card.style.left=d.current.x+'px';d.card.style.top=d.current.y+'px';
 });
 document.addEventListener('pointerup',event=>{
  if(!drag||event.pointerId!==drag.pointerId)return;const d=drag;cancelDrag();if(!d.moved)return;
  try{commit(()=>{const r=get(d.id);if(!r)throw new Error('This note was deleted.');r.notePosition=d.current;},d.snapshot);d.card.style.left=d.current.x+'px';d.card.style.top=d.current.y+'px';d.card.classList.add('is-settling');// Extend the board after moving toward its lower edge.
   const h=N.height(state.reminders);$('.notes-canvas').style.height=h+'px';$('.notes-scaled').style.height=h*zoom+'px';
  }catch(error){feedback(error);}
 });
 document.addEventListener('pointercancel',cancelDrag);
 document.addEventListener('animationend',event=>{if(event.animationName==='note-settle')event.target.closest('.sticky-note')?.classList.remove('is-settling');});
 document.addEventListener('lostpointercapture',()=>{if(drag)cancelDrag();});
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&drag){cancelDrag();event.preventDefault();event.stopImmediatePropagation();return;}
  const handle=event.target.closest?.('[data-note-drag]');if(!handle||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
  event.preventDefault();const r=get(handle.dataset.noteDrag);if(!r)return;
  try{const p=N.position(r.notePosition,state.reminders.indexOf(r)),step=event.shiftKey?30:10;commit(()=>{r.notePosition=N.position({x:p.x+(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0),y:p.y+(event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0)});});render();$(`[data-note-drag="${CSS.escape(r.id)}"]`)?.focus({preventScroll:true});}catch(error){feedback(error);}
 },true);
 window.addEventListener('storage',event=>{if(event.key===STORE_KEY)externalChange=true;});
 window.addEventListener('blur',cancelDrag);
})();
