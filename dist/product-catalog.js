(() => {
 'use strict';
 let moduleSequence=0,storageSnapshot=null;
 const input=(name,label,value='',extra='')=>`<div class="field"><label for="catalog-${name}">${label}</label><input id="catalog-${name}" name="${name}" value="${esc(value)}" ${extra}></div>`;
 const choice=(name,label,items,value)=>`<div class="field"><label for="catalog-${name}">${label}</label><select id="catalog-${name}" name="${name}">${items.map(item=>`<option value="${esc(item)}" ${item===value?'selected':''}>${esc(item)}</option>`).join('')}</select></div>`;
 function moduleRow(module={},used=false){
  const id=++moduleSequence;
  return `<div class="catalog-module-row"><div class="field"><label for="catalog-module-${id}">Module name *</label><input id="catalog-module-${id}" data-module-name value="${esc(module.name||'')}" required maxlength="100" ${used?'readonly aria-describedby="catalog-linked-'+id+'"':''} placeholder="e.g. Account management">${used?`<small id="catalog-linked-${id}">Linked to client records · name protected</small>`:''}</div><div class="field"><label for="catalog-scope-${id}">Scope / capability</label><input id="catalog-scope-${id}" data-module-scope value="${esc(module.description||'')}" maxlength="1000" placeholder="What does this module provide?"></div><button type="button" class="catalog-remove-module" data-catalog-remove aria-label="Remove module" ${used?'disabled title="This module is linked to client records"':''}>${icon('close')}</button></div>`;
 }
 function syncCommercial(){
  const form=$('#product-catalog-form');if(!form)return;
  const enabled=form.elements.pricing.value==='Reference price',fields=form.querySelector('.catalog-commercial-fields');
  fields.hidden=!enabled;fields.disabled=!enabled;
  const model=form.elements.model.value,usage=model==='Usage based',cycle=form.elements.billingCycle;
  if(model==='Monthly subscription')cycle.value='Monthly';
  if(['Annual branch license','Annual AMC'].includes(model))cycle.value='Annual';
  const usageFields=form.querySelector('.catalog-usage-fields');usageFields.hidden=!usage;usageFields.disabled=!enabled||!usage;
 }
 function openCatalog(id=''){
  const p=id?byId('products',id):null;if(id&&!p)return;
  try{storageSnapshot=localStorage.getItem(STORE_KEY);}catch{toast('Browser storage is unavailable. Enable it before changing the catalog.');return;}
  const c=p?.defaultCommercial||{},used=ProductCatalog.usedModules(state,id),families=[...new Set(state.products.map(p=>p.family).filter(Boolean))].sort();
  const modules=p?(p.subproducts||[]).map(name=>({name,description:p.moduleDetails?.find(m=>m.name===name)?.description||''})):[{}];
  const body=`<form id="product-catalog-form" data-id="${esc(id)}">
   <div class="catalog-flow"><span class="is-current">1 · Define product</span><span>2 · Assign to a client</span><span>3 · Agree branch terms</span></div>
   <section class="catalog-form-section"><div class="catalog-section-heading"><span>01</span><div><h3>Product identity</h3><p>A reusable offering in your product catalog.</p></div></div>
    <div class="form-grid">${input('name','Product name *',p?.name,'required maxlength="120" placeholder="e.g. Core Banking Suite"')}${input('code','Product code *',p?ProductCatalog.code(p):'','required maxlength="32" placeholder="e.g. CBS-01"')}</div>
    <div class="form-grid">${input('family','Product family *',p?.family,'required maxlength="80" list="catalog-families" placeholder="Choose or enter a family"')}${input('owner','Product owner',p?.owner,'maxlength="100" placeholder="Responsible person or team"')}</div><datalist id="catalog-families">${families.map(f=>`<option value="${esc(f)}"></option>`).join('')}</datalist>
    <div class="field"><label for="catalog-description">Purpose & scope *</label><textarea id="catalog-description" name="description" required maxlength="3000" rows="3" placeholder="Who uses this product, and what business need does it solve?">${esc(p?.description||'')}</textarea></div>
    <div class="form-grid">${choice('deliveryMode','Delivery model',['Not specified','Cloud hosted','Client hosted','Hybrid'],p?.deliveryMode||'Not specified')}${input('source','Product documentation URL',p?.source,'type="url" placeholder="https://"')}</div>
   </section>
   <section class="catalog-form-section"><div class="catalog-section-heading"><span>02</span><div><h3>Modules & capabilities</h3><p>Define modules here; choose the required modules for each client branch later.</p></div></div><div id="catalog-modules">${modules.map(m=>moduleRow(m,used.has(m.name))).join('')}</div><button type="button" class="btn btn-soft" data-catalog-add>${icon('plus')} Add module</button><p class="catalog-helper">A standalone product can have one core module. Up to 50 modules per product.</p></section>
   <section class="catalog-form-section"><div class="catalog-section-heading"><span>03</span><div><h3>Commercial defaults</h3><p>Reference terms for new agreements. Existing client prices stay as recorded.</p></div></div>
    ${choice('pricing','Pricing approach',['Set per client / branch','Reference price'],p?.defaultCommercial?'Reference price':'Set per client / branch')}
    <fieldset class="catalog-commercial-fields"><legend class="sr-only">Reference commercial terms in INR</legend>
     <div class="form-grid">${choice('model','Commercial model',ProductCatalog.models,c.model||'Annual branch license')}${choice('billingCycle','Billing cycle',['Annual','Monthly'],c.billingCycle||'Annual')}</div>
     <div class="form-grid">${input('setupFee','One-time setup · INR *',c.setupFee??'','type="number" min="0" step="0.01" required placeholder="0.00"')}${input('recurringFee','Base fee per billing cycle · INR *',c.recurringFee??'','type="number" min="0" step="0.01" required placeholder="0.00"')}</div>
     <fieldset class="catalog-usage-fields form-grid"><legend class="sr-only">Usage pricing</legend>${input('usageRate','Price per unit · INR *',c.usageRate??'','type="number" min="0.01" step="0.01" required')}${input('usageUnit','Usage unit *',c.usageUnit,'required maxlength="60" placeholder="e.g. transaction"')}</fieldset>
     ${choice('paymentTerms','Payment terms',['Net 15','Net 30','Net 45','Due on receipt'],c.paymentTerms||'Net 30')}
     <p class="catalog-helper">Amounts are before tax. Branch size, selected modules and negotiated charges are finalized in the client’s product assignment.</p>
    </fieldset>
   </section><p class="form-error" role="alert"></p></form>`;
  modal(p?'Edit product':'Add product','Define the offering once, then configure each client’s deployment.',body,`<button type="button" class="btn" data-action="close-modal">Cancel</button><button type="submit" class="btn btn-primary" form="product-catalog-form">${p?'Save product':'Create product'}</button>`);
  $('#modal-root .modal')?.classList.add('catalog-editor-modal');syncCommercial();$('#catalog-name')?.focus();
 }
 const originalOpenForm=openForm;
 openForm=function(type){if(type==='product')return openCatalog();return originalOpenForm(type);};
 openProductEditor=function(){openCatalog(selectedProductId);};
 document.addEventListener('click',event=>{
  const add=event.target.closest('[data-catalog-add]'),remove=event.target.closest('[data-catalog-remove]');
  const form=$('#product-catalog-form');if(!form||(!add&&!remove))return;
  const rows=form.querySelectorAll('.catalog-module-row'),error=form.querySelector('.form-error');error.textContent='';
  if(add){if(rows.length>=50){error.textContent='This product can have up to 50 modules.';return;}form.querySelector('#catalog-modules').insertAdjacentHTML('beforeend',moduleRow());form.querySelector('.catalog-module-row:last-child input')?.focus();}
  if(remove&&!remove.disabled){if(rows.length===1){error.textContent='Keep at least one module. For a standalone product, use its core capability.';return;}remove.closest('.catalog-module-row').remove();form.querySelector('[data-catalog-add]')?.focus();}
 });
 document.addEventListener('change',event=>{if(event.target.closest('#product-catalog-form')&&['pricing','model'].includes(event.target.name))syncCommercial();});
 document.addEventListener('submit',event=>{
  const form=event.target;if(form.id!=='product-catalog-form')return;event.preventDefault();
  const values=Object.fromEntries(new FormData(form)),id=form.dataset.id,error=form.querySelector('.form-error');error.textContent='';
  try{
   if(localStorage.getItem(STORE_KEY)!==storageSnapshot)throw Error('The workspace changed while this form was open. Close and reopen it before saving.');
   const modules=[...form.querySelectorAll('.catalog-module-row')].map(row=>({name:row.querySelector('[data-module-name]').value,description:row.querySelector('[data-module-scope]').value}));
   const validated=ProductCatalog.validate(state,{...values,modules,commercial:values.pricing==='Reference price'?values:null},id);
   const before=JSON.stringify(state),productId=id||uid('p');
   try{if(id)Object.assign(byId('products',id),validated);else state.products.push({id:productId,...validated});if(state.helpdesk)state.helpdesk.changeVersion=(state.helpdesk.changeVersion||0)+1;save();}catch(error){state=JSON.parse(before);throw error;}
   $('#modal-root').innerHTML='';selectedProductId=productId;productModuleFilter='all';setView('productDetail');toast(id?'Product updated. Existing client terms are unchanged.':'Product created. Assign it to a client when ready.');
  }catch(problem){error.textContent=problem.name==='QuotaExceededError'?'Browser storage is full. The product was not saved. Free space and try again.':problem.message;error.scrollIntoView?.({block:'nearest'});}
 });
 window.productCatalogSummary=function(p){
  const c=p.defaultCommercial;
  return `<section class="card catalog-summary"><div><span class="catalog-summary-label">CATALOG RECORD</span><strong>${esc(ProductCatalog.code(p))} · ${esc(p.family)}</strong><p>${esc(p.owner?'Owner: '+p.owner:'Owner not assigned')} · ${esc(p.deliveryMode||'Delivery model not specified')}</p></div><div><span class="catalog-summary-label">DEFAULT COMMERCIAL</span><strong>${c?esc(c.model)+' · '+commercialAmount(c):'Set per client / branch'}</strong><p>${c?`Setup ${money(c.setupFee)} · ${esc(c.paymentTerms)}${c.usageRate?' · '+commercialMoney(c.usageRate)+' / '+esc(c.usageUnit):''}`:'Record negotiated terms after assigning this product.'}</p></div></section>`;
 };
})();
