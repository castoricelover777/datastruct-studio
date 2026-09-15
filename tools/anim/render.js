'use strict';
/**
 * LinkList Studio —— 模块演示动画的渲染核心
 * ---------------------------------------------------------------------------
 * 输出「内联 SMIL 的动画 SVG」。选 SMIL 而不是 CSS keyframes 的原因：
 *
 *   1. GitHub README 里用 <img src="*.svg"> 引用时，SVG 内的 SMIL 会正常播放
 *      （而 JS 不会执行），所以动画必须完全由声明式动画构成；
 *   2. 每个元素把自己的时间轴写在身上，26 个动画不用互相协调全局 CSS；
 *   3. 验证时可以用 svg.setCurrentTime(t) 精确跳到任意时刻截图，逐帧核对。
 *
 * 一个"场景" = 一条链表 + 一组带可见时间段的元素 + 若干步骤字幕。
 */

// ---------------------------------------------------------------------------
// 视觉系统
// ---------------------------------------------------------------------------
const PAL = {
  bg: '#FFFFFF',
  ink: '#1F2328',
  dim: '#6E7781',
  faint: '#D8DEE4',
  line: '#D0D7DE',
  nodeFill: '#FFFFFF',
  headFill: '#F1F3F5',
  headStroke: '#AFB8C1',
  slotEmpty: '#F6F8FA',
  blue: '#3B82F6',
  blueSoft: '#EAF2FE',
  green: '#10B981',
  greenSoft: '#E7F7F1',
  red: '#EF4444',
  redSoft: '#FDECEC',
  amber: '#D29922',
  codeBg: '#F6F8FA',
};

const FONT = "'Segoe UI','Microsoft YaHei UI','PingFang SC',system-ui,sans-serif";
const MONO = "ui-monospace,'Cascadia Code','JetBrains Mono',Consolas,monospace";

// 画布
const W = 960;
const H = 340;

// 链表几何
const NODE_Y = 96;
const NODE_H = 46;
const MID_Y = NODE_Y + NODE_H / 2;        // 结点竖直中心
const NEXT_Y = MID_Y - 9;                 // next 指针通道
const PRIOR_Y = MID_Y + 9;                // prior 指针通道
const PAD_X = 36;                         // 左右内边距

// 结点尺寸
const SIZE = {
  singly: { nodeW: 68, dataW: 34, ptrW: 34, gap: 48 },
  doubly: { nodeW: 96, priorW: 28, dataW: 40, nextW: 28, gap: 44 },
};

// 数组（格子阵列）几何 —— 顺序表 / 栈 / 队列 / 复杂度计数都用它
const CELL_W = 58;
const CELL_H = 46;
const CELL_GAP = 2;
const CELL_Y = 104;

// 顶部标题与底部字幕
const TITLE_Y = 40;
const SUB_Y = 63;
const CAPTION_Y = 250;
const CODE_Y = 276;
const BAR_Y = 308;

// ---------------------------------------------------------------------------
// 小工具
// ---------------------------------------------------------------------------
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 生成"按时间段可见"的 SMIL opacity 动画 */
function animOpacity(ranges, total, fade = 0.14) {
  if (!ranges || ranges.length === 0) return '<animate attributeName="opacity" values="0" dur="1s"/>';
  const pts = [];
  for (const [s, e] of ranges) {
    const a = Math.max(0, s - fade);
    const b = Math.max(a, e - fade);
    pts.push([a, 0], [Math.max(a, s), 1], [b, 1], [e, 0]);
  }
  pts.sort((x, y) => x[0] - y[0]);
  // 同一时刻只保留一个值；并保证时间严格递增
  const seq = [];
  for (const [t, v] of pts) {
    if (seq.length && t <= seq[seq.length - 1][0] + 1e-6) {
      seq[seq.length - 1][1] = Math.max(seq[seq.length - 1][1], v);
      continue;
    }
    seq.push([t, v]);
  }
  if (seq[0][0] > 0) seq.unshift([0, 0]);
  if (seq[seq.length - 1][0] < total) seq.push([total, 0]);

  const values = seq.map((p) => p[1]).join(';');
  const keyTimes = seq.map((p) => (p[0] / total).toFixed(4)).join(';');
  return `<animate attributeName="opacity" values="${values}" keyTimes="${keyTimes}" `
    + `dur="${total}s" repeatCount="indefinite" calcMode="linear"/>`;
}

/** 只在某个时刻附近发生一次的位移动画（用于新结点上浮） */
function animRise(at, total, dist = 16) {
  const t0 = Math.max(0, (at - 0.18) / total).toFixed(4);
  const t1 = Math.max(0.0001, at / total).toFixed(4);
  return `<animateTransform attributeName="transform" type="translate" `
    + `values="0 ${dist};0 0;0 0" keyTimes="0;${t1};1" dur="${total}s" `
    + `repeatCount="indefinite" calcMode="linear"/>`;
}

/** 线条"生长"效果：dashoffset 从满长回到 0 */
function animGrow(len, at, total, grow = 0.34) {
  const k0 = Math.max(0, (at - 0.02) / total).toFixed(4);
  const k1 = Math.min(1, (at + grow) / total).toFixed(4);
  return `<animate attributeName="stroke-dashoffset" `
    + `values="${len};${len};0;0;${len}" keyTimes="0;${k0};${k1};0.999;1" `
    + `dur="${total}s" repeatCount="indefinite" calcMode="linear"/>`;
}

// ---------------------------------------------------------------------------
// 几何
// ---------------------------------------------------------------------------
function layout(variant, slotCount) {
  const s = SIZE[variant];
  const total = slotCount * s.nodeW + (slotCount - 1) * s.gap;
  const left = Math.max(PAD_X, (W - total) / 2);
  return {
    ...s,
    left,
    x(slot) { return left + slot * (s.nodeW + s.gap); },
    right(slot) { return left + slot * (s.nodeW + s.gap) + s.nodeW; },
  };
}

// ---------------------------------------------------------------------------
// 元素渲染
// ---------------------------------------------------------------------------

/** 一个链表结点 */
function renderNode(node, geo, variant, total) {
  const x = geo.x(node.slot);
  const y = NODE_Y;
  const isHead = node.role === 'head';
  const accent = node.accent || null;
  const stroke = accent === 'new' ? PAL.green : accent === 'del' ? PAL.red : isHead ? PAL.headStroke : PAL.line;
  const fill = isHead ? PAL.headFill : accent === 'new' ? PAL.greenSoft : accent === 'del' ? PAL.redSoft : PAL.nodeFill;
  const parts = [];

  const g = [];
  g.push(`<rect x="${x}" y="${y}" width="${geo.nodeW}" height="${NODE_H}" rx="8" `
    + `fill="${fill}" stroke="${stroke}" stroke-width="${accent ? 2 : 1.2}"`
    + `${isHead ? ' stroke-dasharray="4 3"' : ''}/>`);

  if (variant === 'singly') {
    const sep = x + geo.dataW;
    g.push(`<line x1="${sep}" y1="${y}" x2="${sep}" y2="${y + NODE_H}" stroke="${PAL.line}" stroke-width="1"/>`);
    // 数据格
    if (isHead) {
      g.push(`<line x1="${x + 6}" y1="${y + NODE_H - 8}" x2="${x + geo.dataW - 6}" y2="${y + 8}" stroke="${PAL.faint}" stroke-width="1.4"/>`);
    } else {
      g.push(`<text x="${x + geo.dataW / 2}" y="${y + NODE_H / 2 + 5.5}" text-anchor="middle" `
        + `font-family="${MONO}" font-size="15" fill="${PAL.ink}">${esc(node.value ?? '')}</text>`);
    }
    // 指针域圆点
    g.push(`<circle cx="${x + geo.dataW + geo.ptrW / 2}" cy="${y + NODE_H / 2}" r="3.6" fill="${PAL.blue}"/>`);
  } else {
    const s1 = x + geo.priorW;
    const s2 = x + geo.priorW + geo.dataW;
    g.push(`<line x1="${s1}" y1="${y}" x2="${s1}" y2="${y + NODE_H}" stroke="${PAL.line}" stroke-width="1"/>`);
    g.push(`<line x1="${s2}" y1="${y}" x2="${s2}" y2="${y + NODE_H}" stroke="${PAL.line}" stroke-width="1"/>`);
    if (isHead) {
      g.push(`<line x1="${s1 + 5}" y1="${y + NODE_H - 7}" x2="${s2 - 5}" y2="${y + 7}" stroke="${PAL.faint}" stroke-width="1.4"/>`);
    } else {
      g.push(`<text x="${s1 + geo.dataW / 2}" y="${y + NODE_H / 2 + 5.5}" text-anchor="middle" `
        + `font-family="${MONO}" font-size="15" fill="${PAL.ink}">${esc(node.value ?? '')}</text>`);
    }
    g.push(`<circle cx="${x + geo.priorW / 2}" cy="${y + NODE_H / 2}" r="3.4" fill="${PAL.blue}" opacity="0.85"/>`);
    g.push(`<circle cx="${x + geo.nodeW - geo.nextW / 2}" cy="${y + NODE_H / 2}" r="3.6" fill="${PAL.blue}"/>`);
  }

  // 结点下方的名字（head / L / p）
  if (node.tag) {
    g.push(`<text x="${x + geo.nodeW / 2}" y="${y + NODE_H + 17}" text-anchor="middle" `
      + `font-family="${MONO}" font-size="11.5" fill="${PAL.dim}">${esc(node.tag)}</text>`);
  }

  const anims = [];
  anims.push(animOpacity(node.vis, total));
  if (node.rise != null) anims.push(animRise(node.rise, total));

  parts.push(`<g opacity="0">${anims.join('')}${g.join('')}</g>`);
  return parts.join('');
}

/** 指针域的圆点位置（箭头要从这里出发，才看得出"指针在结点里"） */
function ptrAnchor(geo, slot, variant, kind) {
  if (variant === 'doubly') {
    return kind === 'prior'
      ? geo.x(slot) + geo.priorW / 2
      : geo.x(slot) + geo.nodeW - geo.nextW / 2;
  }
  return geo.x(slot) + geo.dataW + geo.ptrW / 2;
}

/** 指针箭头：从 from 结点的 next/prior 通道指向 to 结点（参数是槽位号） */
function renderArrow(arrow, geo, variant, total) {
  const y = arrow.kind === 'prior' ? PRIOR_Y : NEXT_Y;
  let x1;
  let x2;
  if (arrow.kind === 'prior') {
    // 右结点的 prior 圆点 → 左结点的右边缘（方向朝左）
    x1 = ptrAnchor(geo, arrow.fromSlot, variant, 'prior');
    x2 = geo.right(arrow.toSlot);
  } else {
    // 左结点的 next 圆点 → 右结点的左边缘
    x1 = ptrAnchor(geo, arrow.fromSlot, variant, 'next');
    x2 = geo.x(arrow.toSlot);
  }
  const dir = x2 > x1 ? 1 : -1;
  const len = Math.abs(x2 - x1);
  const head = 7;
  const lineEnd = x2 - dir * head;
  const color = arrow.accent === 'new' ? PAL.green : arrow.accent === 'del' ? PAL.red : PAL.blue;
  const grows = arrow.at > 0.05;   // at≈0 表示"一开始就存在的连接"，不做生长动画

  const g = [];
  // 新连接也用实线：虚线在链表图里通常表示"还没接上"，用它标注新连接会误导
  const lineAttrs = `x1="${x1}" y1="${y}" x2="${x2 - dir * head}" y2="${y}" stroke="${color}" `
    + `stroke-width="${arrow.accent ? 2.2 : 1.8}" stroke-linecap="round"`;
  if (grows) {
    g.push(`<line ${lineAttrs} stroke-dasharray="${len} ${len}" stroke-dashoffset="${len}">`
      + `<animate attributeName="stroke-dashoffset" `
      + `values="${len};${len};0;0;${len}" `
      + `keyTimes="0;${Math.max(0.0001, (arrow.at - 0.02) / total).toFixed(4)};`
      + `${Math.min(0.9995, (arrow.at + 0.34) / total).toFixed(4)};0.9996;1" `
      + `dur="${total}s" repeatCount="indefinite" calcMode="linear"/></line>`);
  } else {
    g.push(`<line ${lineAttrs}/>`);
  }
  g.push(`<path d="M ${x2} ${y} L ${lineEnd} ${y - 4.6} L ${lineEnd} ${y + 4.6} Z" fill="${color}"/>`);

  return `<g opacity="0">${animOpacity(arrow.vis, total)}${g.join('')}</g>`;
}

/**
 * 游标（当前指针 p / q / s）
 * 支持两种形态：
 *   - 原地停留：给 vis 时间段，位置固定在 slot
 *   - 平滑移动：给 move:[{t,slot}]，在两个槽位之间滑过去（比闪烁跳变生动得多）
 */
function renderCursor(c, geo, total) {
  const y = NODE_Y - 12;
  const base = c.move && c.move.length ? c.move[0].slot : c.slot;
  const bx = geo.x(base) + geo.nodeW / 2;

  const g = [];
  g.push(`<path d="M ${bx} ${y + 9} l -6 -9 l 12 0 Z" fill="${PAL.amber}"/>`);
  g.push(`<text x="${bx}" y="${y - 3}" text-anchor="middle" font-family="${MONO}" `
    + `font-size="12.5" font-weight="600" fill="${PAL.amber}">${esc(c.label)}</text>`);

  const anims = [animOpacity(c.vis, total)];
  if (c.move && c.move.length > 1) {
    const pts = c.move;
    const times = [0];
    const vals = ['0 0'];
    const t0 = pts[0].t;
    if (t0 > 0) { times.push(t0 / total); vals.push('0 0'); }
    for (let i = 1; i < pts.length; i++) {
      const dx = (geo.x(pts[i].slot) - geo.x(pts[0].slot)).toFixed(1);
      times.push(pts[i].t / total);
      vals.push(`${dx} 0`);
    }
    const last = pts[pts.length - 1];
    if (last.t < total) { times.push(1); vals.push(vals[vals.length - 1]); }
    anims.push(`<animateTransform attributeName="transform" type="translate" `
      + `values="${vals.join(';')}" keyTimes="${times.map((t) => t.toFixed(4)).join(';')}" `
      + `dur="${total}s" repeatCount="indefinite" calcMode="linear"/>`);
  }

  return `<g opacity="0">${anims.join('')}${g.join('')}</g>`;
}

/** 任意两点之间的箭头（用于标注引线、变量指向结点等） */
function renderFreeArrow(a, total) {
  const [x1, y1] = a.from;
  const [x2, y2] = a.to;
  const color = a.color || PAL.dim;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const head = 6.5;
  const ex = x2 - ux * head;
  const ey = y2 - uy * head;
  // 箭头头部垂直方向
  const px = -uy;
  const py = ux;
  const g = [];
  g.push(`<line x1="${x1}" y1="${y1}" x2="${ex}" y2="${ey}" stroke="${color}" `
    + `stroke-width="${a.width || 1.4}" stroke-linecap="round"`
    + `${a.dashed ? ' stroke-dasharray="4 3"' : ''}/>
    <animate attributeName="stroke-dashoffset" values="${len};${len};0;0;${len}" `
    + `keyTimes="0;${Math.max(0, ((a.at || 0) - 0.02) / total).toFixed(4)};`
    + `${Math.min(0.9999, ((a.at || 0) + 0.3) / total).toFixed(4)};0.9995;1" `
    + `dur="${total}s" repeatCount="indefinite" calcMode="linear"/></line>`);
  g.push(`<path d="M ${x2} ${y2} L ${ex + px * 4} ${ey + py * 4} L ${ex - px * 4} ${ey - py * 4} Z" fill="${color}"/>`);
  return `<g opacity="0">${animOpacity(a.vis, total)}${g.join('')}</g>`;
}

/** 引出线（标注到目标的细线，不带头部） */
function renderLeader(l, total) {
  return `<g opacity="0">${animOpacity(l.vis, total)}`
    + `<line x1="${l.from[0]}" y1="${l.from[1]}" x2="${l.to[0]}" y2="${l.to[1]}" `
    + `stroke="${l.color || PAL.faint}" stroke-width="1.1" stroke-dasharray="3 3"/></g>`;
}

/** 取出某个结点某个格子的矩形范围，供高亮框使用 */
function boxAt(geo, variant, slot, part) {
  const x = geo.x(slot);
  const y = NODE_Y;
  const h = NODE_H;
  if (variant === 'doubly') {
    if (part === 'prior') return { x, y, w: geo.priorW, h };
    if (part === 'data') return { x: x + geo.priorW, y, w: geo.dataW, h };
    if (part === 'next') return { x: x + geo.priorW + geo.dataW, y, w: geo.nextW, h };
    return { x, y, w: geo.nodeW, h };
  }
  if (part === 'data') return { x, y, w: geo.dataW, h };
  if (part === 'next') return { x: x + geo.dataW, y, w: geo.ptrW, h };
  return { x, y, w: geo.nodeW, h };
}

/** 半透明高亮框：强调"这一步动的是哪一格" */
function renderHighlight(b, geo, variant, total) {
  const r = boxAt(geo, variant, b.slot, b.part || 'node');
  const pad = 3;
  const color = b.color || PAL.blue;
  return `<g opacity="0">${animOpacity(b.vis, total, 0.12)}`
    + `<rect x="${r.x - pad}" y="${r.y - pad}" width="${r.w + pad * 2}" height="${r.h + pad * 2}" `
    + `rx="10" fill="${color}" fill-opacity="0.10" stroke="${color}" stroke-width="1.6"/></g>`;
}

/** 悬空的新结点（还没挂到链上时，画在链表下方） */
function renderFloating(node, geo, total) {
  const x = geo.x(node.slot);
  const y = NODE_Y + NODE_H + 34;
  const w = geo.nodeW;
  const label = node.value;
  const g = [];
  g.push(`<rect x="${x}" y="${y}" width="${w}" height="34" rx="7" fill="${PAL.greenSoft}" `
    + `stroke="${PAL.green}" stroke-width="1.8"/>`);
  const s1 = x + geo.dataW;
  g.push(`<line x1="${s1}" y1="${y}" x2="${s1}" y2="${y + 34}" stroke="${PAL.green}" stroke-width="1" opacity="0.5"/>`);
  g.push(`<text x="${x + geo.dataW / 2}" y="${y + 21.5}" text-anchor="middle" font-family="${MONO}" `
    + `font-size="14" fill="${PAL.ink}">${esc(label)}</text>`);
  g.push(`<circle cx="${x + geo.dataW + geo.ptrW / 2}" cy="${y + 17}" r="3.4" fill="${PAL.green}"/>`);
  if (node.tag) {
    g.push(`<text x="${x + w / 2}" y="${y + 48}" text-anchor="middle" font-family="${MONO}" `
      + `font-size="11.5" fill="${PAL.dim}">${esc(node.tag)}</text>`);
  }
  return `<g opacity="0">${animOpacity(node.vis, total)}${animRise(node.rise ?? 0, total, 12)}${g.join('')}</g>`;
}

/** 自由文字标注 */
function renderNote(n, total) {
  const anchor = n.anchor || 'start';
  const weight = n.bold ? '600' : '400';
  const family = n.mono ? MONO : FONT;
  return `<g opacity="0">${animOpacity(n.vis, total)}`
    + `<text x="${n.x}" y="${n.y}" text-anchor="${anchor}" font-family="${family}" `
    + `font-size="${n.size || 12.5}" font-weight="${weight}" fill="${n.color || PAL.dim}">`
    + `${esc(n.text)}</text></g>`;
}

/** 底部步骤字幕 + 当前代码 */
/**
 * 把 \`**强调**\` 转成 SVG 的 tspan（粗体）。
 * 场景文案里到处在用这个写法，直接输出会把星号画出来。
 */
function mdBold(text) {
  const src = String(text == null ? '' : text);
  const parts = src.split(/\*\*/);
  if (parts.length === 1) return esc(src);
  return parts.map((p, i) => (i % 2 === 1
    ? `<tspan font-weight="700">${esc(p)}</tspan>`
    : esc(p))).join('');
}

function renderCaption(scene) {
  const { steps, total } = scene;
  const out = [];
  steps.forEach((s, i) => {
    const end = i + 1 < steps.length ? steps[i + 1].t : total;
    const vis = [[s.t, end]];
    out.push(`<g opacity="0">${animOpacity(vis, total, 0.18)}`
      + `<text x="${PAD_X}" y="${CAPTION_Y}" font-family="${FONT}" font-size="14" `
      + `fill="${PAL.ink}">${mdBold(s.text)}</text>`
      + (s.code
        ? `<text x="${PAD_X}" y="${CODE_Y}" font-family="${MONO}" font-size="12.5" `
          + `fill="${PAL.blue}">${esc(s.code)}</text>`
        : '')
      + `</g>`);
  });
  return out.join('');
}

/** 底部的播放进度条 */
function renderProgress(total, color) {
  const barW = W - PAD_X * 2;
  return `<g>
    <rect x="${PAD_X}" y="${BAR_Y}" width="${barW}" height="2.5" rx="1.25" fill="${PAL.faint}"/>
    <rect x="${PAD_X}" y="${BAR_Y}" width="0" height="2.5" rx="1.25" fill="${color || PAL.blue}">
      <animate attributeName="width" values="0;${barW}" dur="${total}s" repeatCount="indefinite" calcMode="linear"/>
    </rect>
  </g>`;
}

// ---------------------------------------------------------------------------
// 数组 / 格子阵列渲染
//   顺序表、栈、队列、复杂度计数、最大子列和 —— 这些内容的共同形态是
//   "一排格子 + 几个指针"，所以单独做一套，比套用链表渲染自然得多。
// ---------------------------------------------------------------------------

/** 格子阵列的水平布局 */
function layoutCells(n) {
  const total = n * CELL_W + (n - 1) * CELL_GAP;
  const left = Math.max(PAD_X, (W - total) / 2);
  return {
    n, left, right: left + total,
    x: (i) => left + i * (CELL_W + CELL_GAP),
    center: (i) => left + i * (CELL_W + CELL_GAP) + CELL_W / 2,
  };
}

/** 格子底座：空位一直画着，让人看出"数组有多大、用到哪儿了" */
function renderCellBase(i, geo) {
  const x = geo.x(i);
  return `<rect x="${x}" y="${CELL_Y}" width="${CELL_W}" height="${CELL_H}" rx="6" `
    + `fill="${PAL.slotEmpty}" stroke="${PAL.faint}" stroke-width="1" stroke-dasharray="3 3"/>`
    + `<text x="${geo.center(i)}" y="${CELL_Y + CELL_H + 16}" text-anchor="middle" `
    + `font-family="${MONO}" font-size="10.5" fill="${PAL.dim}">${i}</text>`;
}

/** 有值的格子 */
function renderCell(c, geo, total) {
  const x = geo.x(c.at);
  const accent = c.accent || null;
  const stroke = accent === 'new' ? PAL.green : accent === 'del' ? PAL.red
    : accent === 'hot' ? PAL.amber : PAL.line;
  const fill = accent === 'new' ? PAL.greenSoft : accent === 'del' ? PAL.redSoft
    : accent === 'hot' ? '#FFF6E0' : PAL.nodeFill;

  const g = [];
  g.push(`<rect x="${x}" y="${CELL_Y}" width="${CELL_W}" height="${CELL_H}" rx="6" `
    + `fill="${fill}" stroke="${stroke}" stroke-width="${accent ? 2 : 1.4}"/>`);
  g.push(`<text x="${x + CELL_W / 2}" y="${CELL_Y + CELL_H / 2 + 5.5}" text-anchor="middle" `
    + `font-family="${MONO}" font-size="15" fill="${PAL.ink}">${esc(c.value)}</text>`);

  const anims = [animOpacity(c.vis, total)];
  if (c.rise != null) anims.push(animRise(c.rise, total, 14));
  return `<g opacity="0">${anims.join('')}${g.join('')}</g>`;
}

/** 指针标注（top / front / rear / i / j），画在格子上方 */
function renderArrayPointer(p, geo, total) {
  const x = geo.center(p.at);
  const y = CELL_Y - 13;
  const color = p.color || PAL.amber;
  return `<g opacity="0">${animOpacity(p.vis, total)}`
    + `<path d="M ${x} ${y + 9} l -6 -9 l 12 0 Z" fill="${color}"/>`
    + `<text x="${x}" y="${y - 3}" text-anchor="middle" font-family="${MONO}" `
    + `font-size="12" font-weight="600" fill="${color}">${esc(p.label)}</text></g>`;
}

/** 格子高亮框（强调"这一步动的是哪一格"） */
function renderCellHighlight(b, geo, total) {
  const x = geo.x(b.at) - 3;
  const color = b.color || PAL.blue;
  return `<g opacity="0">${animOpacity(b.vis, total, 0.12)}`
    + `<rect x="${x}" y="${CELL_Y - 3}" width="${CELL_W + 6}" height="${CELL_H + 6}" rx="9" `
    + `fill="${color}" fill-opacity="0.10" stroke="${color}" stroke-width="1.6"/></g>`;
}

/** 说明性箭头（两格之间，或格子到格子外） */
function renderCellArrow(a, geo, total) {
  // 虚线紧贴格子下方；文字离虚线近一点，把 210 那一行让给 notes
  const y = CELL_Y + CELL_H + 30;
  const x1 = geo.center(a.from);
  const x2 = geo.center(a.to);
  const color = a.color || PAL.blue;
  return `<g opacity="0">${animOpacity(a.vis, total)}`
    + `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="1.5" `
    + `stroke-dasharray="4 3"/>`
    + `<text x="${(x1 + x2) / 2}" y="${y + 15}" text-anchor="middle" font-family="${FONT}" `
    + `font-size="11" fill="${color}">${esc(a.text || '')}</text></g>`;
}

/** 数组类场景的整体渲染 */
function renderArrayScene(scene) {
  const total = scene.total || 9;
  const n = scene.slots || 8;
  const geo = layoutCells(n);
  const accentColor = scene.accentColor || PAL.blue;
  const body = [];

  body.push(renderProgress(total, accentColor));
  body.push(`<text x="${PAD_X}" y="${TITLE_Y}" font-family="${FONT}" font-size="19" font-weight="600" `
    + `fill="${PAL.ink}">${esc(scene.no)} · ${esc(scene.title)}</text>`);
  body.push(`<text x="${PAD_X}" y="${SUB_Y}" font-family="${FONT}" font-size="12.5" `
    + `fill="${PAL.dim}">${esc(scene.sub || '')}</text>`);
  if (scene.bookTag) {
    body.push(`<text x="${W - PAD_X}" y="${TITLE_Y}" text-anchor="end" font-family="${FONT}" `
      + `font-size="12.5" fill="${accentColor}">${esc(scene.bookTag)}</text>`);
  }

  // 底座 → 高亮 → 格子 → 指针 → 箭头 → 标注 → 字幕
  for (let i = 0; i < n; i++) body.push(renderCellBase(i, geo));
  for (const b of scene.highlights || []) body.push(renderCellHighlight(b, geo, total));
  for (const c of scene.cells || []) body.push(renderCell(c, geo, total));
  for (const p of scene.pointers || []) body.push(renderArrayPointer(p, geo, total));
  for (const a of scene.cellArrows || []) body.push(renderCellArrow(a, geo, total));
  for (const note of scene.notes || []) body.push(renderNote(note, total));
  body.push(renderCaption(scene));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" `
    + `role="img" aria-label="${esc(scene.title)}">`
    + `<rect width="${W}" height="${H}" fill="${PAL.bg}"/>`
    + body.join('')
    + `</svg>`;
}

// ---------------------------------------------------------------------------
// 树渲染（二叉树为主，也能画多叉树）
//   布局用最省事的办法：**中序遍历定列号、深度定行号**。
//   这样画出来的二叉树天然不会左右打架，也符合纸上的习惯画法。
// ---------------------------------------------------------------------------
const TREE_COL_W = 58;
const TREE_TOP = 84;
const TREE_R = 19;
// 按深度自适应行距：3 层的树用 60px 很舒展，4 层再用 60 就画出画面了
const TREE_AREA_H = 118;

/** 中序遍历给每个结点排好列，深度决定行 */
function layoutTree(root) {
  const pos = new Map();
  let col = 0;
  (function walk(node, path, depth) {
    if (!node) return;
    walk(node.l, path + '.l', depth + 1);
    pos.set(path, { col: col++, depth });
    walk(node.r, path + '.r', depth + 1);
  })(root, 'root', 0);

  const width = col * TREE_COL_W;
  const left = Math.max(PAD_X, (W - width) / 2);
  // 最深那一层决定行距：总高度控制在 TREE_AREA_H 以内
  let maxDepth = 0;
  for (const v of pos.values()) if (v.depth > maxDepth) maxDepth = v.depth;
  const levelH = maxDepth > 0
    ? Math.max(36, Math.min(62, TREE_AREA_H / maxDepth))
    : 62;
  return {
    pos,
    cols: col,
    levelH,
    at(path) {
      const p = pos.get(path);
      if (!p) return null;
      return {
        x: left + p.col * TREE_COL_W + TREE_COL_W / 2,
        y: TREE_TOP + p.depth * levelH,
      };
    },
  };
}

/** 按路径（root / root.l / root.r.l …）取出树里的结点 */
function treeNodeAt(root, path) {
  let node = root;
  for (const step of String(path).split('.').slice(1)) {
    if (!node) return null;
    node = step === 'l' ? node.l : node.r;
  }
  return node;
}

/** 一个树结点：圆 + 值 */
function renderTreeNode(node, p, state, total) {
  const st = state || {};
  const accent = st.accent || null;
  const stroke = accent === 'new' ? PAL.green : accent === 'del' ? PAL.red
    : accent === 'hot' ? PAL.amber : accent === 'visited' ? PAL.blue : PAL.line;
  const fill = accent === 'new' ? PAL.greenSoft : accent === 'del' ? PAL.redSoft
    : accent === 'hot' ? '#FFF6E0' : accent === 'visited' ? PAL.blueSoft : PAL.nodeFill;

  const g = [];
  g.push(`<circle cx="${p.x}" cy="${p.y}" r="${TREE_R}" fill="${fill}" stroke="${stroke}" `
    + `stroke-width="${accent ? 2.4 : 1.4}"/>`);
  const text = node.v == null ? '' : String(node.v);
  g.push(`<text x="${p.x}" y="${p.y + 5.5}" text-anchor="middle" font-family="${MONO}" `
    + `font-size="${text.length > 2 ? 12 : 15}" fill="${PAL.ink}">${esc(text)}</text>`);
  // 平衡因子之类的角标（AVL 用）
  if (st.badge) {
    g.push(`<text x="${p.x + TREE_R - 2}" y="${p.y - TREE_R + 3}" text-anchor="middle" `
      + `font-family="${MONO}" font-size="10.5" font-weight="600" fill="${PAL.dim}">${esc(st.badge)}</text>`);
  }

  const anims = [animOpacity(st.vis || [[0, total]], total)];
  if (st.rise != null) anims.push(animRise(st.rise, total, 16));
  return `<g opacity="0">${anims.join('')}${g.join('')}</g>`;
}

/** 父子之间的连线（从圆周到圆周，不戳进结点里） */
function renderTreeEdge(from, to, state, total) {
  const st = state || {};
  const accent = st.accent || null;
  const stroke = accent === 'new' ? PAL.green : accent === 'del' ? PAL.red
    : accent === 'hot' ? PAL.amber : PAL.faint;
  const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  const dx = (to.x - from.x) / len;
  const dy = (to.y - from.y) / len;
  const x1 = from.x + dx * TREE_R;
  const y1 = from.y + dy * TREE_R;
  const x2 = to.x - dx * TREE_R;
  const y2 = to.y - dy * TREE_R;
  return `<g opacity="0">${animOpacity(st.vis || [[0, total]], total)}`
    + `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" `
    + `stroke-width="${accent ? 2.4 : 1.4}"/></g>`;
}

/** 树类场景的整体渲染 */
function renderTreeScene(scene) {
  const total = scene.total || 9;
  const color = scene.accentColor || '#10B981';
  const geo = layoutTree(scene.tree || { v: '' });
  const body = [];

  body.push(renderProgress(total, color));
  body.push(`<text x="${PAD_X}" y="${TITLE_Y}" font-family="${FONT}" font-size="19" font-weight="600" `
    + `fill="${PAL.ink}">${esc(scene.no)} · ${esc(scene.title)}</text>`);
  body.push(`<text x="${PAD_X}" y="${SUB_Y}" font-family="${FONT}" font-size="12.5" `
    + `fill="${PAL.dim}">${esc(scene.sub || '')}</text>`);
  if (scene.bookTag) {
    body.push(`<text x="${W - PAD_X}" y="${TITLE_Y}" text-anchor="end" font-family="${FONT}" `
      + `font-size="12.5" fill="${color}">${esc(scene.bookTag)}</text>`);
  }

  const nodeStates = scene.nodes || {};
  const edgeStates = scene.edges || {};
  const paths = [...geo.pos.keys()].sort((a, b) => {
    const da = geo.pos.get(a).depth;
    const db = geo.pos.get(b).depth;
    return da - db || a.localeCompare(b);
  });

  // 先画所有边再画所有结点，结点会盖住线的端点
  for (const path of paths) {
    if (path === 'root') continue;
    const child = geo.at(path);
    const parentPath = path.slice(0, path.lastIndexOf('.'));
    const parent = geo.at(parentPath || 'root');
    if (child && parent) body.push(renderTreeEdge(parent, child, edgeStates[path], total));
  }
  for (const path of paths) {
    const node = treeNodeAt(scene.tree, path);
    const p = geo.at(path);
    if (node && p) body.push(renderTreeNode(node, p, nodeStates[path], total));
  }

  for (const note of scene.notes || []) body.push(renderNote(note, total));
  body.push(renderCaption(scene));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" `
    + `role="img" aria-label="${esc(scene.title)}">`
    + `<rect width="${W}" height="${H}" fill="${PAL.bg}"/>`
    + body.join('')
    + `</svg>`;
}

// ---------------------------------------------------------------------------
// 图渲染（顶点 + 边 + 权值）
//   顶点坐标由场景直接给出 —— 图没有"天然"的布局，
//   与其猜一个，不如让作者照着要讲的那张图摆位置，反而更可控。
// ---------------------------------------------------------------------------
const G_R = 21;

/** 顶点上的附加状态（颜色、角标如 dist / indegree） */
function graphNodeStyle(st) {
  const accent = st.accent || null;
  return {
    stroke: accent === 'new' ? PAL.green : accent === 'del' ? PAL.red
      : accent === 'hot' ? PAL.amber : accent === 'visited' ? PAL.blue
      : accent === 'done' ? PAL.dim : PAL.line,
    fill: accent === 'new' ? PAL.greenSoft : accent === 'del' ? PAL.redSoft
      : accent === 'hot' ? '#FFF6E0' : accent === 'visited' ? PAL.blueSoft
      : accent === 'done' ? '#F1F3F5' : PAL.nodeFill,
    width: accent ? 2.6 : 1.5,
  };
}

function renderGraphNode(n, total) {
  const st = n.state || {};
  const s = graphNodeStyle(st);
  const g = [];
  g.push(`<circle cx="${n.x}" cy="${n.y}" r="${G_R}" fill="${s.fill}" stroke="${s.stroke}" `
    + `stroke-width="${s.width}"/>`);
  const text = String(n.label == null ? n.id : n.label);
  g.push(`<text x="${n.x}" y="${n.y + 5.5}" text-anchor="middle" font-family="${MONO}" `
    + `font-size="${text.length > 2 ? 12 : 15}" fill="${PAL.ink}">${esc(text)}</text>`);
  // dist / indegree 这类角标，画在结点右下角
  if (st.badge) {
    g.push(`<text x="${n.x}" y="${n.y + G_R + 15}" text-anchor="middle" font-family="${MONO}" `
      + `font-size="11" fill="${st.badgeColor || PAL.dim}">${esc(st.badge)}</text>`);
  }
  const anims = [animOpacity(st.vis || [[0, total]], total)];
  if (st.rise != null) anims.push(animRise(st.rise, total, 14));
  return `<g opacity="0">${anims.join('')}${g.join('')}</g>`;
}

function renderGraphEdge(e, byId, total) {
  const a = byId.get(e.from);
  const b = byId.get(e.to);
  if (!a || !b) return '';
  const st = e.state || {};
  const accent = st.accent || null;
  const stroke = accent === 'new' ? PAL.green : accent === 'del' ? PAL.red
    : accent === 'hot' ? PAL.amber : accent === 'visited' ? PAL.blue : PAL.faint;
  const width = accent ? 3 : (e.dashed ? 1.4 : 1.8);

  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;
  const shrink = G_R + (e.directed ? 7 : 1);
  const x1 = a.x + ux * G_R;
  const y1 = a.y + uy * G_R;
  const x2 = b.x - ux * shrink;
  const y2 = b.y - uy * shrink;

  const g = [];
  g.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" `
    + `stroke-width="${width}"${e.dashed ? ' stroke-dasharray="5 4"' : ''}/>`);
  if (e.directed) {
    const px = -uy;
    const py = ux;
    const tipX = b.x - ux * (G_R + 1);
    const tipY = b.y - uy * (G_R + 1);
    g.push(`<path d="M ${tipX} ${tipY} L ${tipX - ux * 9 + px * 4.5} ${tipY - uy * 9 + py * 4.5} `
      + `L ${tipX - ux * 9 - px * 4.5} ${tipY - uy * 9 - py * 4.5} Z" fill="${stroke}"/>`);
  }
  // 权值标在中点稍微往法线方向偏一点，免得压在线上
  if (e.w != null) {
    const mx = (x1 + x2) / 2 - uy * 11;
    const my = (y1 + y2) / 2 + ux * 11 + 4;
    g.push(`<text x="${mx}" y="${my}" text-anchor="middle" font-family="${MONO}" font-size="11" `
      + `font-weight="600" fill="${accent ? stroke : PAL.dim}">${esc(e.w)}</text>`);
  }
  return `<g opacity="0">${animOpacity(st.vis || [[0, total]], total)}${g.join('')}</g>`;
}

/**
 * 把一批坐标整体缩放到"安全区"里。
 *
 * 图类场景的顶点坐标是手写的，很容易写到 y=270 这种位置 ——
 * 而字幕在 y=214、进度条更靠下，于是结点会压在文字上。
 * 与其逐个场景去调坐标，不如在这里统一压回安全区：
 * 按比例缩放 + 居中，保持相对布局不变。
 */
const SAFE = { x0: 90, x1: 870, y0: 84, y1: 198 };

function fitSafeArea(nodes) {
  if (!nodes.length) return nodes;
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const scaleX = Math.min(1, (SAFE.x1 - SAFE.x0) / spanX);
  const scaleY = Math.min(1, (SAFE.y1 - SAFE.y0) / spanY);

  if (scaleX >= 1 && scaleY >= 1) return nodes;

  // 缩放后居中放回安全区
  const newSpanX = spanX * scaleX;
  const newSpanY = spanY * scaleY;
  const offX = SAFE.x0 + (SAFE.x1 - SAFE.x0 - newSpanX) / 2 - minX * scaleX;
  const offY = SAFE.y0 + (SAFE.y1 - SAFE.y0 - newSpanY) / 2 - minY * scaleY;

  return nodes.map((n) => Object.assign({}, n, {
    x: Math.round(n.x * scaleX + offX),
    y: Math.round(n.y * scaleY + offY),
  }));
}

function renderGraphScene(scene) {
  const total = scene.total || 9;
  const color = scene.accentColor || '#8250DF';
  const nodes = fitSafeArea(scene.gnodes || []);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const body = [];

  body.push(renderProgress(total, color));
  body.push(`<text x="${PAD_X}" y="${TITLE_Y}" font-family="${FONT}" font-size="19" font-weight="600" `
    + `fill="${PAL.ink}">${esc(scene.no)} · ${esc(scene.title)}</text>`);
  body.push(`<text x="${PAD_X}" y="${SUB_Y}" font-family="${FONT}" font-size="12.5" `
    + `fill="${PAL.dim}">${esc(scene.sub || '')}</text>`);
  if (scene.bookTag) {
    body.push(`<text x="${W - PAD_X}" y="${TITLE_Y}" text-anchor="end" font-family="${FONT}" `
      + `font-size="12.5" fill="${color}">${esc(scene.bookTag)}</text>`);
  }

  for (const e of scene.gedges || []) body.push(renderGraphEdge(e, byId, total));
  for (const n of nodes) body.push(renderGraphNode(n, total));
  for (const note of scene.notes || []) body.push(renderNote(note, total));
  body.push(renderCaption(scene));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" `
    + `role="img" aria-label="${esc(scene.title)}">`
    + `<rect width="${W}" height="${H}" fill="${PAL.bg}"/>`
    + body.join('')
    + `</svg>`;
}

// ---------------------------------------------------------------------------
// 场景渲染
// ---------------------------------------------------------------------------
function renderScene(scene) {
  // 图类内容（邻接矩阵、DFS/BFS、最短路、最小生成树、拓扑排序）
  if (scene.variant === 'graph') return renderGraphScene(scene);
  // 树类内容（二叉树、BST、AVL、堆、哈夫曼……）
  if (scene.variant === 'tree') return renderTreeScene(scene);
  // 数组/格子类内容走另一套渲染（顺序表、栈、队列、复杂度……）
  if (scene.variant === 'array') return renderArrayScene(scene);

  const total = scene.total || 8;
  const variant = scene.variant || 'singly';
  const accentColor = scene.accentColor || PAL.blue;

  // 槽位数量 = 所有结点（含浮动结点）用到的最大 slot + 1
  const all = [...(scene.nodes || []), ...(scene.floating || [])];
  const slots = Math.max(...all.map((n) => n.slot)) + 1;
  const geo = layout(variant, slots);

  // 结点 id → 槽位号：箭头是用 id 声明的，画之前先换算成坐标槽位
  const slotOf = new Map(all.map((n) => [n.id, n.slot]));
  const arrows = (scene.arrows || [])
    .map((a) => ({ ...a, fromSlot: slotOf.get(a.from), toSlot: slotOf.get(a.to) }))
    .filter((a) => a.fromSlot != null && a.toSlot != null);

  const body = [];
  body.push(renderProgress(total, accentColor));

  // 标题
  body.push(`<text x="${PAD_X}" y="${TITLE_Y}" font-family="${FONT}" font-size="19" font-weight="600" `
    + `fill="${PAL.ink}">${esc(scene.no)} · ${esc(scene.title)}</text>`);
  body.push(`<text x="${PAD_X}" y="${SUB_Y}" font-family="${FONT}" font-size="12.5" `
    + `fill="${PAL.dim}">${esc(scene.sub || '')}</text>`);
  if (scene.bookTag) {
    body.push(`<text x="${W - PAD_X}" y="${TITLE_Y}" text-anchor="end" font-family="${FONT}" `
      + `font-size="12.5" fill="${accentColor}">${esc(scene.bookTag)}</text>`);
  }

  // 箭头画在结点下面（先画）
  for (const a of arrows) body.push(renderArrow(a, geo, variant, total));
  for (const n of scene.nodes || []) body.push(renderNode(n, geo, variant, total));
  for (const f of scene.floating || []) body.push(renderFloating(f, geo, total));
  // 高亮框压在结点上，但要在游标之下
  for (const b of scene.highlights || []) body.push(renderHighlight(b, geo, variant, total));
  for (const c of scene.cursors || []) body.push(renderCursor(c, geo, total));
  for (const l of scene.leaders || []) body.push(renderLeader(l, total));
  for (const a of scene.freeArrows || []) body.push(renderFreeArrow(a, total));
  for (const n of scene.notes || []) body.push(renderNote({ ...n, vis: n.vis }, total));
  body.push(renderCaption(scene));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" `
    + `role="img" aria-label="${esc(scene.title)}">`
    + `<rect width="${W}" height="${H}" fill="${PAL.bg}"/>`
    + body.join('')
    + `</svg>`;
}

module.exports = {
  renderScene,
  fitSafeArea,
  // 场景文件要按结点几何摆标注和引出线，必须能拿到这几个值。
  // 曾经这里只导出上面两个函数，而 02-02-singly.js / 02-02-doubly.js 写了
  // `const { NODE_Y, NODE_H } = require(...)` —— 解构 undefined 不报错，
  // 于是 MID 变成 NaN，所有引出线和标注静默画到画面外，直到 verify 的
  // "SVG 里出现 NaN" 才暴露。
  NODE_Y,
  NODE_H,
  MID_Y,
};
