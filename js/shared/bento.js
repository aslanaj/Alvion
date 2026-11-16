/* ALVION bento layout helpers: size pattern for the Our Work grid (it follows the service filters). */
(function () {
  var grid = document.querySelector('.portfolio-card-grid');
  if (!grid) return;
  var SIZE = ['b-big', 'b-full', 'b-wide', 'b-half', 'b-tall', 'b-sq'];
  var busy = false;

  function assign() {
    if (busy) return;
    busy = true;
    var items = Array.prototype.filter.call(grid.querySelectorAll('.portfolio-project'), function (el) { return !el.hidden; });
    items.forEach(function (el) { SIZE.forEach(function (c) { el.classList.remove(c); }); });
    /* Desktop: every 7th card is large. */
    items.forEach(function (el, k) { if (k % 7 === 0) el.classList.add('b-big'); });
    /* Phone: full, two tall halves, wide, two square halves… a half left alone becomes wide. */
    var pattern = ['full', 'tall', 'wide', 'sq'];
    for (var k = 0, c = 0; k < items.length; c++) {
      var t = pattern[c % 4], left = items.length - k;
      if ((t === 'tall' || t === 'sq') && left >= 2) {
        items[k].classList.add('b-half', 'b-' + t); items[k + 1].classList.add('b-half', 'b-' + t); k += 2;
      } else if (t === 'tall' || t === 'sq') {
        items[k].classList.add('b-full', 'b-wide'); k++;
      } else {
        items[k].classList.add('b-full'); if (t === 'wide') items[k].classList.add('b-wide'); k++;
      }
    }
    busy = false;
  }

  new MutationObserver(assign).observe(grid, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  grid.addEventListener('toggle', function (e) {
    var card = e.target.closest && e.target.closest('.portfolio-project');
    if (card) card.classList.toggle('b-open', e.target.open);
  }, true);
  assign();
})();
