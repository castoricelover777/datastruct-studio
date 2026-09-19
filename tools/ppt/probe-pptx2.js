const fs = require('fs');
const zlib = require('zlib');
const p = process.argv[2];
const b = fs.readFileSync(p);
const parts = [];
for (let i = 0; i + 30 < b.length; i++) {
  if (b[i] !== 0x50 || b[i + 1] !== 0x4b || b[i + 2] !== 0x03 || b[i + 3] !== 0x04) continue;
  const method = b.readUInt16LE(i + 8);
  const cs = b.readUInt32LE(i + 18);
  const nl = b.readUInt16LE(i + 26);
  const el = b.readUInt16LE(i + 28);
  const n = b.slice(i + 30, i + 30 + nl).toString('utf8');
  const ds = i + 30 + nl + el;
  if (cs && (n.startsWith('ppt/slides/slide') || n === 'docProps/app.xml')) {
    try { parts.push({ n, t: (method === 8 ? zlib.inflateRawSync(b.slice(ds, ds + cs)) : b.slice(ds, ds + cs)).toString('utf8') }); } catch {}
  }
  i = ds + cs - 1;
}
const slides = parts.filter((x) => x.n.includes('slides/'));
console.log('  文件:', p.split(/[\\/]/).pop(), b.length, '字节');
console.log('  幻灯片数:', slides.length);
for (const k of ['我的专业知识图谱', '图谱是怎么建出来的', '六个分支里具体有什么', '这些认识是从哪来的',
  '这七天我做了什么', '我做的四件事', '改一次东西，要跑几个地方', '现在做出来什么样', '我做这个的来由']) {
  console.log(`    ${parts.some((x) => x.t.includes(k)) ? '有' : '缺'}  ${k}`);
}
const app = parts.find((x) => x.n === 'docProps/app.xml');
if (app) {
  const a = app.t.match(/<Application>([^<]*)</);
  const s = app.t.match(/<Slides>(\d+)</);
  console.log('  生成程序:', a ? a[1] : '?', ' 声明页数:', s ? s[1] : '?');
}
