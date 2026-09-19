#!/usr/bin/env node
'use strict';
/**
 * 把纯文本 PDR 转成 .docx（不依赖任何第三方库）
 *   node tools/ppt/txt2docx.js <输入.txt> <输出.docx> [标题]
 *
 * 排版规则：
 *   · 以 === 结尾的下一行 → 居中加粗小标题
 *   · 以 · 或数字序号开头 → 正文（首行不缩进）
 *   · 其余 → 正文
 *   · 含制表符/框线字符(─│┌└━●)的行 → 等宽字体，保证 ASCII 图对齐
 */
const fs = require('fs');
const zlib = require('zlib');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const MONO_CHARS = /[─│┌┐└┘├┤┬┴┼━●→↓↑←⇄↺▶⏸⏮⏭○◆]/;

function para(text, opts) {
  const { mono = false, center = false, bold = false, size = 21 } = opts || {};
  if (text === '') return '<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr></w:p>';
  const rpr = [];
  rpr.push(`<w:rFonts w:ascii="${mono ? 'Consolas' : 'Times New Roman'}" w:hAnsi="${mono ? 'Consolas' : 'Times New Roman'}" w:eastAsia="${mono ? '宋体' : '宋体'}"/>`);
  if (bold) rpr.push('<w:b/>');
  rpr.push(`<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`);
  const ppr = [];
  if (center) ppr.push('<w:jc w:val="center"/>');
  ppr.push('<w:spacing w:before="0" w:after="0" w:line="300" w:lineRule="auto"/>');
  ppr.push('<w:ind w:firstLine="0"/>');
  return `<w:p><w:pPr>${ppr.join('')}</w:pPr><w:r><w:rPr>${rpr.join('')}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function build(srcText, title) {
  const lines = srcText.replace(/\r\n/g, '\n').split('\n');
  const body = [];
  // 标题识别：文档第一行是题目；「一、二、」是一级；「4.1」是二级
  const isH1 = (l, i) => i === 0 && l.trim().length > 0;
  const isH2 = (l) => /^[一二三四五六七八九十]+、/.test(l.trim());
  const isH3 = (l) => /^\d+\.\d+\s/.test(l.trim());
  let firstDone = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\s+$/, '');
    const next = (lines[i + 1] || '').trim();
    // 兼容老格式：下一行是 === 分隔线 → 当前行是标题
    if (/^=+$/.test(next) && line.trim()) {
      body.push(para(line.trim(), { center: true, bold: true, size: 24 }));
      i++;
      continue;
    }
    if (/^=+$/.test(line.trim())) continue;
    if (isH1(line, i) && !firstDone) {
      firstDone = true;
      body.push(para(line.trim(), { center: true, bold: true, size: 30 }));
      continue;
    }
    if (isH2(line)) { body.push(para(line.trim(), { center: true, bold: true, size: 22 })); continue; }
    if (isH3(line)) { body.push(para(line.trim(), { bold: true, size: 18 })); continue; }
    const mono = MONO_CHARS.test(line);
    body.push(para(line, { mono, size: mono ? 19 : 21 }));
  }
  const documentXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
    `<w:body>${body.join('')}` +
    `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>` +
    `<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>` +
    `</w:body></w:document>`;

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
    `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>` +
    `</Types>`;

  const rels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>` +
    `</Relationships>`;

  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const core =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ` +
    `xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" ` +
    `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
    `<dc:title>${esc(title)}</dc:title>` +
    `<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>` +
    `<dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>` +
    `</cp:coreProperties>`;

  return { documentXml, contentTypes, rels, core };
}

// ---- 极简 zip 写入（store 方式，不压缩；Word 完全接受） ----
function crc32(buf) {
  let c, crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xFF;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function zip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const [name, content] of files) {
    const data = Buffer.from(content, 'utf8');
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);      // store
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBuf, data);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(data.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);
    offset += local.length + nameBuf.length + data.length;
  }
  const cdBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cdBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...chunks, cdBuf, end]);
}

const [src, out, title] = process.argv.slice(2);
if (!src || !out) {
  console.error('用法: node tools/ppt/txt2docx.js <输入.txt> <输出.docx> [标题]');
  process.exit(1);
}
const text = fs.readFileSync(src, 'utf8');
const { documentXml, contentTypes, rels, core } = build(text, title || 'PDR');
const buf = zip([
  ['[Content_Types].xml', contentTypes],
  ['_rels/.rels', rels],
  ['docProps/core.xml', core],
  ['word/document.xml', documentXml],
]);
fs.writeFileSync(out, buf);
console.log(`已生成 ${out}  ${buf.length} 字节`);
