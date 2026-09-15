'use strict';
/**
 * 动画场景静态核验。
 *
 * 找出两类内容缺陷：
 *   ① **初始时刻画面是空的** —— 某个时刻（尤其是 t=0）没有任何可见元素。
 *      用户在播放器里一打开就是这个时间，看到的是空模板。
 *   ② **元素越界 / 画布外**、**标注文字与格子重叠**。
 *
 *   node tools/lint-anim.js            核验全部
 *   node tools/lint-anim.js 05         只核验 05 章
 *   node tools/lint-anim.js 05-02 03   核验多节
 */
const fs = require('fs');
const path = require('path');

const A = path.join(__dirname, '..', 'resources', 'animations');
const { normalizeScene } = require('./anim/normalize');
const { fitSafeArea } = require('./anim/render');
const W = 960;
const H = 300;
const CELL_Y = 104;
const CELL_H = 46;
const CELL_W = 58;

const filters = process.argv.slice(2).filter((s) => /^\d/.test(s));
const files = fs.readdirSync(A).filter((f) => f.endsWith('.js')).filter((f) =>
  !filters.length || filters.some((p) => f.startsWith(p)));

/** vis 区间列表在某个时刻是否可见 */
function visibleAt(vis, t) {
  if (!vis || !vis.length) return true; // 没写 vis 默认一直可见
  for (const [b, e] of vis) {
    if (t >= b && (e === undefined || t < e)) return true;
  }
  return false;
}

const problems = [];
const add = (file, id, kind, detail) => problems.push({ file, id, kind, detail });

/** 收集一个场景里"有内容的东西"及其可见区间 */
function elementsOf(sc) {
  const out = [];
  for (const c of sc.cells || []) out.push({ what: 'cell@' + c.at + '=' + c.value, vis: c.vis });
  for (const n of sc.nodes ? Object.entries(sc.nodes) : []) out.push({ what: 'node:' + n[0], vis: n[1].vis });
  for (const n of sc.gnodes || []) out.push({ what: 'gnode:' + n.id, vis: n.state && n.state.vis });
  for (const e of sc.gedges || []) out.push({ what: 'gedge:' + e.from + '-' + e.to, vis: e.state && e.state.vis });
  // 树渲染器的结点/边也是按路径写在 nodes/edges 里的，上面已经覆盖
  if (sc.tree) out.push({ what: 'tree', vis: null });
  return out;
}

/** 树场景：从 nodes 里取可见区间 */
function treeElements(sc) {
  const out = [];
  for (const [, st] of Object.entries(sc.nodes || {})) out.push({ what: 'treeNode', vis: st.vis });
  return out;
}

for (const f of files) {
  const p = path.join(A, f);
  let scenes;
  try {
    delete require.cache[require.resolve(p)];
    scenes = require(p).map((s) => normalizeScene(JSON.parse(JSON.stringify(s))));
  } catch (e) {
    add(f, '-', '加载失败', e.message);
    continue;
  }
  if (!Array.isArray(scenes)) continue;

  for (const sc of scenes) {
    const total = sc.total || 9;
    const kind = sc.variant || 'singly';
    let els = elementsOf(sc);
    if (sc.tree) els = els.concat(treeElements(sc));
    // 有 tree/tree2 定义就算有内容，不用再看 nodes 的可见性
    const hasStaticTree = !!sc.tree;

    // ---- 检查若干时间点：画面是不是空的 ----
    const probes = [0, total * 0.25, total * 0.5, total * 0.75];
    for (const t of probes) {
      const tl = Math.round(t * 100) / 100;
      let count = 0;
      for (const el of els) {
        if (el.vis === null) { count++; continue; }
        if (visibleAt(el.vis, tl)) count++;
      }
      if (hasStaticTree) count++;
      // 还有标注和说明算内容
      const noteCount = (sc.notes || []).filter((n) => visibleAt(n.vis, tl)).length;

      if (count === 0 && noteCount === 0) {
        add(f, sc.id, '画面为空', `t=${tl} 时没有任何可见元素（cells/nodes 全不可见，也没有标注）`);
      }
    }

    // ---- 第一个元素出现的时刻（用来诊断"开头长时间空白"）----
    let firstAt = Infinity;
    for (const el of els) {
      if (el.vis === null) { firstAt = 0; break; }
      for (const [b] of el.vis || []) firstAt = Math.min(firstAt, b);
    }
    for (const n of sc.notes || []) for (const [b] of n.vis || []) firstAt = Math.min(firstAt, b);
    if (firstAt !== Infinity && firstAt > total * 0.2) {
      add(f, sc.id, '开头长时间空白', `第一个元素要到 t=${firstAt} 才出现（总时长 ${total}）`);
    }

    // ---- 格子阵列：越界检查 ----
    if (kind === 'array') {
      const slots = sc.slots || 8;
      for (const c of sc.cells || []) {
        if (c.at < 0 || c.at >= slots) add(f, sc.id, '格子越界', `cell.at=${c.at} 超出 slots=${slots}`);
      }
      for (const b of sc.highlights || []) {
        if (b.at < 0 || b.at >= slots) add(f, sc.id, '高亮越界', `highlight.at=${b.at} 超出 slots=${slots}`);
      }
      // notes 的 y 必须落在"格子底"和"字幕"之间的空白里
      for (const n of sc.notes || []) {
        if (n.y === undefined) continue;
        if (n.y >= CELL_Y - 6 && n.y <= CELL_Y + CELL_H + 6) {
          add(f, sc.id, '标注压在格子上', `note y=${n.y} 落在格子行`);
        }
        if (n.y > 208 && n.y < 214) add(f, sc.id, '标注贴住字幕', `note y=${n.y}`);
        if (n.y > 214) add(f, sc.id, '标注压住字幕/代码/进度条', `note y=${n.y}（安全上限 208，字幕在 214、代码 240、进度条 268）`);
      }
      // 文字太长会横向超出
      for (const n of sc.notes || []) {
        const size = n.size || 12.5;
        const est = String(n.text || '').length * size * 0.62;
        if (n.anchor === 'middle' && (n.x || 480) - est / 2 < 4) {
          add(f, sc.id, '标注超出左边界', `「${String(n.text).slice(0, 26)}」估算宽度 ${Math.round(est)}px`);
        }
        if (n.anchor === 'middle' && (n.x || 480) + est / 2 > W - 4) {
          add(f, sc.id, '标注超出右边界', `「${String(n.text).slice(0, 26)}」估算宽度 ${Math.round(est)}px`);
        }
      }
      // 同一时刻有多条标注且 y 相同 → 会重叠
      const byTime = {};
      for (const n of sc.notes || []) {
        const key = String(n.y) + '|' + String(n.x);
        for (const [b, e] of n.vis || [[0, total]]) {
          byTime[key] = byTime[key] || [];
          byTime[key].push([b, e === undefined ? total : e, n.text]);
        }
      }
      for (const [key, arr] of Object.entries(byTime)) {
        for (let i = 0; i < arr.length; i++) {
          for (let j = i + 1; j < arr.length; j++) {
            const [b1, e1] = arr[i];
            const [b2, e2] = arr[j];
            if (b1 < e2 && b2 < e1) {
              add(f, sc.id, '标注互相重叠',
                `同一位置 ${key} 有两条标注时间重叠：「${String(arr[i][2]).slice(0, 20)}」/「${String(arr[j][2]).slice(0, 20)}」`);
            }
          }
        }
      }
    }

    // ---- 树/图：结点坐标越界 ----
    if (kind === 'graph') {
      // 渲染时会把坐标压进安全区，这里按同一结果检查，否则会误报
      for (const n of fitSafeArea(sc.gnodes || [])) {
        if (n.x < 30 || n.x > W - 30 || n.y < 70 || n.y > H - 40) {
          add(f, sc.id, '顶点越界', `${n.id} 在 (${n.x}, ${n.y})`);
        }
      }
    }
  }
}

// ---------- 输出 ----------
if (!problems.length) {
  console.log(`核验 ${files.length} 个场景文件：没有发现问题`);
  process.exit(0);
}

const byKind = {};
for (const p of problems) (byKind[p.kind] = byKind[p.kind] || []).push(p);

console.log(`核验 ${files.length} 个场景文件，发现 ${problems.length} 个问题：\n`);
for (const [kind, arr] of Object.entries(byKind).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`【${kind}】${arr.length} 处`);
  const seen = new Set();
  for (const p of arr) {
    const key = p.file + '|' + p.id + '|' + p.detail.slice(0, 40);
    if (seen.has(key)) continue;
    seen.add(key);
    console.log(`  ${p.file.replace('.js', '')}  ${p.id}`);
    console.log(`      ${p.detail}`);
    if (seen.size >= 14) { console.log(`      …还有 ${arr.length - seen.size} 处同类`); break; }
  }
  console.log();
}
process.exit(1);
