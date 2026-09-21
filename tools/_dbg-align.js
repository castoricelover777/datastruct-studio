const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '..', 'resources', 'reference', '02-04-队列', 'modules.py');
const lines = fs.readFileSync(p, 'utf8').split('\n');

let problems = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!/^\s*#@[sd]\b/.test(line)) continue;
  const indent = line.length - line.trimStart().length;
  // 找到下一条非注释、非空行
  let j = i + 1;
  while (j < lines.length && (lines[j].trim() === '' || /^\s*#/.test(lines[j]))) j++;
  const code = lines[j] || '';
  const codeIndent = code.length - code.trimStart().length;
  const ok = indent === codeIndent;
  if (!ok) {
    problems++;
    console.log(`line ${i + 1}: 注释缩进 ${indent} vs 代码缩进 ${codeIndent}`);
    console.log(`   @ ${JSON.stringify(line.slice(0, 60))}`);
    console.log(`   > ${JSON.stringify(code.slice(0, 60))}`);
  }
}
console.log('缩进不齐的 @ 行数 =', problems);

// 无注释档残留检查（模拟 checker）
const text = lines.join('\n');
for (const m of require('../shared/parse').parse([{ name: 'modules.py', text }]).modules) {
  const none = m.modes.none;
  const bad = none.split('\n').filter((l) => /^[ \t]*#?@[sd]\b/.test(l) || /^[ \t]*#%/.test(l));
  if (bad.length) console.log(`模块 ${m.id} 无注释档残留:`, bad);
  console.log(`模块 ${m.id}: 代码行 ${none.split('\n').filter((l) => l.trim()).length} 行`);
}
