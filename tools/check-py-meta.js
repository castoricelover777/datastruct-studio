#!/usr/bin/env node
'use strict';
/**
 * C 版与 Python 版的逐字段一致性检查
 *
 *   node tools/check-py-meta.js
 *
 * 比什么：每个模块的 编号 / key / 中文标题 / 难度 / 依赖 / summary
 * 为什么要比：check-py-refs.js 只查"C 有的 Python 有没有"和格式，
 * 不看这些字段的内容。曾经因此漏掉两类问题：
 *   - 把 #%summary 打成 #@summary → 该模块 summary 变空
 *   - 整行 #%summary 漏写       → 同上
 * 这类问题不影响代码输出（cmp 查不出来），但界面上会显示成空白。
 */
const fs = require('fs');
const path = require('path');
const P = require('../shared/parse');

const REF = path.join(__dirname, '..', 'resources', 'reference');

function collectViews() {
  const out = [];
  for (const d of fs.readdirSync(REF).sort()) {
    const dir = path.join(REF, d);
    if (!fs.statSync(dir).isDirectory()) continue;
    const cFiles = fs.readdirSync(dir).filter((f) => f.endsWith('.c') && f !== 'drivers.c').sort();
    if (cFiles.length) { out.push({ label: d, dir, cFiles }); continue; }
    for (const sub of fs.readdirSync(dir)) {
      const sdir = path.join(dir, sub);
      if (!fs.statSync(sdir).isDirectory()) continue;
      const cf = fs.readdirSync(sdir).filter((f) => f.endsWith('.c') && f !== 'drivers.c').sort();
      if (cf.length) out.push({ label: `${d}/${sub}`, dir: sdir, cFiles: cf });
    }
  }
  return out;
}

const FIELDS = ['id', 'key', 'title', 'difficulty', 'summary'];
let nSec = 0, nMod = 0, nBad = 0;

for (const { label, dir, cFiles } of collectViews()) {
  const pyFile = path.join(dir, 'modules.py');
  if (!fs.existsSync(pyFile)) continue;
  nSec++;

  const c = P.parse(cFiles.map((f) => ({ name: f, text: fs.readFileSync(path.join(dir, f), 'utf8') })));
  const py = P.parse([{ name: 'modules.py', text: fs.readFileSync(pyFile, 'utf8') }]);
  const cById = new Map(c.modules.map((m) => [m.id, m]));
  const pyById = new Map(py.modules.map((m) => [m.id, m]));

  const errs = [];
  for (const [id, cm] of cById) {
    const pm = pyById.get(id);
    if (!pm) { errs.push(`${id}: Python 版缺这个模块`); continue; }
    nMod++;
    for (const f of FIELDS) {
      const cv = cm[f];
      const pv = pm[f];
      const cs = f === 'deps' ? '' : String(cv == null ? '' : cv).trim();
      const ps = f === 'deps' ? '' : String(pv == null ? '' : pv).trim();
      if (cs !== ps) errs.push(`${id} 的 ${f}:\n        C : ${cs || '(空)'}\n        Py: ${ps || '(空)'}`);
    }
    if (JSON.stringify(cm.deps) !== JSON.stringify(pm.deps)) {
      errs.push(`${id} 的 deps:\n        C : [${cm.deps.join(',')}]\n        Py: [${pm.deps.join(',')}]`);
    }
  }
  for (const id of pyById.keys()) {
    if (!cById.has(id)) errs.push(`${id}: Python 版多出这个模块`);
  }

  if (errs.length) {
    nBad++;
    console.log(`  ✗ ${label}`);
    errs.slice(0, 6).forEach((e) => console.log(`      ${e}`));
    if (errs.length > 6) console.log(`      …还有 ${errs.length - 6} 条`);
  } else {
    console.log(`  ✓ ${label}`);
  }
}

console.log(`\n  ${nSec} 节 ${nMod} 个模块，字段不一致的节 ${nBad} 个`);
process.exit(nBad ? 1 : 0);
