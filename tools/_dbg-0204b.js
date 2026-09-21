const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '..', 'resources', 'reference', '02-04-队列', 'modules.py');
const text = fs.readFileSync(p, 'utf8');

function prefixOf(raw) {
  const t = raw.trim();
  if (t.startsWith('//%') || t.startsWith('//@')) return '//';
  if (t.startsWith('#%') || t.startsWith('#@')) return '#';
  return '//';
}
function mres(p) {
  const e = p === '#' ? '#' : '\\/\\/';
  return {
    module: new RegExp(`^${e}%module\\s*\\|\\s*([^|]*)\\|\\s*([^|]*)\\|\\s*([^|]*)\\|\\s*([^|]*)\\|\\s*(.*)$`),
    end: new RegExp(`^${e}%end\\s*$`),
  };
}
const prefix = prefixOf(text);
console.log('prefix =', JSON.stringify(prefix));
const R = mres(prefix);
console.log('module re =', R.module.source);
const lines = text.replace(/\r\n?/g, '\n').split('\n');
let hits = 0;
for (const raw of lines) {
  const mm = raw.match(R.module);
  if (mm) { hits++; if (hits <= 2) console.log('match:', JSON.stringify(mm.slice(1))); }
}
console.log('module header hits =', hits);
let ends = 0;
for (const raw of lines) if (R.end.test(raw)) ends++;
console.log('end hits =', ends);
