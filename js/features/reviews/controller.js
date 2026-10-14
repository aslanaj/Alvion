(() => {
  /* ---------------- Reviews (data lives in reviews.js) ---------------- */
  const reviewsSection = document.querySelector('#reviews');
  const reviews = Array.isArray(window.ALVION_REVIEWS) ? window.ALVION_REVIEWS.filter(r => r && r.text && r.name) : [];
  if (reviewsSection && reviews.length) {
    const grid = reviewsSection.querySelector('.reviews-grid');
    reviews.slice(0, 6).forEach(r => {
      const fig = document.createElement('figure');
      fig.className = 'review-card';
      const stars = Math.max(1, Math.min(5, Number(r.stars) || 5));
      const s = document.createElement('div');
      s.className = 'review-stars';
      s.setAttribute('aria-label', stars + ' out of 5 stars');
      s.textContent = '★'.repeat(stars);
      const q = document.createElement('blockquote');
      q.textContent = '“' + r.text + '”';
      const c = document.createElement('figcaption');
      c.textContent = [r.name, r.car, r.service].filter(Boolean).join(' · ').toUpperCase();
      fig.append(s, q, c);
      grid.appendChild(fig);
    });
    const more = reviewsSection.querySelector('.reviews-more');
    if (more && window.ALVION_REVIEWS_LINK) more.href = window.ALVION_REVIEWS_LINK; else if (more) more.hidden = true;
    reviewsSection.hidden = false;
  }


})();
