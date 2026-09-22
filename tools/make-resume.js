#!/usr/bin/env node
'use strict';
/**
 * 生成简历 .docx（零依赖，手工拼 OOXML）
 *
 *   node tools/make-resume.js <内容.txt> <输出.docx> "<文档标题>"
 *
 * 内容格式（就是普通文本，按行首标记决定样式）：
 *   # 名字           → 姓名（大号，居中）
 *   ## 小节名        → 小标题（带下划线分隔线）
 *   - 内容           → 项目符号
 *   | 内容           → 缩进一点（用于小标题下面的说明）
 *   （空行）         → 空一行
 *   其它             → 正文
 *
 * 为什么手写 OOXML 而不用库：项目里一个 npm 依赖都不想加，
 * 而且 WPS / Word 对这个格式的兼容性最好。
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---------------- 极简 zip 写入（store + deflate 两种都支持，这里用 deflate） ----------------
function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function zip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const f of files) {
    const nameBuf = Buffer.from(f.name, 'utf8');
    const data = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data, 'utf8');
    const comp = zlib.deflateRawSync(data, { level: 9 });
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);          // version needed
    local.writeUInt16LE(0x0800, 6);      // UTF-8 flag
    local.writeUInt16LE(8, 8);           // deflate
    local.writeUInt16LE(0, 10);          // time
    local.writeUInt16LE(0x21, 12);       // date (1980-01-01 附近，无所谓)
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBuf, comp);

    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt16LE(8, 10);
    cen.writeUInt16LE(0, 12);
    cen.writeUInt16LE(0x21, 14);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(comp.length, 20);
    cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(nameBuf.length, 28);
    cen.writeUInt16LE(0, 30);
    cen.writeUInt16LE(0, 32);
    cen.writeUInt16LE(0, 34);
    cen.writeUInt16LE(0, 36);
    cen.writeUInt32LE(0, 38);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, nameBuf);

    offset += 30 + nameBuf.length + comp.length;
  }

  const cenBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cenBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...chunks, cenBuf, end]);
}

// ---------------- OOXML ----------------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const FONT = '微软雅黑';

/** 一个段落。sz 是半磅（21 = 10.5pt）；bold / center / spacing 等按需 */
function para(text, o = {}) {
  const sz = o.sz || 21;
  const rPr = `<w:rPr><w:rFonts w:ascii="${FONT}" w:eastAsia="${FONT}" w:hAnsi="${FONT}"/>`
    + (o.bold ? '<w:b/>' : '')
    + (o.color ? `<w:color w:val="${o.color}"/>` : '')
    + `<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr>`;
  const pPr = '<w:pPr>'
    + (o.center ? '<w:jc w:val="center"/>' : '')
    + (o.indent ? `<w:ind w:left="${o.indent}"/>` : '')
    + `<w:spacing w:before="${o.before == null ? 0 : o.before}" w:after="${o.after == null ? 60 : o.after}" w:line="${o.line || 260}" w:lineRule="auto"/>`
    + (o.border ? '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="2" w:color="888888"/></w:pBdr>' : '')
    + (o.shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>` : '')
    + '</w:pPr>';
  const runs = String(text).split('\n').map((line, i) =>
    (i ? '<w:r><w:br/></w:r>' : '') + `<w:r>${rPr}<w:t xml:space="preserve">${esc(line)}</w:t></w:r>`
  ).join('');
  return `<w:p>${pPr}${runs}</w:p>`;
}

/** 项目符号段落（用符号字符实现，避免依赖 numbering.xml） */
function bullet(text, o = {}) {
  return para('· ' + text, { ...o, indent: o.indent || 260 });
}

// ---------------- 内容解析 ----------------
function build(content) {
  const out = [];
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (line.trim() === '') { out.push(para('', { sz: 8, after: 0 })); continue; }
    if (line.startsWith('# ')) {
      out.push(para(line.slice(2), { sz: 40, bold: true, center: true, after: 40 }));
    } else if (line.startsWith('## ')) {
      out.push(para(line.slice(3), { sz: 24, bold: true, before: 200, after: 90, border: true, color: '1F3864' }));
    } else if (line.startsWith('### ')) {
      out.push(para(line.slice(4), { sz: 22, bold: true, before: 120, after: 40 }));
    } else if (line.startsWith('- ')) {
      out.push(bullet(line.slice(2)));
    } else if (line.startsWith('| ')) {
      out.push(para(line.slice(2), { indent: 460, sz: 19, color: '555555', after: 40 }));
    } else {
      out.push(para(line));
    }
  }
  return out.join('');
}

// ---------------- main ----------------
const [inFile, outFile, title] = process.argv.slice(2);
if (!inFile || !outFile) {
  console.error('用法: node tools/make-resume.js <内容.txt> <输出.docx> "<标题>"');
  process.exit(1);
}
const content = fs.readFileSync(inFile, 'utf8');

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
${build(content)}
<w:sectPr>
  <w:pgSz w:w="11906" w:h="16838"/>
  <w:pgMar w:top="1000" w:right="1100" w:bottom="1000" w:left="1100" w:header="720" w:footer="720" w:gutter="0"/>
</w:sectPr>
</w:body>
</w:document>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr>
<w:rFonts w:ascii="${FONT}" w:eastAsia="${FONT}" w:hAnsi="${FONT}"/><w:sz w:val="21"/><w:szCs w:val="21"/>
</w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
</w:styles>`;

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>${esc(title || path.basename(outFile))}</dc:title>
<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;

const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
<Application>DataStruct Studio</Application>
</Properties>`;

const buf = zip([
  { name: '[Content_Types].xml', data: contentTypes },
  { name: '_rels/.rels', data: rels },
  { name: 'word/document.xml', data: documentXml },
  { name: 'word/styles.xml', data: stylesXml },
  { name: 'word/_rels/document.xml.rels', data: docRels },
  { name: 'docProps/core.xml', data: coreXml },
  { name: 'docProps/app.xml', data: appXml },
]);

fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
fs.writeFileSync(outFile, buf);
console.log(`  已生成 ${outFile}  ${buf.length} 字节`);
