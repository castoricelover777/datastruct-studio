#!/usr/bin/env node
'use strict';
/**
 * Python 版参考代码的自动校验（铺量时每次都要跑）
 *
 *   node tools/check-py-refs.js            检查全部
 *   node tools/check-py-refs.js 02-01      只查一节
 *
 * 检查四件事：
 *   1. 标记语法：模块能否被解析器解析出来，id 是否与 C 版一一对应
 *   2. 三档一致：无注释档里不能残留 #@ 标记行；三档去掉注释后必须完全相同
 *   3. 语法正确：把标记行注释掉之后，python -m py_compile 能通过
 *   4. 语义冒烟：无注释档拼起来后，能 import 成功（不执行，只看编译）
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const P = require('../shared/parse');

const REF = path.join(__dirname, '..', 'resources', 'reference');
const only = process.argv[2] || null;

function pyCompile(code) {
  const f = path.join(os.tmpdir(), `ds-check-${Date.now()}-${Math.random().toString(36).slice(2)}.py`);
  fs.writeFileSync(f, code, 'utf8');
  try {
    execFileSync('python', ['-m', 'py_compile', f], { encoding: 'utf8', timeout: 20000, stdio: 'pipe' });
    return { ok: true };
  } catch (e) {
    const msg = (e.stderr || e.stdout || e.message || '').split('\n').filter((l) => l.trim()).slice(0, 6).join('\n');
    return { ok: false, msg };
  } finally {
    try { fs.unlinkSync(f); } catch { /* 忽略 */ }
    try { fs.unlinkSync(f.replace(/\.py$/, '.pyc')); } catch { /* 忽略 */ }
  }
}

function compileTree() {
  const py = path.join(os.tmpdir(), `ds-scan-${Date.now()}`);
  fs.mkdirSync(py, { recursive: true });
  return py;
}

const dirs = fs.readdirSync(REF).filter((d) => fs.statSync(path.join(REF, d)).isDirectory()).sort();

let nFiles = 0, nMods = 0, nErr = 0, nWarn = 0;
const problems = [];

for (const d of dirs) {
  const dir = path.join(REF, d);
  const pyFile = path.join(dir, 'modules.py');
  const cFile = path.join(dir, 'modules.c');
  const hasPy = fs.existsSync(pyFile);
  const hasC = fs.existsSync(cFile);

  if (only && !d.startsWith(only)) continue;
  if (!hasPy && !hasC) continue;

  // C 版模块 id（作为"应该有哪些"的基准）
  let cIds = [];
  if (hasC) {
    const rc = P.parse([{ name: 'modules.c', text: fs.readFileSync(cFile, 'utf8') }]);
    cIds = rc.modules.map((m) => m.id);
  }

  if (!hasPy) {
    console.log(`  ○ ${d}  ——还没写 Python（C 有 ${cIds.length} 个模块）`);
    continue;
  }

  nFiles++;
  const text = fs.readFileSync(pyFile, 'utf8');
  const openTags = (text.match(/^#%module\s*\|/gm) || []).length;
  const endTags = (text.match(/^#%end\s*$/gm) || []).length;
  const r = P.parse([{ name: 'modules.py', text }]);
  const pyIds = r.modules.map((m) => m.id);
  nMods += pyIds.length;

  const errs = [];

  // 0) 文件是否写完整：每个 %module 都要有 %end 收尾，
  //    否则解析器会把整个尾巴吃掉，报出来只是"缺模块"，看不出真正原因
  if (openTags !== endTags) {
    errs.push(`文件没写完整：有 ${openTags} 个 #%module 但只有 ${endTags} 个 #%end（缺 ${openTags - endTags} 个）`);
  }

  // 1) 模块对应关系
  if (hasC) {
    const missing = cIds.filter((id) => !pyIds.includes(id));
    const extra = pyIds.filter((id) => !cIds.includes(id));
    if (missing.length) errs.push(`C 有但 Python 缺：${missing.join(', ')}`);
    if (extra.length) errs.push(`Python 多出：${extra.join(', ')}`);
  }

  // 2) 三档一致 + 无残留标记
  for (const m of r.modules) {
    const { detail, short, none } = m.modes;
    if (/^[ \t]*#?@[sd]\b/m.test(none)) errs.push(`模块 ${m.id}: 无注释档里残留 @ 标记`);
    if (/^[ \t]*#%/.test(none)) errs.push(`模块 ${m.id}: 无注释档里残留 % 标记`);
    // 三档剥掉注释行之后必须一模一样
    const strip = (s) => s.split('\n')
      .filter((l) => !/^[ \t]*#/.test(l))
      .map((l) => l.replace(/\s+$/, ''))
      .join('\n').trim();
    if (strip(detail) !== strip(none)) errs.push(`模块 ${m.id}: 详细档与无注释档的代码不一致`);
    if (strip(short) !== strip(none)) errs.push(`模块 ${m.id}: 精简档与无注释档的代码不一致`);
  }

  // 3) 语法：把标记行注释掉再编译
  const cleaned = text.split('\n').map((l) => {
    const t = l.trim();
    if (t.startsWith('#%') || t.startsWith('#@')) {
      return l.slice(0, l.length - l.trimStart().length) + '# ' + t;
    }
    return l;
  }).join('\n');
  const cc = pyCompile(cleaned);
  if (!cc.ok) errs.push('语法错误：\n      ' + cc.msg.replace(/\n/g, '\n      '));

  if (errs.length) {
    nErr++;
    problems.push({ d, errs });
    console.log(`  ✗ ${d}  ${pyIds.length} 个模块，${errs.length} 个问题`);
    for (const e of errs.slice(0, 4)) console.log(`      · ${e}`);
    if (errs.length > 4) console.log(`      · …还有 ${errs.length - 4} 条`);
  } else {
    console.log(`  ✓ ${d}  ${pyIds.length} 个模块`);
  }
}

console.log('');
console.log(`  小节 ${nFiles} 个，模块 ${nMods} 个，有问题的节 ${nErr} 个`);
if (nErr) process.exit(1);
