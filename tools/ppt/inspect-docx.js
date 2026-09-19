// 看原 docx 用了什么字体字号，好照着复刻
const fs = require('fs');
const zlib = require('zlib');

function entries(file) {
  const b = fs.readFileSync(file);
  const out = {};
  for (let i = 0; i + 30 < b.length; i++) {
    if (b[i] !== 0x50 || b[i + 1] !== 0x4b || b[i + 2] !== 0x03 || b[i + 3] !== 0x04) continue;
    const method = b.readUInt16LE(i + 8);
    const compSize = b.readUInt32LE(i + 18);
    const nameLen = b.readUInt16LE(i + 26);
    const extraLen = b.readUInt16LE(i + 28);
    const name = b.slice(i + 30, i + 30 + nameLen).toString('utf8');
    const dataStart = i + 30 + nameLen + extraLen;
    if (compSize === 0) { i = dataStart; continue; }
    const raw = b.slice(dataStart, dataStart + compSize);
    try { out[name] = (method === 8 ? zlib.inflateRawSync(raw) : raw).toString('utf8'); } catch {}
    i = dataStart + compSize - 1;
  }
  return out;
}

const e = entries(process.argv[2]);
console.log('=== 条目 ===');
console.log('  ' + Object.keys(e).join('\n  '));

console.log('\n=== core.xml（作者信息）===');
console.log(e['docProps/core.xml'] || '(无)');

console.log('\n=== document.xml 里的字体/字号 ===');
const doc = e['word/document.xml'] || '';
const fonts = [...new Set([...doc.matchAll(/w:ascii="([^"]+)"/g)].map((m) => m[1]))];
const eas = [...new Set([...doc.matchAll(/w:eastAsia="([^"]+)"/g)].map((m) => m[1]))];
const sizes = [...new Set([...doc.matchAll(/<w:sz w:val="(\d+)"/g)].map((m) => m[1]))];
console.log('  西文字体:', fonts.join(', ') || '(无，走默认)');
console.log('  中文字体:', eas.join(', ') || '(无，走默认)');
console.log('  字号(half-point):', sizes.join(', ') || '(无)');
console.log('  段落数:', (doc.match(/<w:p[ >]/g) || []).length);
console.log('  Tab 使用:', (doc.match(/<w:tab\/>/g) || []).length);

console.log('\n=== styles.xml 里的样式名 ===');
const st = e['word/styles.xml'] || '';
console.log('  ' + [...new Set([...st.matchAll(/w:styleId="([^"]+)"/g)].map((m) => m[1]))].join(', '));
