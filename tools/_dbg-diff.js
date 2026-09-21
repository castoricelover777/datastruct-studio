// 一致性验证：C 版 modules.c 与 Python 版 modules.py 的实际输出逐字节比对
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const P = require('../shared/parse');

const REF = path.join(__dirname, '..', 'resources', 'reference');
const dir = path.join(REF, '02-04-队列');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-0204-'));

// C：直接编译整个 modules.c（它本身是可编译的）
const cSrc = path.join(tmp, 'm.c');
fs.copyFileSync(path.join(dir, 'modules.c'), cSrc);
const cExe = path.join(tmp, process.platform === 'win32' ? 'm.exe' : 'm');
execFileSync('gcc', ['-std=c99', '-o', cExe, cSrc], { stdio: 'pipe' });
const cOut = execFileSync(cExe, { encoding: 'utf8', stdio: 'pipe' });

// Python：把各模块的"无注释档"拼起来跑
const r = P.parse([{ name: 'modules.py', text: fs.readFileSync(path.join(dir, 'modules.py'), 'utf8') }]);
const pySrc = path.join(tmp, 'm.py');
fs.writeFileSync(pySrc, r.modules.map((m) => m.modes.none).join('\n\n'), 'utf8');
const pyOut = execFileSync('python', [pySrc], {
  encoding: 'utf8',
  stdio: 'pipe',
  env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
});

const norm = (s) => s.replace(/\r\n?/g, '\n').replace(/\s+$/, '');
const a = norm(cOut);
const b = norm(pyOut);
console.log('C 输出字节 =', Buffer.byteLength(a, 'utf8'), ' Python 输出字节 =', Buffer.byteLength(b, 'utf8'));
console.log('输出完全一致 =', a === b);
if (a !== b) {
  const al = a.split('\n');
  const bl = b.split('\n');
  const n = Math.max(al.length, bl.length);
  for (let i = 0; i < n; i++) {
    if (al[i] !== bl[i]) console.log(`第 ${i + 1} 行不同:\n  C : ${JSON.stringify(al[i])}\n  PY: ${JSON.stringify(bl[i])}`);
  }
  process.exit(1);
}
fs.rmSync(tmp, { recursive: true, force: true });
