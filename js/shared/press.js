/* Touch feedback for primary buttons: a light ripple from the point of contact.
   The press-down movement itself is CSS (css/accent.css). */
(() => {
  'use strict';
  const PRIMARY = '.header-cta,.quote-button,.circle-cta,.tesla-offer-cta,.faq-cta,.button.primary,.submit,#alvion-car-preview .cta';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('pointerdown', event => {
    const button = event.target.closest?.(PRIMARY);
    if (!button || button.disabled) return;
    if (getComputedStyle(button).position === 'static') button.style.position = 'relative';
    const box = button.getBoundingClientRect();
    const size = Math.max(box.width, box.height) * 2;
    const ripple = document.createElement('span');
    ripple.className = 'acc-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    ripple.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (event.clientX - box.left - size / 2) + 'px;top:' + (event.clientY - box.top - size / 2) + 'px';
    button.append(ripple);
    setTimeout(() => ripple.remove(), 520);
  }, { passive: true });
})();
