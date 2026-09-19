#!/usr/bin/env node
'use strict';
/**
 * 检查导出的 PPTX 里有没有「不该出现的话」和「编码损坏」。
 *
 *   node tools/ppt/check-pptx.js "ppt/考核汇报.pptx" ...
 *
 * 背景：这个项目的全部代码由 AI 生成，汇报材料必须如实说明。
 * 早期版本里出现过「代码书写我用了 AI 辅助」「我唯一手写维护」这类
 * 含糊或失实的说法，一旦被追问就无法自圆其说，所以固化成本检查。
 */
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// 必须存在的说法：如实交代代码来源
const MUST = ['代码不是我写的', 'AI 生成', '我做的四件事', '定怎么学'];
// 绝对不能出现的说法：含糊或把 AI 的功劳说成自己的
const FORBIDDEN = ['我的强项', '关键设计决策', '唯一手写', '我负责', 'AI 辅助',
  '我设计的架构', '我写的代码', '我实现了'];

function slides(file) {
  const b = fs.readFileSync(file);
  const out = [];
  for (let i = 0; i + 30 < b.length; i++) {
    if (b[i] !== 0x50 || b[i + 1] !== 0x4b || b[i + 2] !== 0x03 || b[i + 3] !== 0x04) continue;
    const method = b.readUInt16LE(i + 8);
    const compSize = b.readUInt32LE(i + 18);
    const nameLen = b.readUInt16LE(i + 26);
    const extraLen = b.readUInt16LE(i + 28);
    const name = b.slice(i + 30, i + 30 + nameLen).toString('utf8');
    const dataStart = i + 30 + nameLen + extraLen;
    if (compSize === 0 || !name.startsWith('ppt/slides/slide')) { i = dataStart; continue; }
    const raw = b.slice(dataStart, dataStart + compSize);
    try {
      out.push({ name, text: (method === 8 ? zlib.inflateRawSync(raw) : raw).toString('utf8') });
    } catch { /* 跳过无法解压的条目 */ }
    i = dataStart + compSize - 1;
  }
  return out;
}

let fail = 0;
for (const f of process.argv.slice(2)) {
  const parts = slides(f);
  if (!parts.length) { console.log(`  ${path.basename(f)}  ✗ 不是有效的 PPTX 或没有幻灯片`); fail++; continue; }
  const all = parts.map((p) => p.text).join('');
  const bad = FORBIDDEN.filter((k) => all.includes(k));
  const broken = [...all.matchAll(/\uFFFD/g)].length;
  const hit = MUST.filter((k) => all.includes(k));

  console.log(`  ${path.basename(f)}  ${parts.length} 页`);
  console.log(`     如实交代用词: ${hit.length ? hit.join('、') : '（无 —— 需检查）'}`);
  if (bad.length) { console.log(`     ✗ 不该出现: ${bad.join('、')}`); fail++; }
  if (broken) { console.log(`     ✗ 编码损坏: ${broken} 个替换字符`); fail++; }
  if (!bad.length && !broken) console.log('     ✓ 无禁忌用词、无编码损坏');
}
if (fail) { console.log(`\n检查未通过：${fail} 项`); process.exit(1); }
console.log('\n检查通过');
