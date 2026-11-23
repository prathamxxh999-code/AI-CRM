// Focused workspaces for the three daily operational flows.
let billingStatus='all',billingClient='all',billingSort='due',billingPage=1;
let caseStatus='active',casePriority='all',caseSort='urgency',casePage=1;
const coreTotal=record=>Number(record.amount||0)+Number(record.tax||0);
const corePage=(items,page,size=8)=>({rows:items.slice((page-1)*size,page*size),pages:Math.max(1,Math.ceil(items.length/size))});
const corePager=(page,pages,kind)=>pages<=1?'':`<div class="core-pager"><span>Page ${page} of ${pages}</span><div><button data-core-page="${kind}:previous" ${page<=1?'disabled':''} aria-label="Previous page">←</button><button data-core-page="${kind}:next" ${page>=pages?'disabled':''} aria-label="Next page">→</button></div></div>`;
const coreMetric=(label,value,detail,tone='')=>`<article class="core-metric ${tone}"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></article>`;

renderBilling=function(){
 const invoices=state.invoices;
 const issued=invoices.filter(i=>i.status!=='Draft'),open=issued.filter(i=>i.status!=='Paid'),late=open.filter(overdue),paid=issued.filter(i=>i.status==='Paid');
 const inr=records=>records.filter(i=>i.currency==='INR').reduce((n,i)=>n+coreTotal(i),0);
 const foreign=invoices.filter(i=>i.currency!=='INR').length;
 const clients=[...new Set(invoices.map(i=>i.clientId))].map(id=>({id,name:nameOf('clients',id)})).sort((a,b)=>a.name.localeCompare(b.name));
 const q=filter.trim().toLowerCase();
 let rows=invoices.filter(i=>(billingStatus==='all'||billingStatus==='Overdue'&&overdue(i)||billingStatus!=='Overdue'&&i.status===billingStatus)&&(billingClient==='all'||i.clientId===billingClient)&&[i.number,nameOf('clients',i.clientId),nameOf('branches',i.branchId),nameOf('products',i.productId),invoiceStatus(i)].some(v=>String(v||'').toLowerCase().includes(q)));
 rows.sort((a,b)=>billingSort==='amount'?coreTotal(b)-coreTotal(a):billingSort==='client'?nameOf('clients',a.clientId).localeCompare(nameOf('clients',b.clientId)):billingSort==='recent'?String(b.number).localeCompare(String(a.number)):String(a.due).localeCompare(String(b.due)));
 const pages=Math.max(1,Math.ceil(rows.length/8));billingPage=Math.min(billingPage,pages);
 const displayed=corePage(rows,billingPage).rows;
 const statuses=[['all','All'],['Draft','Drafts'],['Sent','Sent'],['Overdue','Overdue'],['Paid','Paid']];
 return `<div class="core-workspace billing-workspace"><div class="core-heading"><div><span class="core-eyebrow">FINANCE WORKSPACE</span><h1>Billing</h1><p>Track drafts, due dates and payment status by institution and branch.</p></div><button class="btn btn-primary" data-action="add-invoice">${icon('plus')} Create draft</button></div><div class="core-metrics">${coreMetric('Outstanding',money(inr(open)),`${open.length} issued invoice${open.length===1?'':'s'} unpaid`,'featured')}${coreMetric('Overdue',money(inr(late)),`${late.length} invoice${late.length===1?'':'s'} past due`,'warning')}${coreMetric('Recorded paid',money(inr(paid)),`${paid.length} payment${paid.length===1?'':'s'} recorded`)}${coreMetric('Drafts',String(invoices.filter(i=>i.status==='Draft').length),'Awaiting review before issue')}</div>${foreign?`<p class="core-currency-note">Totals above show INR only. ${foreign} invoice${foreign===1?' is':'s are'} in another currency and remain visible below.</p>`:''}<section class="core-panel"><div class="core-panel-heading"><div><h2>Invoice register</h2><p>Open a record to review its client, branch, product, tax and next step.</p></div><span>${rows.length} matching records</span></div><div class="core-filters"><div class="core-tabs" role="group" aria-label="Invoice status">${statuses.map(([value,label])=>`<button data-core-status="${value}" class="${billingStatus===value?'active':''}" aria-pressed="${billingStatus===value}">${label}</button>`).join('')}</div><div class="core-filter-row"><input id="list-search" type="search" value="${esc(filter)}" placeholder="Search invoice, client or product" aria-label="Search invoices"><select id="billing-client" aria-label="Filter by client"><option value="all">All clients</option>${clients.map(c=>`<option value="${esc(c.id)}" ${billingClient===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select><select id="billing-sort" aria-label="Sort invoices"><option value="due" ${billingSort==='due'?'selected':''}>Due date</option><option value="recent" ${billingSort==='recent'?'selected':''}>Invoice number</option><option value="amount" ${billingSort==='amount'?'selected':''}>Highest amount</option><option value="client" ${billingSort==='client'?'selected':''}>Client name</option></select></div></div><div class="core-table-wrap" tabindex="0" role="region" aria-label="Invoice register"><table class="core-table has-row-actions"><thead><tr><th>Invoice</th><th>Institution / branch</th><th>Product</th><th>Total incl. tax</th><th>Due</th><th>Status</th><th><span class="sr-only">Action</span></th></tr></thead><tbody>${displayed.map(i=>`<tr><td><button class="core-link" data-detail="invoice:${esc(i.id)}">${esc(i.number)}</button></td><td><strong>${esc(nameOf('clients',i.clientId))}</strong><small>${esc(nameOf('branches',i.branchId))}</small></td><td>${esc(nameOf('products',i.productId))}</td><td class="core-amount">${money(coreTotal(i),i.currency)}</td><td>${prettyDate(i.due)}</td><td>${tag(invoiceStatus(i))}</td><td>${renderRecordRowActions('invoice',i.id,i.number)}</td></tr>`).join('')||'<tr><td colspan="7" class="core-empty">No invoices match these filters. Adjust the filters or create a draft.</td></tr>'}</tbody></table></div>${corePager(billingPage,pages,'billing')}</section><p class="core-footnote">Preview records only. Sending and payment actions change this workspace; they do not issue a legal invoice or collect funds.</p></div>`;
};

renderHelpdesk=function(){
 const tickets=state.tickets,active=tickets.filter(t=>!['Resolved','Closed'].includes(t.status)),late=active.filter(t=>t.due&&t.due<localDate(0));
 const high=active.filter(t=>t.priority==='High'),waiting=active.filter(t=>t.status==='Waiting on Client'),resolved=tickets.filter(t=>['Resolved','Closed'].includes(t.status));
 const q=filter.trim().toLowerCase();
 let rows=tickets.filter(t=>(caseStatus==='all'||caseStatus==='active'&&!['Resolved','Closed'].includes(t.status)||caseStatus==='overdue'&&t.due&&t.due<localDate(0)&&!['Resolved','Closed'].includes(t.status)||caseStatus==='resolved'&&['Resolved','Closed'].includes(t.status))&&(casePriority==='all'||t.priority===casePriority)&&[t.number,t.subject,t.priority,t.status,t.owner,t.module,nameOf('clients',t.clientId),nameOf('branches',t.branchId)].some(v=>String(v||'').toLowerCase().includes(q)));
 const rank={High:0,Medium:1,Low:2};rows.sort((a,b)=>caseSort==='due'?String(a.due||'9999').localeCompare(String(b.due||'9999')):caseSort==='client'?nameOf('clients',a.clientId).localeCompare(nameOf('clients',b.clientId)):caseSort==='recent'?String(b.created||'').localeCompare(String(a.created||'')):(rank[a.priority]??3)-(rank[b.priority]??3)||String(a.due||'9999').localeCompare(String(b.due||'9999')));
 const pages=Math.max(1,Math.ceil(rows.length/8));casePage=Math.min(casePage,pages);const displayed=corePage(rows,casePage).rows;
 const tabs=[['active','Active'],['overdue','Overdue'],['resolved','Resolved'],['all','All']];
 return `<div class="core-workspace helpdesk-workspace"><div class="core-heading"><div><span class="core-eyebrow">SERVICE WORKSPACE</span><h1>Helpdesk</h1><p>Prioritize affected clients, follow the next owner and document resolution.</p></div><button class="btn btn-primary" data-action="add-ticket">${icon('plus')} New case</button></div><div class="core-metrics">${coreMetric('Active cases',String(active.length),'Open through escalation','featured')}${coreMetric('High priority',String(high.length),'Needs prompt review','warning')}${coreMetric('Past due',String(late.length),'Active cases beyond due date')}${coreMetric('Waiting on client',String(waiting.length),`${resolved.length} resolved or closed`)}</div><section class="core-panel"><div class="core-panel-heading"><div><h2>Case queue</h2><p>Each case links to its institution, branch, product and full activity history.</p></div><span>${rows.length} matching cases</span></div><div class="core-filters"><div class="core-tabs" role="group" aria-label="Case queue">${tabs.map(([value,label])=>`<button data-case-status="${value}" class="${caseStatus===value?'active':''}" aria-pressed="${caseStatus===value}">${label}</button>`).join('')}</div><div class="core-filter-row"><input id="list-search" type="search" value="${esc(filter)}" placeholder="Search case, client, branch or issue" aria-label="Search cases"><select id="case-priority" aria-label="Filter by priority"><option value="all">All priorities</option>${['High','Medium','Low'].map(p=>`<option ${casePriority===p?'selected':''}>${p}</option>`).join('')}</select><select id="case-sort" aria-label="Sort cases"><option value="urgency" ${caseSort==='urgency'?'selected':''}>Priority then due</option><option value="due" ${caseSort==='due'?'selected':''}>Due date</option><option value="recent" ${caseSort==='recent'?'selected':''}>Recently opened</option><option value="client" ${caseSort==='client'?'selected':''}>Client name</option></select></div></div><div class="case-list">${displayed.map(t=>`<button class="case-row" data-ticket="${esc(t.id)}"><span class="case-row-main"><span class="case-row-top"><strong>${esc(t.subject)}</strong><small>${esc(t.number)}</small></span><span>${esc(nameOf('clients',t.clientId))} · ${esc(t.branchId?nameOf('branches',t.branchId):'Institution-wide')}</span><small>${esc(t.productId?nameOf('products',t.productId):'General support')}${t.module?' / '+esc(t.module):''} · Owner: ${esc(t.owner||'Unassigned')}</small></span><span class="case-row-meta">${tag(t.priority)} ${tag(t.status)}<small>${t.due?`Due ${prettyDate(t.due)}`:'No due date'}</small></span><span class="case-row-arrow" aria-hidden="true">↗</span></button>`).join('')||'<div class="core-empty">No cases match these filters. Adjust the queue or create a case.</div>'}</div>${corePager(casePage,pages,'case')}</section></div>`;
};

const originalCoreInbox=renderInbox;
renderInbox=function(){
 const unread=state.messages.filter(m=>!m.archived&&!m.read).length;
 const clientThreads=new Set(state.messages.filter(m=>!m.archived&&m.clientId).map(m=>m.clientId)).size;
 const drafts=state.mailDrafts.length;
 let markup=originalCoreInbox();
 markup=markup.replace(/<span class="mail-list-indicator">[^<]*<\/span>/,`<span class="mail-workflow-summary" title="Inbox at a glance"><b>${unread}</b> unread <i></i> <b>${clientThreads}</b> clients <i></i> <b>${drafts}</b> drafts</span>`);
 if(selectedMail){const message=state.messages.find(m=>m.id===selectedMail);if(message?.clientId){markup=markup.replace('<div class="mail-reader-footer">',`<div class="mail-context-strip"><div class="mail-context-heading"><span>LINKED CLIENT</span><strong>${esc(nameOf('clients',message.clientId))}</strong></div><div class="mail-context-links"><button data-profile="${esc(message.clientId)}">Open client ↗</button><button data-core-mail-billing="${esc(message.clientId)}">Billing records ↗</button><button data-core-mail-case="${esc(message.clientId)}">Create support case ↗</button></div></div><div class="mail-reader-footer">`);}}
 return markup;
};

function coreEditInvoice(id){
 const invoice=byId('invoices',id);if(!invoice||invoice.status!=='Draft')return;
 const clientOptions=state.clients.map(c=>`<option value="${esc(c.id)}" ${invoice.clientId===c.id?'selected':''}>${esc(c.name)}</option>`).join('');
 const branchOptions=state.branches.filter(b=>b.clientId===invoice.clientId).map(b=>`<option value="${esc(b.id)}" ${invoice.branchId===b.id?'selected':''}>${esc(b.name)}</option>`).join('');
 const productOptions=state.products.map(p=>`<option value="${esc(p.id)}" ${invoice.productId===p.id?'selected':''}>${esc(p.name)}</option>`).join('');
 modal('Edit invoice draft','Update internal draft details before it is marked sent.',`<form id="core-invoice-form" data-id="${esc(id)}"><div class="form-grid"><div class="field"><label for="core-invoice-client">Client</label><select name="clientId" id="core-invoice-client">${clientOptions}</select></div><div class="field"><label for="core-invoice-branch">Branch</label><select name="branchId" id="core-invoice-branch">${branchOptions}</select></div></div><div class="field"><label for="core-invoice-product">Product</label><select name="productId" id="core-invoice-product">${productOptions}</select></div><div class="form-grid"><div class="field"><label for="core-invoice-amount">Amount before tax</label><input id="core-invoice-amount" name="amount" type="number" min="0.01" step="0.01" required value="${esc(invoice.amount)}"></div><div class="field"><label for="core-invoice-tax">Tax amount</label><input id="core-invoice-tax" name="tax" type="number" min="0" step="0.01" required value="${esc(invoice.tax)}"></div></div><div class="form-grid"><div class="field"><label for="core-invoice-currency">Currency</label><select id="core-invoice-currency" name="currency">${['INR','USD','EUR','GBP'].map(c=>`<option ${invoice.currency===c?'selected':''}>${c}</option>`).join('')}</select></div><div class="field"><label for="core-invoice-due">Due date</label><input id="core-invoice-due" name="due" type="date" required value="${esc(invoice.due)}"></div></div><div class="form-error" id="core-invoice-error"></div></form>`,'<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" type="submit" form="core-invoice-form">Save draft</button>');
}

document.addEventListener('click',event=>{
 const editInvoice=event.target.closest?.('[data-action="edit-invoice"]');if(editInvoice){coreEditInvoice(editInvoice.dataset.id);return;}
 const status=event.target.closest?.('[data-core-status]');if(status){billingStatus=status.dataset.coreStatus;billingPage=1;render();return;}
 const caseTab=event.target.closest?.('[data-case-status]');if(caseTab){caseStatus=caseTab.dataset.caseStatus;casePage=1;render();return;}
 const pager=event.target.closest?.('[data-core-page]');if(pager){const [kind,direction]=pager.dataset.corePage.split(':');if(kind==='billing')billingPage=Math.max(1,billingPage+(direction==='next'?1:-1));else casePage=Math.max(1,casePage+(direction==='next'?1:-1));render();return;}
 const mailCase=event.target.closest?.('[data-core-mail-case]');if(mailCase){
  if(window.helpdeskFromMail){window.helpdeskFromMail(selectedMail);return;}
  const message=byId('messages',selectedMail);
  openForm('ticket');const form=$('#entity-form');
  if(form?.elements.clientId){form.elements.clientId.value=mailCase.dataset.coreMailCase;updateBranchSelect();}
  if(message&&form){
   const plan=inboxReplyPlan(message);
   if(plan.branch&&form.elements.branchId){form.elements.branchId.value=plan.branch.id;updateTicketProductSelect();}
   form.elements.subject.value=message.subject;
   form.elements.description.value=`Client email from ${message.from}${message.email?' <'+message.email+'>':''}\n\n${message.body}`;
   form.elements.source.value='Email';
  }
  return;
 }
 const mailBilling=event.target.closest?.('[data-core-mail-billing]');if(mailBilling){billingClient=mailBilling.dataset.coreMailBilling;setView('billing');return;}
});
document.addEventListener('change',event=>{
 const el=event.target;
 if(el.id==='core-invoice-client'){const branches=state.branches.filter(b=>b.clientId===el.value);$('#core-invoice-branch').innerHTML=branches.map(b=>`<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('');}
 if(el.id==='billing-client'){billingClient=el.value;billingPage=1;render();}
 if(el.id==='billing-sort'){billingSort=el.value;billingPage=1;render();}
 if(el.id==='case-priority'){casePriority=el.value;casePage=1;render();}
 if(el.id==='case-sort'){caseSort=el.value;casePage=1;render();}
});
document.addEventListener('submit',event=>{
 if(event.target.id!=='core-invoice-form')return;
 event.preventDefault();const form=event.target,invoice=byId('invoices',form.dataset.id);if(!invoice||invoice.status!=='Draft')return;
 const data=Object.fromEntries(new FormData(form).entries()),error=$('#core-invoice-error');
 const branch=byId('branches',data.branchId),amount=Number(data.amount),tax=Number(data.tax);
 if(!branch||branch.clientId!==data.clientId){error.textContent='Choose a branch belonging to this client.';return;}
 if(!byId('products',data.productId)||!Number.isFinite(amount)||amount<=0||!Number.isFinite(tax)||tax<0){error.textContent='Choose a product and enter a valid amount and tax.';return;}
 Object.assign(invoice,{clientId:data.clientId,branchId:data.branchId,productId:data.productId,amount,tax,currency:data.currency,due:data.due});save();$('#modal-root').innerHTML='';render();toast('Invoice draft updated.');
});
