// 从 .docx 提取正文文本（解 zip 里的 word/document.xml，保留段落）
const fs = require('fs');
const zlib = require('zlib');

function docxText(file) {
  const b = fs.readFileSync(file);
  const parts = [];
  for (let i = 0; i + 30 < b.length; i++) {
    if (b[i] !== 0x50 || b[i + 1] !== 0x4b || b[i + 2] !== 0x03 || b[i + 3] !== 0x04) continue;
    const method = b.readUInt16LE(i + 8);
    const compSize = b.readUInt32LE(i + 18);
    const nameLen = b.readUInt16LE(i + 26);
    const extraLen = b.readUInt16LE(i + 28);
    const name = b.slice(i + 30, i + 30 + nameLen).toString('utf8');
    const dataStart = i + 30 + nameLen + extraLen;
    if (compSize === 0 || name !== 'word/document.xml') { i = dataStart; continue; }
    const raw = b.slice(dataStart, dataStart + compSize);
    try {
      parts.push((method === 8 ? zlib.inflateRawSync(raw) : raw).toString('utf8'));
    } catch { /* skip */ }
    i = dataStart + compSize - 1;
  }
  if (!parts.length) return null;
  let xml = parts.join('');
  // 表格单元格与段落都当换行处理
  xml = xml.replace(/<w:tab\/>/g, '\t').replace(/<w:br\/>/g, '\n');
  xml = xml.replace(/<\/w:p>/g, '\n').replace(/<\/w:tc>/g, ' | ').replace(/<\/w:tr>/g, '\n');
  const texts = [...xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((m) => m[1]);
  // 逐段重建：按 </w:p> 分段
  const segs = xml.split('\n');
  const out = [];
  for (const seg of segs) {
    const t = [...seg.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((m) => m[1]).join('')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    if (t.trim() || out.length) out.push(t);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

for (const f of process.argv.slice(2)) {
  console.log('='.repeat(70));
  console.log('文件: ' + f);
  console.log('='.repeat(70));
  const t = docxText(f);
  console.log(t === null ? '（解析失败，可能不是 docx）' : t);
  console.log('');
}
