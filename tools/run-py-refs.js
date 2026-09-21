#!/usr/bin/env node
'use strict';
/**
 * 把某一节的 Python 版真正跑一遍，看输出对不对
 *   node tools/run-py-refs.js 02-01
 *
 * 做法：用解析器取出所有模块的"无注释档"拼成完整程序（去掉重复的定义），
 * 写进临时文件交给 python 执行，打印输出。
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const P = require('../shared/parse');

const sec = process.argv[2];
if (!sec) { console.error('用法: node tools/run-py-refs.js <节 id，如 02-01>'); process.exit(1); }

const REF = path.join(__dirname, '..', 'resources', 'reference');
const dir = fs.readdirSync(REF).find((d) => d.startsWith(sec));
if (!dir) { console.error('找不到这一节: ' + sec); process.exit(1); }

const pyFile = path.join(REF, dir, 'modules.py');
if (!fs.existsSync(pyFile)) { console.error('这一节还没有 modules.py'); process.exit(1); }

const r = P.parse([{ name: 'modules.py', text: fs.readFileSync(pyFile, 'utf8') }]);

// 一个模块都没解析出来，多半是格式问题（标记前缀判错、缺 #%end），
// 而不是"这一节本来就是空的" —— 直接报错，别拼个空程序还打 ✅
if (r.modules.length === 0) {
  console.error(`  ❌ ${dir}: 解析出 0 个模块 —— 文件格式有问题，先跑 tools/check-py-refs.js 看原因`);
  process.exit(1);
}

// 模块 01 里的常量与 class 是后面所有方法的前提，必须在前；
// 这里按模块顺序拼，靠 `if __name__` 判断是不是驱动器。
const parts = [];
for (const m of r.modules) {
  const code = m.modes.none.replace(/^\s*\n/, '');
  if (!code.trim()) continue;
  parts.push(code);
}
const full = parts.join('\n\n');

const tmp = path.join(os.tmpdir(), `ds-run-${sec}-${Date.now()}.py`);
fs.writeFileSync(tmp, full, 'utf8');

console.log(`  ════ ${dir} 的 Python 版实跑 ════`);
try {
  const out = execFileSync('python', [tmp], { encoding: 'utf8', timeout: 20000, stdio: 'pipe', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  console.log(out.split('\n').map((l) => '  ' + l).join('\n'));
  console.log('  ✅ 运行成功');
} catch (e) {
  console.log('  ❌ 运行失败');
  if (e.stdout) console.log('  stdout:\n' + e.stdout.split('\n').map((l) => '    ' + l).join('\n'));
  if (e.stderr) console.log('  stderr:\n' + e.stderr.split('\n').map((l) => '    ' + l).join('\n'));
  process.exit(1);
} finally {
  try { fs.unlinkSync(tmp); } catch { /* 忽略 */ }
}
