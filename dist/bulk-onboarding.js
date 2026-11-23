// Browser-only bulk import for the downloadable Clients workbook.
const bulkHeaders=['Institution Name','Institution Type','Head Office City','Registration ID','Primary Contact','Contact Role','Work Email','Phone','Billing Contact','Billing Email','Account Owner','First Branch Name','First Branch Code','First Branch City'];
const bulkTypes=new Set(['Co-operative bank','Credit society','NBFC','Payments bank','Other']);
let bulkRows=[];

function bulkCellText(cell,strings){
 if(cell.getElementsByTagName('f').length)throw new Error('Formula cells are not supported. Paste values before uploading.');
 const type=cell.getAttribute('t');
 if(type==='inlineStr')return [...cell.getElementsByTagName('t')].map(node=>node.textContent).join('');
 const value=cell.getElementsByTagName('v')[0]?.textContent||'';
 return type==='s'?strings[Number(value)]||'':value;
}
function parseBulkWorkbook(bytes){
 if(!window.fflate)throw new Error('Excel reader did not load. Refresh and try again.');
 const zip=window.fflate.unzipSync(new Uint8Array(bytes));
 const decoder=new TextDecoder();
 const sheetBytes=zip['xl/worksheets/sheet1.xml'];
 if(!sheetBytes)throw new Error('Use the downloadable onboarding template. The Clients sheet was not found.');
 if(sheetBytes.length>4_000_000)throw new Error('This workbook is too large for browser import. Use up to 500 clients.');
 const xml=new DOMParser().parseFromString(decoder.decode(sheetBytes),'application/xml');
 if(xml.getElementsByTagName('parsererror').length)throw new Error('This workbook could not be read.');
 const stringsBytes=zip['xl/sharedStrings.xml'];
 const strings=stringsBytes?[...new DOMParser().parseFromString(decoder.decode(stringsBytes),'application/xml').getElementsByTagName('si')].map(item=>[...item.getElementsByTagName('t')].map(node=>node.textContent).join('')):[];
 const parsed=[...xml.getElementsByTagName('row')].map(row=>{
  const values=Array(bulkHeaders.length).fill('');
  for(const cell of row.getElementsByTagName('c')){
   const letters=(cell.getAttribute('r')||'').match(/^[A-Z]+/)?.[0]||'';
   const col=[...letters].reduce((n,ch)=>n*26+ch.charCodeAt(0)-64,0)-1;
   if(col>=0&&col<values.length)values[col]=bulkCellText(cell,strings).trim();
  }
  return {line:Number(row.getAttribute('r'))||0,values};
 });
 const heading=parsed.find(row=>row.line===1)?.values||[];
 if(bulkHeaders.some((label,index)=>String(heading[index]||'').toLowerCase()!==label.toLowerCase()))throw new Error('The Clients sheet headers do not match the template. Download a fresh copy.');
 const rows=parsed.filter(row=>row.line>1&&row.values.some(Boolean));
 if(rows.length>500)throw new Error('Import up to 500 clients at a time. Split this workbook into smaller files.');
 return rows;
}
function validateBulkRows(rows){
 const names=new Set(state.clients.map(client=>client.name.trim().toLowerCase()));
 const emails=new Set(state.clients.map(client=>String(client.email||'').trim().toLowerCase()).filter(Boolean));
 const registrations=new Set(state.clients.map(client=>String(client.registration||'').trim().toLowerCase()).filter(Boolean));
 const valid=[];
 const review=rows.map(row=>{
  const [name,type,city,registration,contact,contactRole,email,phone,billingContact,billingEmail,owner,branchName,branchCode,branchCity]=row.values;
  const problems=[];
  if(!name||!type||!city||!contact||!email)problems.push('Fill all required institution and contact fields.');
  if(type&&!bulkTypes.has(type))problems.push('Choose a listed institution type.');
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))problems.push('Enter a valid work email.');
  if(billingEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail))problems.push('Enter a valid billing email.');
  if(name&&names.has(name.toLowerCase()))problems.push('Institution name already exists.');
  if(email&&emails.has(email.toLowerCase()))problems.push('Work email already exists.');
  if(registration&&registrations.has(registration.toLowerCase()))problems.push('Registration ID already exists.');
  if([branchName,branchCode,branchCity].some(Boolean)&&![branchName,branchCode,branchCity].every(Boolean))problems.push('Complete all three first branch fields.');
  if(!problems.length){names.add(name.toLowerCase());emails.add(email.toLowerCase());if(registration)registrations.add(registration.toLowerCase());valid.push({name,type,city,registration,contact,contactRole,email,phone,billingContact,billingEmail,owner,branchName,branchCode,branchCity});}
  return {line:row.line,name:name||'Unnamed row',branch:branchName||'',problems};
 });
 return {valid,review};
}
function openBulkOnboarding(){
 bulkRows=[];
 const body=`<div class="bulk-onboard"><p>Use one row per company. After import, open each client profile to assign products, modules and branch terms.</p><a class="btn btn-soft" href="assets/client-onboarding-template.xlsx" download="IDSSPL-client-onboarding-template.xlsx">Download Excel template ↧</a><div class="field"><label for="bulk-file">Upload completed Excel template</label><input id="bulk-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"><small>Up to 500 companies. Review every row before importing.</small></div><div id="bulk-preview" class="bulk-preview" aria-live="polite">Choose an Excel file to preview its rows.</div></div>`;
 modal('Bulk onboard clients','Review first. Nothing is added until you confirm.',body,'<button class="btn" data-action="close-modal">Cancel</button><button class="btn btn-primary" data-bulk-action="import" id="bulk-import-confirm" disabled>Import clients</button>');
 $('#modal-root .modal')?.classList.add('bulk-onboard-modal');
}
function showBulkPreview(){
 const preview=$('#bulk-preview'),button=$('#bulk-import-confirm');if(!preview)return;
 if(!bulkRows.length){preview.textContent='No filled client rows found. Add clients to the Clients sheet and upload again.';button.disabled=true;return;}
 const {valid,review}=validateBulkRows(bulkRows),bad=review.length-valid.length;
 preview.innerHTML=`<div class="bulk-preview-summary"><strong>${valid.length} ready to import</strong><span>${bad} row${bad===1?'':'s'} need correction</span></div><div class="bulk-review-list">${review.map(row=>`<div class="bulk-review-row ${row.problems.length?'has-error':''}"><span>Row ${row.line}</span><strong>${esc(row.name)}</strong><small>${esc(row.branch||'No first branch')}</small><em>${row.problems.length?esc(row.problems.join(' ')):'Ready'}</em></div>`).join('')}</div>${bad?'<p class="bulk-review-note">Correct every flagged row in Excel, then upload the file again.</p>':''}`;
 button.disabled=bad>0||valid.length===0;
}
document.addEventListener('click',event=>{
 const action=event.target.closest?.('[data-bulk-action]')?.dataset.bulkAction;
 if(action==='open'){openBulkOnboarding();return;}
 if(action==='import'){
  const {valid,review}=validateBulkRows(bulkRows);if(!valid.length||valid.length!==review.length)return;
  for(const row of valid){
   const id=uid('c');
   state.clients.push({id,name:row.name,type:row.type,city:row.city,registration:row.registration,contact:row.contact,contactRole:row.contactRole,email:row.email.toLowerCase(),phone:row.phone,billingContact:row.billingContact,billingEmail:row.billingEmail.toLowerCase(),owner:row.owner||'Account team',status:'Onboarding'});
   if(row.branchName)state.branches.push({id:uid('b'),clientId:id,name:row.branchName,code:row.branchCode.toUpperCase(),city:row.branchCity,status:'Setup'});
   logActivity(id,'Client Imported','Added from bulk onboarding workbook.');
  }
  save();bulkRows=[];$('#modal-root').innerHTML='';render();toast(`${valid.length} client${valid.length===1?'':'s'} imported.`);
 }
});
document.addEventListener('change',async event=>{
 if(event.target.id!=='bulk-file')return;
 const file=event.target.files?.[0],preview=$('#bulk-preview');bulkRows=[];$('#bulk-import-confirm').disabled=true;
 if(!file)return;
 if(!/\.xlsx$/i.test(file.name)||file.size>1_500_000){preview.textContent='Choose an .xlsx template smaller than 1.5 MB.';return;}
 preview.textContent='Reading workbook…';
 try{bulkRows=parseBulkWorkbook(await file.arrayBuffer());showBulkPreview();}
 catch(error){preview.textContent=error.message||'Could not read this workbook.';}
});
