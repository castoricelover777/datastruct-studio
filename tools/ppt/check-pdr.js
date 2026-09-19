const fs = require('fs');
const t = fs.readFileSync('docs/PDR-v2.1.3-修订版.txt', 'utf8');
// Monaco 只能出现在「没用 Monaco…」这句否定句里
const monacoLines = t.split('\n').filter((l) => l.includes('Monaco'));
const monacoOK = monacoLines.length === 1 && monacoLines[0].includes('没用');
const checks = [
  ['Monaco 只出现在否定句里', monacoOK],
  ['含「自己做的，不是现成库」', t.includes('自己做的，不是现成库')],
  ['含「后端 / 服务器 —— 还不会」', t.includes('后端 / 服务器 —— 还不会')],
  ['含透明输入框的说明', t.includes('输入框叠在语法高亮文字上面')],
  ['含 TCC 152 KB', t.includes('152 KB')],
  ['含 Node.js 脚本（28 个）', t.includes('Node.js 脚本（28 个）')],
  ['含 96.2 MB', t.includes('96.2 MB')],
  ['第一节完好', t.includes('一、为什么做')],
  ['第十四节完好', t.includes('十四、这一版（v2.1.3）改了什么')],
  ['无 AI 味词', !/赋能|助力|打造|旨在|致力于|综上所述/.test(t)],
];
for (const [name, ok] of checks) console.log(`  ${ok ? '✅' : '❌'}  ${name}`);
console.log(`  总行数: ${t.split('\n').length}`);
if (monacoLines.length) console.log(`  Monaco 上下文: ${monacoLines[0].trim()}`);
