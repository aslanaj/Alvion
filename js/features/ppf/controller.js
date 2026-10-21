/* Every film selection lifts briefly, then settles onto the vehicle. */
window.Alvion = window.Alvion || {};
Alvion.createPpfController = function (view, catalog, environment) {
  const state = { packageId: 'front', exploded: false, colorIndex: 0, filmColorIndex: 0, phase: 'idle' };
  let timers = [], destroyed = false, interacted = false;
  const render = () => view.render({ ...state });
  function cancel() {
    timers.forEach(environment.clearTimer);
    timers = [];
    state.phase = 'idle';
    state.exploded = false;
  }
  function applyFilm() {
    cancel();
    if (environment.prefersReducedMotion()) {
      state.filmColorIndex = state.colorIndex;
      if (state.packageId === 'front') state.phase = 'lift';
      render();
      return;
    }
    state.phase = 'lift';
    render();
    if (state.packageId === 'front') return;
    timers.push(environment.setTimer(() => {
      state.filmColorIndex = state.colorIndex;
      state.phase = 'color';
      render();
    }, catalog.timing.recolor));
    timers.push(environment.setTimer(() => { state.phase = 'return'; render(); }, catalog.timing.return));
    timers.push(environment.setTimer(() => { state.phase = 'idle'; timers = []; render(); }, catalog.timing.complete));
  }
  function selectPackage(id) {
    if (!catalog.packages[id] || destroyed) return;
    interacted = true;
    state.packageId = id;
    applyFilm();
  }
  function selectColor(index) {
    if (!catalog.colors[index] || destroyed) return;
    interacted = true;
    state.colorIndex = index;
    applyFilm();
  }
  function replay() { if (!destroyed) { interacted = true; applyFilm(); } }
  view.bind({ selectPackage, selectColor, toggleExploded: replay });
  render();
  if (view.ready) view.ready.then(() => { if (!interacted && !destroyed) applyFilm(); });
  return {
    destroy() { destroyed = true; cancel(); },
    settle() { cancel(); state.filmColorIndex = state.colorIndex; if(state.packageId === 'front') state.phase='lift'; render(); }
  };
};

(() => {
  const hosts = document.querySelectorAll('[data-alvion-ppf], #ppf-studio');
  const initialize = host => {
    if (host.shadowRoot) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const view = Alvion.createPpfView(host, Alvion.ppfCatalog);
    const controller = Alvion.createPpfController(view, Alvion.ppfCatalog, {
      setTimer: (callback, delay) => setTimeout(callback, delay),
      clearTimer: timer => clearTimeout(timer),
      prefersReducedMotion: () => preference.matches
    });
    preference.addEventListener('change', () => { if (preference.matches) controller.settle(); });
  };
  if (!('IntersectionObserver' in window)) { hosts.forEach(initialize); return; }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { observer.unobserve(entry.target); initialize(entry.target); }
  }), { rootMargin: '400px 0px' });
  hosts.forEach(host => observer.observe(host));
})();
