/* Direct quote submissions; no email app required. */
(() => {
  document.querySelectorAll('form[data-mode="web3forms"]').forEach(form => {
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('.submit');
  const phone = form.elements.phone, email = form.elements.email;
  let sending = false, sent = false;
  const preference = () => form.querySelector('input[name="reply"]:checked')?.value || 'text';
  const required = () => {
    const needPhone = preference() !== 'email';
    phone.required = needPhone; email.required = !needPhone;
    phone.closest('.field').querySelector('.req').textContent = needPhone ? '(required)' : '(optional)';
    email.closest('.field').querySelector('.req').textContent = needPhone ? '(optional)' : '(required)';
    if (form.classList.contains('sheet-form')) {
      phone.closest('.field').hidden = !needPhone;
      email.closest('.field').hidden = needPhone;
      phone.disabled = !needPhone; email.disabled = needPhone;
    }
  };
  form.querySelectorAll('input[name="reply"]').forEach(el => el.addEventListener('change', required));
  required();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || sent || !form.reportValidity()) return;
    const payload = Object.fromEntries(new FormData(form));
    if (payload.botcheck) return;
    if (payload.year || payload.make || payload.model) {
      payload.vehicle = [payload.year, payload.make, payload.model].map(v => (v || '').trim()).filter(Boolean).join(' ');
    }
    if (!payload.selected_vehicle) delete payload.selected_vehicle;
    if (!payload.email?.trim()) delete payload.email;
    payload.subject = 'ALVION quote request: ' + (payload.service || 'Project');
    sending = true; submit.disabled = true; submit.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true'); status.classList.remove('is-error');
    status.textContent = 'Sending your request…';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(form.action, {
        method: 'POST', headers: {'Content-Type':'application/json', Accept:'application/json'},
        body: JSON.stringify(payload), signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error('not-confirmed');
      sent = true;
      form.querySelectorAll('input,textarea,select,button').forEach(el => { el.disabled = true; });
      submit.textContent = 'Request sent';
      status.textContent = 'Thank you — your request has been sent. ALVION will follow up using your preferred contact method. You can text or email any photos using the contact links.';
      status.setAttribute('tabindex','-1'); status.focus();
      if (window.alvionTrack) window.alvionTrack('generate_lead', {service:payload.service || '', reply:payload.reply || ''});
    } catch (_) {
      submit.disabled = false; submit.textContent = 'Send request ↗';
      status.classList.add('is-error');
      status.textContent = 'We could not confirm your submission. Your details are still here. Please try again, or contact us using the text or email links below.';
    } finally {
      clearTimeout(timer); sending = false; form.removeAttribute('aria-busy');
    }
  });
  });
})();
