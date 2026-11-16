(function(){
 'use strict';
 function init(){
  var section=document.getElementById('testimonials');
  if(section){
   var track=section.querySelector('.testimonial-track'),cards=Array.from(track.children),controls=section.querySelector('.testimonial-controls'),prev=section.querySelector('[data-review-prev]'),next=section.querySelector('[data-review-next]'),status=section.querySelector('.testimonial-status');
   function update(){var max=track.scrollWidth-track.clientWidth;controls.hidden=max<2;prev.disabled=track.scrollLeft<2;next.disabled=track.scrollLeft>=max-2;var index=cards.reduce(function(best,card,i){return Math.abs(card.getBoundingClientRect().left-track.getBoundingClientRect().left)<Math.abs(cards[best].getBoundingClientRect().left-track.getBoundingClientRect().left)?i:best;},0);status.textContent='Review '+(index+1)+' of '+cards.length;}
   function move(direction){track.scrollBy({left:direction*(cards[0].getBoundingClientRect().width+parseFloat(getComputedStyle(track).gap||0)),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
   prev.addEventListener('click',function(){move(-1);});next.addEventListener('click',function(){move(1);});
   track.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
   track.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);update();
  }
  var copy=document.getElementById('copy-review-link');
  if(copy){copy.hidden=false;copy.addEventListener('click',async function(){var input=document.getElementById('review-page-link'),status=document.getElementById('copy-review-status');try{await navigator.clipboard.writeText(input.value);status.textContent='Link copied. Ready to share.';}catch(error){input.focus();input.select();status.textContent='Select and copy the link above to share it.';}});}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
