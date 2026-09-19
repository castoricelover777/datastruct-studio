// 预估 PPTD 文本框是否溢出（中英混排宽度估算）
// 用法：node tools/ppt/lint-width.js ppt/考核汇报 ppt/准备计划
const fs = require('fs');
const path = require('path');

function charWidth(ch) {
  const c = ch.codePointAt(0);
  if (c >= 0x2e80 && c <= 0x9fff) return 1.0;      // CJK 汉字
  if (c >= 0xf900 && c <= 0xfaff) return 1.0;      // 兼容汉字
  if (c >= 0xff00 && c <= 0xff60) return 1.0;      // 全角标点
  if (c >= 0x3000 && c <= 0x303f) return 1.0;      // CJK 标点
  if (c >= 0x2000 && c <= 0x206f) return 1.0;      // 通用标点（— · → 等）
  if (c >= 0x2190 && c <= 0x21ff) return 1.0;      // 箭头
  if (ch === ' ') return 0.28;
  if (ch >= 'A' && ch <= 'Z') return 0.63;
  if (ch >= '0' && ch <= '9') return 0.55;
  if ('ilj.,:;!|I'.includes(ch)) return 0.28;
  if ('ftr()[]{}'.includes(ch)) return 0.35;
  if ('mwMW'.includes(ch)) return 0.86;
  return 0.54;                                     // 其它拉丁小写
}

function textWidth(s, size) {
  let u = 0;
  for (const ch of s) u += charWidth(ch);
  return u * size;
}

function parsePage(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const els = [];
  let cur = null, mode = null;
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    const m = L.match(/^  - elementId: (\S+)/);
    if (m) { if (cur) els.push(cur); cur = { id: m[1], type: null, bounds: [], text: [], size: null, lineHeight: 1.25 }; mode = null; continue; }
    if (!cur) continue;
    if (/^    elementType: /.test(L)) { cur.type = L.split(': ')[1].trim(); continue; }
    if (/^    bounds:/.test(L)) { mode = 'bounds'; continue; }
    if (/^    content:/.test(L)) { mode = 'content'; continue; }
    if (/^      text: \|-/.test(L)) { mode = 'text'; continue; }
    if (/^      fontSize: /.test(L)) { cur.size = parseFloat(L.split(': ')[1]); mode = null; continue; }
    if (/^      lineHeight: /.test(L)) { cur.lineHeight = parseFloat(L.split(': ')[1]); mode = null; continue; }
    if (/^      \w+: /.test(L) || /^    \w+:/.test(L) || /^  - /.test(L)) mode = null;
    if (mode === 'bounds') { const n = L.match(/^      - ([\d.]+)/); if (n) cur.bounds.push(parseFloat(n[1])); }
    else if (mode === 'text') { if (/^        /.test(L)) cur.text.push(L.slice(8)); else mode = null; }
  }
  if (cur) els.push(cur);
  return els;
}

let problems = 0;
const rects = [];
for (const dir of process.argv.slice(2)) {
  const pageDir = path.join(dir, 'pages');
  if (!fs.existsSync(pageDir)) { console.log(`跳过（不存在）：${dir}`); continue; }
  for (const f of fs.readdirSync(pageDir).sort()) {
    if (!f.endsWith('.page')) continue;
    const els = parsePage(path.join(pageDir, f));
    for (const e of els) {
      if (!e.bounds.length) continue;
      const [x, y, w, h] = e.bounds;
      if (e.type === 'text' && e.size) {
        for (const line of e.text) {
          const need = textWidth(line, e.size);
          if (need > w + 1) {
            problems++;
            console.log(`溢出 ${dir}/${f} ${e.id}  需要 ${need.toFixed(0)}pt / 框宽 ${w}pt  「${line.slice(0, 34)}」`);
          }
        }
        const needH = e.text.length * e.size * e.lineHeight;
        if (needH > h + 6) {
          problems++;
          console.log(`过高 ${dir}/${f} ${e.id}  需要 ${needH.toFixed(0)}pt / 框高 ${h}pt  「${e.text[0].slice(0, 24)}」`);
        }
      }
      rects.push({ key: `${dir}/${f}`, id: e.id, type: e.type, x, y, w, h });
    }
    // 文本重叠检查（同页、同类可见元素）
    const texts = rects.filter((r) => r.key === `${dir}/${f}` && r.type === 'text');
    const others = rects.filter((r) => r.key === `${dir}/${f}` && r.type !== 'line');
    for (const a of texts) {
      for (const b of others) {
        if (a === b || a.id === b.id) continue;
        const ov = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ov > 6 && oy > 6) {
          problems++;
          console.log(`重叠 ${a.key} ${a.id}(${a.type}) 与 ${b.id}(${b.type})  横向 ${ov}pt 纵向 ${oy}pt`);
        }
      }
    }
  }
}
console.log(problems === 0 ? '版面检查：全部通过' : `版面检查：${problems} 处待修`);
