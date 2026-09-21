const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '..', 'resources', 'reference', '02-04-队列', 'modules.py');
const buf = fs.readFileSync(p);
const text = buf.toString('utf8');
console.log('bytes =', buf.length, 'has CRLF =', text.includes('\r\n'), 'has BOM =', buf[0] === 0xef);
const lines = text.split('\n');
[54, 55, 68, 69, 70, 100, 101, 102].forEach((n) => {
  const l = lines[n - 1];
  console.log(n, JSON.stringify(l));
});
const first = lines[0];
console.log('line1 [' + first + '] codes=' + [...first.slice(0, 6)].map((c) => c.charCodeAt(0)).join(','));
