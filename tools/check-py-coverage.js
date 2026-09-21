#!/usr/bin/env node
'use strict';
/**
 * 最终完整性检查：Python 版是否真的覆盖了全部模块
 *
 *   node tools/check-py-coverage.js
 *
 * 为什么单独做这个：前面几个工具各查一面 ——
 *   check-py-refs  查源码侧（每个 modules.py 的格式与模块对应）
 *   check-py-meta  查字段是否与 C 一致
 *   cmp-c-py       查运行输出是否逐字节相同
 *   sample-lang    查界面上按钮能不能切换
 * 但没有一个回答"构建产物里到底有多少模块带上了 Python"。
 *
 * 这里的口径：code 表里的模块总数减去**拼装视图**（"完整源码"是构建时
 * 自动拼出来的，本来就不该有独立的 Python 版），剩下的就是真实模块。
 */
const fs = require('fs');
const path = require('path');

const CODEP = path.join(__dirname, '..', 'data', 'code');
const CHP = path.join(__dirname, '..', 'data', 'chapters');

// 从 chapters 收集"哪些 id 是拼装视图"
const asmIds = new Set();
for (const f of fs.readdirSync(CHP).filter((x) => x.endsWith('.json'))) {
  const ch = JSON.parse(fs.readFileSync(path.join(CHP, f), 'utf8'));
  for (const sec of ch.sections || []) {
    for (const m of sec.modules || []) if (m.isAssembly) asmIds.add(m.id);
  }
}

/**
 * 判断一个模块是不是"拼装视图"（完整源码）。
 *
 * 编号规律：拼装视图紧跟在最后一个真实模块之后，而模块从 01 连续编号，
 * 所以**拼装视图的编号 = 同一前缀下的模块个数**（12 个真实模块 → 拼装是 13）。
 * 这条规律对单节视图和大模块的子视图都成立（02-02 的两个子视图就是这样，
 * 它们在 chapters 里没单独登记，靠编号规律才认得出来）。
 *
 * 注意：拼装视图现在**也有** Python 版（把整节的 Python 拼起来），
 * 所以不能再靠"有没有 py"来识别 —— 只认编号规律和 chapters 里的标记。
 */
function markAssembly(code) {
  const groups = [];
  if (code.modules) groups.push(code.modules);
  if (code.views) for (const v of Object.keys(code.views)) groups.push(code.views[v]);
  for (const g of groups) {
    const byPrefix = new Map();
    for (const id of Object.keys(g)) {
      const m = /^(.*-)(\d+)$/.exec(id);
      if (!m) continue;
      if (!byPrefix.has(m[1])) byPrefix.set(m[1], []);
      byPrefix.get(m[1]).push(parseInt(m[2], 10));
    }
    for (const [prefix, nums] of byPrefix) {
      const asmId = prefix + String(nums.length).padStart(2, '0');
      if (g[asmId]) asmIds.add(asmId);
    }
  }
}

let real = 0, realPy = 0, asm = 0, asmPy = 0;
const missing = [];
const perSec = [];

for (const f of fs.readdirSync(CODEP).filter((x) => x.endsWith('.json')).sort()) {
  const j = JSON.parse(fs.readFileSync(path.join(CODEP, f), 'utf8'));
  markAssembly(j);
  let t = 0, p = 0, at = 0, ap = 0;
  const walk = (mods) => {
    for (const id of Object.keys(mods || {})) {
      const m = mods[id];
      // 拼装视图：chapters 里标了 isAssembly，或者 id 落在 asmIds 里
      const isAsm = m.isAssembly === true || asmIds.has(id);
      if (isAsm) { at++; if (m.py) ap++; }
      else { t++; if (m.py) p++; else missing.push(id); }
    }
  };
  if (j.modules) walk(j.modules);
  if (j.views) for (const v of Object.keys(j.views)) walk(j.views[v]);
  real += t; realPy += p; asm += at; asmPy += ap;
  perSec.push(`  ${f.replace('.json', '').padEnd(8)} 真实 ${String(p).padStart(3)}/${String(t).padEnd(3)}${p < t ? ' ⚠' : '  '}  拼装 ${ap}/${at}`);
}

console.log('  逐节覆盖：');
perSec.forEach((l) => console.log(l));
console.log('');
console.log(`  真实模块:   ${realPy} / ${real} 个有 Python`);
console.log(`  拼装视图:   ${asmPy} / ${asm} 个有 Python（本来就不该有）`);
console.log('');
if (missing.length) {
  console.log(`  ❌ 还有 ${missing.length} 个真实模块没写 Python：`);
  missing.slice(0, 20).forEach((m) => console.log('     ' + m));
  process.exit(1);
}
console.log('  ✅ 全部真实模块都有 Python 版');
