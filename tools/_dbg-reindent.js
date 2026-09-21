// 一次性修复脚本：把 #@s / #@d 标记行按它描述的代码缩进对齐（写完即删）
// 规则：标记行紧邻的下一条代码行的缩进就是它该有的缩进；
//       连续多行标记行用同一个缩进（这一组标记描述同一段代码）。
const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '..', 'resources', 'reference', '02-04-队列', 'modules.py');
const lines = fs.readFileSync(p, 'utf8').split('\n');
const isMarker = (l) => /^\s*#@[sd]\b/.test(l);
const isCommentish = (l) => l.trim() === '' || /^\s*#/.test(l);

const out = lines.slice();
let i = 0;
let changed = 0;
while (i < out.length) {
  if (!isMarker(out[i])) { i++; continue; }
  const start = i;
  while (i < out.length && isMarker(out[i])) i++;
  // 这一组标记紧邻的下一条代码行
  let j = i;
  while (j < out.length && isCommentish(out[j])) j++;
  const code = out[j] || '';
  let target = code.length - code.trimStart().length;
  if (target === 0) target = 0;
  for (let k = start; k < i; k++) {
    const body = out[k].replace(/^\s*/, '');
    const next = ' '.repeat(target) + body;
    if (next !== out[k]) changed++;
    out[k] = next;
  }
}
fs.writeFileSync(p, out.join('\n'), 'utf8');
console.log('已调整缩进的标记行数 =', changed);
