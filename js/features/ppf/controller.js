/* State and animation sequencing. The view is the only DOM adapter. */
window.Alvion = window.Alvion || {};

Alvion.createPpfController = function createPpfController(view, catalog, environment) {
  const state = {
    packageId: 'front', exploded: true,
    colorIndex: 0, filmColorIndex: 0, phase: 'idle'
  };
  let timers = [];
  const render = () => view.render({ ...state });

  function cancelAnimation() {
    timers.forEach(environment.clearTimer);
    timers = [];
    state.phase = 'idle';
  }

  function selectColor(index) {
    if (!catalog.colors[index]) return;
    cancelAnimation();
    state.colorIndex = index;
    if (environment.prefersReducedMotion()) {
      state.filmColorIndex = index;
      render();
      return;
    }

    state.phase = 'lift';
    render();
    timers.push(environment.setTimer(() => {
      state.filmColorIndex = index;
      state.phase = 'color';
      render();
    }, catalog.timing.recolor));
    timers.push(environment.setTimer(() => {
      state.phase = 'return';
      render();
    }, catalog.timing.return));
    timers.push(environment.setTimer(() => {
      state.phase = 'idle';
      timers = [];
      render();
    }, catalog.timing.complete));
  }

  function selectPackage(packageId) {
    if (!catalog.packages[packageId]) return;
    cancelAnimation();
    state.packageId = packageId;
    if (packageId === 'color') selectColor(state.colorIndex);
    else render();
  }

  function toggleExploded() {
    if (state.packageId === 'color') return;
    state.exploded = !state.exploded;
    render();
  }

  view.bind({ selectPackage, selectColor, toggleExploded });
  render();
  return { destroy: cancelAnimation };
};

// Composition root: wires browser services to each independent instance.
document.querySelectorAll('[data-alvion-ppf], #ppf-studio').forEach(host => {
  if (host.shadowRoot) return;
  const catalog = Alvion.ppfCatalog;
  const view = Alvion.createPpfView(host, catalog);
  Alvion.createPpfController(view, catalog, {
    setTimer: (callback, delay) => window.setTimeout(callback, delay),
    clearTimer: timer => window.clearTimeout(timer),
    prefersReducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  });
});
