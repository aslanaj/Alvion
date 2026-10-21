/* ALVION PERFORMANCE — Google Analytics 4 (G-7C53LLJF5C) with cookie consent.
 * Analytics cookies load only after the visitor clicks "Accept". The choice is remembered;
 * any "Manage cookies" button (class .manage-cookies) reopens the banner. */
(() => {
  const GA_ID = 'G-7C53LLJF5C';
  const KEY = 'alvion-cookie-consent';
  const inFrame = window !== window.top;
  const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const set = v => { try { localStorage.setItem(KEY, v); } catch (e) {} };

  const track = (name, params) => { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); };
  window.alvionTrack = track;

  let loaded = false;
  function loadGA() {
    if (loaded || !GA_ID) return;
    loaded = true;
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(tag);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }
  function clearGA() {
    // Remove Google Analytics cookies after a visitor declines.
    document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(n => /^_ga/.test(n)).forEach(n => {
      [location.hostname, '.' + location.hostname.replace(/^www\./, '')].forEach(d => {
        document.cookie = n + '=; Max-Age=0; path=/; domain=' + d;
      });
      document.cookie = n + '=; Max-Age=0; path=/';
    });
  }

  let banner;
  function showBanner() {
    if (inFrame) return;
    if (!banner) {
      banner = document.createElement('section');
      banner.className = 'cookie-banner';
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-label', 'Cookie preferences');
      banner.innerHTML = '<p>Optional analytics cookies help us improve this site. <a href="privacy.html#cookies">Privacy policy</a></p>' +
        '<div class="cookie-actions"><button type="button" data-consent="denied">Decline</button><button type="button" data-consent="granted" class="cookie-accept">Accept</button></div>';
      banner.addEventListener('click', e => {
        const b = e.target.closest('[data-consent]');
        if (!b) return;
        const v = b.dataset.consent;
        set(v);
        if (v === 'granted') loadGA(); else { clearGA(); if (loaded) location.reload(); }
        banner.hidden = true;
      });
      document.body.appendChild(banner);
    }
    banner.hidden = false;
    const focusTarget = banner.querySelector('.cookie-accept');
    if (focusTarget && document.activeElement && document.activeElement.classList.contains('manage-cookies')) focusTarget.focus();
  }

  const start = () => {
    const choice = get();
    if (choice === 'granted') loadGA();
    else if (!choice) showBanner();
    document.addEventListener('click', e => {
      if (e.target.closest && e.target.closest('.manage-cookies')) { e.preventDefault(); showBanner(); }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  // Count the actions that matter for a shop: calls, texts, emails, quote clicks, social visits.
  document.addEventListener('click', event => {
    const link = event.target.closest && event.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('tel:')) track('click_call');
    else if (href.startsWith('sms:')) track('click_text');
    else if (href.startsWith('mailto:')) track('click_email');
    else if (/instagram\.com|tiktok\.com|youtube\.com|google\.com\/maps/.test(href)) track('click_social', { link_url: href });
    else if (link.matches('[data-track="quote"]')) track('click_quote');
    else if (/contact\.html/.test(href)) track('click_contact');
  });
})();
