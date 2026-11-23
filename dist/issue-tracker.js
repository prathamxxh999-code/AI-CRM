/* Client and module issue tracker additions for the local CRM preview. */
(() => {
 'use strict';
 const H=Helpdesk;
 let trackerClient='',trackerStatus='all',trackerModule='all',trackerSearch='';
 const terminal=()=>H?.terminal||['Resolved','Closed','Cancelled'];
 const ticketBranches=t=>[...new Set(t.branchIds||[t.branchId].filter(Boolean))];
 const clientIssues=clientId=>state.tickets.filter(t=>t.clientId===clientId);
 const issueStatusLabel=t=>t.archivedAt?'Archived':t.status||'Open';
 const issueScope=t=>ticketBranches(t).map(id=>nameOf('branches',id)).join(', ')||'Whole client';
 const issueDate=value=>{if(!value)return '—';const text=String(value);return prettyDate(/^\d{4}-\d\d-\d\d$/.test(text)?text:text.slice(0,10));};
 const issueMatches=(t,clientId)=>{
  if(clientId&&t.clientId!==clientId)return false;
  if(trackerStatus==='active'&&(t.archivedAt||terminal().includes(t.status)))return false;
  if(trackerStatus==='resolved'&&!['Resolved','Closed'].includes(t.status))return false;
  if(trackerStatus!=='all'&&!['active','resolved'].includes(trackerStatus)&&issueStatusLabel(t)!==trackerStatus)return false;
  if(trackerModule!=='all'&&(t.module||'General support')!==trackerModule)return false;
  const q=trackerSearch.trim().toLowerCase();
  return !q||[t.number,t.subject,t.status,t.priority,t.owner,t.module,nameOf('products',t.productId),issueScope(t)].join(' ').toLowerCase().includes(q);
 };
 const issueSort=(a,b)=>String(b.updatedAt||b.createdAt||b.created||'').localeCompare(String(a.updatedAt||a.createdAt||a.created||''));
 const issueRow=t=>`<tr><td><button class="row-action issue-number" data-ticket="${esc(t.id)}">${esc(t.number||'Issue')}</button><span class="sub-cell">${esc(issueDate(t.created||t.createdAt))}</span></td><td><strong>${esc(t.subject||'Untitled issue')}</strong><span class="sub-cell">${esc(issueScope(t))}</span></td><td>${esc(t.productId?nameOf('products',t.productId):'General support')}<span class="sub-cell">${esc(t.module||'All modules')}</span></td><td>${tag(t.priority||'Medium')}</td><td>${tag(issueStatusLabel(t))}</td><td>${esc(t.owner||'Unassigned')}<span class="sub-cell">${t.due?`Due ${esc(issueDate(t.due))}`:'No due date'}</span></td><td><div class="issue-row-actions"><button class="row-action" data-ticket="${esc(t.id)}">View</button>${!t.archivedAt&&!terminal().includes(t.status)?`<button class="row-action" data-action="edit-ticket-details" data-id="${esc(t.id)}">Edit</button><button class="row-action issue-resolve-link" data-action="issue-resolve" data-id="${esc(t.id)}">Resolve</button>`:''}${['Closed','Cancelled'].includes(t.status)&&!t.archivedAt?`<button class="row-action record-delete" data-action="delete-ticket" data-id="${esc(t.id)}">Archive</button>`:''}</div></td></tr>`;
 const statusOptions=items=>items.map(v=>`<option value="${esc(v)}" ${trackerStatus===v?'selected':''}>${esc(v==='all'?'All statuses':v==='active'?'Active':v==='resolved'?'Resolved / closed':v)}</option>`).join('');
 window.renderClientIssueTracker=function(client){
  const all=clientIssues(client.id);
  if(trackerClient!==client.id){trackerClient=client.id;trackerStatus='all';trackerModule='all';trackerSearch='';}
  const modules=[...new Set(all.map(t=>t.module||'General support'))].sort((a,b)=>a.localeCompare(b));
  const visible=all.filter(t=>issueMatches(t,client.id)).sort(issueSort);
  const active=all.filter(t=>!t.archivedAt&&!terminal().includes(t.status)).length;
  const resolved=all.filter(t=>['Resolved','Closed'].includes(t.status)).length;
  const overdue=all.filter(t=>t.due&&t.due<localDate(0)&&!terminal().includes(t.status)).length;
  const high=all.filter(t=>t.priority==='High'&&!terminal().includes(t.status)).length;
  const rows=visible.map(issueRow).join('');
  return `<section class="issue-tracker"><div class="issue-tracker-head"><div><p class="eyebrow">CLIENT SERVICE</p><h2>Issue tracker</h2><p>Track every support issue for ${esc(client.name)} by product, module and branch. Changes remain in the Helpdesk history.</p></div><div class="issue-tracker-actions"><button class="btn" data-action="export-issues" data-client-id="${esc(client.id)}">${icon('download')} Export Excel</button><button class="btn btn-primary" data-action="new-client-issue" data-client-id="${esc(client.id)}">${icon('plus')} New issue</button></div></div><div class="issue-kpis"><div><strong>${active}</strong><span>Active</span></div><div><strong>${resolved}</strong><span>Resolved / closed</span></div><div><strong>${high}</strong><span>High priority open</span></div><div><strong>${overdue}</strong><span>Past due</span></div></div><section class="card issue-tracker-panel"><div class="issue-tracker-filter-row"><input id="issue-tracker-search" type="search" value="${esc(trackerSearch)}" placeholder="Search issue, product, module or branch" aria-label="Search client issues"><select id="issue-tracker-status" aria-label="Filter issues by status">${statusOptions(['all','active','resolved',...new Set(all.map(t=>issueStatusLabel(t)))])}</select><select id="issue-tracker-module" aria-label="Filter issues by module"><option value="all">All modules</option>${modules.map(m=>`<option value="${esc(m)}" ${trackerModule===m?'selected':''}>${esc(m)}</option>`).join('')}</select><span class="issue-result-count">${visible.length} of ${all.length} issues</span></div>${table(['Issue','Summary / location','Product / module','Priority','Status','Owner / due',''],rows,'No issues match these filters. Create a new issue to start the client history.',{className:'issue-tracker-table',label:`Issues for ${client.name}`})}<p class="issue-tracker-hint">Create, edit, resolve and archive from this view. Archived cases remain available in the Helpdesk history for auditability.</p></section></section>`;
 };
 function xml(value){return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}
 function column(index){let n=index+1,out='';while(n){const r=(n-1)%26;out=String.fromCharCode(65+r)+out;n=Math.floor((n-1)/26);}return out;}
 function xlsx(records){
  if(!window.fflate?.zipSync||!window.fflate?.strToU8)throw new Error('Excel export is not available until the workbook helper loads. Refresh and try again.');
  const headers=['Issue number','Issue summary','Client','Affected branches','Product','Module','Category','Priority','Status','Owner','Source','Coverage','Due date','Opened','Resolved','Resolution','Description','Updated'];
  const rows=[headers,...records.map(t=>[t.number||'',t.subject||'',nameOf('clients',t.clientId),issueScope(t),t.productId?nameOf('products',t.productId):'General support',t.module||'All modules',t.category||'Other',t.priority||'Medium',issueStatusLabel(t),t.owner||'Unassigned',t.source||'Internal',t.coverage||'',t.due||'',t.created||t.createdAt||'',t.resolvedAt||'',t.resolution||'',t.description||'',t.updatedAt||''])];
  const sheetRows=rows.map((row,ri)=>`<row r="${ri+1}">${row.map((value,ci)=>`<c r="${column(ci)}${ri+1}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`).join('')}</row>`).join('');
  const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><outlinePr summaryBelow="1" summaryRight="1"/></sheetPr><dimension ref="A1:R${rows.length}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetData>${sheetRows}</sheetData><autoFilter ref="A1:R${rows.length}"/></worksheet>`;
  const files={
   '[Content_Types].xml':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
   '_rels/.rels':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
   'xl/workbook.xml':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Issues" sheetId="1" r:id="rId1"/></sheets></workbook>`,
   'xl/_rels/workbook.xml.rels':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
   'xl/worksheets/sheet1.xml':sheet
  };
  return window.fflate.zipSync(Object.fromEntries(Object.entries(files).map(([name,text])=>[name,window.fflate.strToU8(text)])),{level:6});
 }
 function download(records,client){
  const bytes=xlsx(records),blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`${(client?.name||'IDSSPL') .replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'IDSSPL'}-issues.xlsx`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),1000);toast(`${records.length} issue${records.length===1?'':'s'} exported to Excel.`);
 }
 window.exportIssueWorkbook=download;
 const baseHelpdesk=renderHelpdesk;
 renderHelpdesk=function(){
  let html=baseHelpdesk();
  const marker='<button class="btn btn-primary" data-action="add-ticket">';
  const start=html.indexOf(marker);
  if(start>=0){const end=html.indexOf('</button>',start)+9;const button=`<button class="btn" data-action="export-issues">${icon('download')} Export Excel</button>`;html=html.slice(0,end)+button+html.slice(end);}
  return html;
 };
 function openResolve(id){
  const t=byId('tickets',id);if(!t||t.archivedAt||terminal().includes(t.status))return;
  modal('Mark issue resolved',`${t.number} · ${t.subject}`,`<form id="issue-resolve-form" data-id="${esc(id)}"><p class="form-note">This records the resolution, assigns the active workspace operator when needed, and keeps the full case history.</p><div class="field"><label for="issue-resolution-note">Resolution note <span>*</span></label><textarea id="issue-resolution-note" name="note" required minlength="10" placeholder="What fixed the issue and how was it verified?"></textarea></div><p class="form-error" id="issue-resolve-error"></p></form>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="issue-resolve-form">Mark resolved</button>`);
 }
 document.addEventListener('input',e=>{if(e.target.id==='issue-tracker-search'){const cursor=e.target.selectionStart;trackerSearch=e.target.value;render();const next=$('#issue-tracker-search');if(next){next.focus();next.setSelectionRange(cursor,cursor);}}});
 document.addEventListener('change',e=>{if(e.target.id==='issue-tracker-status'){trackerStatus=e.target.value;render();}if(e.target.id==='issue-tracker-module'){trackerModule=e.target.value;render();}});
 document.addEventListener('click',e=>{
  const exportButton=e.target.closest?.('[data-action="export-issues"]');
  if(exportButton){e.preventDefault();try{const clientId=exportButton.dataset.clientId||'';const client=clientId?byId('clients',clientId):null;download(clientId?clientIssues(clientId):state.tickets,client);}catch(error){toast(error.message);}return;}
  const add=e.target.closest?.('[data-action="new-client-issue"]');
  if(add){e.preventDefault();if(window.openHelpdeskForm)openHelpdeskForm('',{clientId:add.dataset.clientId});return;}
  const resolve=e.target.closest?.('[data-action="issue-resolve"]');
  if(resolve){e.preventDefault();openResolve(resolve.dataset.id);return;}
 });
 document.addEventListener('submit',e=>{
  if(e.target.id!=='issue-resolve-form')return;
  e.preventDefault();const form=e.target,t=byId('tickets',form.dataset.id),error=form.querySelector('.form-error');if(!t)return;
  try{
   const ownerId=state.supportUsers.find(u=>u.id===t.ownerId&&u.active)?.id||state.supportUsers.find(u=>u.active)?.id||'';
   H.transition(state,t.id,{status:'Resolved',ownerId,priority:t.priority||'Medium',note:new FormData(form).get('note'),revision:t.revision});
   state.helpdesk.changeVersion=(state.helpdesk.changeVersion||0)+1;save();$('#modal-root').innerHTML='';render();toast(`${t.number} marked resolved.`);
  }catch(err){error.textContent=err.message;}
 });
 const preview=new URLSearchParams(location.search).get('preview');
 if(preview?.startsWith('issue-tracker')){const clientId=new URLSearchParams(location.search).get('client')||'c1';if(byId('clients',clientId)){selectedClientId=clientId;profileTab='issues';setView('profile');}}
})();
