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
 * 三条依据，任意一条成立即可：
 *   1. chapters 里标了 isAssembly
 *   2. 它的 id 就在 asmIds 里
 *   3. **兜底规则**：它的 id 正好是同一视图里最大模块编号 + 1。
 *      大模块的子视图（02-02 的 singly / doubly）在 chapters 里没有单独登记，
 *      但构建时照样会追加一个拼装模块，靠这条兜底才认得出来。
 */
function markAssembly(code) {
  const groups = [];
  if (code.modules) groups.push(code.modules);
  if (code.views) for (const v of Object.keys(code.views)) groups.push(code.views[v]);
  for (const g of groups) {
    const ids = Object.keys(g);
    // 按"前缀 + 数字后缀"分组，同一前缀里数字最大的那个后面那个编号就是拼装视图
    const groupsByPrefix = new Map();
    for (const id of ids) {
      const m = /^(.*-)(\d+)$/.exec(id);
      if (!m) continue;
      if (!groupsByPrefix.has(m[1])) groupsByPrefix.set(m[1], []);
      groupsByPrefix.get(m[1]).push(parseInt(m[2], 10));
    }
    for (const [prefix, nums] of groupsByPrefix) {
      // 模块从 01 连续编号，拼装视图紧跟在最后一个真实模块之后。
      // 所以"编号个数"正好就是拼装视图的编号：12 个真实模块 → 拼装是 13。
      const asmId = prefix + String(nums.length).padStart(2, '0');
      // 只在"它确实没有 Python 版"时才认定，避免把真有 Python 的模块误判
      if (g[asmId] && g[asmId].py == null) asmIds.add(asmId);
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
