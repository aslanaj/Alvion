/* Browser checks for the ALVION site. Usage: node browser_check.js http://localhost:8765 [/absolute/path/to/site/folder]
   Loads every page at phone and desktop size and exercises the quote sheet and the vehicle preview. */
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8765';
const PAGES = ['index.html','work.html','services.html','vinyl-wrap.html','paint-protection-film.html','window-tint.html','ceramic-coating.html','detailing.html','about.html','aftercare.html','faq.html','contact.html','reviews.html','terms.html','privacy.html','404.html','tesla-wrap-los-angeles.html','color-change-wrap-south-bay.html','car-wrap-long-beach.html'];
const fails = [], info = [];
const check = (ok, message) => { if (!ok) fails.push(message); };
(async () => {
  const browser = await chromium.launch();
  for (const mode of ['phone', 'desktop']) {
    const context = await browser.newContext(mode === 'phone'
      ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
      : { viewport: { width: 1440, height: 900 } });
    for (const name of PAGES) {
      const page = await context.newPage();
      const errors = [];
      let bytes = 0, requests = 0;
      const external = [];
      page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
      page.on('pageerror', e => errors.push('script error: ' + e.message));
      page.on('requestfailed', r => { if (r.url().startsWith(BASE)) errors.push('failed: ' + r.url()); else external.push(r.url()); });
      page.on('response', async r => { if (!r.url().startsWith(BASE)) return; requests++; if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); try { bytes += (await r.body()).length; } catch (_) {} });
      const start = Date.now();
      await page.goto(BASE + '/' + name, { waitUntil: 'load' });
      const loadMs = Date.now() - start;
      await page.waitForTimeout(350);
      const facts = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        cta: (() => { const el = [...document.querySelectorAll('.header-cta,.quote-button,.circle-cta,.button.primary')].find(e => e.offsetParent); return el ? getComputedStyle(el).backgroundImage + getComputedStyle(el).backgroundColor : null; })(),
        bodyBg: getComputedStyle(document.body).backgroundColor,
        small: [...document.querySelectorAll('.header-cta,.quote-button,.submit,.tesla-offer-cta,.glass-nav a')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 44).map(e => e.className + ' ' + Math.round(e.getBoundingClientRect().height))
      }));
      check(errors.length === 0, `${mode} ${name}: ${errors.slice(0, 3).join(' | ')}`);
      check(facts.overflow <= 1, `${mode} ${name}: page scrolls sideways by ${facts.overflow}px`);
      check(!facts.cta || /168, 196, 236|198, 218, 246/.test(facts.cta), `${mode} ${name}: main button is not using the accent color (${facts.cta})`);
      check(facts.small.length === 0, `${mode} ${name}: tap targets under 44px: ${facts.small.join(', ')}`);
      info.push({ mode, name, kb: Math.round(bytes / 1024), requests, loadMs, external: [...new Set(external.map(u => new URL(u).host))] });
      await page.close();
    }
    /* Quote sheet opens from a #quote link on any page, with the service pre-selected. */
    for (const [name, query, want] of [['index.html', '?utm_source=instagram', null], ['vinyl-wrap.html', '?service=Vinyl+Wrap&utm_source=instagram&utm_medium=bio', 'Vinyl Wrap'], ['tesla-wrap-los-angeles.html', '?service=Paint+Protection+Film', 'Paint Protection Film'], ['contact.html', '', null]]) {
      const page = await context.newPage();
      await page.goto(BASE + '/' + name + query + (name === 'contact.html' ? '#projectForm' : '#quote'));
      await page.waitForTimeout(600);
      const state = await page.evaluate(() => ({ open: document.getElementById('home-quote-sheet')?.open, service: document.querySelector('#home-quote-sheet select[name=service]')?.value }));
      check(state.open === true, `${mode} ${name}: quote sheet did not open from the link`);
      if (want) check(state.service === want, `${mode} ${name}: service was "${state.service}", expected "${want}"`);
      /* Reply choice moves the highlight; the form refuses to send when empty. */
      await page.locator('#home-quote-sheet .reply-options label', { hasText: 'Email me' }).click();
      const checked = await page.evaluate(() => document.querySelector('#home-quote-sheet input[name=reply]:checked').value);
      check(checked === 'email', `${mode} ${name}: reply choice did not switch`);
      await page.close();
    }
    /* Contact page form: the accent sits exactly on the chosen pill, nothing stretches across the row. */
    {
      const page = await context.newPage();
      await page.goto(BASE + '/contact.html'); await page.waitForTimeout(400);
      const r = await page.evaluate(() => {
        const row = document.querySelector('#projectForm .reply-options'); const before = getComputedStyle(row, '::before').content;
        const chosen = row.querySelector('label:has(:checked)'); const other = row.querySelector('label:not(:has(:checked))');
        return { before, chosen: getComputedStyle(chosen).backgroundImage, other: getComputedStyle(other).backgroundImage };
      });
      check(r.before === 'none' && /gradient/.test(r.chosen) && r.other === 'none', `${mode} contact form reply pills: ${JSON.stringify(r)}`);
      await page.close();
    }
    /* Buttons that should open the sheet do so on click. */
    {
      const page = await context.newPage();
      await page.goto(BASE + '/tesla-wrap-los-angeles.html'); await page.waitForTimeout(400);
      await page.locator('button', { hasText: 'Decline' }).first().click().catch(() => {});
      await page.evaluate(() => document.querySelector('.tesla-offer-cta').scrollIntoView({ block: 'center' }));
      await page.waitForTimeout(300);
      await page.locator('.tesla-offer-cta').click();
      await page.waitForTimeout(500);
      const s = await page.evaluate(() => ({ open: document.getElementById('home-quote-sheet').open, vehicle: document.querySelector('#home-quote-sheet [name=vehicle]').value, service: document.querySelector('#home-quote-sheet select[name=service]').value }));
      check(s.open && s.vehicle === 'Tesla' && s.service === 'Vinyl Wrap', `${mode} tesla page: offer button gave ${JSON.stringify(s)}`);
      await page.close();
    }
    await context.close();
  }

  /* Vehicle preview: every vehicle in every film. Painted panels must change, glass must not. */
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(BASE + '/services.html');
  await page.locator('#alvion-car-preview').scrollIntoViewIfNeeded();
  await page.waitForSelector('#alvion-car-preview .cars button');
  await page.waitForTimeout(600);
  const result = await page.evaluate(async () => {
    const root = document.getElementById('alvion-car-preview'), stage = root.querySelector('.vehicle-canvas');
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const select = root.querySelector('#alvion-service');
    const setService = async v => { select.value = v; select.dispatchEvent(new Event('change')); await wait(60); };
    const grab = () => stage.getContext('2d').getImageData(0, 0, stage.width, stage.height);
    const art = Alvion.estimatorCatalog.art, out = [], timings = [];
    const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    for (let v = 0; v < art.length; v++) {
      root.querySelectorAll('.cars button')[v].click();
      await setService('clear'); await wait(350);
      const base = grab();
      const mask = await loadImg('assets/vehicles/' + art[v].slug + '-mask.webp');
      const c = document.createElement('canvas'); c.width = stage.width; c.height = stage.height;
      const cx = c.getContext('2d'); const tw = 1024, th = tw * art[v].height / 512;
      const sc = Math.min(stage.width / tw, stage.height / th);
      cx.drawImage(mask, (stage.width - tw * sc) / 2, (stage.height - th * sc) / 2, tw * sc, th * sc);
      const m = cx.getImageData(0, 0, c.width, c.height).data;
      for (const service of ['vinyl', 'color']) {
        await setService(service);
        const tabs = [...root.querySelectorAll('.film-tabs button')].map(b => b.textContent);
        for (const tab of tabs) {
          [...root.querySelectorAll('.film-tabs button')].find(b => b.textContent === tab).click(); await wait(20);
          const count = root.querySelectorAll('.swatches button').length;
          for (let s = 0; s < count; s++) {
            const t0 = performance.now();
            root.querySelectorAll('.swatches button')[s].click();
            await wait(45);
            timings.push(performance.now() - t0 - 45);
            const now = grab().data, b = base.data; const name = root.querySelector('.color-name').textContent;
            let paint = 0, painted = 0, glass = 0, glassChanged = 0;
            for (let j = 0; j < now.length; j += 4) {
              const lum = .2126 * b[j] + .7152 * b[j + 1] + .0722 * b[j + 2];
              const diff = Math.abs(now[j] - b[j]) + Math.abs(now[j + 1] - b[j + 1]) + Math.abs(now[j + 2] - b[j + 2]);
              if (m[j] > 235 && lum > 110 && Math.max(b[j], b[j + 1], b[j + 2]) - Math.min(b[j], b[j + 1], b[j + 2]) < 14) { paint++; if (diff > 9) painted++; }
              if (m[j + 1] > 235) { glass++; if (diff > 6) glassChanged++; }
            }
            out.push({ car: art[v].slug, film: name, paint, painted: painted / paint, glass: glassChanged / Math.max(1, glass) });
          }
        }
      }
    }
    /* Tint darkens glass only; caliper and front PPF draw without error. */
    root.querySelectorAll('.cars button')[2].click(); await setService('clear'); await wait(300); const b0 = grab().data;
    await setService('tint'); await wait(300); const t1 = grab().data; let changed = 0; for (let j = 0; j < t1.length; j += 4) if (Math.abs(t1[j] - b0[j]) > 6) changed++;
    await setService('front'); await wait(150); await setService('caliper'); await wait(150); await setService('ceramic'); await wait(100);
    return { out, tintChanged: changed, avgDraw: timings.reduce((a, b) => a + b, 0) / timings.length };
  });

  /* PPF visualizer: clear finishes and color films are painted through the paint map. */
  for (const [name, hostSel] of [['paint-protection-film.html', '#ppf-studio'], ['index.html', '#ppf-coverage'], ['services.html', '#ppf-coverage']]) {
    const ppf = await context.newPage();
    const ppfErrors = [];
    ppf.on('pageerror', e => ppfErrors.push(e.message));
    await ppf.goto(BASE + '/' + name);
    await ppf.evaluate(sel => document.querySelector(sel).scrollIntoView(), hostSel);
    await ppf.waitForFunction(sel => document.querySelector(sel)?.shadowRoot?.querySelector('[data-package]'), hostSel, { timeout: 8000 });
    const act = async (selector, wait = 2700) => { await ppf.evaluate(([h, s]) => document.querySelector(h).shadowRoot.querySelector(s).click(), [hostSel, selector]); await ppf.waitForTimeout(wait); };
    const read = () => ppf.evaluate(async h => {
      const root = document.querySelector(h).shadowRoot, render = root.getElementById('render');
      const result = { opacity: render.getAttribute('opacity'), href: (render.getAttribute('href') || '').slice(0, 5), finishRow: !!root.getElementById('finishes'), swatches: root.querySelectorAll('#swatches button').length, label: root.getElementById('panel-label').textContent, look: new URL(root.getElementById('quote-link').href).searchParams.get('look') };
      if (result.opacity === '1') {
        const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
        const [shot, photo, mask] = await Promise.all([load(render.getAttribute('href')), load('assets/ppf-porsche-911.webp'), load(Alvion.ppfCatalog.art.mask)]);
        const px = img => { const c = document.createElement('canvas'); c.width = 768; c.height = 512; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 768, 512); return x.getImageData(0, 0, 768, 512).data; };
        const a = px(shot), b = px(photo), m = px(mask); let paint = 0, painted = 0, other = 0, otherChanged = 0;
        for (let j = 0; j < a.length; j += 4) {
          const lum = .2126 * b[j] + .7152 * b[j + 1] + .0722 * b[j + 2], diff = Math.abs(a[j] - b[j]) + Math.abs(a[j + 1] - b[j + 1]) + Math.abs(a[j + 2] - b[j + 2]);
          if (m[j] > 240 && lum > 110 && Math.max(b[j], b[j + 1], b[j + 2]) - Math.min(b[j], b[j + 1], b[j + 2]) < 14) { paint++; if (diff > 12) painted++; }
          if (m[j] < 3) { other++; if (diff > 36) otherChanged++; }
        }
        result.painted = painted / paint; result.spill = otherChanged / other;
      }
      return result;
    }, hostSel);
    await act('[data-package=body]'); let r = await read();
    check(r.opacity === '0', `ppf ${name}: gloss clear should show the original car`);
    check(r.finishRow === false, `ppf ${name}: the clear-finish row should be gone`);
    await act('[data-package=front]', 900); r = await read();
    check(r.opacity === '0', `ppf ${name}: full front should show the original car`);
    await act('[data-package=color]'); r = await read();
    check(r.swatches === 30, `ppf ${name}: color mode controls ${JSON.stringify(r)}`);
    const groups = await ppf.evaluate(h => [...document.querySelector(h).shadowRoot.querySelectorAll('.swatch-group')].map(g => g.querySelector('.swatch-brand').textContent + ':' + g.querySelectorAll('button').length).join(','), hostSel);
    check(groups === 'PurePPF:14,XPEL:16', `ppf ${name}: brand groups were ${groups}`);
    for (const index of [16, 9, 7]) { await ppf.evaluate(([h, i]) => document.querySelector(h).shadowRoot.querySelectorAll('#swatches button')[i].click(), [hostSel, index]); await ppf.waitForTimeout(2700); r = await read(); check(r.opacity === '1' && r.painted > 0.99 && r.spill < 0.01, `ppf ${name}: color film ${index} gave ${JSON.stringify(r)}`); }
    check(ppfErrors.length === 0, `ppf ${name}: ${ppfErrors.join(' | ')}`);
    info.push({ ppf: name, lastPaintCoverage: +(r.painted * 100).toFixed(2), lastSpill: +(r.spill * 100).toFixed(2) });
    await ppf.close();
  }

  /* Films close to the silver base car barely move the pixels, so coverage is judged on the clearly different colors. */
  const greyish = /Silver|Grey|Gray|Steel|Stainless|Rock|Tarmac|Cement|Shark|Crayon|Bond|Heritage|White|Beige/i;
  let worstPaint = 1, worstGlass = 0;
  for (const r of result.out) {
    if (!greyish.test(r.film)) { worstPaint = Math.min(worstPaint, r.painted); check(r.painted > 0.985, `preview ${r.car} / ${r.film}: only ${(r.painted * 100).toFixed(1)}% of painted panels changed`); }
    worstGlass = Math.max(worstGlass, r.glass); check(r.glass < 0.015, `preview ${r.car} / ${r.film}: ${(r.glass * 100).toFixed(1)}% of glass changed color`);
  }
  check(result.tintChanged > 2000, 'preview: window tint did not darken the glass');
  check(errors.length === 0, 'preview script errors: ' + errors.join(' | '));
  info.push({ preview: { combinations: result.out.length, worstPaintCoverage: +(worstPaint * 100).toFixed(2), worstGlassSpill: +(worstGlass * 100).toFixed(2), avgRedrawMs: +result.avgDraw.toFixed(1) } });
  /* Opened straight from a folder (file://) the previews must still draw. */
  if (process.argv[3]) {
    const local = await context.newPage();
    await local.goto('file://' + process.argv[3] + '/services.html');
    await local.evaluate(() => document.getElementById('alvion-car-preview').scrollIntoView());
    await local.waitForTimeout(1800);
    const drawn = await local.evaluate(() => document.querySelector('#alvion-car-preview .vehicle-canvas').classList.contains('is-drawn'));
    check(drawn, 'local file: vehicle preview did not draw');
    await local.evaluate(() => document.querySelector('#ppf-coverage').scrollIntoView());
    await local.waitForFunction(() => document.querySelector('#ppf-coverage')?.shadowRoot?.querySelector('[data-package]'), null, { timeout: 8000 });
    await local.evaluate(() => { const r = document.querySelector('#ppf-coverage').shadowRoot; r.querySelector('[data-package=body]').click(); });
    await local.waitForTimeout(2800);
    await local.evaluate(() => { const r = document.querySelector('#ppf-coverage').shadowRoot; r.querySelector('[data-package=color]').click(); });
    await local.waitForTimeout(3000);
    const shown = await local.evaluate(() => document.querySelector('#ppf-coverage').shadowRoot.querySelector('#render').getAttribute('opacity'));
    check(shown === '1', 'local file: PPF visualizer did not paint the car');
    info.push({ localFile: { vehiclePreview: drawn, ppf: shown === '1' } });
    await local.close();
  }
  await browser.close();
  for (const i of info) console.log(JSON.stringify(i));
  console.log(fails.length ? 'FAILS (' + fails.length + '):\n - ' + fails.join('\n - ') : 'BROWSER CHECK PASSED');
  process.exit(fails.length ? 1 : 0);
})();
