/* Native modal keeps focus inside, obscures navigation, and returns to the same page. */
(() => {
  const sheet = document.getElementById('home-quote-sheet');
  if (!sheet || !sheet.showModal) return;
  const mobile = matchMedia('(max-width: 820px)');
  let opener, scrollY = 0, previousStyle;
  function close() { sheet.close(); }
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || !mobile.matches || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !url.pathname.endsWith('/contact.html') || url.hash !== '#projectForm') return;
    event.preventDefault();
    if (sheet.open) return;
    opener = link; scrollY = window.scrollY; previousStyle = document.body.getAttribute('style');
    document.body.style.position = 'fixed'; document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    sheet.showModal(); sheet.scrollTop = 0;
    sheet.querySelector('.sheet-close').focus({preventScroll:true});
  });
  sheet.querySelector('.sheet-close').addEventListener('click', close);
  sheet.addEventListener('click', event => {
    const rect = sheet.getBoundingClientRect();
    if (event.target === sheet && (event.clientY < rect.top || event.clientX < rect.left || event.clientX > rect.right)) close();
  });
  sheet.addEventListener('close', () => {
    if (previousStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', previousStyle);
    window.scrollTo({top:scrollY,behavior:'instant'});
    opener?.focus({preventScroll:true});
  });
  mobile.addEventListener('change', () => { if (!mobile.matches && sheet.open) close(); });
})();
