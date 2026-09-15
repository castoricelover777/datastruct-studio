'use strict';
/**
 * 动画场景规范化。
 *
 * 写场景时很容易犯两个毛病，而且都不容易被发现（要盯着播放器才看得出来）：
 *
 *   ① **画面开头是空的** —— 元素从 0.6 秒才开始出现，而播放器打开就是 t=0，
 *      用户看到的是一个空模板。这里把所有元素里**最早那个出现时刻**归零，
 *      保证 t=0 一定有内容。
 *
 *   ② **同一位置的标注时间重叠** —— 多条说明文字放在同一个 (x, y) 上，
 *      靠 vis 区间切换，但区间一旦交叠就会叠字。
 *      这里把同位置的区间改成**首尾串联**，谁也不盖谁。
 *
 * 只影响产物（SVG / data 里的动画 JSON），不改源文件格式。
 */

/** vis 是否在 t 时刻可见 */
function visibleAt(vis, t) {
  if (!vis || !vis.length) return true;
  return vis.some(([b, e]) => t >= b && (e === undefined || t < e));
}

/** 收集场景里所有 vis 区间（按引用返回，方便原地改） */
function collectVis(scene) {
  const out = [];
  for (const c of scene.cells || []) if (c.vis) out.push(c.vis);
  for (const h of scene.highlights || []) if (h.vis) out.push(h.vis);
  for (const p of scene.pointers || []) if (p.vis) out.push(p.vis);
  for (const a of scene.cellArrows || []) if (a.vis) out.push(a.vis);
  for (const n of Object.values(scene.nodes || {})) if (n.vis) out.push(n.vis);
  for (const e of Object.values(scene.edges || {})) if (e.vis) out.push(e.vis);
  for (const g of scene.gnodes || []) if (g.state && g.state.vis) out.push(g.state.vis);
  for (const g of scene.gedges || []) if (g.state && g.state.vis) out.push(g.state.vis);
  for (const n of scene.notes || []) if (n.vis) out.push(n.vis);
  return out;
}

/**
 * ① 把最早的可见时刻归零。
 *
 * 不直接把"所有区间"都平移到 0 —— 那会破坏关键帧和代码行的对应关系。
 * 只把**起点等于全局最早时刻的那些区间**的起点改成 0，其余不动。
 * 效果是"第一个出现的元素从开头就在"，后续节奏完全不变。
 */
function alignStart(scene) {
  const total = scene.total || 9;
  const all = collectVis(scene);
  let minStart = Infinity;
  for (const vis of all) {
    for (const seg of vis) if (seg[0] < minStart) minStart = seg[0];
  }
  if (minStart === Infinity || minStart <= 0) return 0;

  let touched = 0;
  for (const vis of all) {
    for (const seg of vis) {
      if (seg[0] === minStart) {
        seg[0] = 0;
        touched++;
      }
    }
  }
  if (touched) scene.__alignedFrom = minStart;
  return touched;
}

/**
 * ② 同一位置的多条标注改成首尾串联。
 *
 * 按起点排序之后，让每条的结束时间等于下一条的开始时间；
 * 最后一条延长到总时长。每条至少保留 minLen 秒，太短的会往后挤。
 */
function unstackNotes(scene) {
  const total = scene.total || 9;
  const minLen = 0.8;
  const groups = new Map();

  for (const n of scene.notes || []) {
    if (!n.vis || !n.vis.length) continue;
    const key = String(n.x) + '|' + String(n.y);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(n);
  }

  let fixed = 0;
  for (const arr of groups.values()) {
    if (arr.length < 2) continue;

    // 展开成"单段 + 原始起点"的列表
    const segs = [];
    for (const n of arr) {
      for (const [b, e] of n.vis) {
        segs.push({ n, b, e: (e === undefined ? total : e) });
      }
    }
    segs.sort((p, q) => p.b - q.b || p.e - q.e);

    // 检查是否真的重叠
    let overlaps = false;
    for (let i = 0; i < segs.length; i++) {
      for (let j = i + 1; j < segs.length; j++) {
        if (segs[i].b < segs[j].e && segs[j].b < segs[i].e) overlaps = true;
      }
    }
    if (!overlaps) continue;

    // 串联：每条尽量保持原时长，但起点不能早于前一条的终点
    let cursor = segs[0].b;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      const want = Math.max(minLen, s.e - s.b);
      const start = Math.max(s.b, cursor);
      const end = Math.min(total, start + want);
      s.n.vis = [[start, end]];
      cursor = end;
      fixed++;
    }
    // 最后一条如果还有空间就延长到结尾
    const last = segs[segs.length - 1];
    if (last.n.vis.length && cursor < total) last.n.vis[0][1] = total;
  }
  return fixed;
}

/**
 * ③ 同一格子的"变形"要首尾相接。
 *
 * 排序类动画靠"同一位置在时间轴上换值"来表现元素移动，写法是：
 *
 *     cell(0, '5', [[0.6, 4.4]]),   ← 4.4 秒之前是 5
 *     cell(0, '1', [[4.4, 99]]),    ← 之后变成 1
 *
 * 但手写时极容易把前一个的结束写成 9 或 99，于是两个数字在同一格上
 * **同时可见、叠在一起** —— 看上去就是"数字显示不正常 / 位置不对"。
 * 这里按起点排序，强制让前一个的结束等于后一个的开始。
 */
function chainCells(scene) {
  const total = scene.total || 9;
  const byAt = new Map();
  for (const c of scene.cells || []) {
    if (!byAt.has(c.at)) byAt.set(c.at, []);
    byAt.get(c.at).push(c);
  }

  let fixed = 0;
  for (const arr of byAt.values()) {
    if (arr.length < 2) continue;

    // 展开成单段，按起点排序
    const segs = [];
    for (const c of arr) {
      const iv = c.vis && c.vis.length ? c.vis : [[0, total]];
      for (const [b, e] of iv) segs.push({ c, b, e: e === undefined ? total : e });
    }
    segs.sort((p, q) => p.b - q.b);

    // **无条件串联**：同一格只要有多段，就把前一段接到后一段的起点上。
    //
    // 不只在"检测到重叠"时才动手 —— 因为还有一个同样常见的毛病：
    // 前一段结束得早、后一段开始得晚，中间留出一段**空档**，
    // 那一瞬间格子上什么都没有（看上去像数字丢了）。
    // 对排序这类"连续数组"来说，格子留空本来就没有语义，所以直接补齐。
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      const next = segs[i + 1];
      const end = next ? next.b : total;
      if (end > s.b) {
        s.c.vis = [[s.b, end]];
        fixed++;
      }
    }
  }
  return fixed;
}

/** 就地规范化一个场景，返回改动摘要 */
function normalizeScene(scene) {
  if (!scene || typeof scene !== 'object') return scene;
  const aligned = alignStart(scene);
  const unstacked = unstackNotes(scene);
  const chained = chainCells(scene);
  if (aligned) scene.__aligned = aligned;
  if (unstacked) scene.__unstacked = unstacked;
  if (chained) scene.__chained = chained;
  return scene;
}

module.exports = { normalizeScene, visibleAt };
