/* Branch and product workflow canvas. This preview documents flows; it does not execute automation. */
let canvasSelectedNodeId = '';
let canvasConnectFrom = '';
let canvasDrag = null;

function workflowCanvasFor(deployment) {
  if (!state.workflowCanvases) state.workflowCanvases = {};
  if (state.workflowCanvases[deployment.id]) return state.workflowCanvases[deployment.id];
  const steps = state.requirements.filter(r => !r.archived && r.clientId === deployment.clientId && r.branchId === deployment.branchId && r.productId === deployment.productId);
  const nodes = [{id:'start',type:'start',title:'Workflow starts',details:'Branch and product selected',x:70,y:230}];
  steps.forEach((step,index) => nodes.push({
    id:'node-'+step.id,type:'task',title:step.title,details:step.details||'',owner:step.owner||'Account team',
    documentId:step.documentId||'',stage:step.stage||'Discovery',requirementId:step.id,x:350+index*275,y:230
  }));
  nodes.push({id:'end',type:'end',title:'Ready for handover',details:'Complete the documented flow',x:350+steps.length*275,y:230});
  const edges = nodes.slice(1).map((node,index) => ({id:uid('edge'),from:nodes[index].id,to:node.id,label:''}));
  const canvas = {deploymentId:deployment.id,nodes,edges,versionHistory:[],updatedAt:new Date().toLocaleString('en-IN')};
  state.workflowCanvases[deployment.id] = canvas;
  save();
  return canvas;
}

function workflowCanvasCount(deployment,requirements) {
  const canvas = state.workflowCanvases?.[deployment.id];
  return canvas ? canvas.nodes.filter(n => n.type !== 'start' && n.type !== 'end').length :
    requirements.filter(r => !r.archived && r.branchId === deployment.branchId && r.productId === deployment.productId).length;
}

function renderClientWorkflow(client,branches,deployments,requirements) {
  const visible = deployments.filter(d => (workflowBranchFilter === 'all' || d.branchId === workflowBranchFilter) &&
    (workflowProductFilter === 'all' || d.productId === workflowProductFilter));
  const products = [...new Set(deployments.map(d => d.productId))];
  const filters = '<div class="workflow-filters"><select id="workflow-branch-filter" aria-label="Filter workflow by branch"><option value="all">All branches</option>' +
    branches.map(b => '<option value="'+esc(b.id)+'" '+(workflowBranchFilter===b.id?'selected':'')+'>'+esc(b.name)+'</option>').join('') +
    '</select><select id="workflow-product-filter" aria-label="Filter workflow by product"><option value="all">All products</option>' +
    products.map(id => '<option value="'+esc(id)+'" '+(workflowProductFilter===id?'selected':'')+'>'+esc(nameOf('products',id))+'</option>').join('') + '</select></div>';
  const cards = visible.map(d => {
    const count = workflowCanvasCount(d,requirements);
    const modules = (d.modules||[]).slice(0,4).map(m => '<span>'+esc(m)+'</span>').join('');
    return '<article class="card workflow-picker-card"><div class="workflow-picker-top"><span class="workflow-picker-icon">'+icon('branch')+'</span>'+tag(d.status)+'</div>' +
      '<small>'+esc(nameOf('branches',d.branchId))+'</small><h3>'+esc(nameOf('products',d.productId))+'</h3>' +
      '<div class="workflow-picker-modules">'+(modules||'<span>No modules recorded</span>')+'</div>' +
      '<div class="workflow-picker-footer"><span>'+(count?'<strong>'+count+'</strong> documented step'+(count===1?'':'s'):'Not started')+'</span>' +
      '<button class="btn btn-primary" data-action="open-workflow-canvas" data-id="'+esc(d.id)+'">'+(count?'Open Workflow':'Create Workflow')+' →</button></div></article>';
  }).join('');
  return '<div class="workflow-profile-head"><div><h2>Branch & Product Workflows</h2><p>Choose a deployment to design its documented flow on a canvas.</p></div></div>' +
    filters + '<div class="workflow-picker-grid">'+(cards||'<div class="card workflow-empty">No branch and product matches these filters. Select a product for a branch first.</div>')+'</div>';
}

function canvasWorldSize(canvas) {
  return {
    width: Math.max(1150,...canvas.nodes.map(n => Number(n.x||0)+300)),
    height: Math.max(650,...canvas.nodes.map(n => Number(n.y||0)+230))
  };
}

function renderCanvasSvg(canvas,size) {
  const byNode = new Map(canvas.nodes.map(n => [n.id,n]));
  const paths = canvas.edges.map(edge => {
    const from=byNode.get(edge.from),to=byNode.get(edge.to);
    if (!from || !to) return '';
    const x1=Number(from.x)+218,y1=Number(from.y)+61,x2=Number(to.x),y2=Number(to.y)+61;
    const bend=Math.max(65,Math.abs(x2-x1)*0.46);
    const path='M '+x1+' '+y1+' C '+(x1+bend)+' '+y1+', '+(x2-bend)+' '+y2+', '+x2+' '+y2;
    const label=edge.label?'<text x="'+((x1+x2)/2)+'" y="'+((y1+y2)/2-10)+'" text-anchor="middle">'+esc(edge.label)+'</text>':'';
    return '<g data-canvas-edge="'+esc(edge.id)+'"><path class="canvas-wire" d="'+path+'" marker-end="url(#canvas-arrow)"/>' +
      '<path class="canvas-wire-hit" d="'+path+'"/>'+label+'</g>';
  }).join('');
  return '<svg class="canvas-wires" width="'+size.width+'" height="'+size.height+'" viewBox="0 0 '+size.width+' '+size.height+'" aria-label="Workflow connections">' +
    '<defs><marker id="canvas-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M 0 0 L 9 4.5 L 0 9 z" fill="#8798c2"/></marker></defs>'+paths+'</svg>';
}

function renderCanvasNode(node) {
  const typeName={start:'Start',task:'Task',decision:'Decision',approval:'Approval',end:'Finish'}[node.type]||'Step';
  const details=node.details||({start:'Begin this branch and product flow',end:'Handover or close the workflow'}[node.type]||'Add instructions for this block.');
  const symbol={start:'branch',task:'task',decision:'grid',approval:'users',end:'arrow'}[node.type]||'box';
  const badge=node.type==='task'&&node.stage?'<span class="canvas-node-stage">'+esc(node.stage)+'</span>':'';
  const actions=node.type==='end'?'':'<button type="button" data-canvas-action="connect-from" data-id="'+esc(node.id)+'" title="Connect from this block" aria-label="Connect from '+esc(node.title)+'">↗</button>';
  const linkedTask=state.tasks?.find(t=>!t.deleted&&!t.done&&t.requirementId===node.requirementId);
  const taskAction=node.type==='task'&&node.requirementId?'<button type="button" class="canvas-assign-task" data-action="create-task-from-canvas" data-id="'+esc(node.requirementId)+'">'+icon(linkedTask?'task':'plus')+(linkedTask?'View assigned task':'Assign task')+'</button>':'';
  const edit=node.type==='start'||node.type==='end'?'':'<button type="button" data-canvas-action="edit" data-id="'+esc(node.id)+'" title="Edit block" aria-label="Edit '+esc(node.title)+'">'+icon('edit')+'</button>';
  return '<article class="workflow-node workflow-node-'+esc(node.type)+(canvasSelectedNodeId===node.id?' selected':'')+'" data-canvas-node="'+esc(node.id)+'" tabindex="0" style="left:'+Number(node.x)+'px;top:'+Number(node.y)+'px">' +
    '<div class="canvas-node-head"><span class="canvas-node-icon">'+icon(symbol)+'</span><span class="canvas-node-type">'+typeName+'</span>'+badge+'<span class="canvas-node-actions">'+actions+edit+'</span></div>' +
    '<strong>'+esc(node.title)+'</strong><p>'+esc(details)+'</p>'+taskAction+'<span class="canvas-port canvas-port-in"></span><span class="canvas-port canvas-port-out"></span></article>';
}

function renderWorkflowCanvas() {
  const deployment=byId('deployments',selectedWorkflowDeploymentId);
  if (!deployment) return '<div class="card workflow-empty">Choose a branch and product from a client profile first.</div>';
  const canvas=workflowCanvasFor(deployment),size=canvasWorldSize(canvas);
  const client=nameOf('clients',deployment.clientId),branch=nameOf('branches',deployment.branchId),product=nameOf('products',deployment.productId);
  if(canvas.nodes.length<=2&&!canvas.manualStarted&&!canvas.source){
    return '<div class="workflow-canvas-page workflow-start-page"><button class="canvas-back" data-canvas-action="back">← Client Workflows</button><div class="workflow-start-intro"><span class="workflow-start-symbol">'+icon('branch')+'</span><h1>Start the workflow for '+esc(branch)+'</h1><p>'+esc(client)+' · '+esc(product)+'</p><span>Choose how to create this branch and product flow.</span></div><div class="workflow-start-options"><button class="workflow-start-card" data-import-action="open"><span class="workflow-start-card-icon">'+icon('bill')+'</span><strong>Upload an existing format</strong><p>Read a BRD, SOP, process document or flowchart and review the suggested workflow.</p><small>PDF · DOCX · Text · Image →</small></button><button class="workflow-start-card" data-canvas-action="start-manual"><span class="workflow-start-card-icon">'+icon('grid')+'</span><strong>Create on a blank canvas</strong><p>Add tasks, approvals and decisions, then connect them to document the flow.</p><small>Start from scratch →</small></button></div></div>';
  }
  return '<div class="workflow-canvas-page"><div class="canvas-page-bar"><div><button class="canvas-back" data-canvas-action="back">← Client Workflows</button>' +
    '<h1>'+esc(branch)+' <span>·</span> '+esc(product)+'</h1><p>'+esc(client)+' · '+canvas.nodes.length+' blocks · Saved in this browser</p></div>' +
    '<div class="canvas-page-actions"><button class="btn" data-import-action="history">Versions</button><button class="btn" data-canvas-action="review">Review Structure</button></div></div>' +
    '<div class="canvas-toolbar"><div class="canvas-toolbar-label">Add block</div>' +
    '<button data-canvas-action="new" data-type="task"><span class="canvas-tool-icon task">'+icon('bill')+'</span>Task</button>' +
    '<button data-canvas-action="new" data-type="decision"><span class="canvas-tool-icon decision">'+icon('grid')+'</span>Decision</button>' +
    '<button data-canvas-action="new" data-type="approval"><span class="canvas-tool-icon approval">'+icon('users')+'</span>Approval</button>' +
    '<span class="canvas-toolbar-divider"></span><button class="canvas-import-trigger" data-import-action="open">'+icon('plus')+' Upload & Generate</button><button class="'+(canvasConnectFrom?'active':'')+'" data-canvas-action="connect"><span class="canvas-tool-icon">↗</span>Connect</button>' +
    '<button data-canvas-action="reset-view"><span class="canvas-tool-icon">⌖</span>Center</button></div>' +
    (canvas.source?'<div class="canvas-source-bar"><span>'+icon('bill')+' Draft generated from <strong>'+esc(canvas.source.fileName)+'</strong></span><button data-import-action="source">View source</button><button data-import-action="history">Version history</button></div>':'') +
    '<div class="canvas-feedback" id="canvas-feedback">'+(canvasConnectFrom?'Select a target block to connect from '+esc(canvas.nodes.find(n=>n.id===canvasConnectFrom)?.title||'the selected block')+'. Press Esc to cancel.':'Drag blocks to arrange the flow. Select a block to edit or connect it. Connections are saved automatically.')+'</div>' +
    '<div class="canvas-viewport" id="canvas-viewport"><div class="canvas-world" id="canvas-world" style="width:'+size.width+'px;height:'+size.height+'px">' +
    renderCanvasSvg(canvas,size)+canvas.nodes.map(renderCanvasNode).join('')+'</div></div>' +
    '<div class="canvas-footnote"><span class="canvas-footnote-dot"></span>Connect the delivery steps and assign work to your team.</div></div>';
}

function activeCanvas() {
  const deployment=byId('deployments',selectedWorkflowDeploymentId);
  return deployment?workflowCanvasFor(deployment):null;
}

function refreshCanvas() {
  const previous=document.getElementById('canvas-viewport');
  const left=previous?.scrollLeft||0,top=previous?.scrollTop||0;
  render();
  const next=document.getElementById('canvas-viewport');
  if(next){next.scrollLeft=left;next.scrollTop=top;}
}

function persistCanvas(canvas,activity) {
  canvas.updatedAt=new Date().toLocaleString('en-IN');
  if(activity){
    const deployment=byId('deployments',selectedWorkflowDeploymentId);
    logActivity(deployment.clientId,'Workflow Canvas',activity+' · '+nameOf('branches',deployment.branchId)+' / '+nameOf('products',deployment.productId));
  }
  save();
  refreshCanvas();
}

function canvasSelectNode(id) {
  canvasSelectedNodeId=id;
  document.querySelectorAll('.workflow-node').forEach(element=>element.classList.toggle('selected',element.dataset.canvasNode===id));
}

function canvasNodeEditor(type,id) {
  const canvas=activeCanvas();
  if(!canvas)return;
  const node=id?canvas.nodes.find(n=>n.id===id):null;
  type=node?.type||type;
  if(!['task','decision','approval'].includes(type))return;
  const deployment=byId('deployments',selectedWorkflowDeploymentId);
  const documents=state.documents.filter(d=>d.clientId===deployment.clientId);
  const docs='<option value="">No linked document</option>'+documents.map(d=>'<option value="'+esc(d.id)+'" '+(node?.documentId===d.id?'selected':'')+'>'+esc(d.name)+'</option>').join('');
  const stages=['Discovery','In Review','Approved','In Delivery','Complete'];
  const stageOptions=stages.map(s=>'<option value="'+s+'" '+((node?.stage||'Discovery')===s?'selected':'')+'>'+s+'</option>').join('');
  const fields='<form id="workflow-node-form" data-node-id="'+esc(id||'')+'" data-node-type="'+esc(type)+'">' +
    '<div class="field"><label for="canvas-title">Block Name *</label><input id="canvas-title" name="title" maxlength="90" required value="'+esc(node?.title||'')+'" placeholder="'+(type==='decision'?'e.g. Has the branch approved UAT?':type==='approval'?'e.g. Sign off the rollout':'e.g. Configure selected modules')+'"></div>' +
    '<div class="field"><label for="canvas-details">'+(type==='decision'?'Condition *':'Instructions & Acceptance Notes *')+'</label><textarea id="canvas-details" name="details" maxlength="700" required placeholder="Describe what must happen before this block is complete.">'+esc(node?.details||'')+'</textarea></div>' +
    (type==='decision'?'':'<div class="form-grid"><div class="field"><label for="canvas-owner">Owner *</label><input id="canvas-owner" name="owner" required value="'+esc(node?.owner||'Account team')+'"></div><div class="field"><label for="canvas-document">Supporting Document</label><select id="canvas-document" name="documentId">'+docs+'</select></div></div>') +
    (type==='task'?'<div class="field"><label for="canvas-stage">Delivery Stage</label><select id="canvas-stage" name="stage">'+stageOptions+'</select></div>':'') +
    (node?.sourceExcerpt?'<div class="canvas-source-excerpt"><strong>Source excerpt</strong><p>'+esc(node.sourceExcerpt)+'</p><small>Check the document before relying on this interpretation.</small></div>':'') +
    '<div class="form-error" id="canvas-form-error"></div></form>';
  const footer='<button class="btn" data-canvas-action="close-modal">Cancel</button>' +
    (node?'<button class="btn canvas-delete-button" data-canvas-action="delete-prompt" data-id="'+esc(node.id)+'">Delete Block</button>':'') +
    '<button class="btn btn-primary" type="submit" form="workflow-node-form">'+(node?'Save Changes':'Create Block')+'</button>';
  modal(node?'Edit '+typeName(type):'Add '+typeName(type),'Configure this branch and product workflow block.',fields,footer);
}

function typeName(type){return {task:'Task',decision:'Decision',approval:'Approval'}[type]||'Block';}

function canvasWouldCycle(canvas,from,to) {
  const seen=new Set(),queue=[to];
  while(queue.length){
    const current=queue.shift();
    if(current===from)return true;
    if(seen.has(current))continue;
    seen.add(current);
    canvas.edges.filter(edge=>edge.from===current).forEach(edge=>queue.push(edge.to));
  }
  return false;
}

function canvasLink(fromId,toId) {
  const canvas=activeCanvas(),from=canvas?.nodes.find(n=>n.id===fromId),to=canvas?.nodes.find(n=>n.id===toId);
  if(!from||!to)return;
  if(fromId===toId){toast('Connect two different blocks.');return;}
  if(from.type==='end'||to.type==='start'){toast('The flow must move from Start toward Finish.');return;}
  if(canvas.edges.some(edge=>edge.from===fromId&&edge.to===toId)){toast('These blocks are already connected.');return;}
  if(canvasWouldCycle(canvas,fromId,toId)){toast('This connection would create a loop.');return;}
  const outgoing=canvas.edges.filter(edge=>edge.from===fromId);
  if(outgoing.length>=(from.type==='decision'?2:1)){toast(from.type==='decision'?'A decision supports one Yes and one No route.':'Remove the current outgoing connection first.');return;}
  const label=from.type==='decision'?(outgoing.some(edge=>edge.label==='Yes')?'No':'Yes'):'';
  canvas.edges.push({id:uid('edge'),from:fromId,to:toId,label});
  canvasConnectFrom='';
  persistCanvas(canvas,'Connected '+from.title+' to '+to.title);
}

function canvasSaveNode(event) {
  event.preventDefault();
  const form=event.target,canvas=activeCanvas(),deployment=byId('deployments',selectedWorkflowDeploymentId);
  if(!canvas||!deployment)return;
  const data=Object.fromEntries(new FormData(form).entries()),type=form.dataset.nodeType;
  const title=String(data.title||'').trim(),details=String(data.details||'').trim(),owner=String(data.owner||'').trim();
  const error=document.getElementById('canvas-form-error');
  if(!title||!details||((type==='task'||type==='approval')&&!owner)){error.textContent='Complete the name, instructions and owner for this block.';return;}
  const linkedDocument=data.documentId?byId('documents',data.documentId):null;
  if(linkedDocument&&linkedDocument.clientId!==deployment.clientId){error.textContent='Choose a document belonging to this client.';return;}
  let node=canvas.nodes.find(n=>n.id===form.dataset.nodeId);
  if(node){
    Object.assign(node,{title,details,owner,documentId:data.documentId||'',stage:data.stage||node.stage||'Discovery'});
  }else{
    const end=canvas.nodes.find(n=>n.id==='end'),incoming=canvas.edges.filter(edge=>edge.to==='end');
    const canInsert=incoming.length===1&&canvas.nodes.some(n=>n.id===incoming[0].from&&n.type!=='decision');
    const largest=Math.max(...canvas.nodes.map(n=>Number(n.x||0)));
    const x=canInsert?end.x:largest+270,y=canInsert?end.y:390;
    node={id:uid('node'),type,title,details,owner,documentId:data.documentId||'',stage:data.stage||'Discovery',x,y};
    canvas.nodes.push(node);
    if(canInsert){
      const old=incoming[0];canvas.edges=canvas.edges.filter(edge=>edge.id!==old.id);
      end.x+=270;
      canvas.edges.push({id:uid('edge'),from:old.from,to:node.id,label:''},{id:uid('edge'),from:node.id,to:'end',label:type==='decision'?'Yes':''});
    }
  }
  if(type==='task'||type==='approval'){
    let requirement=node.requirementId?byId('requirements',node.requirementId):null;
    if(!requirement){requirement={id:uid('req'),clientId:deployment.clientId,branchId:deployment.branchId,productId:deployment.productId};state.requirements.push(requirement);node.requirementId=requirement.id;}
    Object.assign(requirement,{title,details,owner,documentId:data.documentId||'',stage:data.stage||'Discovery',archived:false});
  }
  document.getElementById('modal-root').innerHTML='';
  canvasSelectedNodeId=node.id;
  persistCanvas(canvas,(form.dataset.nodeId?'Updated ':'Added ')+typeName(type)+' block: '+title);
}

function canvasDeleteNode(id) {
  const canvas=activeCanvas(),node=canvas?.nodes.find(n=>n.id===id);
  if(!node||node.type==='start'||node.type==='end')return;
  canvas.nodes=canvas.nodes.filter(n=>n.id!==id);
  canvas.edges=canvas.edges.filter(edge=>edge.from!==id&&edge.to!==id);
  const requirement=node.requirementId?byId('requirements',node.requirementId):null;
  if(requirement)requirement.archived=true;
  canvasSelectedNodeId='';
  document.getElementById('modal-root').innerHTML='';
  persistCanvas(canvas,'Removed '+typeName(node.type)+' block: '+node.title);
}

function canvasReview() {
  const canvas=activeCanvas();if(!canvas)return;
  const errors=[],nodes=new Map(canvas.nodes.map(n=>[n.id,n]));
  const visited=new Set(),queue=['start'];
  while(queue.length){
    const current=queue.shift();if(visited.has(current))continue;visited.add(current);
    canvas.edges.filter(edge=>edge.from===current).forEach(edge=>queue.push(edge.to));
  }
  canvas.nodes.forEach(node=>{
    if(!visited.has(node.id))errors.push(node.title+' is not connected to Start.');
    if(node.type!=='end'&&!canvas.edges.some(edge=>edge.from===node.id))errors.push(node.title+' has no next block.');
    if(node.type==='decision'){
      const labels=canvas.edges.filter(edge=>edge.from===node.id).map(edge=>edge.label);
      if(!labels.includes('Yes')||!labels.includes('No'))errors.push(node.title+' needs both Yes and No routes.');
    }
    if(['task','approval'].includes(node.type)&&(!node.owner||node.owner==='Unassigned'))errors.push(node.title+' needs an owner.');
    if(['task','approval','decision'].includes(node.type)&&(!node.title.trim()||!node.details.trim()))errors.push('A block is missing its name or instructions.');
  });
  if(!visited.has('end'))errors.push('Finish cannot be reached from Start.');
  canvas.edges.forEach(edge=>{if(!nodes.has(edge.from)||!nodes.has(edge.to))errors.push('A connection points to a removed block.');});
  const body=errors.length?'<div class="canvas-review-summary"><strong>'+errors.length+' item'+(errors.length===1?'':'s')+' to fix</strong><ul>'+errors.map(message=>'<li>'+esc(message)+'</li>').join('')+'</ul></div>':
    '<div class="canvas-review-summary ready"><strong>Structure looks ready</strong><p>Every block is reachable, all decisions have two routes, and the flow reaches Finish. This is still a documented preview; no automated actions will run.</p></div>';
  modal('Review Workflow','Check the flow before sharing it with the team.',body,'<button class="btn btn-primary" data-canvas-action="close-modal">Close Review</button>');
}

function canvasEdgeEditor(id) {
  const canvas=activeCanvas(),edge=canvas?.edges.find(item=>item.id===id);if(!edge)return;
  const from=canvas.nodes.find(n=>n.id===edge.from),to=canvas.nodes.find(n=>n.id===edge.to);
  modal('Connection',esc(from?.title||'Block')+' → '+esc(to?.title||'Block'),
    '<div class="canvas-review-summary"><strong>'+esc(edge.label||'Next step')+'</strong><p>Remove this route if the flow needs to change. Then connect the blocks you want.</p></div>',
    '<button class="btn" data-canvas-action="close-modal">Keep Connection</button><button class="btn canvas-delete-button" data-canvas-action="remove-edge" data-id="'+esc(id)+'">Remove Connection</button>');
}

document.addEventListener('click',event=>{
  if(view!=='workflowCanvas')return;
  const button=event.target.closest('[data-canvas-action]');
  if(button){
    const action=button.dataset.canvasAction,id=button.dataset.id;
    if(action==='back'){const deployment=byId('deployments',selectedWorkflowDeploymentId);selectedClientId=deployment.clientId;profileTab='workflow';canvasConnectFrom='';setView('profile');return;}
    if(action==='start-manual'){const canvas=activeCanvas();canvas.manualStarted=true;save();render();return;}
    if(action==='new'){canvasNodeEditor(button.dataset.type);return;}
    if(action==='edit'){canvasNodeEditor('',id);return;}
    if(action==='connect-from'){canvasConnectFrom=id;canvasSelectNode(id);refreshCanvas();return;}
    if(action==='connect'){
      canvasConnectFrom=canvasConnectFrom?'':canvasSelectedNodeId;
      if(!canvasConnectFrom){toast('Select a block, then choose Connect.');return;}
      refreshCanvas();return;
    }
    if(action==='review'){canvasReview();return;}
    if(action==='reset-view'){const viewport=document.getElementById('canvas-viewport');viewport.scrollTo({left:0,top:0,behavior:'smooth'});return;}
    if(action==='close-modal'){document.getElementById('modal-root').innerHTML='';return;}
    if(action==='delete-prompt'){
      const node=activeCanvas()?.nodes.find(n=>n.id===id);if(!node)return;
      modal('Delete Block','Remove this block and its connections from the canvas?',
        '<div class="canvas-review-summary"><strong>'+esc(node.title)+'</strong><p>Its linked requirement will be archived in this browser. Other blocks will remain.</p></div>',
        '<button class="btn" data-canvas-action="close-modal">Cancel</button><button class="btn canvas-delete-button" data-canvas-action="delete-node" data-id="'+esc(id)+'">Delete Block</button>');return;
    }
    if(action==='delete-node'){canvasDeleteNode(id);return;}
    if(action==='remove-edge'){
      const canvas=activeCanvas(),edge=canvas?.edges.find(item=>item.id===id);
      if(edge){canvas.edges=canvas.edges.filter(item=>item.id!==id);document.getElementById('modal-root').innerHTML='';persistCanvas(canvas,'Removed a connection');}
      return;
    }
    return;
  }
  const edge=event.target.closest('[data-canvas-edge]');
  if(edge){canvasEdgeEditor(edge.dataset.canvasEdge);return;}
  const node=event.target.closest('[data-canvas-node]');
  if(node){
    const id=node.dataset.canvasNode;
    if(canvasConnectFrom){canvasLink(canvasConnectFrom,id);return;}
    canvasSelectNode(id);
  }
});

document.addEventListener('submit',event=>{
  if(event.target.id==='workflow-node-form')canvasSaveNode(event);
});

document.addEventListener('keydown',event=>{
  if(view!=='workflowCanvas')return;
  if(event.key==='Escape'&&canvasConnectFrom){canvasConnectFrom='';refreshCanvas();return;}
  if(!canvasSelectedNodeId||event.target.closest('input,textarea,select,[role="dialog"]'))return;
  const movement={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]}[event.key];
  if(!movement)return;
  const canvas=activeCanvas(),node=canvas.nodes.find(n=>n.id===canvasSelectedNodeId);
  if(!node)return;
  event.preventDefault();
  node.x=Math.max(24,Math.min(3000,node.x+movement[0]));
  node.y=Math.max(24,Math.min(1600,node.y+movement[1]));
  persistCanvas(canvas);
});

document.addEventListener('pointerdown',event=>{
  if(view!=='workflowCanvas'||event.button!==0||event.target.closest('button'))return;
  const element=event.target.closest('.workflow-node');
  if(!element)return;
  const canvas=activeCanvas(),node=canvas?.nodes.find(n=>n.id===element.dataset.canvasNode);
  if(!node)return;
  canvasDrag={canvas,node,element,startX:event.clientX,startY:event.clientY,x:node.x,y:node.y,moved:false};
});

window.addEventListener('pointermove',event=>{
  if(!canvasDrag)return;
  const drag=canvasDrag,dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
  if(Math.abs(dx)+Math.abs(dy)<4&&!drag.moved)return;
  drag.moved=true;
  drag.node.x=Math.max(24,Math.min(3000,drag.x+dx));
  drag.node.y=Math.max(24,Math.min(1600,drag.y+dy));
  drag.element.style.left=drag.node.x+'px';drag.element.style.top=drag.node.y+'px';
  const world=document.getElementById('canvas-world'),svg=world?.querySelector('.canvas-wires');
  if(world&&svg){
    const size=canvasWorldSize(drag.canvas);
    world.style.width=size.width+'px';world.style.height=size.height+'px';
    svg.outerHTML=renderCanvasSvg(drag.canvas,size);
  }
});

window.addEventListener('pointerup',()=>{
  if(!canvasDrag)return;
  const drag=canvasDrag;canvasDrag=null;
  if(drag.moved){drag.canvas.updatedAt=new Date().toLocaleString('en-IN');save();}
});
