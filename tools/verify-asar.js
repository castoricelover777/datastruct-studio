// 从打包后的 app.asar 里验证：Python 功能与全部 26 节代码是否真打进去了
const fs = require('fs');
const path = require('path');

const ASAR = 'dist/win-unpacked/resources/app.asar';
const buf = fs.readFileSync(ASAR);
const headerSize = buf.readUInt32LE(4);
const headerStr = buf.slice(8, 8 + headerSize).toString('utf8');
const dir = JSON.parse(headerStr.slice(headerStr.indexOf('{'), headerStr.lastIndexOf('}') + 1));
const dataStart = 8 + headerSize;

const files = new Map();
(function walk(node, prefix) {
  for (const [name, meta] of Object.entries(node.files || {})) {
    const p = prefix ? prefix + '/' + name : name;
    if (meta.files) walk(meta, p);
    else files.set(p, meta);
  }
})(dir, '');

function read(rel) {
  const key = [...files.keys()].find((k) => k === rel || k.endsWith('/' + rel));
  if (!key) return null;
  const meta = files.get(key);
  const off = Number(meta.offset);
  return buf.slice(dataStart + off, dataStart + off + meta.size).toString('utf8');
}

console.log(`  asar 里共 ${files.size} 个文件`);

// 1) 前端与数据文件
const checks = [
  ['src/index.html', ['langModes', 'data-lang="py"']],
  ['src/app.js', ['currentCode', 'hasPy', 'setLang']],
  ['src/highlight.js', ['PY_KEYWORDS', 'detectLang', 'inTriple']],
];
let bad = 0;
for (const [f, keys] of checks) {
  const c = read(f);
  if (!c) { console.log(`  ❌ 找不到 ${f}`); bad++; continue; }
  const miss = keys.filter((k) => !c.includes(k));
  console.log(`  ${miss.length ? '⚠' : '✅'} ${f}  命中 ${keys.length - miss.length}/${keys.length}${miss.length ? '  缺: ' + miss.join(',') : ''}`);
  if (miss.length) bad++;
}

// 2) 每一节的 data/code 里都要有 py 字段
const codeFiles = [...files.keys()].filter((k) => /data\/code\/[^/]+\.json$/.test(k));
let totMod = 0, pyMod = 0, secs = 0;
for (const k of codeFiles) {
  const j = JSON.parse(read(k));
  let n = 0, p = 0;
  const count = (mods) => { for (const id of Object.keys(mods || {})) { n++; if (mods[id].py) p++; } };
  if (j.modules) count(j.modules);
  if (j.views) for (const v of Object.keys(j.views)) count(j.views[v]);
  totMod += n; pyMod += p;
  if (p) secs++;
}
console.log(`  ${pyMod === totMod ? '✅' : '⚠'} data/code：${secs} 个小节带 Python，模块 ${pyMod}/${totMod} 个有 py 字段`);
if (pyMod !== totMod) bad++;

// 3) 抽查一段 Python 代码内容是否完整（不是空串）
const sample = JSON.parse(read([...files.keys()].find((k) => k.endsWith('data/code/03-03.json'))));
const ids = Object.keys(sample.modules).filter((i) => sample.modules[i].py);
const one = sample.modules[ids[0]].py;
console.log(`  ${one && one.modes.detail.length > 500 ? '✅' : '⚠'} 03-03 的 Python 详细档 ${one ? one.modes.detail.length : 0} 字符，代码 ${one ? one.codeLineCount : 0} 行`);

console.log('');
console.log(bad ? `  ⚠ ${bad} 项没通过` : '  ✅ 打包结果包含全部 Python 相关改动');
process.exit(bad ? 1 : 0);
