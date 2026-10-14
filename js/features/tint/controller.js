
(()=>{
 const root=document.getElementById('alvion-configurator');if(!root)return;
 const colors=[['Midnight Green','#234b3e'],['Obsidian Black','#25282e'],['Pearl White','#d5d6d2'],['Steel Silver','#848d97'],['Deep Blue','#234779'],['Burgundy','#692334'],['Violet','#634479']];
 let selected=0,finish='Gloss',vlt=35,context='home';
 const qs=s=>root.querySelector(s),qa=s=>root.querySelectorAll(s);
 const swatches=qs('.av-swatches');
 const car=AlvionCar.mount(qs('.av-car-stage'),{label:'Tesla Model 3 style preview'});
 colors.forEach(([name,color],i)=>{const b=document.createElement('button');b.type='button';b.style.setProperty('--swatch',color);b.setAttribute('aria-label',name);b.setAttribute('aria-pressed',String(i===0));b.dataset.tooltip=name;b.addEventListener('click',()=>{selected=i;paint()});swatches.appendChild(b)});
 function blend(hex,amount){const n=parseInt(hex.slice(1),16);return '#'+[n>>16,(n>>8)&255,n&255].map(c=>Math.round(amount>0?c+(255-c)*amount:c*(1+amount)).toString(16).padStart(2,'0')).join('')}
 function textSummary(){return context==='tint'?vlt+'% VLT · Side windows':colors[selected][0]+' · '+finish+(context==='home'?' · '+vlt+'% VLT':'')}
 function paint(){
 car.render({color:colors[selected][1],finish:finish,vlt:context==='wrap'?70:vlt,paintBody:context!=='tint'});
 qs('.av-color-name').textContent=colors[selected][0];qs('#av-tint-value').value=vlt+'% VLT';qs('#av-tint-range').setAttribute('aria-valuetext',vlt+' percent visible light transmission');
 qa('.av-swatches button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));qa('[data-finish]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.finish===finish)));qa('[data-vlt]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.vlt)===vlt)));
 qs('.av-summary').textContent=textSummary();qs('#av-inquiry-text').value='Service: '+(context==='tint'?'Window Tint':context==='wrap'?'Vinyl Wrap':'Vinyl Wrap + Window Tint')+'\n'+textSummary()+'\nPreview vehicle: Tesla Model 3';}

 qa('[data-finish]').forEach(b=>b.addEventListener('click',()=>{finish=b.dataset.finish;paint()}));
 qs('#av-tint-range').addEventListener('input',e=>{vlt=Number(e.target.value);paint()});
 qa('[data-vlt]').forEach(b=>b.addEventListener('click',()=>{vlt=Number(b.dataset.vlt);qs('#av-tint-range').value=vlt;paint()}));
 qa('[data-context]').forEach(b=>b.addEventListener('click',()=>{context=b.dataset.context;qa('[data-context]').forEach(tab=>{const active=tab.dataset.context===context;tab.setAttribute('aria-selected',String(active));tab.classList.toggle('active',active)});qs('#av-config-panel').setAttribute('aria-labelledby',b.id);qs('.av-page').textContent=context==='home'?'COLOR & TINT':context==='wrap'?'VINYL WRAP':'WINDOW TINT';qs('.av-heading h2').innerHTML=context==='tint'?'Find your <em>shade.</em>':context==='wrap'?'Make it <em>yours.</em>':'Find your <em>finish.</em>';qs('.av-wrap-controls').hidden=context==='tint';qs('.av-tint-controls').hidden=context==='wrap';qs('.av-controls').classList.toggle('av-focused',context!=='home');qs('.av-inquiry').hidden=true;paint()}));
 qs('.av-quote').addEventListener('click',()=>{const quoteUrl=Alvion.buildQuoteUrl({service:context==='tint'?'Window Tint':'Vinyl Wrap',look:textSummary(),configurator:context});const link=document.createElement('a');link.href=quoteUrl;document.body.appendChild(link);link.click();link.remove()});qs('.av-close').addEventListener('click',()=>{qs('.av-inquiry').hidden=true;qs('.av-quote').focus()});paint();qs('[data-context='+root.dataset.initial+']').click();
})();
