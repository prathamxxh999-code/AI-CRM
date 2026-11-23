/* Catalog definitions are reusable; signed prices live on branch assignments. */
const ProductCatalog = (() => {
 const models=['Annual branch license','Monthly subscription','Annual AMC','Usage based','Custom agreement'];
 const clean=value=>String(value??'').trim().replace(/\s+/g,' ');
 const key=value=>clean(value).toLocaleLowerCase('en-IN');
 const code=product=>product.code||String(product.id||'').toUpperCase();
 const usedModules=(state,id)=>new Set([
  ...(state.deployments||[]).filter(d=>d.productId===id).flatMap(d=>[...(d.modules||[]),...Object.keys(d.moduleCommercials||{})]),
  ...(state.tickets||[]).filter(t=>t.productId===id).map(t=>t.module),
  ...(state.requirements||[]).filter(r=>r.productId===id).map(r=>r.module)
 ].filter(Boolean));
 function validate(state,input,id=''){
  const existing=id?(state.products||[]).find(p=>p.id===id):null;
  if(id&&!existing)throw Error('This product no longer exists. Close this form and refresh the catalog.');
  const name=clean(input.name),productCode=clean(input.code).toUpperCase(),family=clean(input.family),description=String(input.description||'').trim();
  if(!name||name.length>120)throw Error('Enter a product name of up to 120 characters.');
  if(!/^[A-Z0-9][A-Z0-9_-]{1,31}$/.test(productCode))throw Error('Use a unique product code of 2–32 letters, numbers, hyphens or underscores.');
  if(!family||family.length>80)throw Error('Choose or enter a product family of up to 80 characters.');
  if(!description||description.length>3000)throw Error('Describe the product purpose in up to 3,000 characters.');
  const others=(state.products||[]).filter(p=>p.id!==id);
  if(others.some(p=>key(p.name)===key(name)))throw Error('A product with this name already exists.');
  if(others.some(p=>key(code(p))===key(productCode)))throw Error('This product code is already in use.');
  if(!Array.isArray(input.modules)||!input.modules.length||input.modules.length>50)throw Error('Add between 1 and 50 modules. For a standalone product, add its core capability as one module.');
  const modules=input.modules.map(m=>({name:clean(m.name),description:String(m.description||'').trim()}));
  if(modules.some(m=>!m.name||m.name.length>100||m.description.length>1000))throw Error('Each module needs a name of up to 100 characters. Scope notes can use up to 1,000 characters.');
  if(new Set(modules.map(m=>key(m.name))).size!==modules.length)throw Error('Module names must be unique within this product.');
  const removed=[...usedModules(state,id)].filter(name=>!modules.some(m=>m.name===name));
  if(removed.length)throw Error(`Keep the names of linked modules: ${removed.join(', ')}. Their descriptions can still be updated.`);
  const source=String(input.source||'').trim();
  if(source){let url;try{url=new URL(source);}catch{throw Error('Enter a complete product reference URL, starting with https:// or http://.');}if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error('Use a public http:// or https:// product reference URL without credentials.');}
  const owner=clean(input.owner),deliveryMode=clean(input.deliveryMode)||'Not specified';
  if(owner.length>100)throw Error('Keep the product owner name under 100 characters.');
  if(!['Not specified','Cloud hosted','Client hosted','Hybrid'].includes(deliveryMode))throw Error('Choose a valid delivery model.');
  let defaultCommercial=null;
  if(input.commercial){
   const c=input.commercial;
   if(!models.includes(c.model))throw Error('Choose a valid commercial model.');
   if(!['Monthly','Annual'].includes(c.billingCycle)||!['Net 15','Net 30','Net 45','Due on receipt'].includes(c.paymentTerms))throw Error('Choose a billing cycle and payment terms.');
   const amount=(value,label)=>{if(value===''||value==null)throw Error(`Enter ${label}, or 0 if there is no charge.`);const n=Number(value);if(!Number.isFinite(n)||n<0||n>1e12)throw Error(`${label} must be between 0 and 1,000,000,000,000.`);return Math.round(n*100)/100;};
   const setupFee=amount(c.setupFee,'setup fee'),recurringFee=amount(c.recurringFee,'base fee');
   const usageRate=c.model==='Usage based'?amount(c.usageRate,'usage rate'):0,usageUnit=c.model==='Usage based'?clean(c.usageUnit):'';
   if(c.model==='Usage based'&&(!usageUnit||usageUnit.length>60||usageRate<=0))throw Error('Usage pricing needs a positive rate and a unit, such as transaction or active user.');
   if(c.model==='Monthly subscription'&&c.billingCycle!=='Monthly')throw Error('Monthly subscriptions use a monthly billing cycle.');
   if(['Annual branch license','Annual AMC'].includes(c.model)&&c.billingCycle!=='Annual')throw Error('Annual commercial models use an annual billing cycle.');
   defaultCommercial={model:c.model,setupFee,recurringFee,billingCycle:c.billingCycle,paymentTerms:c.paymentTerms,usageRate,usageUnit,sample:false};
  }
  return {name,code:productCode,family,description,owner,deliveryMode,source,subproducts:modules.map(m=>m.name),moduleDetails:modules,defaultCommercial,catalogVersion:1};
 }
 return {models,code,usedModules,validate};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=ProductCatalog;
