/* Vehicle preview and starting estimate (services.html).
   Each vehicle has its own image and a per-pixel paint map, so a film color lands on
   painted panels only and never on glass, lights, wheels or trim.
   Data: js/data/estimator-catalog.js, js/data/vinyl-films.js, js/data/ppf-colors.js */
(() => {
  'use strict';
  const root = document.getElementById('alvion-car-preview');
  if (!root || !window.Alvion?.estimatorCatalog) return;

  const { vehicles, art } = Alvion.estimatorCatalog;
  const PRICE_COLUMN = { vinyl: 2, clear: 3, color: 4, front: 5, tint: 6, ceramic: 7 };
  const ART_PATH = 'assets/vehicles/';
  const ART_VERSION = '?v=20261113-paint1';
  const GRID = 512;                      // artwork coordinates are in a 512-wide grid
  const MAX_TILE = 1024;                 // native width of the artwork

  /* Film lists. Every entry: { brand, name, code, finish, hex, group } */
  const vinylFilms = (Alvion.vinylFilms || []).map(([brand, name, code, finish, hex]) =>
    ({ brand, name, code, finish, hex, group: finish }));
  const ppfFilms = (Alvion.ppfColors || []).map(([brand, name, finish, hex]) =>
    ({ brand, name, code: '', finish, hex, group: brand }));
  const palettes = {
    vinyl: { films: vinylFilms, groups: ['Gloss', 'Satin', 'Matte'], label: 'Finish' },
    color: { films: ppfFilms, groups: ['PurePPF', 'XPEL'], label: 'Brand' }
  };

  const state = { vehicle: 0, service: 'vinyl', group: { vinyl: 'Gloss', color: 'PurePPF' }, film: { vinyl: 0, color: 0 } };
  const stage = root.querySelector('.vehicle-canvas');
  const $ = selector => root.querySelector(selector);

  /* ---------- artwork loading ---------- */
  const artCache = new Map();
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }
  /* Opened straight from a folder (file://) the browser will not let a script read image files,
     so the same artwork is taken from an embedded copy instead. The live site uses the image files. */
  const LOCAL_FILE = location.protocol === 'file:';
  let embedded;
  function embeddedArt() {
    return embedded || (embedded = new Promise((resolve, reject) => {
      if (Alvion.vehicleArtFallback) { resolve(Alvion.vehicleArtFallback); return; }
      const script = document.createElement('script');
      script.src = 'js/data/vehicle-art-fallback.js';
      script.onload = () => resolve(Alvion.vehicleArtFallback);
      script.onerror = reject;
      document.head.append(script);
    }));
  }
  function loadArtImage(name) {
    return LOCAL_FILE ? embeddedArt().then(files => loadImage(files[name])) : loadImage(ART_PATH + name + ART_VERSION);
  }
  function loadArt(index) {
    if (!artCache.has(index)) {
      const slug = art[index].slug;
      artCache.set(index, Promise.all([loadArtImage(slug + '.webp'), loadArtImage(slug + '-mask.webp')])
        .then(([photo, mask]) => ({ photo, mask, tiles: new Map() })));
    }
    return artCache.get(index);
  }

  /* One prepared tile per vehicle and size: original pixels plus the paint and glass maps. */
  function prepareTile(entry, index, width) {
    if (entry.tiles.has(width)) return entry.tiles.get(width);
    const height = Math.round(width * art[index].height / GRID);
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.imageSmoothingQuality = 'high';
    context.drawImage(entry.photo, 0, 0, width, height);
    const base = context.getImageData(0, 0, width, height);
    context.clearRect(0, 0, width, height);
    context.drawImage(entry.mask, 0, 0, width, height);
    const maskPixels = context.getImageData(0, 0, width, height).data;
    const count = width * height;
    const paint = new Float32Array(count), glass = new Float32Array(count), light = new Float32Array(count);
    for (let i = 0, j = 0; i < count; i++, j += 4) {
      const r = base.data[j], g = base.data[j + 1], b = base.data[j + 2];
      const luminance = .2126 * r + .7152 * g + .0722 * b;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      // Deep shadow, black trim and colored lamps keep their own look.
      const key = Math.max(0, Math.min(1, (luminance - 30) / 28)) * Math.max(0, Math.min(1, 1 - (chroma - 18) / 60));
      paint[i] = maskPixels[j] / 255 * key;
      glass[i] = maskPixels[j + 1] / 255;
      light[i] = luminance / 255;
    }
    const tile = { width, height, base, paint, glass, light };
    entry.tiles.set(width, tile);
    return tile;
  }

  /* ---------- film shading ---------- */
  function shade(tile, output, film) {
    const rgb = film.hex.match(/\w\w/g).map(value => parseInt(value, 16) / 255);
    const finish = film.finish;
    const source = tile.base.data, target = output.data, { paint, light } = tile;
    for (let i = 0, j = 0; i < paint.length; i++, j += 4) {
      const amount = paint[i];
      if (!amount) continue;
      const l = light[i];
      let level, floor, gain, highlight;
      if (finish === 'Gloss') { level = Math.min(1.2, Math.pow(l, 1.12) * 1.06); floor = .14; gain = 1; highlight = Math.pow(l, 5) * 64; }
      else if (finish === 'Satin') { level = l * .74 + .156; floor = .19; gain = .92; highlight = Math.pow(l, 4) * 16; }
      else { level = l * .5 + .3; floor = .23; gain = .86; highlight = 0; }
      for (let k = 0; k < 3; k++) {
        const value = level * (floor + gain * rgb[k]) * 255 + highlight;
        target[j + k] = source[j + k] * (1 - amount) + Math.min(255, value) * amount;
      }
    }
  }
  function darkenGlass(tile, output, strength) {
    const target = output.data, { glass } = tile;
    for (let i = 0, j = 0; i < glass.length; i++, j += 4) {
      const amount = glass[i] * strength;
      if (!amount) continue;
      target[j] = target[j] * (1 - amount) + 1 * amount;
      target[j + 1] = target[j + 1] * (1 - amount) + 3 * amount;
      target[j + 2] = target[j + 2] * (1 - amount) + 6 * amount;
    }
  }
  function markFront(tile, output) {
    const target = output.data, { paint, width } = tile, from = Math.round(width * 345 / GRID);
    for (let i = 0, j = 0; i < paint.length; i++, j += 4) {
      if (i % width < from || !paint[i]) continue;
      const amount = paint[i] * .22;
      target[j] = target[j] * (1 - amount) + 122 * amount;
      target[j + 1] = target[j + 1] * (1 - amount) + 188 * amount;
      target[j + 2] = target[j + 2] * (1 - amount) + 245 * amount;
    }
  }
  function drawCalipers(context, tile, index) {
    const unit = tile.width / GRID;
    const original = context.getImageData(0, 0, tile.width, tile.height);
    art[index].wheels.forEach(([cx, cy, radius]) => {
      const r = radius * unit;
      context.save();
      context.translate(cx * unit + r * .15, cy * unit);
      context.scale(.68, .68);
      const gradient = context.createLinearGradient(r * .2, 0, r * .72, 0);
      gradient.addColorStop(0, '#701a19'); gradient.addColorStop(.35, '#e05340');
      gradient.addColorStop(.7, '#bc3027'); gradient.addColorStop(1, '#5d1515');
      context.fillStyle = gradient;
      context.beginPath();
      context.moveTo(r * .27, -r * .39);
      context.bezierCurveTo(r * .4, -r * .48, r * .64, -r * .38, r * .67, -r * .20);
      context.lineTo(r * .65, r * .23);
      context.quadraticCurveTo(r * .52, r * .43, r * .28, r * .34);
      context.lineTo(r * .21, r * .16);
      context.lineTo(r * .24, -r * .18);
      context.closePath();
      context.fill();
      context.restore();
    });
    // Spokes stay in front of the caliper: bright original pixels win.
    const painted = context.getImageData(0, 0, tile.width, tile.height);
    for (let j = 0; j < painted.data.length; j += 4) {
      const luminance = (original.data[j] + original.data[j + 1] + original.data[j + 2]) / 3;
      const keep = Math.max(0, Math.min(1, (luminance - 25) / 35));
      for (let k = 0; k < 3; k++) painted.data[j + k] = painted.data[j + k] * (1 - keep) + original.data[j + k] * keep;
    }
    context.putImageData(painted, 0, 0);
  }

  /* ---------- drawing ---------- */
  const work = document.createElement('canvas');
  let drawToken = 0;
  function currentFilm() {
    const palette = palettes[state.service];
    return palette ? palette.films[state.film[state.service]] : null;
  }
  async function draw() {
    const token = ++drawToken, index = state.vehicle;
    const cssWidth = stage.clientWidth, cssHeight = stage.clientHeight;
    if (!cssWidth || !cssHeight) return;
    let entry;
    try { entry = await loadArt(index); } catch (_) { return; }
    if (token !== drawToken) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fit = Math.min(cssWidth, cssHeight * GRID / art[index].height);
    const width = Math.min(MAX_TILE, Math.max(256, Math.ceil(fit * dpr / 128) * 128));
    const tile = prepareTile(entry, index, width);
    const output = new ImageData(new Uint8ClampedArray(tile.base.data), tile.width, tile.height);
    const film = currentFilm();
    if (film) shade(tile, output, film);
    if (state.service === 'tint') darkenGlass(tile, output, Math.max(0, .82 - Number($('#alvion-tint').value) / 100));
    if (state.service === 'front') markFront(tile, output);
    work.width = tile.width; work.height = tile.height;
    const workContext = work.getContext('2d', { willReadFrequently: true });
    workContext.putImageData(output, 0, 0);
    if (state.service === 'caliper') drawCalipers(workContext, tile, index);
    stage.width = Math.round(cssWidth * dpr); stage.height = Math.round(cssHeight * dpr);
    const context = stage.getContext('2d');
    context.imageSmoothingQuality = 'high';
    const scale = Math.min(stage.width / tile.width, stage.height / tile.height);
    const drawWidth = tile.width * scale, drawHeight = tile.height * scale;
    context.drawImage(work, (stage.width - drawWidth) / 2, (stage.height - drawHeight) / 2, drawWidth, drawHeight);
    stage.classList.add('is-drawn');
  }

  /* ---------- controls ---------- */
  const thumbs = loadArtImage('thumbs.webp');
  vehicles.forEach((vehicle, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'cursor-interaction';
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 116; canvas.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span'); label.textContent = vehicle[0];
    button.append(canvas, label);
    button.onclick = () => { state.vehicle = index; update(); };
    $('.cars').append(button);
    thumbs.then(sheet => canvas.getContext('2d').drawImage(sheet, (index % 3) * 256, Math.floor(index / 3) * 116, 256, 116, 0, 0, 256, 116)).catch(() => {});
  });

  /* Vehicle row: one scrolling line with arrow buttons (swipe works too). */
  (() => {
    const cars = $('.cars'), row = document.createElement('div');
    row.className = 'cars-row'; cars.before(row); row.append(cars);
    const make = (cls, label, text, dir) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'cars-nav cursor-interaction ' + cls; button.setAttribute('aria-label', label); button.textContent = text;
      button.onclick = () => cars.scrollBy({ left: dir * cars.clientWidth * .7, behavior: 'smooth' });
      row.append(button); return button;
    };
    const prev = make('prev', 'Previous vehicles', '‹', -1), next = make('next', 'More vehicles', '›', 1);
    const sync = () => { prev.disabled = cars.scrollLeft < 4; next.disabled = cars.scrollLeft + cars.clientWidth > cars.scrollWidth - 4; };
    cars.addEventListener('scroll', sync, { passive: true }); new ResizeObserver(sync).observe(cars); sync();
  })();

  const tabs = $('.film-tabs'), swatches = $('.swatches');
  function buildPalette() {
    const palette = palettes[state.service];
    tabs.replaceChildren(); swatches.replaceChildren();
    if (!palette) return;
    tabs.setAttribute('aria-label', palette.label);
    palette.groups.forEach(group => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'cursor-interaction'; button.textContent = group;
      button.setAttribute('aria-pressed', String(group === state.group[state.service]));
      button.onclick = () => {
        state.group[state.service] = group;
        state.film[state.service] = palette.films.findIndex(film => film.group === group);
        buildPalette(); update();
      };
      tabs.append(button);
    });
    palette.films.forEach((film, index) => {
      if (film.group !== state.group[state.service]) return;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'cursor-interaction';
      button.title = film.name;
      button.setAttribute('aria-label', film.brand + ' ' + film.name);
      button.setAttribute('aria-pressed', String(index === state.film[state.service]));
      const dot = document.createElement('i'); dot.style.setProperty('--paint', film.hex);
      button.append(dot);
      button.onclick = () => { state.film[state.service] = index; update(); };
      button.dataset.film = index;
      swatches.append(button);
    });
  }
  function filmLabel(film) {
    return film.brand + ' ' + film.name + (film.code ? ' (' + film.code + ')' : '');
  }

  function update() {
    const service = state.service;
    const showLuxury = ['vinyl', 'clear', 'color', 'front'].includes(service);
    if (!showLuxury && state.vehicle === 4) state.vehicle = 2;
    root.querySelectorAll('.cars button').forEach((button, index) => {
      button.hidden = index === 4 && !showLuxury;
      button.setAttribute('aria-pressed', String(index === state.vehicle));
    });
    $('.model').textContent = vehicles[state.vehicle][0];
    const film = currentFilm();
    $('.paint-control').hidden = !film;
    if (film) {
      $('.color-name').textContent = film.name;
      $('.film-detail').textContent = film.brand + (film.code ? ' · ' + film.code : '') + ' · ' + film.finish;
      swatches.querySelectorAll('button').forEach(button =>
        button.setAttribute('aria-pressed', String(Number(button.dataset.film) === state.film[service])));
    }
    $('.tint-control').hidden = service !== 'tint';
    const tintNote = $('#estimator-tint-note');
    if (tintNote) tintNote.hidden = service !== 'tint';
    const price = service === 'caliper' ? 500 : vehicles[state.vehicle][PRICE_COLUMN[service]];
    $('.price').textContent = price ? '$' + price.toLocaleString('en-US') : 'Individually quoted';
    $('.quote .muted').textContent = price ? 'Starting at' : 'Bespoke estimate';
    $('.warranty').textContent = service === 'vinyl' ? '5-year installation warranty'
      : ['clear', 'color', 'front'].includes(service) ? '10-year installation warranty'
      : service === 'tint' ? 'Installation warranty while the original customer owns the vehicle'
      : 'Coverage confirmed with your quote';
    $('.inquiry').hidden = true;
    draw();
  }

  $('#alvion-service').onchange = event => { state.service = event.target.value; buildPalette(); update(); };
  $('#alvion-tint').oninput = event => { $('.vlt').textContent = event.target.value + '%'; draw(); };
  $('.cta').onclick = () => {
    const film = currentFilm();
    const quoteUrl = Alvion.buildQuoteUrl({
      vehicle: vehicles[state.vehicle][0],
      service: $('#alvion-service').selectedOptions[0].text,
      estimate: $('.price').textContent,
      look: film ? filmLabel(film) : state.service === 'tint' ? $('#alvion-tint').value + '% VLT preview' : ''
    });
    if (!window.Alvion.openQuote?.(quoteUrl, $('.cta'))) {
      if (window.alvionTrack) window.alvionTrack('click_quote');
      window.location.href = quoteUrl;
    }
  };
  new ResizeObserver(draw).observe(stage);
  buildPalette();
  update();
})();
