(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (!motion.matches && entry.boundingClientRect.top > 80) {
        entry.target.animate([
          {opacity:.25,transform:'translateY(8px)'},
          {opacity:1,transform:'translateY(0)'}
        ],{duration:300,easing:'cubic-bezier(.2,.7,.2,1)'});
      }
    }),{threshold:.08});
    document.querySelectorAll('.expertise-card,.selected-grid>a,.portfolio-project').forEach(el=>observer.observe(el));
  }
  document.querySelectorAll('.faq-list details').forEach(details => {
    const summary=details.querySelector('summary');
    let animation, targetOpen=details.open;
    summary.addEventListener('click', event => {
      if (motion.matches || !details.animate) return;
      event.preventDefault();
      const start=details.getBoundingClientRect().height;
      targetOpen=animation ? !targetOpen : !details.open;
      if(animation){animation.onfinish=null;animation.cancel();}
      details.style.height='';
      details.open=true;
      const end=targetOpen ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height;
      details.style.overflow='hidden';
      animation=details.animate([{height:start+'px'},{height:end+'px'}],{duration:240,easing:'cubic-bezier(.2,.7,.2,1)'});
      const finish=()=>{details.open=targetOpen;details.style.overflow='';animation=null;};
      animation.onfinish=finish;
      animation.oncancel=()=>{details.style.overflow='';};
    });
  });
  motion.addEventListener('change', () => {
    if(motion.matches) document.getAnimations().forEach(animation=>animation.cancel());
  });
})();
