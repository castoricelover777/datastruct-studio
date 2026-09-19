// 校验 PPTX 里确实含新生版文案（用 zlib 手工解析 zip 的 deflate 条目）
const fs = require('fs');
const zlib = require('zlib');

function readZip(file) {
  const b = fs.readFileSync(file);
  const parts = [];
  // 顺序扫描本地文件头 PK\x03\x04
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
      const out = method === 8 ? zlib.inflateRawSync(raw) : raw;
      parts.push(out.toString('utf8'));
    } catch { /* 跳过 */ }
    i = dataStart + compSize - 1;
  }
  return parts.join('');
}

const KEYS = ['大一', '开学第二周', '开学第五天', '还没上到', '项目让我入门', '我踩过的坑'];
for (const f of process.argv.slice(2)) {
  const all = readZip(f);
  const hit = KEYS.filter((k) => all.includes(k));
  const bad = ['我的强项', '关键设计决策', '验收标准'].filter((k) => all.includes(k));
  console.log(`  ${f.split(/[\\/]/).pop()}  长度 ${all.length}`);
  console.log(`     命中新生版关键词: ${hit.length ? hit.join('、') : '（无）'}`);
  console.log(`     残留旧措辞: ${bad.length ? '⚠ ' + bad.join('、') : '无'}`);
}
