// PPT 画法公共模块 —— 设计系统：dsh-engineering-blueprint
// 纸张底 #F0EAE0 / 墨 #252824 / 强调 #B5392A
// 版心：960×540，外边距 48，右边界 912
const fs = require('fs');

const W = 960, H = 540, ML = 48, MR = 912;
const GRID_X0 = 48, GRID_X1 = 665, GRID_Y0 = 150, GRID_Y1 = 460, STEP = 24;
const C = {
  ink: '#252824', mut: '#62625c', soft: '#b3b0a8', red: '#B5392A',
  box: '#E7E0D4', band: '#ead7cc', paper: '#F0EAE0', grid: '#e3ddd4', rule: '#ded8ce',
};

const FONTS = `      fontFamily: &ff\n        latin: Arial\n        mac: PingFang SC\n        win: Microsoft YaHei\n        ea: Noto Sans CJK SC\n`;
const FONTS_REF = `      fontFamily: *ff\n`;
// notes 必须单行，否则 YAML 解析错位
const oneLine = (s) => String(s).replace(/\s+/g, ' ').trim();

// 每类元素用独立计数器，避免跨类撞 ID
const ctr = { t: 0, s: 0, l: 0, g: 0 };
const next = (k) => `${k}${++ctr[k]}`;
const reset = () => { ctr.t = 0; ctr.s = 0; ctr.l = 0; ctr.g = 0; };

// 背景装饰网格
function grid() {
  const out = [];
  for (let x = GRID_X0; x <= GRID_X1; x += STEP) {
    out.push(`  - elementId: ${next('g')}\n    elementType: line\n    bounds:\n      - ${x}\n      - ${GRID_Y0}\n      - 1\n      - ${GRID_Y1 - GRID_Y0}\n    viewBox:\n      - 1\n      - ${GRID_Y1 - GRID_Y0}\n    points: 0,0 0,${GRID_Y1 - GRID_Y0}\n    border:\n      width: 0.35\n      color: '${C.grid}'`);
  }
  for (let y = GRID_Y0; y <= GRID_Y1; y += STEP) {
    out.push(`  - elementId: ${next('g')}\n    elementType: line\n    bounds:\n      - ${GRID_X0}\n      - ${y}\n      - ${GRID_X1 - GRID_X0}\n      - 1\n    viewBox:\n      - ${GRID_X1 - GRID_X0}\n      - 1\n    points: 0,0 ${GRID_X1 - GRID_X0},0\n    border:\n      width: 0.35\n      color: '${C.grid}'`);
  }
  return out;
}

function txt(x, y, w, h, text, o = {}) {
  const lines = String(text).split('\n').map((s) => `        ${s}`).join('\n');
  let s = `  - elementId: ${next('t')}\n    elementType: text\n    bounds:\n      - ${x}\n      - ${y}\n      - ${w}\n      - ${h}\n    content:\n      text: |-\n${lines}\n`;
  s += o.first ? FONTS : FONTS_REF;
  s += `      fontSize: ${o.size || 18}\n      lineHeight: ${o.lh || 1.25}\n      color: '${o.color || C.ink}'\n      bold: ${o.bold ? 'true' : 'false'}\n`;
  if (o.align) s += `      align: ${o.align}\n`;
  if (o.ls) s += `      letterSpacing: ${o.ls}\n`;
  return s;
}

function rect(x, y, w, h, o = {}) {
  let s = `  - elementId: ${next('s')}\n    elementType: shape\n    bounds:\n      - ${x}\n      - ${y}\n      - ${w}\n      - ${h}\n    shapeName: ${o.shape || 'rect'}\n    fill:\n      type: solid\n      color: '${o.fill || C.box}'\n`;
  if (o.stroke !== null) s += `    border:\n      color: '${o.stroke || '#68665F'}'\n      width: ${o.sw || 0.7}\n`;
  return s;
}

function line(x, y, w, h, o = {}) {
  return `  - elementId: ${next('l')}\n    elementType: line\n    bounds:\n      - ${x}\n      - ${y}\n      - ${w}\n      - ${h}\n    viewBox:\n      - ${w}\n      - ${h}\n    points: ${o.points || `0,0 ${w},0`}\n    border:\n      color: '${o.color || C.soft}'\n      width: ${o.width || 0.6}\n`;
}
const hline = (x, y, w, o = {}) => line(x, y, w, 1, { points: `0,0 ${w},0`, ...o });
const vline = (x, y, h, o = {}) => line(x, y, 1, h, { points: `0,0 0,${h}`, ...o });

// 通用内容页：页眉 + 标题 + 网格 + 正文 + 页脚
function contentPage(pageNo, kicker, title, body, notes) {
  reset();
  const els = [];
  els.push(...grid());                                   // 网格最先绘制，避免遮挡正文
  // kicker 为空就不画（真人做 PPT 不会每页都顶一行英文小标题）
  if (kicker) els.push(txt(ML, 27, 665, 20, kicker, { size: 10, color: C.mut, ls: 1.2 }));
  els.push(hline(ML, 50, 864, { color: '#68665F' }));
  els.push(txt(754, 46, 158, 13, String(pageNo).padStart(2, '0'), { size: 9, color: C.mut, align: 'right', first: true }));
  els.push(txt(ML, 76, 864, 64, title, { size: 32, bold: true }));
  els.push(...body);
  els.push(txt(ML, 505, 760, 16, '数据结构研习社 · 研究所入所第一次考核', { size: 9, color: C.mut }));
  els.push(txt(860, 504, 48, 18, String(pageNo).padStart(2, '0'), { size: 11, color: C.ink }));
  return `pageType: content\nbackground:\n  type: solid\n  color: '${C.paper}'\nnotes: ${oneLine(notes)}\nelements:\n${els.join('\n')}\n`;
}

// 封面页
function coverPage({ kicker, title, bigLines, subLines, footer, boxes, pageNo = '01', notes }) {
  reset();
  const els = [];
  if (kicker) els.push(txt(ML, 24, 700, 18, kicker, { size: 10, color: '#68665F', ls: 1.2, first: true }));
  els.push(hline(ML, 50, 864, { color: '#68665F' }));
  els.push(txt(ML, 68, 864, 64, title, kicker ? { size: 31, bold: true } : { size: 31, bold: true, first: true }));
  els.push(txt(ML, 505, 760, 16, footer, { size: 9, color: '#68665F' }));
  els.push(txt(860, 504, 48, 18, pageNo, { size: 11, color: C.ink }));
  els.push(txt(ML, 168, 480, 180, bigLines, { size: 64, bold: true, lh: 1.15 }));
  els.push(txt(52, 366, 460, 90, subLines, { size: 23, color: '#68665F', lh: 1.3 }));
  // 右侧装饰网格
  for (let x = 565; x <= 905; x += 49) els.push(vline(x, 140, 315, { color: '#d8d2c8', width: 0.25 }));
  for (let y = 140; y <= 455; y += 45) els.push(hline(565, y, 340, { color: '#d8d2c8', width: 0.25 }));
  for (let x = 560; x <= 900; x += 48) els.push(rect(x, 148, 1, 298, { fill: C.soft, stroke: null }));
  for (let y = 148; y <= 436; y += 48) els.push(rect(560, y, 340, 1, { fill: C.soft, stroke: null }));
  boxes.forEach(([bx, by, label, size], i) => {
    const fill = i === 2 ? C.red : C.paper;
    els.push(rect(bx, by, 228, 48, { fill, stroke: i === 2 ? null : '#68665F' }));
    els.push(txt(bx + 6, by + 13, 216, 26, label, { size: size || 16, align: 'center', color: i === 2 ? C.paper : C.ink }));
  });
  return `pageType: cover\nbackground:\n  type: solid\n  color: '${C.paper}'\nnotes: ${oneLine(notes)}\nelements:\n${els.join('\n')}\n`;
}

function writeDeck(outDir, title, pages) {
  fs.mkdirSync(`${outDir}/pages`, { recursive: true });
  const list = pages.map((_, i) => `  - pages/${String(i + 1).padStart(2, '0')}.page`).join('\n');
  fs.writeFileSync(`${outDir}/deck.pptd`,
    `version: v2\ntitle: ${title}\nsize:\n  - 960\n  - 540\ntemplate:\n  id: dsh-engineering-blueprint\n  name: Engineering Blueprint\npages:\n${list}\n`, 'utf8');
  pages.forEach((c, i) => fs.writeFileSync(`${outDir}/pages/${String(i + 1).padStart(2, '0')}.page`, c, 'utf8'));
  return pages.length;
}

module.exports = { C, ML, MR, W, H, txt, rect, line, hline, vline, grid, contentPage, coverPage, writeDeck, reset };
