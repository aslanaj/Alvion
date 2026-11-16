/* Mobile nav bar motion: a highlight pill slides to the tapped tab before the page changes,
   then settles with a small icon pop on the new page. Design of the bar is untouched. */
(() => {
  const nav = document.querySelector('.glass-nav');
  if (!nav || !nav.animate) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = [...nav.querySelectorAll('a,button')];
  const pill = document.createElement('span');
  pill.className = 'nav-pill'; pill.setAttribute('aria-hidden', 'true');
  nav.prepend(pill); nav.classList.add('has-pill');
  const KEY = 'alvion-nav-move';
  let at = null, motion = null;

  const current = () => nav.querySelector('button[aria-expanded=true]') || nav.querySelector('[aria-current=page]') || nav.querySelector('button[data-current=true]');
  const box = item => ({ x: item.offsetLeft, y: item.offsetTop, w: item.offsetWidth, h: item.offsetHeight });
  const place = b => { pill.style.width = b.w + 'px'; pill.style.height = b.h + 'px'; pill.style.transform = `translate(${b.x}px,${b.y}px)`; };
  const pop = item => { if (calm) return; item.classList.remove('nav-pop'); void item.offsetWidth; item.classList.add('nav-pop'); };

  /* Slide the pill; it stretches a little mid-way, like a drop being pulled. */
  const moveTo = (item, duration) => {
    if (!item) { pill.style.opacity = '0'; at = null; return; }
    pill.style.opacity = '1';
    const to = box(item), from = at && at !== item && !calm && nav.offsetWidth ? box(at) : null;
    at = item; motion?.cancel(); place(to);
    if (!from) return;
    const left = Math.min(from.x, to.x), span = Math.abs(from.x - to.x), mid = { x: left + span * .5 - (to.w * 1.18 - to.w) / 2, w: to.w * 1.18 };
    motion = pill.animate([
      { transform: `translate(${from.x}px,${from.y}px)`, width: from.w + 'px' },
      { transform: `translate(${mid.x + (to.x > from.x ? 1 : -1) * span * .12}px,${to.y}px) scaleY(.9)`, width: mid.w + 'px', offset: .5 },
      { transform: `translate(${to.x}px,${to.y}px)`, width: to.w + 'px' }
    ], { duration: duration || 380, easing: 'cubic-bezier(.3,1.25,.5,1)' });
  };

  /* First paint: no slide, only the settle pop when we arrived by tapping the bar. */
  const start = () => {
    const item = current(); at = null; moveTo(item);
    let came = null;
    try { came = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch (e) {}
    if (item && came && Date.now() - came.t < 4000) {
      pop(item);
      if (!calm) pill.animate([{ transform: pill.style.transform + ' scale(.86)', opacity: .6 }, { transform: pill.style.transform + ' scale(1.05)', opacity: 1, offset: .6 }, { transform: pill.style.transform }], { duration: 420, easing: 'ease-out' });
    }
  };
  start();

  /* Menu open/close and late aria-current changes move the pill too. */
  new MutationObserver(() => { const item = current(); if (item !== at) { moveTo(item); if (item) pop(item); } })
    .observe(nav, { attributes: true, subtree: true, attributeFilter: ['aria-current', 'aria-expanded', 'data-current'] });
  addEventListener('resize', () => { const item = current(); at = null; moveTo(item); });
  addEventListener('pageshow', event => { if (event.persisted) { nav.querySelectorAll('.nav-pressed').forEach(el => el.classList.remove('nav-pressed')); at = null; moveTo(current()); } });

  items.forEach(item => {
    item.addEventListener('pointerdown', () => item.classList.add('nav-pressed'));
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => item.addEventListener(type, () => item.classList.remove('nav-pressed')));
    if (item.tagName !== 'A') return;
    item.addEventListener('click', event => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button) return;
      const url = new URL(item.href, location.href);
      if (url.origin !== location.origin && location.protocol !== 'file:') return;
      if (url.pathname === location.pathname) { pop(item); return; }
      try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now() })); } catch (e) {}
      if (calm) return;
      event.preventDefault();
      moveTo(item, 260); pop(item);
      setTimeout(() => { location.href = item.href; }, 170);
    });
  });
})();
