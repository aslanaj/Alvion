const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? files(filename) : [filename];
  });
}
let scripts = 0;
for (const filename of files(root)) {
  if (filename.endsWith('.js')) {
    new vm.Script(fs.readFileSync(filename, 'utf8'), { filename });
    scripts++;
  }
  if (!filename.endsWith('.html')) continue;
  const html = fs.readFileSync(filename, 'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"#?]+)[^"]*"/g)) {
    const reference = match[1];
    if (/^(https?:|data:|mailto:|tel:|sms:|\/)/.test(reference)) continue;
    const resolved = path.join(path.dirname(filename), decodeURIComponent(reference));
    assert.ok(fs.existsSync(resolved), `${filename}: missing ${reference}`);
  }
}
console.log(`PASS: ${scripts} JavaScript files parse; local HTML links resolve.`);
