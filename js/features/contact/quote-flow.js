/* Shared, progressively enhanced quote dialog. Contact links retain normal navigation. */
(() => {
 'use strict';
 const sheet=document.getElementById('home-quote-sheet');
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 let opener,scrollPosition=0,bodyStyle,closing=false,gesture;
 function fill(url){
  if(!sheet)return;
  const form=sheet.querySelector('form');
  if(form.dataset.sent==='true')return;
  const query=url.searchParams;
  if(query.has('service')||query.has('vehicle')){
   for(const key of ['selected_vehicle','selected_look','starting_estimate'])form.elements[key].value='';
  }
  const values={selected_vehicle:query.get('vehicle'),selected_look:query.get('look'),starting_estimate:query.get('estimate')};
  for(const [key,value] of Object.entries(values))if(value!==null)form.elements[key].value=value.slice(0,300);
  if(values.selected_vehicle!==null)form.elements.vehicle.value=values.selected_vehicle.slice(0,150);
  const service=query.get('service');
  if(service){const field=form.elements.service,value=service.slice(0,150);let option=Array.from(field.options).find(o=>o.value===value||o.textContent===value);if(!option){option=new Option(value,value);field.add(option);}field.value=option.value;}
  const lines=[['Vehicle',form.elements.selected_vehicle.value],['Finish / shade',form.elements.selected_look.value],['Starting estimate',form.elements.starting_estimate.value]].filter(v=>v[1]).map(v=>v.join(': '));
  const summary=sheet.querySelector('.quote-selection');summary.textContent=lines.join('\n');summary.hidden=!lines.length;
 }
 function finishClose(){sheet.close();closing=false;sheet.classList.remove('is-closing');if(bodyStyle===null)document.body.removeAttribute('style');else document.body.setAttribute('style',bodyStyle);window.scrollTo({top:scrollPosition,behavior:'instant'});opener?.focus({preventScroll:true});}
 function close(){if(!sheet?.open||closing)return;closing=true;if(reduced()){finishClose();return;}sheet.classList.add('is-closing');setTimeout(finishClose,180);}
 function open(href,source,tracked){
  const url=new URL(href,location.href);
  if(url.origin!==location.origin||!url.pathname.endsWith('/contact.html'))return false;
  if(window!==window.top){parent.postMessage({type:'alvion-open-quote',url:url.href},location.origin);return true;}
  if(!sheet?.showModal)return false;
  fill(url);
  if(!tracked&&window.alvionTrack)window.alvionTrack('click_quote');
  if(sheet.open)return true;
  opener=source||document.activeElement;scrollPosition=window.scrollY;bodyStyle=document.body.getAttribute('style');
  document.body.style.position='fixed';document.body.style.top=-scrollPosition+'px';document.body.style.width='100%';
  sheet.showModal();sheet.scrollTop=0;sheet.querySelector('.sheet-close').focus({preventScroll:true});return true;
 }
 window.Alvion=window.Alvion||{};window.Alvion.openQuote=(href,source)=>open(href,source,false);
 document.addEventListener('click',event=>{
  const a=(event.composedPath?.()||[event.target]).find(node=>node.matches?.('a[data-track="quote"]'));if(!a||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  if(open(a.href,a,true))event.preventDefault();
 });
 window.addEventListener('message',event=>{if(event.origin!==location.origin||event.data?.type!=='alvion-open-quote')return;const frame=Array.from(document.querySelectorAll('iframe')).find(f=>f.contentWindow===event.source);if(frame&&typeof event.data.url==='string')open(event.data.url,frame,false);});
 if(!sheet)return;
 const form=sheet.querySelector('form');
 function clearStaleEstimate(){
  form.elements.starting_estimate.value='';
  const lines=[['Vehicle',form.elements.selected_vehicle.value],['Finish / shade',form.elements.selected_look.value]].filter(v=>v[1]).map(v=>v.join(': '));
  const summary=sheet.querySelector('.quote-selection');summary.textContent=lines.join('\n');summary.hidden=!lines.length;
 }
 form.elements.service.addEventListener('change',()=>{form.elements.selected_look.value='';clearStaleEstimate();});
 form.elements.vehicle.addEventListener('input',()=>{form.elements.selected_vehicle.value='';clearStaleEstimate();});
 sheet.querySelector('.sheet-close').addEventListener('click',close);
 sheet.addEventListener('cancel',e=>{e.preventDefault();close();});
 sheet.addEventListener('click',e=>{const r=sheet.getBoundingClientRect();if(e.target===sheet&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))close();});
 const handle=sheet.querySelector('.sheet-handle');
 handle.addEventListener('pointerdown',e=>{gesture={id:e.pointerId,y:e.clientY};handle.setPointerCapture(e.pointerId);});
 handle.addEventListener('pointerup',e=>{if(gesture?.id===e.pointerId&&e.clientY-gesture.y>60)close();gesture=null;});
 handle.addEventListener('pointercancel',()=>gesture=null);
 if(location.pathname.endsWith('/contact.html')&&location.hash==='#projectForm')open(location.href,null,true);
 // Any page can open the sheet from a link ending in #quote (for example the Instagram bio link).
 // ?service=, ?vehicle=, ?look= and ?estimate= in the same link pre-fill the form.
 function openFromHash(){if(location.hash==='#quote')open(new URL('contact.html'+location.search,location.href).href,null,true);}
 openFromHash();window.addEventListener('hashchange',openFromHash);
})();
