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
// 口径与 tools/check-py-coverage.js 一致：拼装视图（「完整源码」）是构建时
// 自动拼出来的，本来就不该有独立的 Python 版，不算在分子分母里。
// 拼装模块的识别靠"id 编号等于视图内模块个数"（模块从 01 连续编号）。
const codeFiles = [...files.keys()].filter((k) => /data\/code\/[^/]+\.json$/.test(k));
let totMod = 0, pyMod = 0, secs = 0, totAsm = 0, totAsmPy = 0;
for (const k of codeFiles) {
  const j = JSON.parse(read(k));
  const groups = [];
  if (j.modules) groups.push(j.modules);
  if (j.views) for (const v of Object.keys(j.views)) groups.push(j.views[v]);
  const asmIds = new Set();
  for (const g of groups) {
    const ids = Object.keys(g);
    const byPrefix = new Map();
    for (const id of ids) {
      const m = /^(.*-)(\d+)$/.exec(id);
      if (!m) continue;
      if (!byPrefix.has(m[1])) byPrefix.set(m[1], []);
      byPrefix.get(m[1]).push(parseInt(m[2], 10));
    }
    for (const [pre, nums] of byPrefix) {
      const asmId = pre + String(nums.length).padStart(2, '0');
      // 拼装视图现在也有 Python 版了，所以只认编号规律，不看有没有 py
      if (g[asmId]) asmIds.add(asmId);
    }
  }
  let n = 0, p = 0, a = 0, ap = 0;
  for (const g of groups) {
    for (const id of Object.keys(g)) {
      if (asmIds.has(id) || g[id].isAssembly) { a++; if (g[id].py) ap++; continue; }
      n++; if (g[id].py) p++;
    }
  }
  totMod += n; pyMod += p; totAsm += a; totAsmPy += ap;
  if (p) secs++;
}
const asmOk = totAsmPy === totAsm;
console.log(`  ${pyMod === totMod ? '✅' : '⚠'} data/code：${secs} 个小节带 Python；真实模块 ${pyMod}/${totMod} 有 py`);
console.log(`  ${asmOk ? '✅' : '⚠'} 拼装视图「完整源码」：${totAsmPy}/${totAsm} 个有 Python 版（把整节的 Python 拼起来）`);
if (pyMod !== totMod) bad++;
if (!asmOk) bad++;

// 3) 抽查一段 Python 代码内容是否完整（不是空串）
const sample = JSON.parse(read([...files.keys()].find((k) => k.endsWith('data/code/03-03.json'))));
const ids = Object.keys(sample.modules).filter((i) => sample.modules[i].py);
const one = sample.modules[ids[0]].py;
console.log(`  ${one && one.modes.detail.length > 500 ? '✅' : '⚠'} 03-03 的 Python 详细档 ${one ? one.modes.detail.length : 0} 字符，代码 ${one ? one.codeLineCount : 0} 行`);

// 4) 抽查一个拼装视图的 Python 版：要有内容，且只能有 1 个活跃的 __main__ 块
const asmSample = JSON.parse(read([...files.keys()].find((k) => k.endsWith('data/code/02-01.json')))).modules['02-01-07'];
const asmPy = asmSample && asmSample.py && asmSample.py.modes ? asmSample.py.modes.none : '';
const mainCount = (asmPy.match(/^if __name__ == ['"]__main__['"]\s*:/gm) || []).length;
const asmSampleOk = asmPy.length > 200 && mainCount === 1;
console.log(`  ${asmSampleOk ? '✅' : '⚠'} 抽查 02-01-07 拼装视图：Python ${asmPy.split('\n').length} 行，活跃 __main__ 块 ${mainCount} 个（应为 1）`);
if (!asmSampleOk) bad++;

console.log('');
console.log(bad ? `  ⚠ ${bad} 项没通过` : '  ✅ 打包结果包含全部 Python 相关改动');
process.exit(bad ? 1 : 0);
