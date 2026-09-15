// 检查 data/animations/02-02.json 里 null 的性质：是可选字段的空值，还是 NaN 被序列化后的残留
const fs = require('fs');
const j = JSON.parse(fs.readFileSync('data/animations/02-02.json', 'utf8'));
const arr = Array.isArray(j) ? j : (j.scenes || Object.values(j));
const list = Array.isArray(arr) ? arr : [j];

for (const sc of list) {
  if (!sc || !sc.id) continue;
  if (!/01-typedef/.test(sc.id)) continue;
  console.log('=== ' + sc.id + ' ===');
  console.log('leaders: ' + JSON.stringify(sc.leaders));
  console.log('notes 前 3 条: ' + JSON.stringify((sc.notes || []).slice(0, 3)));
  if (sc.freeArrows) console.log('freeArrows: ' + JSON.stringify(sc.freeArrows));
}

// 全库统计：哪些字段出现 null
const counts = {};
function walk(o, path) {
  if (o === null) { counts[path] = (counts[path] || 0) + 1; return; }
  if (Array.isArray(o)) { o.forEach((v, i) => walk(v, path + '[]')); return; }
  if (typeof o === 'object') { for (const k of Object.keys(o)) walk(o[k], path + '.' + k); }
}
walk(list, 'scene');
console.log('');
console.log('=== 所有 null 的字段路径 ===');
for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  console.log('  ' + String(v).padStart(4) + '  ' + k);
}
void arr;
