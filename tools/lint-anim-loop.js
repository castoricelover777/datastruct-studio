'use strict';
/**
 * 动画"可见性"核验：模型说某元素在某时刻该显示，产物在那个时刻就必须真的显示。
 * ---------------------------------------------------------------------------
 * 为什么需要它：场景里到处用 `vis: [[0, 99]]` 表示"从头到尾都在"。那个 99 是**哨兵值**，
 * 一旦渲染器把它当秒数算进 keyTimes，就会写出 `8.25` 这种非法 keyTimes（>1），
 * SMIL 会把这项动画当坏数据 —— 元素在正片中途整段消失，剩下的时间画面是空的。
 * 用户截到的 TableSort 那排空框就是这么来的（188 个 SVG 全中）。
 *
 * 判定方式不是"看字符串"，而是两边都按 SMIL 语义解码再对照：
 *   模型侧：normalizeScene 之后，在 t 时刻哪些 cell 的哪个值可见
 *   产物侧：解析 SVG 里每个 <g> 的 opacity 动画，在 t 时刻的真实透明度
 * 模型说"该显示"而产物"不显示" → 报错。
 *
 *   node tools/lint-anim-loop.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
// 默认查工作区产物；也可以传一个目录来查别的产物（例如从 git 里导出的旧版本），
// 这也是"证明这个检查真的抓得住 bug"的办法 —— 拿故障版产物喂给它，它必须报。
const A = process.argv[2] && !process.argv[2].startsWith('--')
  ? path.resolve(process.argv[2])
  : path.join(ROOT, 'docs', 'animations');
const SRC = path.join(ROOT, 'resources', 'animations');
const { normalizeScene, visibleAt } = require('./anim/normalize');

// ---------------------------------------------------------------------------
// --self-test：先证明"判定逻辑本身抓得住这个 bug"，再去看产物。
// 用一段**已知坏掉**的动画（旧渲染器把哨兵值 99 当秒数算出来的 keyTimes）验证，
// 免得交付一条永远绿的死检查 —— 这个项目已经栽过这种跟头。
// ---------------------------------------------------------------------------
if (process.argv.includes('--self-test')) {
  const bad = '<g opacity="0"><animate attributeName="opacity" values="1;1;0" '
    + 'keyTimes="0.0000;8.2383;8.2500" dur="12s" repeatCount="indefinite" calcMode="linear"/>'
    + '<text x="360" y="132.5">30</text></g>';
  const good = '<g opacity="0"><animate attributeName="opacity" values="1;1" '
    + 'keyTimes="0.0000;1.0000" dur="12s" repeatCount="indefinite" calcMode="linear"/>'
    + '<text x="360" y="132.5">30</text></g>';
  const gBad = parseOpacityGroups(bad)[0];
  const gGood = parseOpacityGroups(good)[0];
  const ok1 = gBad && gBad.badKey === true;
  const ok2 = gGood && gGood.badKey === false;
  console.log('自测：');
  console.log('  坏样例（keyTimes 含 8.2383）判为非法 → ' + (ok1 ? '通过' : '失败'));
  console.log('  好样例（keyTimes 0;1）判为合法   → ' + (ok2 ? '通过' : '失败'));
  process.exit(ok1 && ok2 ? 0 : 1);
}

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

/** 解析 SVG 里所有"带 opacity 动画的 <g>"，返回 { value, x, values, keyTimes, dur, badKey } */
function parseOpacityGroups(svg) {
  const out = [];
  for (const m of svg.matchAll(/<g opacity="0">(<animate attributeName="opacity" [^>]*\/>[\s\S]*?)<\/g>/g)) {
    const body = m[1];
    const am = body.match(/values="([^"]*)" keyTimes="([^"]*)" dur="([\d.]+)s"/);
    if (!am) continue;
    const tm = body.match(/<text x="([\d.]+)"[^>]*>([^<]*)<\/text>/);
    if (!tm) continue;
    const keyTimes = am[2].split(';').map(Number);
    out.push({
      value: tm[2].trim(),
      x: Number(tm[1]),
      values: am[1].split(';'),
      keyTimes,
      dur: Number(am[3]),
      // SMIL 规范：keyTimes 必须落在 [0,1] 且单调不减。
      // 越界会让整项动画变成"坏数据"，浏览器只能靠容错决定怎么办 ——
      // 实测 Chromium 表现为元素在正片中途整段消失（用户截到的空框）。
      badKey: keyTimes.some((k) => !Number.isFinite(k) || k < 0 || k > 1)
        || keyTimes.some((k, i) => i > 0 && k < keyTimes[i - 1]),
    });
  }
  return out;
}

const problems = [];
let checkedScenes = 0;
let checkedCells = 0;

for (const f of fs.readdirSync(SRC).filter((x) => x.endsWith('.js')).sort()) {
  let list;
  try { list = require(path.join(SRC, f)); } catch (e) { continue; }
  for (const raw of list) {
    const sc = normalizeScene(JSON.parse(JSON.stringify(raw)));
    if (sc.variant !== 'array' || !(sc.cells || []).length) continue;
    const svgPath = path.join(A, sc.id + '.svg');
    if (!fs.existsSync(svgPath)) continue;
    const groups = parseOpacityGroups(fs.readFileSync(svgPath, 'utf8'));
    if (!groups.length) continue;
    checkedScenes++;
    const total = sc.total || 9;

    // ① 硬判据：产物里不许出现非法 keyTimes（越界 / 非单调）
    const bad = groups.filter((g) => g.badKey);
    if (bad.length) {
      problems.push(`${sc.id} 有 ${bad.length} 个元素的 keyTimes 非法（必须落在 [0,1] 且单调不减）：`
        + `例如值「${bad[0].value}」keyTimes=${bad[0].keyTimes.map((x) => x.toFixed(4)).join(';')}`
        + `，dur=${bad[0].dur}s —— 浏览器会把这项动画当坏数据，元素会在正片中途消失`);
    }

    // 每个 cell 行都要在产物里找到"一个真的覆盖了这一整段"的组。
    //
    // 关键：同一个值往往有好几行（比如某个数在 0~2s 出现在这格、6~12s 又出现），
    // 所以不能"按值找一个组、再看某个点" —— 那样会把早先那行当成这一行（假报），
    // 也会把这一行当成早先那行（漏报）。必须要求**同一个组覆盖整段区间**。
    for (const c of sc.cells || []) {
      const val = String(c.value);
      const rows = (c.vis && c.vis.length) ? c.vis : [[0, total]];
      for (const [b, e] of rows) {
        const end = Math.min(e === undefined ? total : e, total);
        if (end - b < 0.6) continue;                 // 太短的行跳过（淡入淡出本来就在边缘）
        checkedCells++;
        // 采样整段内部（避开两端 0.2s 的淡入淡出）
        const probes = [];
        for (let t = b + 0.25; t < end - 0.25; t += 0.25) probes.push(t);
        if (!probes.length) continue;
        const covering = groups.filter((g) => g.value === val && probes.every(
          (t) => opacityAt(g.values, g.keyTimes, g.dur, t) > 0.9));
        if (!covering.length) {
          const cand = groups.filter((g) => g.value === val);
          problems.push(`${sc.id} 的值「${val}」在 ${b.toFixed(2)}~${end.toFixed(2)}s 模型说该显示，`
            + `但产物里没有一个组覆盖这一段`
            + (cand.length
              ? `（同值组 ${cand.length} 个，例如 keyTimes=${cand[0].keyTimes.join(';')} values=${cand[0].values.join(';')}）`
              : '（产物里根本没有这个值的组）'));
        }
      }
    }
    void visibleAt;
  }
}

console.log(`核验 ${checkedScenes} 个场景 / ${checkedCells} 个格子实例`);
if (!problems.length) {
  console.log('没问题：模型说该显示的，产物都真的显示了。');
  process.exit(0);
}
console.log(`发现 ${problems.length} 处不一致：`);
const shown = new Set();
for (const p of problems) {
  const key = p.slice(0, 60);
  if (shown.has(key)) continue;
  shown.add(key);
  console.log('  ' + p);
  if (shown.size >= 12) { console.log(`  …还有 ${problems.length - shown.size} 处`); break; }
}
process.exit(1);
