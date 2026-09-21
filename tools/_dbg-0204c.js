const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '..', 'resources', 'reference', '02-04-队列', 'modules.py');
const text = fs.readFileSync(p, 'utf8');
const head = text.slice(0, 200);
console.log('len =', text.length);
console.log('head =', JSON.stringify(head));
console.log('head has #% =', head.includes('#%'));
console.log('head has #@ =', head.includes('#@'));
const t = text.trim();
console.log('trim startsWith #% =', t.startsWith('#%'), JSON.stringify(t.slice(0, 12)));
