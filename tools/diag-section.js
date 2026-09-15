'use strict';
/**
 * 单节诊断：把某一节里每个模块的"脚手架 + 答案"都真编译跑一遍，
 * 逐个报告成功/失败与编译错误。
 *
 *   node tools/diag-section.js 03-01
 *
 * 比翻 build-data 的统计有用得多 —— 它会直接告诉你哪一行编不过。
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const P = require('../shared/parse');

const ROOT = path.join(__dirname, '..');
const REF = path.join(ROOT, 'resources', 'reference');
const TMP = path.join(ROOT, 'build-cache', 'diag');
const want = process.argv[2];

if (!want) {
  console.error('用法: node tools/diag-section.js <节id，如 03-01>');
  process.exit(1);
}

const dirs = fs.readdirSync(REF).filter((d) => d.startsWith(want) && fs.statSync(path.join(REF, d)).isDirectory());
if (!dirs.length) {
  console.error('找不到目录：resources/reference/' + want + '*');
  process.exit(1);
}

function buildView(dir, label) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.c'));
  const sources = files.map((f) => ({ name: f, text: fs.readFileSync(path.join(dir, f), 'utf8') }));
  const { modules, drivers, preamble } = P.parse(sources);

  console.log(`\n[${label}] ${modules.length} 个模块，${Object.keys(drivers).length} 个驱动`);
  console.log('  preamble = ' + JSON.stringify(preamble));

  for (const m of modules) {
    const filled = P.buildScaffold(modules, drivers, m.id, { fillCode: m.code, preamble });
    const src = path.join(TMP, `${label}-${m.id}.c`.replace(/[^\w.-]/g, '_'));
    const exe = src.replace(/\.c$/, '.exe');
    fs.mkdirSync(TMP, { recursive: true });
    fs.writeFileSync(src, filled, 'utf8');
    try {
      execFileSync('gcc', ['-std=c11', src, '-o', exe], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000 });
      const out = execFileSync(exe, [], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 8000, encoding: 'utf8' });
      const firstLine = out.trim().split('\n')[0] || '(无输出)';
      console.log(`  ✓ ${m.id} ${m.key}  →  ${firstLine.slice(0, 60)}`);
    } catch (e) {
      const err = (e.stderr || Buffer.from('')).toString()
        .split('\n').filter((l) => /error/.test(l)).slice(0, 3).join('\n      ');
      console.log(`  ✗ ${m.id} ${m.key}`);
      console.log('      ' + (err || (e.message || '').slice(0, 200)));
    }
  }
}

for (const d of dirs) {
  const full = path.join(REF, d);
  const subs = fs.readdirSync(full, { withFileTypes: true }).filter((e) => e.isDirectory());
  if (subs.length) {
    for (const s of subs) buildView(path.join(full, s.name), `${d}/${s.name}`);
  } else {
    buildView(full, d);
  }
}
