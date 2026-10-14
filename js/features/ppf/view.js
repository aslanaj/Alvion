/* DOM/SVG adapter. Receives state; never owns animation timers or selections. */
window.Alvion = window.Alvion || {};

Alvion.createPpfView = function createPpfView(host, catalog) {
  const root = host.attachShadow({ mode: 'open' });
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'css/features/ppf.css?v=clean1';
  root.innerHTML = Alvion.ppfTemplate;
  root.prepend(stylesheet);

  const find = id => root.getElementById(id);
  const packageButtons = [...root.querySelectorAll('[data-package]')];
  const svgElement = (tag, attributes) => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [name, value] of Object.entries(attributes)) {
      element.setAttribute(name, value);
    }
    return element;
  };

  // View references are separate from the immutable panel geometry catalog.
  const panelViews = catalog.panels.map(panel => {
    const film = svgElement('path', {
      d: panel.d, 'fill-rule': 'evenodd', class: 'film'
    });
    const guide = svgElement('g', { class: 'guide-group' });
    guide.append(
      svgElement('line', {
        x1: panel.x, y1: panel.y,
        x2: panel.x + panel.dx, y2: panel.y + panel.dy,
        class: 'guide'
      }),
      svgElement('circle', { cx: panel.x, cy: panel.y, r: 5, class: 'anchor' })
    );
    find('films').append(film);
    find('guides').append(guide);
    return { panel, film, guide };
  });

  const swatches = catalog.colors.map(([name, color]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.style.setProperty('--swatch', color);
    button.setAttribute('aria-label', name);
    find('swatches').append(button);
    return button;
  });

  function render(state) {
    const selection = catalog.packages[state.packageId];
    const colored = state.packageId === 'color';
    const lifted = colored
      ? ['lift', 'color'].includes(state.phase)
      : state.exploded;
    const colorName = catalog.colors[state.colorIndex][0];
    const filmColor = catalog.colors[state.filmColorIndex][1];

    packageButtons.forEach(button => {
      button.setAttribute('aria-pressed', button.dataset.package === state.packageId);
    });
    swatches.forEach((button, index) => {
      button.setAttribute('aria-pressed', index === state.colorIndex);
    });

    const toggle = find('explode');
    toggle.setAttribute('aria-pressed', lifted);
    toggle.disabled = colored;
    toggle.lastChild.textContent = colored
      ? (state.phase === 'idle' ? 'Color film applied' : 'Applying color film…')
      : 'Exploded film view';

    find('colors').hidden = !colored;
    find('color-name').textContent = colorName;
    find('package-title').textContent = selection.title;
    find('package-kicker').textContent = selection.kicker;
    find('package-description').textContent = selection.description;
    find('coverage').replaceChildren(...selection.coverage.map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
    find('panel-label').textContent = state.packageId === 'front'
      ? 'Full hood · bumper · front fenders · mirror caps'
      : 'Exterior painted panels · glass, lights & wheels excluded';
    find('car-title').textContent = `${selection.title} on a Porsche 911${colored ? ' in ' + colorName : ''}`;

    panelViews.forEach(({ panel, film, guide }) => {
      const active = state.packageId !== 'front' || panel.front;
      film.style.fill = colored ? filmColor : 'url(#film)';
      film.style.mixBlendMode = colored && !lifted ? 'multiply' : 'normal';
      film.style.stroke = colored && !lifted ? 'transparent' : '#d5e8e9';
      film.style.opacity = active ? (colored ? '.85' : lifted ? '.88' : '.22') : '0';
      film.style.transform = active && lifted
        ? `translate(${panel.dx}px,${panel.dy}px)`
        : 'translate(0,0)';
      guide.style.opacity = active && lifted ? '1' : '0';
    });

    find('quote-link').href = Alvion.buildQuoteUrl({
      vehicle: 'Porsche 911',
      service: selection.service,
      look: colored
        ? `${colorName} Color PPF (illustrative; confirm product)`
        : 'Clear PPF'
    });
  }

  function bind(actions) {
    packageButtons.forEach(button => {
      button.addEventListener('click', () => actions.selectPackage(button.dataset.package));
    });
    swatches.forEach((button, index) => {
      button.addEventListener('click', () => actions.selectColor(index));
    });
    find('explode').addEventListener('click', actions.toggleExploded);
  }

  return { render, bind };
};
