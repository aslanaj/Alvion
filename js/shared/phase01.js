(() => {
 const path=location.pathname.split('/').pop()||'index.html';
 const servicePages=['services.html','vinyl-wrap.html','paint-protection-film.html','window-tint.html','ceramic-coating.html','detailing.html'];
 const current=path==='index.html'?'home':path==='work.html'?'work':servicePages.includes(path)?'services':path==='contact.html'?'contact':null;
 document.querySelectorAll('.glass-nav a[data-nav]').forEach(a=>{if(a.dataset.nav===current)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 // Quote controls without a vehicle configurator still carry the page's service.
 const services={'vinyl-wrap.html':'Vinyl Wrap','paint-protection-film.html':'Paint Protection Film','window-tint.html':'Window Tint','ceramic-coating.html':'Ceramic Coating','detailing.html':'Detailing'};
 if(services[path])document.querySelectorAll('a[data-track="quote"]').forEach(a=>{const url=new URL(a.href,location.href);if(url.origin===location.origin&&!url.searchParams.has('service')){url.searchParams.set('service',services[path]);a.href=url.href;}});
})();
