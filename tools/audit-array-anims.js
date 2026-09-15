'use strict';
/**
 * 格子阵列动画的"全面体检"：模型 vs 产物，逐格、逐指针、逐时间点核对。
 * ---------------------------------------------------------------------------
 * 用户连着截到两处问题（TableSort 一排空框、InitQueue 两个指针标签叠在一起），
 * 所以这里不抽查，而是把**所有**格子阵列场景按同一套口径过一遍：
 *
 *   ① 每个格子：模型说某时刻该显示某个值，产物在同一列上必须真有那个值且亮着
 *   ② 每个槽位：模型说"有值"而产物那一列是空槽 → 报（这正是"一排空框"那类）
 *   ③ 每个指针：同一格上同时可见的指针标签会不会叠在一起
 *   ④ 全局扫时间轴：每个场景沿时间轴取样，统计"有值的格子数"，把最小值列出来
 *      （最小值 0 且场景本该有值 → 报；本来就是空表的场景不算）
 *
 *   node tools/audit-array-anims.js            # 全部
 *   node tools/audit-array-anims.js 05-01      # 只看某节
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const A = path.join(ROOT, 'docs', 'animations');
const SRC = path.join(ROOT, 'resources', 'animations');
const { normalizeScene, visibleAt } = require('./anim/normalize');

const CELL_W = 58;
const CELL_GAP = 2;
const filters = process.argv.slice(2).filter((s) => /^\d/.test(s));

/** 按 values/keyTimes/dur 解出 t 时刻的 opacity（calcMode=linear） */
function opacityAt(values, keyTimes, dur, t) {
  const k = (t % dur) / dur;
  const pts = keyTimes.map((x, i) => [x, Number(values[i])]);
  if (k <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [k0, v0] = pts[i];
    const [k1, v1] = pts[i + 1];
    if (k >= k0 && k <= k1) return k1 === k0 ? v1 : v0 + (v1 - v0) * ((k - k0) / (k1 - k0));
  }
  return pts[pts.length - 1][1];
}

function parseGroups(svg) {
  const out = [];
  for (const m of svg.matchAll(/<g opacity="0">(<animate attributeName="opacity" [^>]*\/>[\s\S]*?)<\/g>/g)) {
    const body = m[1];
    const am = body.match(/values="([^"]*)" keyTimes="([^"]*)" dur="([\d.]+)s"/);
    if (!am) continue;
    const tm = body.match(/<text x="([\d.]+)"[^>]*>([^<]*)<\/text>/);
    if (!tm) continue;
    out.push({
      value: tm[2].trim(),
      x: Number(tm[1]),
      values: am[1].split(';'),
      keyTimes: am[2].split(';').map(Number),
      dur: Number(am[3]),
    });
  }
  return out;
}

/** 第 i 格的中心 x */
function center(i, n) {
  const left = (960 - (n * CELL_W + (n - 1) * CELL_GAP)) / 2;
  return left + i * (CELL_W + CELL_GAP) + CELL_W / 2;
}

/** 模型在 t 时刻每格显示什么（同格多段取起点最晚的那段） */
function modelAt(sc, t) {
  const best = new Map();
  for (const c of sc.cells || []) {
    if (!visibleAt(c.vis, t)) continue;
    const start = (c.vis && c.vis[0]) ? c.vis[0][0] : 0;
    const cur = best.get(c.at);
    if (!cur || start >= cur.start) best.set(c.at, { value: String(c.value), start });
  }
  return best;
}

const problems = [];
const add = (id, kind, detail) => problems.push({ id, kind, detail });
let scenes = 0;
let cellChecks = 0;
let pointerChecks = 0;
let nodeScenes = 0;
const timeline = [];
const gaps = [];

/**
 * 连续空屏时长：画面元素（格子/结点/顶点/连线/高亮/指针）全不可见的最长连续时段。
 * 字幕和标注**不算**画面内容 —— 用户看到的就是"只剩一行字"。
 */
function longestEmptyGap(sc) {
  const total = sc.total || 9;
  // 收集所有"画面元素"的可见性
  const items = [];
  for (const c of sc.cells || []) items.push(c.vis);
  for (const b of sc.highlights || []) items.push(b.vis);
  for (const p of sc.pointers || []) items.push(p.vis);
  for (const a of sc.cellArrows || []) items.push(a.vis);
  for (const nd of Object.values(sc.nodes || {})) items.push(nd.vis);
  for (const e of Object.values(sc.edges || {})) items.push(e.vis);
  for (const g of sc.gnodes || []) items.push(g.state && g.state.vis);
  for (const g of sc.gedges || []) items.push(g.state && g.state.vis);
  if (!items.length) return { gap: total, from: 0, to: total, empty: true };

  const anyVisible = (t) => items.some((vis) => visibleAt(vis, t));
  const step = 0.1;
  let best = { gap: 0, from: 0, to: 0 };
  let runStart = null;
  for (let t = 0.05; t <= total; t += step) {
    const v = anyVisible(Math.min(t, total - 0.001));
    if (!v) {
      if (runStart === null) runStart = t;
    } else if (runStart !== null) {
      const gap = t - runStart;
      if (gap > best.gap) best = { gap, from: runStart, to: t };
      runStart = null;
    }
  }
  if (runStart !== null) {
    const gap = total - runStart;
    if (gap > best.gap) best = { gap, from: runStart, to: total };
  }
  return best;
}

for (const f of fs.readdirSync(SRC).filter((x) => x.endsWith('.js')).sort()) {
  if (filters.length && !filters.some((p) => f.startsWith(p))) continue;
  let list;
  try { list = require(path.join(SRC, f)); } catch (e) { continue; }
  for (const raw of list) {
    const sc = normalizeScene(JSON.parse(JSON.stringify(raw)));
    const svgPath = path.join(A, sc.id + '.svg');
    if (!fs.existsSync(svgPath)) { add(sc.id, '产物缺失', 'docs/animations 里没有这个 SVG'); continue; }
    const svg = fs.readFileSync(svgPath, 'utf8');
    const groups = parseGroups(svg);
    const total = sc.total || 9;
    const n = sc.slots || 8;
    scenes++;

    // ---- ⓪ 连续空屏（对**所有**场景都查，不只格子场景）----
    // 用户真正会抱怨的是"画面没东西、只有一行字幕"。超过 1.2 秒就算问题。
    {
      const g = longestEmptyGap(sc);
      nodeScenes++;
      if (g.gap >= 1.2) {
        add(sc.id, '⓪ 连续空屏',
          `${g.from.toFixed(1)}s～${g.to.toFixed(1)}s 共 ${g.gap.toFixed(1)}s 画面里没有任何元素`
          + `（占整段 ${Math.round(g.gap / total * 100)}%）；这段在讲：`
          + `「${String((sc.steps || []).find((s) => s.t >= g.from && s.t < g.to)?.text || '').slice(0, 34)}」`);
        gaps.push({ id: sc.id, gap: g.gap, from: g.from, to: g.to });
      }
    }

    if (sc.variant !== 'array') continue;

    // ---- ①② 逐格核对：沿时间轴取样 ----
    //
    // 取样点要**避开换值瞬间**：格子 A 的段结束时、格子 B 的段才开始，
    // 在 A 的结束时刻那个点，模型那边 A 已经不可见、B 还没可见，
    // 而渲染上是一次交叉淡入淡出（看着就是"值变了"），并没有异常。
    // 所以取样点落在"某个 cell 段的两端"附近时直接跳过，避免一堆假命中。
    const edges = [];
    for (const c of sc.cells || []) {
      for (const [b, e] of (c.vis || [])) {
        edges.push(b);
        if (e !== undefined) edges.push(e);
      }
    }
    const nearEdge = (t) => edges.some((x) => Math.abs(t - x) < 0.12);
    const step = Math.max(0.2, total / 40);
    let minLit = Number.POSITIVE_INFINITY;
    const badAt = [];
    // "开局还没铺开"不算整排空框：场景刚起步时只有一两个格子是正常的。
    // 判"整排空框"只认**内容铺开之后**又整排变空 —— 而且**空态本身不算问题**
    // （栈空、空表就是空的），只有"空且持续超过 1 秒"才算，
    // 否则每个"栈底清空"的场景都会被误报。这一条和 ⓪ 连续空屏互为补充：
    // ⓪ 看的是有没有东西，这里看的是"格子里有没有值"。
    const starts = [];
    for (const c of sc.cells || []) for (const [b] of (c.vis || [])) starts.push(b);
    starts.sort((a, b) => a - b);
    const settledAt = starts.length >= 3 ? starts[2] : 0;
    for (let t = 0.1; t < total; t += step) {
      const want = modelAt(sc, t);
      // "整排空框"只统计**内容铺开之后**、且不靠近换值点的时刻
      if (!nearEdge(t) && t >= settledAt) minLit = Math.min(minLit, want.size);
      if (nearEdge(t)) continue;
      for (const [at, cell] of want) {
        cellChecks++;
        const cx = center(at, n);
        const lit = groups.some((g) => g.value === cell.value
          && Math.abs(g.x - cx) < 1.5
          && opacityAt(g.values, g.keyTimes, g.dur, t) > 0.85);
        if (!lit) badAt.push({ t, at, value: cell.value });
      }
    }
    if (badAt.length) {
      const uniq = new Map();
      for (const b of badAt) uniq.set(b.at + '|' + b.value, b);
      const sample = [...uniq.values()].slice(0, 3);
      add(sc.id, '① 模型说有值、画面那一列没有',
        sample.map((b) => `t=${b.t.toFixed(2)} 第 ${b.at} 格该是「${b.value}」`).join('；')
        + `（共 ${badAt.length} 个取样点命中）`);
    }

    // ---- ② 整排空框：格子"该有值却没有"----
    //
    // 空态本身不是问题（栈空、空表就该是空的），所以判定要和**本场景自己的峰值**比：
    // 先扫一遍拿到"最多同时有几格有值"，只有当出现"0 格，而且之前到过 ≥3 格"时
    // 才算异常 —— 这正好对上用户报的"一排空框"（原本排满 6 格的表格突然全空）。
    // 栈/队列那种"最多就 2~3 格"的场景不会被误报。
    let peak = 0;
    let emptyRun = 0;
    let longestEmptyRun = 0;
    for (let t = 0.05; t < total; t += 0.1) {
      const size = modelAt(sc, t).size;
      if (size > peak) peak = size;
      if (size === 0) {
        emptyRun += 0.1;
        longestEmptyRun = Math.max(longestEmptyRun, emptyRun);
      } else emptyRun = 0;
    }
    if (peak >= 3 && longestEmptyRun >= 1.0) {
      add(sc.id, '② 整排空框',
        `大多数时刻有 ${peak} 格有值，但有一连 ${longestEmptyRun.toFixed(1)}s 一个格子的值都没有（一排空框）`);
    }
    timeline.push({ id: sc.id, n, minLit, cells: (sc.cells || []).length, total });

    // ---- ③ 指针标签重叠 ----
    const ps = sc.pointers || [];
    if (ps.length >= 2) {
      const bySlot = new Map();
      ps.forEach((p) => {
        if (!bySlot.has(p.at)) bySlot.set(p.at, []);
        bySlot.get(p.at).push(p);
      });
      for (const [at, arr] of bySlot) {
        if (arr.length < 2) continue;
        pointerChecks++;
        // 同时可见的组合
        for (let i = 0; i < arr.length; i++) {
          for (let j = i + 1; j < arr.length; j++) {
            const iv = (p) => (p.vis && p.vis.length ? p.vis : [[0, total]]);
            let overlap = false;
            for (const [b1, e1] of iv(arr[i])) {
              for (const [b2, e2] of iv(arr[j])) {
                if (b1 < (e2 === undefined ? total : e2) && b2 < (e1 === undefined ? total : e1)) overlap = true;
              }
            }
            if (!overlap) continue;
            const w = String(arr[i].label || '').length * 7.2 + String(arr[j].label || '').length * 7.2 + 10;
            if (w > CELL_W + 40) {
              add(sc.id, '③ 指针标签会压到隔壁',
                `下标 ${at}：「${arr[i].label}」+「${arr[j].label}」错开后约 ${Math.round(w)}px > ${CELL_W + 40}px`);
            }
          }
        }
      }
    }
  }
}

console.log(`彻查 ${scenes} 个格子阵列场景`);
console.log(`  逐格核对 ${cellChecks} 次（模型 vs 产物，同一列必须有同一个值且亮着）`);
console.log(`  指针重叠核对 ${pointerChecks} 组`);
console.log('');
if (!problems.length) {
  console.log('没有发现问题：模型说该显示的，产物都在正确的列上亮着。');
} else {
  const byKind = {};
  for (const p of problems) (byKind[p.kind] = byKind[p.kind] || []).push(p);
  console.log(`发现 ${problems.length} 处：`);
  for (const [kind, arr] of Object.entries(byKind)) {
    console.log(`\n【${kind}】${arr.length} 处`);
    for (const p of arr.slice(0, 10)) console.log('  ' + p.id + '  ' + p.detail);
    if (arr.length > 10) console.log(`  …还有 ${arr.length - 10} 处`);
  }
}
console.log('\n--- 每个场景"有值格子数"的最小值（0 = 出现过整排空框）---');
const zeros = timeline.filter((x) => x.minLit === 0 && x.cells > 0);
const noCells = timeline.filter((x) => x.cells === 0);
console.log('  有格子定义且出现 0 值的场景: ' + (zeros.length ? zeros.map((z) => z.id).join(', ') : '无'));
console.log('  本来就没有格子定义的场景（空表/逐步出现，属设计）: ' + noCells.length + ' 个'
  + (noCells.length ? '：' + noCells.map((z) => z.id).join(', ') : ''));
process.exit(problems.length ? 1 : 0);
