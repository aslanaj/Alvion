const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const base = path.join(__dirname, '..');
const context = {
  URL,
  location: { href: 'https://example.test/site/services.html' },
  document: { querySelectorAll: () => [] }
};
context.window = context;
vm.createContext(context);
for (const file of ['js/core/quote-url.js', 'js/features/ppf/catalog.js', 'js/features/ppf/controller.js']) {
  vm.runInContext(fs.readFileSync(path.join(base, file), 'utf8'), context);
}

const quote = new URL(context.Alvion.buildQuoteUrl({
  vehicle: 'Porsche 911', service: 'Full-body color PPF', look: 'Red & blue', unsafe: 'ignored'
}));
assert.equal(quote.pathname, '/site/contact.html');
assert.equal(quote.searchParams.get('look'), 'Red & blue');
assert.equal(quote.searchParams.has('unsafe'), false);
assert.equal(quote.hash, '#projectForm');

let actions, latest, nextId = 0;
const timers = new Map();
let reduceMotion = false;
const controller = context.Alvion.createPpfController({
  bind: value => { actions = value; },
  render: value => { latest = value; }
}, context.Alvion.ppfCatalog, {
  setTimer: (callback, delay) => { const id = ++nextId; timers.set(id, { callback, delay }); return id; },
  clearTimer: id => timers.delete(id),
  prefersReducedMotion: () => reduceMotion
});
const runAt = delay => {
  const entry = [...timers].find(([, timer]) => timer.delay === delay);
  assert.ok(entry, `Scheduled phase at ${delay}ms`);
  timers.delete(entry[0]);
  entry[1].callback();
};
assert.equal(latest.packageId, 'front');
actions.selectPackage('color');
assert.equal(latest.phase, 'lift');
runAt(2200); assert.equal(latest.phase, 'color');
runAt(3400); assert.equal(latest.phase, 'return');
runAt(6100); assert.equal(latest.phase, 'idle');
actions.selectColor(1);
actions.selectColor(2);
assert.equal(timers.size, 3, 'Rapid selections cancel superseded animation');
runAt(2200); assert.equal(latest.filmColorIndex, 2);
actions.selectPackage('body');
assert.equal(timers.size, 0, 'Changing package cancels pending animation');
assert.equal(latest.packageId, 'body');
reduceMotion = true;
actions.selectPackage('color');
actions.selectColor(3);
assert.equal(latest.phase, 'idle');
assert.equal(latest.filmColorIndex, 3);
assert.equal(timers.size, 0);
controller.destroy();
console.log('PASS: quote encoding, animation phases, cancellation, package switching, reduced motion.');
