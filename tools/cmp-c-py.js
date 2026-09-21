#!/usr/bin/env node
'use strict';
/**
 * C 版与 Python 版的实跑输出逐字节比对（铺量时每节都跑）
 *
 *   node tools/cmp-c-py.js resources/reference/02-01-线性表
 *   node tools/cmp-c-py.js resources/reference/02-02-链表/singly
 *
 * 为什么必须做这一步：check-py-refs.js 只查格式和语法，
 * 语法对、格式对，语义照样可能错（弹栈写成 --top、少测一个边界、
 * printf 与 print 的空格规则不同……）。只有真跑起来逐字节比，
 * 才能保证"Python 版和 C 版干的是同一件事"。
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const P = require('../shared/parse');

const viewDir = process.argv[2];
if (!viewDir) {
  console.error('用法: node tools/cmp-c-py.js <视图目录，如 resources/reference/02-01-线性表>');
  process.exit(1);
}
const dir = path.resolve(viewDir);
if (!fs.existsSync(path.join(dir, 'modules.py'))) {
  console.error('  找不到 ' + path.join(dir, 'modules.py'));
  process.exit(1);
}
const label = path.basename(dir);

// ---------- C 侧：把视图内的 .c 合成一个程序编译运行 ----------
// drivers.c 是练习模式用的测试驱动，不属于正文，要排除
const cFiles = fs.readdirSync(dir).filter((f) => f.endsWith('.c') && f !== 'drivers.c').sort();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cmp-c-py-'));
let cOut = null;
if (cFiles.length) {
  const cat = cFiles.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  fs.writeFileSync(path.join(tmp, 'main.c'), cat, 'utf8');
  try {
    execFileSync('gcc', ['-std=c99', '-w', path.join(tmp, 'main.c'), '-o', path.join(tmp, 'main.exe')],
      { stdio: 'pipe', timeout: 60000 });
    cOut = execFileSync(path.join(tmp, 'main.exe'), [],
      { encoding: 'utf8', timeout: 20000, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  } catch (e) {
    console.log('  ⚠ C 版编译或运行失败：' + String(e.stderr || e.message).split('\n')[0]);
  }
}

// ---------- Python 侧：解析出无注释档拼成完整程序 ----------
const pyText = fs.readFileSync(path.join(dir, 'modules.py'), 'utf8');
const r = P.parse([{ name: 'modules.py', text: pyText }]);
const full = r.modules.map((m) => m.modes.none.replace(/^\s*\n/, '')).filter((s) => s.trim()).join('\n\n');
fs.writeFileSync(path.join(tmp, 'main.py'), full, 'utf8');
let pyOut = null;
try {
  pyOut = execFileSync('python', [path.join(tmp, 'main.py')],
    { encoding: 'utf8', timeout: 20000, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
} catch (e) {
  console.log('  ⚠ Python 版运行失败：' + String(e.stderr || e.message).split('\n').slice(0, 4).join('\n'));
}

// ---------- 比对 ----------
let ok = true;
if (cOut == null || pyOut == null) {
  console.log(`  ⚠ ${label}: 有一侧没跑起来，无法比对`);
  ok = false;
} else {
  const cb = Buffer.byteLength(cOut, 'utf8');
  const pb = Buffer.byteLength(pyOut, 'utf8');
  if (cOut === pyOut) {
    console.log(`  ✅ ${label}: C 与 Python 输出逐字节一致（${cb} 字节）`);
  } else {
    ok = false;
    console.log(`  ❌ ${label}: 输出不一致（C ${cb} 字节 / Python ${pb} 字节）`);
    const a = cOut.split('\n');
    const b = pyOut.split('\n');
    let shown = 0;
    for (let i = 0; i < Math.max(a.length, b.length) && shown < 6; i++) {
      if (a[i] !== b[i]) {
        console.log(`     第 ${i + 1} 行不同：`);
        console.log(`       C : ${JSON.stringify(a[i])}`);
        console.log(`       Py: ${JSON.stringify(b[i])}`);
        shown++;
      }
    }
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(ok ? 0 : 1);
