'use strict';
/**
 * 04-04 最小生成树 —— 动画场景
 *
 * 全篇用这张带权图（6 个顶点、9 条边）：
 *     0-1(6) 0-2(1) 0-3(5) 1-3(5) 1-4(3) 2-3(2) 3-4(6) 3-5(4) 4-5(6)
 * 最小生成树总权值 = 15
 * （Prim 选 3-1，Kruskal 选 1-3，选出的边不同但总权值相同）
 */

const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';
const BLUE = '#3B82F6';

const POS = {
  '0': [240, 118], '1': [660, 118], '2': [240, 238],
  '3': [460, 180], '4': [700, 240], '5': [460, 268],
};
const ALL_EDGES = [
  ['0', '1', 6], ['0', '2', 1], ['0', '3', 5],
  ['1', '3', 5], ['1', '4', 3],
  ['2', '3', 2],
  ['3', '4', 6], ['3', '5', 4],
  ['4', '5', 6],
];
const key = (e) => e[0] + '-' + e[1];

const N = (id, state) => ({ id, label: id, x: POS[id][0], y: POS[id][1], state });
const nodes = (vis, extra) => Object.keys(POS).map((id) =>
  N(id, Object.assign({ vis }, (extra && extra[id]) || {})));
/** extra 用 "u-v" 做键 */
const edges = (vis, extra) => ALL_EDGES.map((e) =>
  ({ from: e[0], to: e[1], w: e[2], state: Object.assign({ vis }, (extra && extra[key(e)]) || {}) }));

const CAP = (no, title, sub, total, extra) => ({
  id: `04-04-${no}`,
  no,
  title,
  sub,
  bookTag: '最小生成树',
  variant: 'graph',
  accentColor: '#8250DF',
  total,
  ...extra,
});

module.exports = [

  // =========================================================================
  CAP('01-typedef', 'typedef —— 两种表示都留着', 'Prim 用矩阵，Kruskal 用边表', 9, {
    gnodes: nodes([[0.6, 9]], { '0': { vis: [[0.6, 9]], accent: 'hot', badge: '源点' } }),
    gedges: edges([[0.6, 9]]),
    notes: [
      { x: 480, y: 244, anchor: 'middle', text: 'Prim 要频繁问"谁离树最近" → 邻接矩阵方便', size: 12.5,
        color: BLUE, vis: [[1.4, 5.4]] },
      { x: 480, y: 244, anchor: 'middle', text: 'Kruskal 要排序边、还要判环 → 边表方便', size: 12.5,
        color: AMBER, vis: [[5.4, 9]] },
      { x: 480, y: 244, anchor: 'middle', text: '先想清楚算法要反复做什么，再决定用什么存', size: 12.5,
        color: GREEN, vis: [[7.2, 9]] },
    ],
    steps: [
      { t: 0, text: '最小生成树：选 n-1 条边把所有点连起来，让总权值最小' },
      { t: 1.4, text: '为什么结果一定是一棵树？因为成环就说明有冗余边，去掉它会更小' },
      { t: 2.6, text: '两种经典算法，贪的东西不一样' },
      { t: 3.4, text: '**Prim 加点法**：每次把"离当前树最近的顶点"加进来' },
      { t: 4.6, text: '**Kruskal 加边法**：把边排序，每次加"不成环的最短边"' },
      { t: 5.4, text: 'Prim 要频繁问"谁离树最近" —— 用邻接矩阵方便' },
      { t: 6.6, text: 'Kruskal 要排序边、还要判断成不成环 —— 用边表方便' },
      { t: 7.2, text: '所以这一节两种表示都留着，这不是凑数' },
      { t: 8.2, text: '**先想清楚算法要反复做什么，再决定用什么存**' },
    ],
  }),

  // =========================================================================
  CAP('02-Prim', 'Prim —— 加点法', '每轮把离树最近的顶点加进来', 13, {
    gnodes: nodes([[0.6, 13]], {
      '0': { vis: [[0.6, 13]], accent: 'visited', badge: 'in' },
      '2': { vis: [[0.6, 13]], accent: 'visited', badge: 'd1 ✓' },
      '3': { vis: [[0.6, 13]], accent: 'visited', badge: 'd2 ✓' },
      '5': { vis: [[0.6, 13]], accent: 'visited', badge: 'd4 ✓' },
      '1': { vis: [[0.6, 13]], accent: 'new', badge: 'd5 →' },
      '4': { vis: [[0.6, 13]], badge: 'd3 待定' },
    }),
    gedges: edges([[0.6, 13]], {
      '0-2': { vis: [[0.6, 13]], accent: 'new' },
      '2-3': { vis: [[0.6, 13]], accent: 'new' },
      '1-3': { vis: [[0.6, 13]], accent: 'new' },
      '3-5': { vis: [[0.6, 13]], accent: 'new' },
      '1-4': { vis: [[0.6, 13]], accent: 'new' },
    }),
    notes: [
      { x: 480, y: 250, anchor: 'middle', text: '第1轮：加 2（边 0-2 权 1）→ 用 2 更新：2-3 权 2 比 5 短', mono: true,
        size: 12, color: GREEN, vis: [[1.6, 5.0]] },
      { x: 480, y: 250, anchor: 'middle', text: '第2轮：加 3（d=2）→ 用 3 更新：到 5 是 4、到 4 是 6', mono: true,
        size: 12, color: GREEN, vis: [[5.0, 8.4]] },
      { x: 480, y: 250, anchor: 'middle', text: '第3、4轮：加 5（d=4）、加 1（d=5）', mono: true,
        size: 12, color: GREEN, vis: [[8.4, 11.0]] },
      { x: 480, y: 250, anchor: 'middle', text: '总权值 = 1 + 2 + 4 + 5 + 3 = 15', mono: true,
        size: 12.5, color: GREEN, vis: [[11.0, 13]] },
    ],
    steps: [
      { t: 0, text: 'Prim：从任意一点出发，每次把"离当前树最近的顶点"加进来' },
      { t: 1.6, text: '初始 dist = [0, 6, 1, 5, INF, INF] —— 只有源点和它的直连邻居有值' },
      { t: 3.0, text: '第 1 轮：未入树里 dist 最小的是 2（dist=1），加进来，总权值 1' },
      { t: 4.0, text: '用 2 更新别人：2-3 权 2 比原来的 5 更短 → dist[3] 改成 2', code: 'if (visited[w] == 0 && G->g[v][w] < dist[w]) dist[w] = G->g[v][w];' },
      { t: 5.0, text: '第 2 轮：最小的是 3（dist=2），加进来，总权值 3' },
      { t: 6.2, text: '用 3 更新：到 5 是 4，到 4 是 6' },
      { t: 7.2, text: '第 3 轮：最小的是 5（dist=4），总权值 7' },
      { t: 8.4, text: '第 4 轮：最小的是 4？（dist=3，因为 1-4 权 3）' },
      { t: 9.4, text: '等等 —— 4 还没入树，但它的 dist 是 3，比 1 的 5 小，所以先加 4' },
      { t: 10.4, text: '第 5 轮：最后加 1' },
      { t: 11.0, text: '总共选了 5 条边（n-1），总权值 15' },
      { t: 12.0, text: '**关键差别**：Prim 的 dist[w] 是"w 到树的一条边"，不是"从源点过来的路程"', name: '和 Dijkstra 差在哪' },
    ],
  }),

  // =========================================================================
  CAP('03-FindRoot', 'FindRoot —— 并查集判环', 'Kruskal 靠它判断"加了会不会成环"', 10, {
    gnodes: nodes([[0.6, 10]], {
      '0': { vis: [[0.6, 10]], accent: 'hot', badge: '根' },
      '2': { vis: [[1.6, 10]], accent: 'visited' },
      '3': { vis: [[2.6, 10]], accent: 'visited' },
      '1': { vis: [[4.4, 10]], accent: 'new' },
      '4': { vis: [[4.4, 10]], accent: 'new' },
    }),
    gedges: edges([[0.6, 10]], {
      '0-2': { vis: [[1.6, 10]], accent: 'new' },
      '2-3': { vis: [[2.6, 10]], accent: 'new' },
      '1-4': { vis: [[4.6, 10]], accent: 'new' },
    }),
    notes: [
      { x: 480, y: 248, anchor: 'middle', text: 'parent[0]=-1 表示 0 是根；parent[2]=0 表示 2 的父亲是 0', mono: true,
        size: 12, color: BLUE, vis: [[1.6, 5.4]] },
      { x: 480, y: 248, anchor: 'middle', text: '一条边 (u,v) 会成环 ⟺ u 和 v 的根相同', size: 12.5,
        color: AMBER, vis: [[5.4, 8.4]] },
      { x: 480, y: 248, anchor: 'middle', text: '而"判断两点是否连通"正是并查集的看家本领', size: 12.5,
        color: GREEN, vis: [[8.4, 10]] },
    ],
    steps: [
      { t: 0, text: 'Kruskal 要反复问一句话：加这条边会不会成环？' },
      { t: 1.6, text: '一条边 (u, v) 成环，等价于 u 和 v **已经连通**' },
      { t: 2.6, text: '比如已经把 0-2 和 2-3 加进去了，现在 {0,2,3} 是一整块' },
      { t: 4.4, text: '这时再想加 0-3：0 和 3 的根都是 0 → 已经连通 → 会成环，跳过' },
      { t: 5.4, text: '而 1 和 4 的根分别是它们自己 → 不连通 → 可以加' },
      { t: 6.8, text: '"判断两点是否连通"正是并查集的看家本领（03-06 讲过）' },
      { t: 7.8, text: '所以 Kruskal = 边排序 + 并查集，两个老朋友拼在一起' },
      { t: 8.4, text: '这里的并查集是简化版：只保留路径压缩，不做按大小合并' },
      { t: 9.2, text: '（parent 用 -1 表示根，比 03-06 的"负数存大小"更好读，但功能少一些）' },
    ],
  }),

  // =========================================================================
  CAP('04-SortEdges', 'SortEdges —— 边按权值排序', 'Kruskal 的第一步', 9, {
    gnodes: nodes([[0.6, 9]], {}),
    gedges: edges([[0.6, 9]], {
      '0-2': { vis: [[1.4, 9]], accent: 'new' },
      '2-3': { vis: [[2.4, 9]], accent: 'new' },
      '1-4': { vis: [[3.4, 9]], accent: 'new' },
      '3-5': { vis: [[4.4, 9]], accent: 'new' },
    }),
    notes: [
      { x: 480, y: 248, anchor: 'middle', text: '排序后：1 → 2 → 3 → 4 → 5 → 5 → 6 → 6 → 6', mono: true,
        size: 12.5, color: GREEN, vis: [[4.4, 9]] },
      { x: 480, y: 248, anchor: 'middle', text: '权值最小的那几条边会最先被考虑', size: 12.5,
        color: BLUE, vis: [[1.4, 6.0]] },
      { x: 480, y: 248, anchor: 'middle', text: '排序算法用什么都行 —— 用冒泡只是为了代码短', size: 12.5,
        color: AMBER, vis: [[6.6, 9]] },
    ],
    steps: [
      { t: 0, text: 'Kruskal 的第一步：把所有边按权值从小到大排好' },
      { t: 1.4, text: '0-2 权 1 排最前，然后是 2-3 权 2、1-4 权 3、3-5 权 4……' },
      { t: 3.4, text: '为什么要排序？因为 Kruskal 是"能用短边就用短边"' },
      { t: 4.4, text: '排序后依次去试，试到不能加（会成环）就跳过' },
      { t: 6.0, text: '排序算法用什么都行 —— Kruskal 的正确性不依赖它好不好' },
      { t: 6.6, text: '这里用冒泡只是为了**代码短、好读**，把注意力留给算法本身' },
      { t: 7.6, text: '真做工程时边数可能上万，那就该换快排（O(e log e) 而不是 O(e²)）' },
      { t: 8.4, text: '下一章会讲快排' },
    ],
  }),

  // =========================================================================
  CAP('05-Kruskal', 'Kruskal —— 加边法', '从小到大试每条边，不成环就加', 13, {
    gnodes: nodes([[0.6, 13]], {
      '0': { vis: [[0.6, 13]], accent: 'visited' },
      '2': { vis: [[0.6, 13]], accent: 'visited' },
      '3': { vis: [[0.6, 13]], accent: 'visited' },
      '5': { vis: [[0.6, 13]], accent: 'visited' },
      '1': { vis: [[0.6, 13]], accent: 'visited' },
      '4': { vis: [[0.6, 13]], accent: 'visited' },
    }),
    gedges: edges([[0.6, 13]], {
      '0-2': { vis: [[0.6, 13]], accent: 'new' },
      '2-3': { vis: [[1.4, 13]], accent: 'new' },
      '1-4': { vis: [[2.4, 13]], accent: 'new' },
      '3-5': { vis: [[3.4, 13]], accent: 'new' },
      '1-3': { vis: [[5.4, 13]], accent: 'new' },
      '0-3': { vis: [[0.6, 5.4]], accent: 'del' },
    }),
    notes: [
      { x: 480, y: 250, anchor: 'middle', text: '① 加 0-2(1)  ② 加 2-3(2)  ③ 加 1-4(3)  ④ 加 3-5(4)', mono: true,
        size: 12, color: GREEN, vis: [[0.6, 5.4]] },
      { x: 480, y: 250, anchor: 'middle', text: '⑤ 试 0-3(5)：0 和 3 已经连通 → 会成环 → 跳过', mono: true,
        size: 12, color: RED, vis: [[5.4, 8.0]] },
      { x: 480, y: 250, anchor: 'middle', text: '⑥ 加 1-3(5)：把两块并起来 → 加够 5 条，停', mono: true,
        size: 12, color: GREEN, vis: [[8.0, 11.0]] },
      { x: 480, y: 250, anchor: 'middle', text: '总权值 = 1+2+3+4+5 = 15（和 Prim 一样）', mono: true,
        size: 12.5, color: GREEN, vis: [[11.0, 13]] },
    ],
    steps: [
      { t: 0, text: '边排好序之后，依次去试' },
      { t: 1.4, text: '① 加 0-2（权 1）：0 和 2 不连通 → 加，总权值 1' },
      { t: 2.4, text: '② 加 2-3（权 2）：不连通 → 加，总权值 3' },
      { t: 3.4, text: '③ 加 1-4（权 3）：不连通 → 加，总权值 6' },
      { t: 4.4, text: '④ 加 3-5（权 4）：不连通 → 加，总权值 10' },
      { t: 5.4, text: '⑤ 试 0-3（权 5）：0 和 3 的根都是 0 → **已经连通，会成环 → 跳过**' },
      { t: 6.8, text: '这一步是算法的精髓：跳过它不会损失最优性，因为绕过它总有别的路连通' },
      { t: 8.0, text: '⑥ 试 1-3（权 5）：1 在 {1,4}，3 在 {0,2,3,5} → 不连通 → 加' },
      { t: 9.4, text: '加进去之后两块连成一体，总共 5 条边 = n-1 → 停' },
      { t: 11.0, text: '总权值 = 1+2+3+4+5 = 15' },
      { t: 12.0, text: '**注意选出的边和 Prim 不完全一样**（Prim 用的是 3-1、Kruskal 是 1-3），但总权值相同' },
    ],
  }),

  // =========================================================================
  CAP('06-main', 'main —— 两种算法对着跑', '思路完全不同，结果必须一样', 11, {
    gnodes: nodes([[0.6, 11]], {
      '0': { vis: [[0.6, 11]], accent: 'hot' },
    }),
    gedges: edges([[0.6, 11]], {
      '0-2': { vis: [[1.4, 11]], accent: 'new' },
      '2-3': { vis: [[1.4, 11]], accent: 'new' },
      '3-5': { vis: [[1.4, 11]], accent: 'new' },
      '1-4': { vis: [[1.4, 11]], accent: 'new' },
      '1-3': { vis: [[1.4, 11]], accent: 'new' },
    }),
    notes: [
      { x: 480, y: 248, anchor: 'middle', text: 'Prim = 15，Kruskal = 15 → 一致，说明都对', mono: true,
        size: 12.5, color: GREEN, vis: [[3.0, 11]] },
      { x: 480, y: 248, anchor: 'middle', text: '看"点"贪心 → Prim，适合稠密图 O(n²)', size: 12.5,
        color: BLUE, vis: [[5.0, 11]] },
      { x: 480, y: 248, anchor: 'middle', text: '看"边"贪心 → Kruskal，适合稀疏图 O(e log e)', size: 12.5,
        color: AMBER, vis: [[7.6, 11]] },
    ],
    steps: [
      { t: 0, text: '同一张图，两种算法各跑一遍' },
      { t: 1.4, text: 'Prim 从 0 出发加点，选出 5 条边' },
      { t: 3.0, text: 'Kruskal 排序加边，也选出 5 条边' },
      { t: 4.0, text: '两者的总权值都是 15 —— **必须一样**' },
      { t: 5.0, text: '为什么用两个算法互相验证？因为它们思路完全不同' },
      { t: 6.2, text: '只看一个结果，错了也不知道；两条路都走通，可信度高得多' },
      { t: 7.0, text: '（最大子列和那节也用过这招 —— 四种算法互相对账）' },
      { t: 7.6, text: '选哪个？看"点"贪心的 Prim 适合稠密图，O(n²)，不依赖边数' },
      { t: 8.8, text: '看"边"贪心的 Kruskal 适合稀疏图，O(e log e)，只和边数有关' },
      { t: 9.8, text: '和邻接矩阵 / 邻接表的选择是一个道理：**看图的稠密程度**' },
      { t: 10.4, text: '下一节最后一站：拓扑排序 —— 它解决的是"谁必须先做"这类顺序问题' },
    ],
  }),

];
