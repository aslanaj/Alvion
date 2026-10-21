/* Load the full-quality configurator only as the visitor approaches it. */
(() => {
  const root = document.getElementById('alvion-car-preview');
  if (!root) return;
  let started = false;
  const scripts = ['js/data/estimator-catalog.js?v=20261018-revision2', 'js/data/vehicle-images.js?v=20261018-revision2', 'js/features/estimator/controller.js?v=20261020-search1'];
  async function start() {
    if (started) return;
    started = true;
    root.setAttribute('aria-busy','true');
    try {
      for (const src of scripts) await new Promise((resolve,reject) => {
        const script = document.createElement('script');
        script.src = src; script.onload = resolve; script.onerror = reject;
        document.body.append(script);
      });
    } catch (_) {
      const message = document.createElement('p');
      message.textContent = 'The vehicle preview could not load. Please refresh to try again. Starting prices are listed below.';
      root.prepend(message);
    } finally { root.removeAttribute('aria-busy'); }
  }
  if (!('IntersectionObserver' in window)) { start(); return; }
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); start(); }
  },{rootMargin:'300px 0px'});
  observer.observe(root);
})();
