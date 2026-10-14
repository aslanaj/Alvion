/* Mirror the existing menu controller without replacing its keyboard handling. */
(() => {
  const top = document.querySelector('.mobile-toggle');
  const bottom = document.querySelector('.bottom-menu');
  const sheet = document.querySelector('.mobile-menu');
  if (!top || !bottom || !sheet) return;
  const path = location.pathname.split('/').pop() || 'index.html';
  const servicePages = ['vinyl-wrap.html','paint-protection-film.html','window-tint.html','ceramic-coating.html','detailing.html'];
  if (servicePages.includes(path)) document.querySelector('[data-nav=services]').setAttribute('aria-current','page');
  if (['about.html','aftercare.html'].includes(path)) bottom.dataset.current = 'true';
  let openedFromBottom = false;
  bottom.addEventListener('click', () => { openedFromBottom = true; top.click(); });
  const sync = () => {
    const open = top.getAttribute('aria-expanded') === 'true';
    bottom.setAttribute('aria-expanded', String(open));
    bottom.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    bottom.querySelector('span').textContent = open ? 'Close' : 'Menu';
    top.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (!open && openedFromBottom) { bottom.focus(); openedFromBottom = false; }
  };
  new MutationObserver(sync).observe(top,{attributes:true,attributeFilter:['aria-expanded']});
  sync();
})();

(() => {
 document.querySelectorAll('.project-cover[aria-controls]').forEach(cover=>{
  const details=document.getElementById(cover.getAttribute('aria-controls'));
  cover.addEventListener('click',()=>{details.open=true;details.querySelector('summary').focus();details.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});});
  details.addEventListener('toggle',()=>cover.setAttribute('aria-expanded',String(details.open)));
 });
 const form=document.querySelector('#projectForm');if(!form)return;
 const params=new URLSearchParams(location.search);const look=params.get('look');
 if(look){form.elements.message.value='Requested look: '+look+'\n'+(params.get('configurator')==='home'?'Interested in vinyl wrap and window tint.\n':'')+'Vehicle: ';}
})();
