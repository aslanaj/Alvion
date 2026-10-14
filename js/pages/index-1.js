const toggle = document.querySelector('.mobile-toggle');
const menu = document.querySelector('.mobile-menu');
function setMenu(open, restoreFocus = false) {
  if (!toggle || !menu) return;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? 'CLOSE' : 'MENU';
  menu.classList.toggle('open', open);
  menu.inert = !open;
  menu.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('menu-open', open);
  if (open) menu.querySelector('a')?.focus();
  else if (restoreFocus) toggle.focus();
}
if (toggle && menu) {
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    if (e.key === 'Escape') { setMenu(false, true); return; }
    if (e.key === 'Tab') {
      const items = [toggle, ...menu.querySelectorAll('a')];
      const index = items.indexOf(document.activeElement);
      e.preventDefault();
      items[(index + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
    }
  });
  window.matchMedia('(min-width:821px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
}
const currentPage = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav a,.mobile-menu a').forEach(a => {
  if (a.getAttribute('href').split('?')[0] === currentPage) a.setAttribute('aria-current', 'page');
});
function updateHeader() { document.querySelector('.site-header')?.classList.toggle('scrolled', window.scrollY > 20); }
window.addEventListener('scroll', updateHeader, {passive:true});
updateHeader();
const form = document.querySelector('#projectForm');
if (form) {
  const FORM_ENDPOINT = 'send-inquiry.php';
  const service = new URLSearchParams(location.search).get('service');
  if ([...form.elements.service.options].some(option => option.value === service)) form.elements.service.value = service;
  const status = form.querySelector('.form-status');
  const submitButton = form.querySelector('.submit');
  const sendLabel = submitButton ? submitButton.textContent : '';
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const d = new FormData(form);
    const inquiry = ['ALVION PERFORMANCE — Project Inquiry', ...['name','email','phone','vehicle','service','message'].map(key => key.toUpperCase() + ': ' + String(d.get(key) || '').trim())].join('\n\n');
    const preview = document.querySelector('#inquiry-preview');
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'SENDING…'; }
    status.textContent = 'Sending your inquiry…';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(FORM_ENDPOINT, { method: 'POST', body: new URLSearchParams(d), headers: { Accept: 'application/json' }, signal: controller.signal });
      clearTimeout(timer);
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error('not sent');
      if (preview) preview.hidden = true;
      form.reset();
      status.textContent = 'Thank you. Your inquiry was sent, and we will reply by phone, text or email.';
      if (window.alvionTrack) window.alvionTrack('generate_lead', { service: String(d.get('service') || '') });
    } catch (error) {
      // The website could not send it directly, so open a ready-to-send email draft instead.
      if (preview) preview.hidden = false;
      const text = document.querySelector('#inquiry-text');
      text.value = inquiry;
      status.textContent = 'We could not send this automatically. Your email app should open with your details ready. You can also call or text (909) 450-6843.';
      text.focus();
      text.select();
      const subject = encodeURIComponent('ALVION Project Inquiry — ' + String(d.get('service') || 'Custom Project'));
      window.location.href = 'mailto:alvionperformance@gmail.com?subject=' + subject + '&body=' + encodeURIComponent(inquiry);
    } finally {
      if (submitButton) { submitButton.disabled = false; submitButton.textContent = sendLabel; }
    }
  });
}

const lightbox = document.querySelector('.lightbox');
if (lightbox) {
  const lightboxImage = lightbox.querySelector('img');
  document.querySelectorAll('.gallery-image').forEach(button => button.addEventListener('click', () => { lightboxImage.src = button.dataset.full; lightboxImage.alt = button.querySelector('img').alt; lightbox.showModal(); }));
  lightbox.querySelector('button').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
}

const filters = [...document.querySelectorAll('[data-filter]')];
if (filters.length) {
  const projects = [...document.querySelectorAll('.portfolio-project')];
  const validCategories = filters.map(b => b.dataset.filter);
  function filterProjects(category, updateUrl = false) {
    if (!validCategories.includes(category)) category = 'all';
    filters.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === category)));
    let count = 0;
    projects.forEach(project => {
      const visible = category === 'all' || project.dataset.categories.split(' ').includes(category);
      project.hidden = !visible;
      if (visible) count++;
      if (!visible) project.querySelectorAll('video').forEach(v => v.pause());
      project.querySelectorAll('[data-service]').forEach(p => { p.hidden = category !== 'all' && p.dataset.service !== category; });
    });
    document.querySelector('#project-count').textContent = `${count} PROJECT${count === 1 ? '' : 'S'}`;
    const motion = document.querySelector('.motion');
    if (motion) { motion.hidden = !['all','vinyl'].includes(category); if (motion.hidden) motion.querySelectorAll('video').forEach(v => v.pause()); }
    if (updateUrl) { const url = new URL(location.href); if (category === 'all') url.searchParams.delete('category'); else url.searchParams.set('category',category); history.pushState({},'',url); }
  }
  filters.forEach(button => button.addEventListener('click', () => filterProjects(button.dataset.filter, true)));
  window.addEventListener('popstate', () => filterProjects(new URLSearchParams(location.search).get('category') || 'all'));
  filterProjects(new URLSearchParams(location.search).get('category') || 'all');
}
