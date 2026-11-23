/* Local document-to-workflow drafting. Files remain in this browser. */
let pendingWorkflowImport = null;
let workflowSourceUrl = '';
const WORKFLOW_FILE_LIMIT = 15 * 1024 * 1024;
const WORKFLOW_TYPES = ['pdf','docx','txt','md','png','jpg','jpeg','webp'];

function workflowImportStatus(message) {
  const target=document.getElementById('workflow-import-status');
  if(target)target.textContent=message;
}
function workflowLoadScript(path,globalName) {
  if(window[globalName])return Promise.resolve(window[globalName]);
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=path;script.onload=()=>window[globalName]?resolve(window[globalName]):reject(new Error('The document reader did not load.'));
    script.onerror=()=>reject(new Error('The document reader could not be loaded.'));
    document.head.appendChild(script);
  });
}
function workflowDb() {
  return new Promise((resolve,reject)=>{
    if(!window.indexedDB){reject(new Error('This browser cannot store uploaded source files.'));return;}
    const request=indexedDB.open('idsspl-workflow-sources',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('files',{keyPath:'id'});
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('Document storage is unavailable.'));
  });
}
async function workflowSourcePut(record) {
  const db=await workflowDb();
  return new Promise((resolve,reject)=>{
    const transaction=db.transaction('files','readwrite');
    transaction.objectStore('files').put(record);
    transaction.oncomplete=()=>{db.close();resolve();};
    transaction.onerror=()=>{db.close();reject(transaction.error||new Error('Could not save the source file.'));};
  });
}
async function workflowSourceGet(id) {
  const db=await workflowDb();
  return new Promise((resolve,reject)=>{
    const request=db.transaction('files','readonly').objectStore('files').get(id);
    request.onsuccess=()=>{db.close();resolve(request.result||null);};
    request.onerror=()=>{db.close();reject(request.error||new Error('Could not read the source file.'));};
  });
}
async function workflowOcr(input) {
  const Tesseract=await workflowLoadScript('vendor/tesseract.min.js','Tesseract');
  workflowImportStatus('Reading text from the scanned image…');
  const base=new URL('vendor/',location.href);
  const worker=await Tesseract.createWorker('eng',1,{
    workerPath:new URL('worker.min.js',base).href,
    corePath:new URL('tesseract-core/',base).href,
    langPath:new URL('lang/',base).href,
    workerBlobURL:false
  });
  try{return (await worker.recognize(input)).data.text||'';}
  finally{await worker.terminate();}
}
async function workflowReadPdf(file) {
  const pdfjs=await import('./vendor/pdf.min.js');
  pdfjs.GlobalWorkerOptions.workerSrc=new URL('vendor/pdf.worker.min.js',location.href).href;
  const documentTask=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())});
  const pdf=await documentTask.promise;
  const pageLimit=Math.min(pdf.numPages,40),pages=[];
  for(let number=1;number<=pageLimit;number++){
    workflowImportStatus('Reading PDF page '+number+' of '+pageLimit+'…');
    const page=await pdf.getPage(number),content=await page.getTextContent();
    let text='',priorY=null;
    for(const item of content.items){
      if(!item.str)continue;
      const y=item.transform?.[5];
      if(priorY!==null&&Math.abs(y-priorY)>2)text+='\n';
      text+=item.str+(item.hasEOL?'\n':' ');
      priorY=y;
    }
    if(text.trim().length<25){
      const viewport=page.getViewport({scale:1.5});
      const image=document.createElement('canvas');
      image.width=Math.min(2400,Math.ceil(viewport.width));
      image.height=Math.min(3200,Math.ceil(viewport.height));
      if(number<=5){
        await page.render({canvasContext:image.getContext('2d'),viewport}).promise;
        text=await workflowOcr(image);
      }
    }
    pages.push('[Page '+number+']\n'+text);
  }
  if(pdf.numPages>pageLimit)pages.push('[Only the first '+pageLimit+' pages were processed.]');
  if(typeof pdf.destroy==='function')await pdf.destroy();
  return pages.join('\n');
}
async function workflowReadDocument(file) {
  const ext=file.name.split('.').pop().toLowerCase();
  if(!WORKFLOW_TYPES.includes(ext))throw new Error('Choose a PDF, DOCX, TXT, MD, PNG, JPG or WebP file.');
  if(file.size>WORKFLOW_FILE_LIMIT)throw new Error('Choose a file smaller than 15 MB.');
  if(file.size===0)throw new Error('The selected file is empty.');
  let text='';
  if(ext==='txt'||ext==='md')text=await file.text();
  else if(ext==='docx'){
    const mammoth=await workflowLoadScript('vendor/mammoth.browser.min.js','mammoth');
    workflowImportStatus('Reading the Word document…');
    const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
    text=result.value||'';
  }else if(ext==='pdf')text=await workflowReadPdf(file);
  else text=await workflowOcr(file);
  text=text.replace(/\u0000/g,'').replace(/\r\n?/g,'\n').slice(0,100000);
  if(text.trim().length<35)throw new Error('Not enough readable text was found. Try a clearer scan or a text-based PDF/DOCX.');
  return text;
}
function workflowExtractSteps(text) {
  const action=/\b(collect|capture|verify|validate|review|approve|configure|create|prepare|submit|test|deploy|sign|confirm|reconcile|notify|send|register|check|complete|handover|activate|implement|resolve|assess|document|upload|assign|receive|record)\b/i;
  const decision=/^(if|whether|is |are |does |has |when |decision\s*[:\-])/i;
  const approval=/\b(approve|approval|sign[ -]?off|authorize|authorise)\b/i;
  const lines=text.split('\n').map(line=>line.trim()).filter(Boolean),steps=[],seen=new Set(),warnings=[];
  let page='',last=null;
  for(const line of lines){
    const pageMatch=line.match(/^\[Page (\d+)\]$/i);
    if(pageMatch){page=pageMatch[1];continue;}
    if(/^owner\s*[:\-]/i.test(line)&&last){last.owner=line.replace(/^owner\s*[:\-]\s*/i,'').slice(0,60);continue;}
    if(line.length<11||/^(contents|introduction|background|overview|purpose|scope|definitions|appendix|version history)$/i.test(line))continue;
    const parts=line.length>260?line.split(/(?<=[.!?])\s+(?=[A-Z])/):[line];
    for(const part of parts){
      const numbered=/^(?:step\s*)?\d{1,2}[.)\-:]\s*/i.test(part);
      const bullet=/^[•*\-–]\s+/.test(part);
      let cleaned=part.replace(/^(?:step\s*)?\d{1,2}[.)\-:]\s*/i,'').replace(/^[•*\-–]\s+/,'').trim();
      if(cleaned.length<11||cleaned.length>330)continue;
      const isDecision=decision.test(cleaned)||/\?\s*$/.test(cleaned)||/\b(if|whether)\b.{0,70}\b(approved|complete|passed|valid)\b/i.test(cleaned);
      if(!numbered&&!bullet&&!isDecision&&!action.test(cleaned))continue;
      const key=cleaned.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,75);
      if(seen.has(key))continue;seen.add(key);
      const ownerMatch=cleaned.match(/\b(?:owner|responsible|assigned to|by)\s*[:\-]\s*([^.;,]+)/i);
      const owner=ownerMatch?.[1]?.trim().slice(0,60)||'';
      const type=isDecision?'decision':approval.test(cleaned)?'approval':'task';
      const title=cleaned.replace(/\s*\b(?:owner|responsible|assigned to)\s*[:\-].*$/i,'').split(/[.;]/)[0].slice(0,90).trim();
      if(title.length<8)continue;
      const step={title,details:cleaned.slice(0,700),type,owner,sourceExcerpt:part.slice(0,500),page,confidence:numbered?88:bullet?77:isDecision?73:62};
      steps.push(step);last=step;
      if(steps.length>=16){warnings.push('Only the first 16 likely steps were included. Review the full document for more.');break;}
    }
    if(steps.length>=16)break;
  }
  if(!steps.length){
    const fallback=lines.filter(line=>line.length>=15&&!/^\[Page/.test(line)).slice(0,8);
    fallback.forEach(line=>steps.push({title:line.slice(0,90),details:line.slice(0,700),type:'task',owner:'',sourceExcerpt:line.slice(0,500),page:'',confidence:40}));
    warnings.push('No clear steps were detected. The lines below are suggestions only.');
  }
  if(steps.some(step=>!step.owner&&step.type!=='decision'))warnings.push('Some owners were not specified in the document.');
  if(steps.some(step=>step.type==='decision'))warnings.push('Decision routes need manual review; the draft only connects the Yes path.');
  return {steps,warnings};
}
function workflowImportOpen() {
  pendingWorkflowImport=null;
  modal('Generate Workflow from Document','The document stays in this browser. Review every suggested step before it replaces the current canvas.',
    '<form id="workflow-import-form"><div class="field"><label for="workflow-import-file">Requirements or flow document *</label><input id="workflow-import-file" type="file" accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp" required><small>PDF, DOCX, text and scanned images · up to 15 MB</small></div><div class="workflow-import-help">Upload a BRD, SOP, process note or flowchart. We will extract likely tasks, approvals and decisions. This local draft needs human review.</div><div id="workflow-import-status" role="status" aria-live="polite"></div><div class="form-error" id="workflow-import-error"></div></form>',
    '<button class="btn" data-import-action="cancel">Cancel</button><button class="btn btn-primary" type="submit" form="workflow-import-form">Generate Draft</button>');
  document.querySelector('#modal-root .modal')?.classList.add('workflow-import-modal');
}
function workflowImportReview() {
  const draft=pendingWorkflowImport;
  if(!draft)return;
  const warnings=draft.warnings.map(w=>'<li>'+esc(w)+'</li>').join('');
  const rows=draft.steps.map((step,index)=>'<article class="workflow-import-step"><div class="workflow-import-step-top"><label><input type="checkbox" name="include_'+index+'" checked> Include step '+(index+1)+'</label><span>'+step.confidence+'% pattern match</span></div><div class="form-grid"><div class="field"><label>Step name</label><input name="title_'+index+'" maxlength="90" value="'+esc(step.title)+'"></div><div class="field"><label>Type</label><select name="type_'+index+'"><option value="task" '+(step.type==='task'?'selected':'')+'>Task</option><option value="approval" '+(step.type==='approval'?'selected':'')+'>Approval</option><option value="decision" '+(step.type==='decision'?'selected':'')+'>Decision</option></select></div></div><div class="field"><label>Owner (if known)</label><input name="owner_'+index+'" maxlength="60" value="'+esc(step.owner)+'" placeholder="Unassigned"></div><div class="field"><label>Instructions</label><textarea name="details_'+index+'" maxlength="700">'+esc(step.details)+'</textarea></div><details><summary>Source excerpt'+(step.page?' · page '+esc(step.page):'')+'</summary><p>'+esc(step.sourceExcerpt)+'</p></details></article>').join('');
  modal('Review Generated Draft',draft.file.name+' · '+draft.steps.length+' suggested steps · '+draft.warnings.length+' review notes',
    '<form id="workflow-import-review-form"><div class="workflow-import-review-note">Selected steps will create a new draft for this branch and product. The current canvas is saved as a restorable version. Source passages stay linked to each block.</div>'+ (warnings?'<ul class="workflow-import-warnings">'+warnings+'</ul>':'')+'<div class="workflow-import-step-list">'+rows+'</div><div class="form-error" id="workflow-import-error"></div></form>',
    '<button class="btn" data-import-action="open">Choose another file</button><button class="btn btn-primary" type="submit" form="workflow-import-review-form">Apply Draft to Canvas</button>');
  document.querySelector('#modal-root .modal')?.classList.add('workflow-import-modal');
}
async function workflowImportGenerate(event) {
  event.preventDefault();
  const file=document.getElementById('workflow-import-file')?.files?.[0],error=document.getElementById('workflow-import-error');
  if(!file){error.textContent='Choose a document first.';return;}
  const button=document.querySelector('[form="workflow-import-form"]');
  button.disabled=true;error.textContent='';
  try{
    workflowImportStatus('Checking the file…');
    const text=await workflowReadDocument(file);
    workflowImportStatus('Finding workflow steps and decisions…');
    const found=workflowExtractSteps(text);
    if(!found.steps.length)throw new Error('No workflow steps could be identified.');
    pendingWorkflowImport={file,text,steps:found.steps,warnings:found.warnings};
    workflowImportReview();
  }catch(cause){error.textContent=cause?.message||'The file could not be read.';workflowImportStatus('');button.disabled=false;}
}
function workflowCurrentSnapshot(canvas,label) {
  return {id:uid('version'),label,at:new Date().toLocaleString('en-IN'),nodes:JSON.parse(JSON.stringify(canvas.nodes)),edges:JSON.parse(JSON.stringify(canvas.edges)),source:canvas.source||null,status:canvas.status||'Current'};
}
function workflowSyncRequirements(canvas,deployment) {
  state.requirements.filter(r=>r.clientId===deployment.clientId&&r.branchId===deployment.branchId&&r.productId===deployment.productId).forEach(r=>r.archived=true);
  canvas.nodes.filter(node=>node.type==='task'||node.type==='approval').forEach(node=>{
    let requirement=node.requirementId?byId('requirements',node.requirementId):null;
    if(!requirement){requirement={id:uid('req'),clientId:deployment.clientId,branchId:deployment.branchId,productId:deployment.productId};state.requirements.push(requirement);node.requirementId=requirement.id;}
    Object.assign(requirement,{title:node.title,details:node.details,owner:node.owner||'Unassigned',stage:node.stage||'Discovery',documentId:node.documentId||'',archived:false});
  });
}
async function workflowImportApply(event) {
  event.preventDefault();
  const draft=pendingWorkflowImport,canvas=activeCanvas(),deployment=byId('deployments',selectedWorkflowDeploymentId),form=event.target;
  if(!draft||!canvas||!deployment)return;
  const data=new FormData(form),steps=draft.steps.map((step,index)=>({step,index})).filter(({index})=>data.has('include_'+index)).map(({step,index})=>({
    title:String(data.get('title_'+index)||'').trim(),type:String(data.get('type_'+index)||'task'),
    details:String(data.get('details_'+index)||'').trim(),owner:String(data.get('owner_'+index)||'').trim(),
    sourceExcerpt:step.sourceExcerpt,page:step.page,confidence:step.confidence
  }));
  const error=document.getElementById('workflow-import-error');
  if(!steps.length){error.textContent='Keep at least one step in the draft.';return;}
  if(steps.some(step=>!step.title||!step.details)){error.textContent='Every selected step needs a name and instructions.';return;}
  const button=document.querySelector('[form="workflow-import-review-form"]');button.disabled=true;
  const sourceId=uid('source'),before=JSON.stringify(state);
  try{
    await workflowSourcePut({id:sourceId,file:draft.file,name:draft.file.name,type:draft.file.type,size:draft.file.size,text:draft.text,at:new Date().toLocaleString('en-IN')});
    const nodes=[{id:'start',type:'start',title:'Workflow starts',details:'Imported from '+draft.file.name,x:70,y:230}];
    steps.forEach((step,index)=>nodes.push({id:uid('node'),type:step.type,title:step.title,details:step.details,owner:step.owner||'Unassigned',sourceExcerpt:step.sourceExcerpt,sourcePage:step.page,confidence:step.confidence,stage:'Discovery',x:350+index*270,y:230}));
    nodes.push({id:'end',type:'end',title:'Ready for handover',details:'Review and complete the documented flow',x:350+steps.length*270,y:230});
    const edges=nodes.slice(1).map((node,index)=>({id:uid('edge'),from:nodes[index].id,to:node.id,label:nodes[index].type==='decision'?'Yes':''}));
    canvas.versionHistory=[...(canvas.versionHistory||[]),workflowCurrentSnapshot(canvas,'Before '+draft.file.name)].slice(-20);
    canvas.nodes=nodes;canvas.edges=edges;canvas.status='Draft';
    canvas.source={id:sourceId,fileName:draft.file.name,fileType:draft.file.type,fileSize:draft.file.size,importedAt:new Date().toLocaleString('en-IN'),warnings:draft.warnings};
    canvas.updatedAt=new Date().toLocaleString('en-IN');
    workflowSyncRequirements(canvas,deployment);
    save();
    pendingWorkflowImport=null;canvasSelectedNodeId='';canvasConnectFrom='';
    document.getElementById('modal-root').innerHTML='';
    logActivity(deployment.clientId,'Workflow Draft','Generated from '+draft.file.name+' for '+nameOf('branches',deployment.branchId)+' / '+nameOf('products',deployment.productId));
    save();render();
    toast('Draft flow created. Review owners and decision routes.');
  }catch(cause){
    state=JSON.parse(before);
    error.textContent=cause?.message||'The draft could not be saved.';
    button.disabled=false;
  }
}
function workflowHistoryOpen() {
  const canvas=activeCanvas(),history=[...(canvas?.versionHistory||[])].reverse();
  const content=history.length?history.map(item=>'<div class="workflow-version-row"><div><strong>'+esc(item.label)+'</strong><small>'+esc(item.at)+' · '+item.nodes.length+' blocks</small></div><button class="btn" data-import-action="restore" data-id="'+esc(item.id)+'">Restore</button></div>').join(''):'<p class="workflow-import-review-note">No earlier versions yet. Importing a document creates the first restorable version.</p>';
  modal('Workflow Versions','Restore a prior canvas without losing the current one.',content,'<button class="btn" data-import-action="cancel">Close</button>');
  document.querySelector('#modal-root .modal')?.classList.add('workflow-import-modal');
}
function workflowRestoreVersion(id) {
  const canvas=activeCanvas(),deployment=byId('deployments',selectedWorkflowDeploymentId);
  const target=canvas?.versionHistory?.find(item=>item.id===id);
  if(!target||!deployment)return;
  const before=JSON.stringify(state);
  try{
    canvas.versionHistory=[...canvas.versionHistory.filter(item=>item.id!==id),workflowCurrentSnapshot(canvas,'Before restore')].slice(-20);
    canvas.nodes=JSON.parse(JSON.stringify(target.nodes));canvas.edges=JSON.parse(JSON.stringify(target.edges));
    canvas.source=target.source||null;canvas.status=target.status||'Draft';
    workflowSyncRequirements(canvas,deployment);save();
    document.getElementById('modal-root').innerHTML='';render();toast('Workflow version restored.');
  }catch(cause){state=JSON.parse(before);toast('Version could not be restored.');}
}
async function workflowShowSource() {
  const source=activeCanvas()?.source;if(!source)return;
  try{
    const record=await workflowSourceGet(source.id);
    if(!record){toast('Original file is unavailable in this browser. Source excerpts remain on the blocks.');return;}
    if(workflowSourceUrl)URL.revokeObjectURL(workflowSourceUrl);
    workflowSourceUrl=URL.createObjectURL(record.file);
    const ext=record.name.split('.').pop().toLowerCase();
    const preview=ext==='pdf'?'<iframe title="Original workflow document" src="'+workflowSourceUrl+'"></iframe>':
      ['png','jpg','jpeg','webp'].includes(ext)?'<img src="'+workflowSourceUrl+'" alt="Original workflow document">':
      '<pre>'+esc(record.text.slice(0,25000))+'</pre>';
    modal('Source Document',record.name+' · saved in this browser','<div class="workflow-source-preview">'+preview+'</div>',
      '<button class="btn" data-import-action="cancel">Close</button><button class="btn btn-primary" data-import-action="download-source">Download Original</button>');
    document.querySelector('#modal-root .modal')?.classList.add('workflow-import-modal');
  }catch(cause){toast('The source file could not be opened.');}
}
async function workflowDownloadSource() {
  const source=activeCanvas()?.source;if(!source)return;
  const record=await workflowSourceGet(source.id);if(!record)return;
  const url=URL.createObjectURL(record.file),link=document.createElement('a');
  link.href=url;link.download=record.name;document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.addEventListener('click',event=>{
  if(view!=='workflowCanvas')return;
  const button=event.target.closest('[data-import-action]');if(!button)return;
  const action=button.dataset.importAction;
  if(action==='open')workflowImportOpen();
  else if(action==='cancel')document.getElementById('modal-root').innerHTML='';
  else if(action==='history')workflowHistoryOpen();
  else if(action==='restore')workflowRestoreVersion(button.dataset.id);
  else if(action==='source')workflowShowSource();
  else if(action==='download-source')workflowDownloadSource();
});
document.addEventListener('submit',event=>{
  if(event.target.id==='workflow-import-form')workflowImportGenerate(event);
  if(event.target.id==='workflow-import-review-form')workflowImportApply(event);
});
