// 一次性修复脚本：模块头的 #@d 大段说明（在 #%summary 之后、第一条代码之前）
// 统一回到第 0 列，和 #%module / #%summary 对齐 —— 与 C 版的视觉一致。
const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '..', 'resources', 'reference', '02-04-队列', 'modules.py');
const lines = fs.readFileSync(p, 'utf8').split('\n');
const out = lines.slice();
let changed = 0;
let inModule = false;
let inHead = false; // 模块开头、还没遇到代码行
for (let i = 0; i < out.length; i++) {
  const l = out[i];
  if (/^\s*#%module\b/.test(l)) { inModule = true; inHead = true; continue; }
  if (/^\s*#%end\b/.test(l)) { inModule = false; inHead = false; continue; }
  if (!inModule) continue;
  if (l.trim() === '') continue;
  if (/^\s*#/.test(l)) {
    if (inHead && /^\s*#@[sd]\b/.test(l)) {
      const next = l.replace(/^\s*/, '');
      if (next !== l) { changed++; out[i] = next; }
    }
    continue;
  }
  inHead = false; // 遇到第一行真正的代码，模块头结束
}
fs.writeFileSync(p, out.join('\n'), 'utf8');
console.log('拉回第 0 列的模块头标记行 =', changed);
