/* ALVION — quote form.
 * Two modes, chosen by data-mode on <form id="projectForm"> in contact.html:
 *   data-mode="email"  (current)  opens a pre-filled email draft, or a text message, from the visitor's phone/computer.
 *   data-mode="send"   (later)    sends directly through send-inquiry.php with photo uploads.
 *                                 Switch back once GoDaddy email delivery (SPF record) is fixed. */
(() => {
  const EMAIL = 'alvionperformance@gmail.com';
  const PHONE = '+19094506843';
  const track = (name, params) => { if (window.alvionTrack) window.alvionTrack(name, params); };

  const form = document.querySelector('#projectForm');
  if (!form) return;
  const mode = form.dataset.mode === 'send' ? 'send' : 'email';
  form.querySelectorAll('[data-mode-only]').forEach(el => { el.hidden = el.dataset.modeOnly !== mode; });

  // Reply preference decides which contact field is required (both modes).
  const phone = form.elements.phone, email = form.elements.email;
  const setRequired = () => {
    const pref = (form.querySelector('input[name="reply"]:checked') || {}).value || 'text';
    const needPhone = pref === 'text' || pref === 'call';
    phone.required = needPhone;
    email.required = !needPhone;
    form.querySelector('label[for="phone"] .req').textContent = needPhone ? '(required)' : '(optional)';
    form.querySelector('label[for="email"] .req').textContent = needPhone ? '(optional)' : '(required)';
  };
  form.querySelectorAll('input[name="reply"]').forEach(r => r.addEventListener('change', setRequired));
  setRequired();

  const status = form.querySelector('.form-status');
  const replyText = { text: 'Text me back', call: 'Call me', email: 'Email me back' };
  const details = () => {
    const d = new FormData(form), v = k => String(d.get(k) || '').trim();
    return [
      'Hi ALVION, I’d like a quote.', '',
      'Name: ' + v('name'),
      'Phone: ' + (v('phone') || '—'),
      'Email: ' + (v('email') || '—'),
      'Reply: ' + (replyText[v('reply')] || 'Text me back'),
      'Vehicle: ' + (v('vehicle') || '—'),
      'Interested in: ' + (v('service') || '—'),
      '', 'My idea:', v('message') || '—', '',
      'Photos: attached below (if I have them)'
    ].join('\n');
  };

  /* ---------------- Email-draft mode ---------------- */
  if (mode === 'email') {
    const smsButton = form.querySelector('[data-send="sms"]');
    let panel = null;
    const showPanel = (how, text) => {
      if (!panel) { panel = document.createElement('div'); panel.className = 'draft-panel'; panel.setAttribute('tabindex', '-1'); status.after(panel); }
      const body = encodeURIComponent(text);
      panel.innerHTML = '<h3></h3><p></p><textarea readonly aria-label="Your request"></textarea><div class="form-fallback"></div>';
      panel.querySelector('h3').textContent = how === 'sms' ? 'Your text is ready — press Send.' : 'Your email is ready — press Send.';
      panel.querySelector('p').textContent = (how === 'sms' ? 'Your messages app should have opened with your request filled in.' : 'Your email app should have opened with your request filled in.') + ' Add photos if you have them, then press Send. If nothing opened, copy the details below or use another option.';
      panel.querySelector('textarea').value = text;
      const box = panel.querySelector('.form-fallback');
      const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Copy details';
      copy.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(text); copy.textContent = 'Copied ✓'; }
        catch (e) { const t = panel.querySelector('textarea'); t.focus(); t.select(); copy.textContent = 'Select & copy'; }
      });
      box.appendChild(copy);
      [[how === 'sms' ? 'Email instead ↗' : 'Text instead ↗', how === 'sms' ? 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Quote request') + '&body=' + body : 'sms:' + PHONE + '?&body=' + body],
       ['Call (909) 450-6843', 'tel:' + PHONE]]
        .forEach(([t, h]) => { const a = document.createElement('a'); a.href = h; a.textContent = t; box.appendChild(a); });
      panel.focus();
    };
    const go = how => {
      status.textContent = '';
      if (!form.reportValidity()) return;
      if (form.elements.website && form.elements.website.value) return; // spam trap
      const text = details();
      const d = new FormData(form);
      const subject = 'Quote request: ' + (String(d.get('service') || 'Project')) + ' — ' + String(d.get('name') || '').trim();
      const url = how === 'sms'
        ? 'sms:' + PHONE + '?&body=' + encodeURIComponent(text)
        : 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
      showPanel(how, text);
      window.location.href = url;
      track(how === 'sms' ? 'inquiry_text_opened' : 'inquiry_draft_opened', { service: String(d.get('service') || '') });
    };
    form.addEventListener('submit', e => { e.preventDefault(); go('email'); });
    if (smsButton) smsButton.addEventListener('click', () => go('sms'));
    return;
  }

  /* ---------------- Direct-send mode (send-inquiry.php) ---------------- */
  form.querySelector('.submit').textContent = 'Send request ↗';

  const MAX_PHOTOS = 6;
  const MAX_EDGE = 1800;
  const submit = form.querySelector('.submit');
  const fileInput = form.querySelector('#photos');
  const thumbs = form.querySelector('.photo-thumbs');
  const photos = []; // {blob, name, url}
  form.elements.started.value = String(Date.now());


  // Resize photos in the browser so uploads are fast on mobile data.
  const shrink = file => new Promise(resolve => {
    if (!/^image\//.test(file.type) || file.type === 'image/gif') return resolve(file);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => { URL.revokeObjectURL(url); resolve(blob && blob.size < file.size ? blob : file); }, 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); }; // e.g. HEIC on some browsers: send original
    img.src = url;
  });

  const renderThumbs = () => {
    thumbs.innerHTML = '';
    photos.forEach((p, i) => {
      const fig = document.createElement('figure');
      const im = document.createElement('img');
      im.src = p.url; im.alt = 'Photo ' + (i + 1);
      const rm = document.createElement('button');
      rm.type = 'button'; rm.textContent = '×'; rm.setAttribute('aria-label', 'Remove photo ' + (i + 1));
      rm.addEventListener('click', () => { URL.revokeObjectURL(p.url); photos.splice(i, 1); renderThumbs(); });
      fig.append(im, rm);
      thumbs.appendChild(fig);
    });
    form.querySelector('.photo-count').textContent = photos.length ? photos.length + ' of ' + MAX_PHOTOS + ' photos added' : 'Up to ' + MAX_PHOTOS + ' photos · optional';
  };

  fileInput.addEventListener('change', async () => {
    const files = [...fileInput.files].slice(0, MAX_PHOTOS - photos.length);
    fileInput.value = '';
    for (const f of files) {
      if (f.size > 20 * 1024 * 1024) continue;
      const blob = await shrink(f);
      const ext = blob.type === 'image/jpeg' ? '.jpg' : (f.name.match(/\.[a-z0-9]+$/i) || [''])[0];
      photos.push({ blob, name: 'photo-' + (photos.length + 1) + ext, url: URL.createObjectURL(blob) });
    }
    renderThumbs();
  });
  renderThumbs();

  const summary = () => {
    const d = new FormData(form);
    return ['ALVION — Quote request', ...['name', 'phone', 'email', 'reply', 'vehicle', 'service', 'message']
      .map(k => k.toUpperCase() + ': ' + String(d.get(k) || '').trim())].join('\n');
  };

  const showFallback = () => {
    let box = form.querySelector('.form-fallback');
    if (!box) { box = document.createElement('div'); box.className = 'form-fallback'; status.after(box); }
    const body = encodeURIComponent(summary());
    box.innerHTML = '';
    const links = [
      ['Text us instead ↗', 'sms:' + PHONE],
      ['Email us instead ↗', 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Quote request') + '&body=' + body],
      ['Call (909) 450-6843', 'tel:' + PHONE]
    ];
    links.forEach(([t, h]) => { const a = document.createElement('a'); a.href = h; a.textContent = t; box.appendChild(a); });
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.classList.remove('is-error');
    if (!form.reportValidity()) return;
    const body = new FormData(form);
    body.delete('photos[]'); // the raw picker is emptied after each pick; send the resized copies instead
    photos.forEach(p => body.append('photos[]', p.blob, p.name));
    submit.disabled = true;
    const label = submit.textContent;
    submit.textContent = photos.length ? 'Sending photos…' : 'Sending…';
    status.textContent = '';
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 60000);
      const res = await fetch(form.action, { method: 'POST', body, headers: { Accept: 'application/json' }, signal: ctrl.signal });
      clearTimeout(timer);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || 'Send failed');
      const pref = body.get('reply');
      const how = pref === 'call' ? 'call you' : pref === 'email' ? 'email you' : 'text you';
      form.innerHTML = '';
      const ok = document.createElement('div');
      ok.className = 'form-success';
      ok.setAttribute('tabindex', '-1');
      ok.innerHTML = '<h3>Thank you — request received.</h3><p></p><p>Need us sooner? Call or text <a href="tel:' + PHONE + '">(909) 450-6843</a>.</p>';
      ok.querySelector('p').textContent = 'We’ll review your project and ' + how + ' with a written price, usually the same day during business hours (Mon–Sun, 10 AM–8 PM).';
      form.appendChild(ok);
      ok.focus();
      track('generate_lead', { service: String(body.get('service') || ''), reply: pref, photos: photos.length });
    } catch (err) {
      submit.disabled = false;
      submit.textContent = label;
      status.classList.add('is-error');
      status.textContent = 'Sorry, your request didn’t go through. Please text, call or email us — your details are ready below.';
      showFallback();
      track('lead_send_failed', { reason: String(err && err.message || '') });
    }
  });
})();
