(() => {
 const sidebar=document.getElementById('sidebar'),toggle=document.getElementById('sidebar-toggle'),backdrop=document.getElementById('sidebar-backdrop');
 if(!sidebar||!toggle)return;
 const media=matchMedia('(max-width: 980px)'),reduced=matchMedia('(prefers-reduced-motion: reduce)'),preference='idsspl-sidebar-compact';
 let collapsed=false,wasOpen=false;
 try{collapsed=localStorage.getItem(preference)==='true';}catch{}
 document.body.classList.toggle('sidebar-is-collapsed',collapsed);
 function sync(){
  const parent={profile:'clients',workflowCanvas:'clients',onboarding:'clients',documentPreview:'clients',leadDetail:'prospects',productDetail:'products',ticketDetail:'helpdesk'};
  const current=parent[view]||view;
  for(const item of sidebar.querySelectorAll('.nav-item[data-view]')){const selected=item.dataset.view===current;item.classList.toggle('active',selected);if(selected)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');}
  const unread=state.messages.filter(m=>!m.archived&&!m.read).length,badge=document.getElementById('nav-unread'),inbox=sidebar.querySelector('[data-view="inbox"]');
  if(badge){badge.hidden=!unread;badge.textContent=unread>99?'99+':String(unread);}
  if(inbox){inbox.setAttribute('aria-label',`Client inbox${unread?`, ${unread} unread messages`:''}`);inbox.title=`Client inbox${unread?` · ${unread} unread`:''}`;}
 }
 function syncDrawer(){
  const open=media.matches&&sidebar.classList.contains('open'),button=document.getElementById('mobile-menu'),main=document.querySelector('.main-wrap'),hadSidebarFocus=sidebar.contains(document.activeElement);
  document.body.classList.toggle('sidebar-mobile-open',open);
  sidebar.inert=media.matches&&!open;if(sidebar.inert)sidebar.setAttribute('aria-hidden','true');else sidebar.removeAttribute('aria-hidden');
  if(main)main.inert=open;
  if(button){button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-controls','sidebar');}
  toggle.setAttribute('aria-label',media.matches?'Close navigation':collapsed?'Expand sidebar':'Collapse sidebar');toggle.title=toggle.getAttribute('aria-label');
  if(media.matches)toggle.removeAttribute('aria-expanded');else toggle.setAttribute('aria-expanded',String(!collapsed));
  if(open&&!wasOpen)(sidebar.querySelector('.nav-item.active')||toggle).focus();
  if(!open&&wasOpen&&media.matches&&hadSidebarFocus)button?.focus();
  wasOpen=open;
 }
 toggle.addEventListener('click',()=>{
  if(media.matches){sidebar.classList.remove('open');syncDrawer();return;}
  collapsed=!collapsed;document.body.classList.toggle('sidebar-is-collapsed',collapsed);
  try{localStorage.setItem(preference,String(collapsed));}catch{}
  syncDrawer();
  // Let maps and charts fit the new content width after the rail settles.
  setTimeout(()=>window.dispatchEvent(new Event('resize')),reduced.matches?0:240);
 });
 backdrop?.addEventListener('click',()=>{sidebar.classList.remove('open');syncDrawer();document.getElementById('mobile-menu')?.focus();});
 // Release the page before the existing navigation handler focuses its content.
 sidebar.addEventListener('click',event=>{if(media.matches&&event.target.closest('[data-view]')){sidebar.classList.remove('open');syncDrawer();}},true);
 sidebar.addEventListener('keydown',event=>{
  if(!media.matches||!sidebar.classList.contains('open')||event.key!=='Tab')return;
  const items=[...sidebar.querySelectorAll('a[href],button:not([disabled])')].filter(el=>el.offsetParent!==null),first=items[0],last=items.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 });
 media.addEventListener('change',()=>{if(!media.matches)sidebar.classList.remove('open');syncDrawer();});
 new MutationObserver(syncDrawer).observe(sidebar,{attributes:true,attributeFilter:['class']});
 const content=document.getElementById('main-content');if(content)new MutationObserver(sync).observe(content,{childList:true});
 document.addEventListener('DOMContentLoaded',()=>{sync();syncDrawer();});
 sync();syncDrawer();
})();
