const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'resources', 'reference', '04-01-图的表示');
const c = fs.readFileSync(path.join(dir, 'modules.c'), 'utf8').replace(/\r\n?/g, '\n').split('\n');
const p = fs.readFileSync(path.join(dir, 'modules.py'), 'utf8').replace(/\r\n?/g, '\n').split('\n');

const grab = (lines, re) => lines.map((l) => { const m = l.match(re); return m ? m[2] : null; }).filter((x) => x !== null);
const norm = (t) => t.replace(/^\s?/, '').replace(/\s+$/, '');

const cCom = grab(c, /^\/\/(@[sd])(\s.*|)$/).map(norm);
const pCom = grab(p, /^#(@[sd])(\s.*|)$/).map(norm);
const pSet = new Set(pCom);
const missing = cCom.filter((t) => !pSet.has(t));

console.log('C 侧 @s/@d 行数 =', cCom.length);
console.log('Python 侧 @s/@d 行数 =', pCom.length);
console.log('C 有、Python 找不到原话的行数 =', missing.length);
missing.forEach((t) => console.log('   缺: ' + JSON.stringify(t)));

const cMod = c.filter((l) => /^\/\/%module/.test(l)).map((l) => l.replace('//', '#'));
const pMod = p.filter((l) => /^#%module/.test(l));
console.log('module 头逐字节一致 =', JSON.stringify(cMod) === JSON.stringify(pMod), '（' + pMod.length + ' 条）');

const cSum = c.filter((l) => /^\/\/%summary/.test(l)).map((l) => l.replace('//', '#'));
const pSum = p.filter((l) => /^#%summary/.test(l));
console.log('summary 逐字节一致 =', JSON.stringify(cSum) === JSON.stringify(pSum), '（C ' + cSum.length + ' / Py ' + pSum.length + '）');

// 每个模块里是否都有"这段 Python 和 C 有什么不一样"
const blocks = fs.readFileSync(path.join(dir, 'modules.py'), 'utf8').split(/^#%module/m).slice(1);
console.log('模块数 =', blocks.length);
blocks.forEach((b, i) => {
  const id = (b.match(/^\s*\|\s*([^|]*)\|/) || [])[1];
  const sec = b.split('\n').filter((l) => l.includes('这段 Python 和 C 有什么不一样')).length;
  console.log(`   模块 ${id}: 有"不一样"小节 ${sec} 处`);
});
