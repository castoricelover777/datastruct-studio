const fs = require('fs');
const path = require('path');
const P = require('../shared/parse');

const p = path.join(__dirname, '..', 'resources', 'reference', '02-04-队列', 'modules.py');
const text = fs.readFileSync(p, 'utf8');
console.log('idx #% =', text.indexOf('#%'));
const r = P.parse([{ name: 'modules.py', text }]);
console.log('modules =', r.modules.length, r.modules.map((m) => m.id));
console.log('drivers =', Object.keys(r.drivers));
console.log('slice200 =', JSON.stringify(text.slice(0, 200)));
console.log('startsWith#% on slice =', text.slice(0, 200).includes('#%'));
console.log('P.parse length =', P.parse.length);
console.log('parse src head =', P.parse.toString().split('\n').slice(0, 6).join('\n'));
const lines = text.split('\n');
const MODULE_RE = /^\/\/%module\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*(.*)$/;
const HASH_RE = /^#%module\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*(.*)$/;
lines.forEach((l, i) => {
  if (l.includes('%module')) {
    console.log(i + 1, 'C-re=', !!l.match(MODULE_RE), 'hash-re=', !!l.match(HASH_RE), JSON.stringify(l));
  }
});
