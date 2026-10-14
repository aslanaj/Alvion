/* ALVION — photo-real Tesla Model 3 color, finish and tint preview.
 * Recolors the studio photo through a precise paint mask (assets/tesla-model-3-mask.webp):
 *   red = painted body, green = window glass, blue = floor reflection.
 * Shading and reflections come from the original photo, so gloss, satin and matte keep a real 3D look.
 */
(() => {
  const PHOTO = 'assets/tesla-model-3-configurator.webp';
  const MASK = 'assets/tesla-model-3-mask.webp?v=2';
  const W = 1536, H = 560, TOP = 235;          // visible crop of the 1536×1024 photo
  const FINISH = {                             // contrast, highlight start, highlight strength, sweep
    Gloss: [1.0, 0.80, 0.85, 0.55],
    Satin: [0.72, 0.88, 0.35, 0.22],
    Matte: [0.50, 0.95, 0.10, 0]
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const toLin = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const c = i / 255; toLin[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  const toSrgb = v => { v = Math.min(1, Math.max(0, v)); return 255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055); };
  const hexLin = hex => [1, 3, 5].map(i => toLin[parseInt(hex.slice(i, i + 2), 16)]);

  let shared;
  const loadImage = src => new Promise((resolve, reject) => { const i = new Image(); i.decoding = 'async'; i.onload = () => resolve(i); i.onerror = reject; i.src = src; });
  const readPixels = (img, offsetY) => {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, -offsetY);
    return x.getImageData(0, 0, W, H).data;
  };
  let assetsPromise;
  const embeddedAssets = () => assetsPromise || (assetsPromise = new Promise((resolve, reject) => {
    if (window.ALVION_CAR_ASSETS) return resolve(window.ALVION_CAR_ASSETS);
    const sc = document.createElement('script'); sc.src = 'js/data/car-image-fallback.js?v=clean1';
    sc.onload = () => resolve(window.ALVION_CAR_ASSETS); sc.onerror = reject;
    document.head.appendChild(sc);
  }));
  // Read an extra full-size helper image (e.g. the PPF panel map) as RGBA pixels.
  function loadAsset(path, key) {
    const viaUrl = u => loadImage(u).then(img => readPixels(img, 0));
    const viaEmbedded = () => embeddedAssets().then(a => viaUrl(a[key]));
    return location.protocol === 'file:' ? viaEmbedded() : viaUrl(path).catch(viaEmbedded);
  }

  // Lookup tables that turn the photo's brightness into a painted color with a given finish.
  function luts(hex, finish) {
    const [k, th, hs, sw] = FINISH[finish] || FINISH.Gloss;
    const C = hexLin(hex);
    const lr = new Uint8ClampedArray(256), lg = new Uint8ClampedArray(256), lb = new Uint8ClampedArray(256);
    const rr = new Uint8ClampedArray(256), rg = new Uint8ClampedArray(256), rb = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) {
      const L = i / 255, ll = toLin[i];
      const shade = Math.pow(ll / 0.34, k);
      let h = Math.min(1, Math.max(0, (L - th) / (1 - th))); h = h * h * (3 - 2 * h) * hs;
      const ch = c => { let v = c * shade; v = v / (1 + v * 0.35) * 1.18; return toSrgb(v * (1 - h) + 0.95 * h); };
      lr[i] = ch(C[0]); lg[i] = ch(C[1]); lb[i] = ch(C[2]);
      const rf = c => toSrgb(Math.min(c * ll / 0.03 * 0.04, ll * 3));
      rr[i] = rf(C[0]); rg[i] = rf(C[1]); rb[i] = rf(C[2]);
    }
    return { lr, lg, lb, rr, rg, rb, sweep: sw };
  }

  function prepare() {
    if (shared) return shared;
    const build = ([photo, mask]) => {
      const o = readPixels(photo, TOP), m = readPixels(mask, 0);
      const n = W * H, lum = new Uint8Array(n);
      for (let p = 0, i = 0; p < n; p++, i += 4) lum[p] = Math.round(0.2126 * o[i] + 0.7152 * o[i + 1] + 0.0722 * o[i + 2]);
      // Alpha mask of the body, used by the light-sweep overlay.
      const mc = document.createElement('canvas'); mc.width = W; mc.height = H;
      const mx = mc.getContext('2d'), md = mx.createImageData(W, H);
      for (let p = 0, i = 0; p < n; p++, i += 4) { md.data[i] = md.data[i + 1] = md.data[i + 2] = 255; md.data[i + 3] = m[i]; }
      mx.putImageData(md, 0, 0);
      return { o, m, lum, maskUrl: mc.toDataURL('image/png') };
    };
    const fromUrls = (a, b) => Promise.all([loadImage(a), loadImage(b)]).then(build);
    // Opened straight from a computer (file://)? Browsers block reading those pixels,
    // so fall back to embedded copies of the two images.
    const embedded = () => embeddedAssets().then(a => fromUrls(a.photo, a.mask));
    shared = (location.protocol === 'file:' ? embedded() : fromUrls(PHOTO, MASK).catch(embedded));
    shared.then(d => { shared.done = d; }, () => {});
    return shared;
  }

  function mount(stage, opts = {}) {
    stage.classList.add('car-stage');
    let tilt = opts.tiltEl;
    if (!tilt) { tilt = document.createElement('div'); stage.appendChild(tilt); }
    tilt.classList.add('car-tilt');
    const host = opts.host || tilt;
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H; canvas.className = 'car-canvas';
    if (opts.label) { canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', opts.label); } else canvas.setAttribute('aria-hidden', 'true');
    const sweep = document.createElement('div'); sweep.className = 'car-sweep'; sweep.setAttribute('aria-hidden', 'true');
    host.append(canvas, sweep);
    const ctx = canvas.getContext('2d');
    const out = ctx.createImageData(W, H);
    let last = null, pending = null;

    const ready = prepare().then(d => {
      sweep.style.webkitMaskImage = sweep.style.maskImage = 'url(' + d.maskUrl + ')';
      stage.classList.add('is-ready');
      if (pending) draw(pending);
      return d;
    }).catch(() => { stage.classList.add('is-failed'); });

    function draw(s) {
      const d = shared && shared.done;
      if (!d) { pending = s; return; }
      const { o, m, lum } = d;
      const paintBody = s.paintBody !== false && s.color;
      // Per-luminance lookup tables (256 entries) keep the per-pixel loop cheap.
      const { lr, lg, lb, rr, rg, rb, sweep: sw } = luts(paintBody ? s.color : '#000000', s.finish);
      const vlt = s.vlt == null ? 70 : s.vlt;
      const glassF = Math.pow(Math.min(1, Math.max(0.07, Math.pow(vlt / 70, 0.9))), 1 / 2.2);
      const px = out.data, n = W * H;
      for (let p = 0, i = 0; p < n; p++, i += 4) {
        let r = o[i], g = o[i + 1], b = o[i + 2];
        const L = lum[p];
        if (paintBody) {
          const a = m[i] / 255;
          if (a > 0) { r += (lr[L] - r) * a; g += (lg[L] - g) * a; b += (lb[L] - b) * a; }
          const fa = m[i + 2] / 255 * 0.85;
          if (fa > 0) { r += (rr[L] - r) * fa; g += (rg[L] - g) * fa; b += (rb[L] - b) * fa; }
        }
        const ga = m[i + 1] / 255;
        if (ga > 0) { const f = 1 - ga + ga * glassF; r *= f; g *= f; b *= f; }
        px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
      }
      ctx.putImageData(out, 0, 0);
      // Light sweep across the paint when the look changes.
      stage.style.setProperty('--sweep', paintBody ? sw : 0);
      const key = (s.color || '') + (s.finish || '');
      if (paintBody && key !== last && !reduced.matches) { sweep.classList.remove('run'); void sweep.offsetWidth; sweep.classList.add('run'); }
      last = key;
    }
    // Subtle 3D tilt that follows the pointer (desktop) and settles back.
    if (!reduced.matches && opts.tilt !== false) {
      const set = (x, y) => { stage.style.setProperty('--ry', (x * 7).toFixed(2) + 'deg'); stage.style.setProperty('--rx', (-y * 4).toFixed(2) + 'deg'); };
      stage.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        const r = stage.getBoundingClientRect();
        set((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
      });
      stage.addEventListener('pointerleave', () => set(0, 0));
    }
    return { render: s => { pending = s; draw(s); }, ready, canvas };
  }

  // Draw the untouched photo (used for before/after comparisons).
  function drawOriginal(canvas) {
    canvas.width = W; canvas.height = H;
    return prepare().then(d => { const c = canvas.getContext('2d'); const img = c.createImageData(W, H); img.data.set(d.o); c.putImageData(img, 0, 0); canvas.classList.add('is-drawn'); });
  }

  window.AlvionCar = { mount, drawOriginal, prepare, luts, loadAsset, W, H };
})();
