/* DOM/SVG adapter. Receives state; never owns animation timers or selections. */
window.Alvion = window.Alvion || {};

Alvion.createPpfView = function createPpfView(host, catalog) {
  const root = host.attachShadow({ mode: 'open' });
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'css/features/ppf.css?v=20261115-fit1';
  root.innerHTML = Alvion.ppfTemplate;
  root.prepend(stylesheet);

  const find = id => root.getElementById(id);
  const packageButtons = [...root.querySelectorAll('[data-package]')];
  const finishButtons = [...root.querySelectorAll('[data-finish]')];
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

  /* Swatches sit in one labelled group per brand (PurePPF, XPEL). */
  const brandGroups = {};
  const swatches = catalog.colors.map(([name, color, , brand]) => {
    if (!brandGroups[brand]) {
      const group = document.createElement('div'), label = document.createElement('span'), row = document.createElement('div');
      group.className = 'swatch-group'; group.setAttribute('role', 'group'); group.setAttribute('aria-label', brand + ' colors');
      label.className = 'swatch-brand'; label.textContent = brand; row.className = 'swatch-row';
      group.append(label, row); find('swatches').append(group); brandGroups[brand] = row;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.style.setProperty('--swatch', color);
    button.setAttribute('aria-label', name);
    button.title = name;
    brandGroups[brand].append(button);
    return button;
  });


  /* ---- Car painter ----------------------------------------------------------------
     The photo is recolored pixel by pixel through a paint map (red = painted panels,
     blue = the Full Front area), so film color and finish land on paint only and
     never on glass, lights, wheels or trim. The result is shown in the #render image. */
  const art = catalog.art;
  const loadImage = src => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
  let tilePromise = null;
  function prepareTile() {
    if (tilePromise) return tilePromise;
    // Opened straight from a folder (file://) scripts may not read image files, so an embedded copy is used there.
    const sources = location.protocol !== 'file:' ? Promise.resolve(art) : new Promise((resolve, reject) => {
      if (Alvion.ppfArtFallback) { resolve(Alvion.ppfArtFallback); return; }
      const script = document.createElement('script');
      script.src = 'js/data/ppf-art-fallback.js';
      script.onload = () => resolve(Alvion.ppfArtFallback);
      script.onerror = reject;
      document.head.append(script);
    });
    tilePromise = sources.then(files => Promise.all([loadImage(files.photo), loadImage(files.mask)])).then(([photo, mask]) => {
      const sharp = host.clientWidth * Math.min(window.devicePixelRatio || 1, 2) > 1100;
      const width = sharp ? art.width : 1024, height = Math.round(width * art.height / art.width);
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.imageSmoothingQuality = 'high';
      context.drawImage(photo, 0, 0, width, height);
      const base = context.getImageData(0, 0, width, height);
      context.clearRect(0, 0, width, height);
      context.drawImage(mask, 0, 0, width, height);
      const map = context.getImageData(0, 0, width, height).data;
      const count = width * height;
      const paint = new Float32Array(count), front = new Float32Array(count), light = new Float32Array(count);
      for (let i = 0, j = 0; i < count; i++, j += 4) {
        const r = base.data[j], g = base.data[j + 1], b = base.data[j + 2];
        const luminance = .2126 * r + .7152 * g + .0722 * b;
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        const key = Math.max(0, Math.min(1, (luminance - 30) / 28)) * Math.max(0, Math.min(1, 1 - (chroma - 18) / 60));
        paint[i] = map[j] / 255 * key;
        front[i] = paint[i] * map[j + 2] / 255;
        light[i] = luminance / 255;
      }
      return { canvas, context, width, height, base, paint, front, light };
    });
    return tilePromise;
  }
  /* How each finish treats light: gloss keeps deep contrast and sharp highlights,
     satin spreads the light, matte flattens it. Dark paint gets a stronger separation. */
  function finishCurve(finish, dark) {
    if (finish === 'Gloss') return dark
      ? l => [Math.min(1.25, Math.pow(l, 1.45) * 1.18), .07, 1, Math.pow(l, 4) * 118]
      : l => [Math.min(1.2, Math.pow(l, 1.12) * 1.06), .14, 1, Math.pow(l, 5) * 64];
    if (finish === 'Satin') return dark
      ? l => [l * .58 + .27, .62, .9, Math.pow(l, 3) * 20]
      : l => [l * .74 + .156, .19, .92, Math.pow(l, 4) * 16];
    return dark
      ? l => [l * .34 + .40, .62, .86, 0]
      : l => [l * .5 + .3, .23, .86, 0];
  }
  function paintLayer(tile, pixels, hex, finish, region) {
    const rgb = hex.match(/\w\w/g).map(value => parseInt(value, 16) / 255);
    const dark = .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2] < .12;
    const curve = finishCurve(finish, dark), amounts = tile[region], light = tile.light;
    for (let i = 0, j = 0; i < amounts.length; i++, j += 4) {
      const amount = amounts[i];
      if (!amount) continue;
      const [level, floor, gain, highlight] = curve(light[i]);
      for (let k = 0; k < 3; k++) {
        const value = level * (floor * (dark ? .32 : 1) + gain * rgb[k]) * 255 + highlight;
        pixels[j + k] = pixels[j + k] * (1 - amount) + Math.min(255, value) * amount;
      }
    }
  }
  /* What the car should look like for a state: a list of [hex, finish, region] layers. */
  function lookFor(state) {
    if (state.packageId === 'color') {
      const film = catalog.colors[state.filmColorIndex];
      return [[film[1], film[2] || 'Gloss', 'paint']];
    }
    const finish = catalog.finishes.find(entry => entry[0] === state.finish);
    if (!finish || finish[0] === 'gloss') return [];
    const layers = [[catalog.darkPaint, 'Gloss', 'paint']];
    layers.push([catalog.darkPaint, finish[2], state.packageId === 'front' ? 'front' : 'paint']);
    return layers;
  }
  const rendered = new Map();
  let shownKey = '', renderToken = 0;
  function showLook(layers) {
    const key = JSON.stringify(layers), image = find('render');
    if (key === shownKey) return;
    shownKey = key;
    const token = ++renderToken;
    if (!layers.length) { image.setAttribute('opacity', '0'); return; }
    const show = url => { if (token !== renderToken) return; image.setAttribute('href', url); image.setAttribute('opacity', '1'); };
    if (rendered.has(key)) { show(rendered.get(key)); return; }
    prepareTile().then(tile => {
      const output = new ImageData(new Uint8ClampedArray(tile.base.data), tile.width, tile.height);
      layers.forEach(([hex, finish, region]) => paintLayer(tile, output.data, hex, finish, region));
      tile.context.putImageData(output, 0, 0);
      tile.canvas.toBlob(blob => {
        if (!blob) return;
        if (rendered.size >= 16) { const oldest = rendered.keys().next().value; URL.revokeObjectURL(rendered.get(oldest)); rendered.delete(oldest); }
        const url = URL.createObjectURL(blob);
        rendered.set(key, url);
        show(url);
      }, 'image/jpeg', .92);
    }).catch(() => {});
  }

  function render(state) {
    const selection = catalog.packages[state.packageId];
    const colored = state.packageId === 'color';
    const lifted = ['lift', 'color'].includes(state.phase);
    const color = catalog.colors[state.colorIndex];
    const colorName = color[0];
    const filmColor = catalog.colors[state.filmColorIndex][1];
    const finish = catalog.finishes.find(entry => entry[0] === state.finish) || catalog.finishes[0];
    const darkCar = !colored && finish[0] !== 'gloss';

    packageButtons.forEach(button => {
      button.setAttribute('aria-pressed', button.dataset.package === state.packageId);
    });
    swatches.forEach((button, index) => {
      button.setAttribute('aria-pressed', index === state.colorIndex);
    });
    finishButtons.forEach(button => {
      button.setAttribute('aria-pressed', button.dataset.finish === state.finish);
    });
    const finishRow = find('finishes');
    if (finishRow) finishRow.hidden = colored;
    find('color-finish').textContent = color[2] ? color[2] + ' finish' : '';

    // While film is lifting away the car keeps its previous look; the new one lands with the film.
    if (state.packageId === 'front' || state.phase !== 'lift') showLook(lookFor(state));

    const toggle = find('explode');
    toggle.removeAttribute('aria-pressed');
    toggle.disabled = false;
    toggle.lastChild.textContent = state.packageId === 'front' ? 'Full Front · lifted film view' : state.phase === 'idle'
      ? 'Replay film application' : 'Applying film…';

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
    find('panel-label').textContent = (state.packageId === 'front'
      ? 'Full hood · bumper · front fenders · mirror caps'
      : 'Exterior painted panels · glass, lights & wheels excluded')
      + (darkCar ? ' · ' + finish[1] + ' film on dark paint' : '');
    find('car-title').textContent = `${selection.title} on a Porsche 911${colored ? ' in ' + colorName : ''}`;

    panelViews.forEach(({ panel, film, guide }) => {
      const active = state.packageId !== 'front' || panel.front;
      film.style.fill = colored ? filmColor : 'url(#film)';
      film.style.mixBlendMode = 'normal';
      film.style.stroke = colored && !lifted ? 'transparent' : '#d5e8e9';
      // Settled color film is painted into the photo itself, so the outline shapes step aside.
      film.style.opacity = active ? (colored ? (lifted ? '.85' : '0') : lifted ? '.88' : darkCar ? '0' : '.22') : '0';
      film.style.transform = active && lifted
        ? `translate(${panel.dx}px,${panel.dy}px)`
        : 'translate(0,0)';
      guide.style.opacity = active && lifted ? '1' : '0';
    });

    find('quote-link').href = Alvion.buildQuoteUrl({
      vehicle: 'Porsche 911',
      service: selection.service,
      look: colored
        ? `${colorName} Color PPF (confirm with a swatch)`
        : `${finish[1]} PPF`
    });
  }

  function bind(actions) {
    packageButtons.forEach(button => {
      button.addEventListener('click', () => actions.selectPackage(button.dataset.package));
    });
    swatches.forEach((button, index) => {
      button.addEventListener('click', () => actions.selectColor(index));
    });
    finishButtons.forEach(button => {
      button.addEventListener('click', () => actions.selectFinish(button.dataset.finish));
    });
    find('explode').addEventListener('click', actions.toggleExploded);
  }

  const ready = Promise.all([
    new Promise(resolve => {
      const image = new Image();
      image.onload = image.onerror = resolve;
      image.src = find('photo').getAttribute('href');
    }),
    new Promise(resolve => {
      if (stylesheet.sheet) resolve();
      else { stylesheet.addEventListener('load',resolve,{once:true}); stylesheet.addEventListener('error',resolve,{once:true}); }
    })
  ]);
  return { render, bind, ready };
};
