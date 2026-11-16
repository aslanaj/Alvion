/* Quote requests: sent straight into ALVION CRM (Sales → New inquiry), with Web3Forms email as the backup.
   No email app required. Clear CRM.endpoint to go back to email only. */
(() => {
  const CRM = {
    // Supabase → Edge Functions → website-inquiry
    endpoint: 'https://icnkklqvlwehgwbeypdd.supabase.co/functions/v1/website-inquiry',
    // Supabase → Project Settings → API Keys → publishable key (public by design)
    key: 'sb_publishable_V0_th9hu1auTlW7QZHd0dw_ZRQLu-HN',
    // Cloudflare Turnstile site key: the small "I'm human" check above the send button
    turnstileSiteKey: '0x4AAAAAAF19wTg1YgFP0WG1'
  };

  /* Cloudflare Turnstile, loaded once per page, and only when someone starts filling in a form. */
  let turnstileReady = null;
  const loadTurnstile = () => turnstileReady || (turnstileReady = new Promise((resolve, reject) => {
    window.alvionTurnstileLoaded = () => resolve(window.turnstile);
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=alvionTurnstileLoaded';
    s.async = true; s.defer = true; s.onerror = reject;
    document.head.appendChild(s);
  }));
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

  document.querySelectorAll('form[data-mode="web3forms"]').forEach(form => {
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('.submit');
  const phone = form.elements.phone, email = form.elements.email;
  const validatePhone = () => {
    const value=phone.value.trim(),digits=value.replace(/\D/g,'');
    phone.setCustomValidity(!phone.disabled && value && (!/^[+()\d\s.\-]+$/.test(value)||digits.length<10||digits.length>15) ? 'Enter a valid phone number, including area code.' : '');
  };
  phone.addEventListener('input',validatePhone);
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
    validatePhone();
  };
  form.querySelectorAll('input[name="reply"]').forEach(el => el.addEventListener('change', required));
  required();

  /* The "I'm human" check: drawn above the send button the first time someone uses this form. */
  const human = { box: null, widget: null, failed: false };
  const startHumanCheck = () => {
    if (!CRM.endpoint || !CRM.turnstileSiteKey || human.box) return;
    human.box = document.createElement('div');
    human.box.className = 'human-check';
    human.box.style.margin = '4px 0 12px';
    form.querySelector('.form-actions')?.before(human.box);
    loadTurnstile().then(ts => {
      human.widget = ts.render(human.box, { sitekey: CRM.turnstileSiteKey, theme: 'auto', size: 'flexible', 'response-field-name': 'cf-turnstile-response' });
    }).catch(() => { human.failed = true; human.box.remove(); });
  };
  form.addEventListener('focusin', startHumanCheck);
  /* The check's answer, waiting a few seconds if it's still finishing. Empty if it couldn't run. */
  const humanToken = async () => {
    if (!CRM.endpoint || !CRM.turnstileSiteKey) return '';
    startHumanCheck();
    for (let i = 0; i < 40 && !human.failed; i++) {
      const token = human.widget !== null && window.turnstile ? window.turnstile.getResponse(human.widget) : '';
      if (token) return token;
      await pause(200);
    }
    return '';
  };
  const resetHumanCheck = () => { if (human.widget !== null && window.turnstile) window.turnstile.reset(human.widget); };

  const post = async (url, body, headers, ms) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers }, body: JSON.stringify(body), signal: controller.signal });
      let result = {};
      try { result = await response.json(); } catch (_) {}
      return { response, result };
    } finally { clearTimeout(timer); }
  };

  /* Into the CRM. Returns 'sent', a message the visitor should act on, or 'unavailable' (use the email backup). */
  const toCrm = async payload => {
    if (!CRM.endpoint) return 'unavailable';
    try {
      // New publishable keys go in "apikey" only; an older anon key (starts "eyJ") also as the bearer token.
      const auth = CRM.key ? { apikey: CRM.key, ...(CRM.key.startsWith('eyJ') ? { Authorization: 'Bearer ' + CRM.key } : {}) } : {};
      const { response, result } = await post(CRM.endpoint, payload, auth, 20000);
      if (response.ok && result.ok === true) return 'sent';
      // The human check couldn't run in this browser (blocked): don't leave them stuck, email it instead.
      if (result.error === 'bot_check' && human.widget === null) return 'unavailable';
      if (response.status === 400 && result.message) return result.message;
      return 'unavailable';
    } catch (_) { return 'unavailable'; }
  };

  /* Web3Forms: emails the request, as the form always has. */
  const toEmail = async payload => {
    const body = { ...payload };
    delete body['cf-turnstile-response'];
    const { response, result } = await post(form.action, body, {}, 30000);
    if (!response.ok || result.success !== true) throw new Error('not-confirmed');
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    validatePhone();
    for(const key of ['name','vehicle']){const field=form.elements[key];if(field){field.value=field.value.trim();field.setCustomValidity(field.required&&!field.value?'Please complete this field.':'');field.addEventListener('input',()=>field.setCustomValidity(''),{once:true});}}
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
    try {
      const token = await humanToken();
      if (token) payload['cf-turnstile-response'] = token;
      const crm = await toCrm(payload);
      if (crm !== 'sent' && crm !== 'unavailable') {
        // Something the visitor can fix (a missing detail, the human check): everything stays as typed.
        submit.disabled = false; submit.textContent = 'Send request ↗';
        status.classList.add('is-error'); status.textContent = crm;
        resetHumanCheck();
        return;
      }
      if (crm === 'unavailable') await toEmail(payload);
      sent = true;
      form.dataset.sent='true';
      form.querySelectorAll('input,textarea,select,button').forEach(el => { el.disabled = true; });
      submit.textContent = 'Request sent';
      status.textContent = 'Thank you — your request has been sent. ALVION will follow up using your preferred contact method. You can text or email any photos using the contact links.';
      status.setAttribute('tabindex','-1'); status.focus();
      if (window.alvionTrack) window.alvionTrack('generate_lead', {service:payload.service || '', reply:payload.reply || ''});
    } catch (_) {
      submit.disabled = false; submit.textContent = 'Send request ↗';
      status.classList.add('is-error');
      status.textContent = 'We could not confirm your submission. Your details are still here. Please try again, or contact us using the text or email links below.';
      resetHumanCheck();
    } finally {
      sending = false; form.removeAttribute('aria-busy');
    }
  });
  });
})();
