'use strict';
/**
 * 04-03 最短路径（Dijkstra）—— 动画场景
 *
 * 全篇用这张带权图：
 *          0 ──2── 1
 *          │       │
 *          5       1
 *          │       │
 *          3 ──1── 2
 *
 * 从 0 出发的答案：到 1 = 2，到 2 = 3，到 3 = 4（注意 3 直连是 5）
 */

const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';
const BLUE = '#3B82F6';

const POS = { '0': [330, 128], '1': [650, 128], '2': [650, 240], '3': [330, 240] };

const N = (id, state) => ({ id, label: id, x: POS[id][0], y: POS[id][1], state });
const E = (from, to, w, state) => ({ from, to, w, state });

const nodes = (vis, extra) => ['0', '1', '2', '3'].map((id) =>
  N(id, Object.assign({ vis }, (extra && extra[id]) || {})));
const edges = (vis, extra) => [
  E('0', '1', 2, Object.assign({ vis }, (extra && extra['0-1']) || {})),
  E('0', '3', 5, Object.assign({ vis }, (extra && extra['0-3']) || {})),
  E('1', '2', 1, Object.assign({ vis }, (extra && extra['1-2']) || {})),
  E('2', '3', 1, Object.assign({ vis }, (extra && extra['2-3']) || {})),
];

const CAP = (no, title, sub, total, extra) => ({
  id: `04-03-${no}`,
  no,
  title,
  sub,
  bookTag: '最短路径',
  variant: 'graph',
  accentColor: '#8250DF',
  total,
  ...extra,
});

module.exports = [

  // =========================================================================
  CAP('01-typedef', 'typedef —— 带权图与三个数组', 'dist / collected / path', 10, {
    gnodes: nodes([[0.6, 10]], {
      '0': { vis: [[1.4, 10]], accent: 'hot', badge: '源点' },
      '1': { badge: 'dist 2' }, '2': { badge: 'dist ∞' }, '3': { badge: 'dist 5' },
    }),
    gedges: edges([[0.6, 10]], {
      '0-1': { vis: [[2.6, 10]], accent: 'new' },
      '0-3': { vis: [[3.4, 10]], accent: 'new' },
    }),
    notes: [
      { x: 480, y: 240, anchor: 'middle', text: 'INF = 65535 表示"没有边"（不能用 0，因为权值本身可能是 0）',
        size: 12.5, color: RED, vis: [[0.6, 4.4]] },
      { x: 480, y: 240, anchor: 'middle', text: 'dist: 0  2  INF  5      ← 一开始只知道直连的', mono: true,
        size: 12.5, color: BLUE, vis: [[2.6, 7.0]] },
      { x: 480, y: 240, anchor: 'middle', text: 'collected: 1 0 0 0      ← 只有源点确定', mono: true,
        size: 12.5, color: AMBER, vis: [[4.4, 7.0]] },
      { x: 480, y: 240, anchor: 'middle', text: 'path: -1  0  -1  0      ← 记下"从谁来的"', mono: true,
        size: 12.5, color: GREEN, vis: [[7.0, 10]] },
    ],
    steps: [
      { t: 0, text: '上一节 BFS 已经能解决无权图：一层层扩散，第一次到达就是最短' },
      { t: 1.4, text: '但现实里的图都带权 —— 两站的直达车可能比三站换乘还慢，BFS 就不管用了' },
      { t: 2.6, text: 'Dijkstra 把 BFS 推广到带权图。它维护三个数组' },
      { t: 3.4, text: '**dist[w]**：从源点到 w 的"当前已知最短距离"' },
      { t: 4.4, text: '**collected[w]**：w 的距离是否已经**确定**（叫"收录"）' },
      { t: 5.4, text: '一开始只有源点确定，其余都是待定' },
      { t: 7.0, text: '**path[w]**：w 是从谁过来的，用来最后还原整条路径' },
      { t: 8.2, text: '注意 INF 不能用 0 —— 权值本身可能就是 0（免费换乘），会分不清' },
      { t: 9.2, text: '还要小心 INF 取太小的话，两段相加会溢出成负数' },
    ],
  }),

  // =========================================================================
  CAP('02-FindMinDist', 'FindMinDist —— 挑出最近的待定顶点', '在没收录的里面找 dist 最小的', 9, {
    gnodes: nodes([[0.6, 9]], {
      '0': { vis: [[0.6, 9]], accent: 'visited', badge: '已收录' },
      '1': { vis: [[1.6, 9]], accent: 'new', badge: '→ 挑它' },
      '2': { vis: [[1.6, 9]], badge: '待定 ∞' },
      '3': { vis: [[1.6, 9]], badge: '待定 5' },
    }),
    gedges: edges([[0.6, 9]], {
      '0-1': { vis: [[2.6, 9]], accent: 'new' },
    }),
    notes: [
      { x: 480, y: 240, anchor: 'middle', text: '待定里 dist 最小的：顶点 1（dist = 2）→ 收录它',
        size: 12.5, color: GREEN, vis: [[2.6, 9]] },
      { x: 480, y: 240, anchor: 'middle', text: '已经收录的不再参与 —— 它的答案已经定了', size: 12.5,
        color: AMBER, vis: [[4.6, 9]] },
      { x: 480, y: 240, anchor: 'middle', text: '朴素实现是 O(n) 的线性扫描，主循环 n 轮 → 整体 O(n²)', size: 12.5,
        color: BLUE, vis: [[6.6, 9]] },
    ],
    steps: [
      { t: 0, text: '每一轮都要问一句：剩下的待定顶点里，谁的 dist 最小？' },
      { t: 1.6, text: '挑出来的那个就可以"转正"了 —— 它的 dist 就是最终答案' },
      { t: 2.6, text: '条件是 `!collected[i] && dist[i] < minDist`，**两个都要**' },
      { t: 4.6, text: '为什么必须排除已收录的？因为它们已经定了，再挑一次没有意义' },
      { t: 5.8, text: '返回 -1 表示"没有待定的了"，主循环这时候就该结束' },
      { t: 6.6, text: '一次线性扫描是 O(n)，主循环跑 n 轮，所以整体 O(n²)' },
      { t: 7.6, text: '用最小堆能把这一步降到 O(log n)，整体变成 O(e log n)' },
      { t: 8.4, text: '这就是"堆优化的 Dijkstra"，稀疏图下快很多，但代码要长一截' },
    ],
  }),

  // =========================================================================
  CAP('03-Dijkstra', 'Dijkstra —— 主算法', '每轮收录一个，再用它松弛邻居', 14, {
    gnodes: nodes([[0.6, 14]], {
      '0': { vis: [[0.6, 14]], accent: 'visited', badge: 'dist 0' },
      '1': { vis: [[0.6, 14]], accent: 'new', badge: 'dist 2 ✓' },
      '2': { vis: [[0.6, 14]], accent: 'new', badge: 'dist 3 ✓' },
      '3': { vis: [[0.6, 14]], accent: 'new', badge: 'dist 4 ✓' },
    }),
    gedges: edges([[0.6, 14]], {
      '0-1': { vis: [[0.6, 14]], accent: 'new' },
      '1-2': { vis: [[4.0, 14]], accent: 'new' },
      '2-3': { vis: [[8.0, 14]], accent: 'new' },
      '0-3': { vis: [[0.6, 8.0]], accent: 'del' },
    }),
    notes: [
      { x: 480, y: 240, anchor: 'middle', text: '第1轮：收录 1（dist 2）→ 松弛邻居，绕它到 2 只要 3', mono: true,
        size: 12.5, color: GREEN, vis: [[4.0, 6.4]] },
      { x: 480, y: 240, anchor: 'middle', text: '第2轮：收录 2（dist 3）→ 绕它到 3 只要 4（直连是 5！）', mono: true,
        size: 12.5, color: GREEN, vis: [[8.0, 11.0]] },
      { x: 480, y: 240, anchor: 'middle', text: '第3轮：收录 3（dist 4），没有可松弛的邻居了', mono: true,
        size: 12.5, color: GREEN, vis: [[11.0, 14]] },
      { x: 480, y: 240, anchor: 'middle', text: '核心只有一句：dist[v] + g[v][w] < dist[w] → 更新', mono: true,
        size: 12.5, color: BLUE, vis: [[0.6, 4.0]] },
    ],
    steps: [
      { t: 0, text: '主循环每轮做两件事：挑一个最近的收录，再用它松弛邻居' },
      { t: 1.4, text: '初始 dist = [0, 2, INF, 5] —— 只知道直连的' },
      { t: 2.6, text: '核心的判断只有一句：', code: 'if (dist[v] + G->g[v][w] < dist[w]) 更新 dist 和 path;' },
      { t: 4.0, text: '第 1 轮：待定里最小的是 1（dist=2），收录它' },
      { t: 5.0, text: '用 1 松弛邻居：1 连着 0（已收录）和 2（权 1）' },
      { t: 5.8, text: '绕 1 到 2 = 2 + 1 = 3 < INF → 更新！dist[2] 从 INF 变成 3，path[2] = 1' },
      { t: 7.0, text: '现在 dist = [0, 2, 3, 5]' },
      { t: 8.0, text: '第 2 轮：待定里最小的是 2（dist=3），收录它' },
      { t: 8.8, text: '用 2 松弛邻居：2 连着 1（已收录）和 3（权 1）' },
      { t: 9.6, text: '绕 2 到 3 = 3 + 1 = 4 < 5 → 更新！dist[3] 从 5 变成 4' },
      { t: 10.4, text: '**这就是这个例子的陷阱**：3 直连源点是 5，绕一圈反而只要 4' },
      { t: 11.0, text: '第 3 轮：收录 3（dist=4），它的邻居都收录了，没有可松弛的' },
      { t: 12.0, text: '第 4 轮：没有待定的了 → 结束' },
      { t: 13.0, text: '答案：到 1 是 2、到 2 是 3、到 3 是 4' },
    ],
  }),

  // =========================================================================
  CAP('04-PrintPath', 'PrintPath —— 还原路径', '顺着 path 倒着走，用递归把顺序翻正', 10, {
    gnodes: nodes([[0.6, 10]], {
      '0': { vis: [[0.6, 10]], accent: 'visited', badge: '起点' },
      '1': { vis: [[0.6, 10]], accent: 'visited' },
      '2': { vis: [[0.6, 10]], accent: 'visited' },
      '3': { vis: [[3.0, 10]], accent: 'new', badge: '终点' },
    }),
    gedges: edges([[0.6, 10]], {
      '0-1': { vis: [[0.6, 10]], accent: 'new' },
      '1-2': { vis: [[0.6, 10]], accent: 'new' },
      '2-3': { vis: [[3.0, 10]], accent: 'new' },
      '0-3': { vis: [[0.6, 3.0]], accent: 'del' },
    }),
    notes: [
      { x: 480, y: 240, anchor: 'middle', text: 'path[3]=2，path[2]=1，path[1]=0，path[0]=-1', mono: true,
        size: 12.5, color: BLUE, vis: [[1.6, 10]] },
      { x: 480, y: 240, anchor: 'middle', text: '从 3 出发一路倒着找：3 → 2 → 1 → 0，走到 -1 就到起点了',
        size: 12.5, color: AMBER, vis: [[3.6, 7.0]] },
      { x: 480, y: 240, anchor: 'middle', text: '递归打印：先递归打前缀，再打自己 —— 顺序自然就翻正了', mono: true,
        size: 12.5, color: GREEN, vis: [[7.0, 10]] },
    ],
    steps: [
      { t: 0, text: 'dist 给的是"多远"，path 给的是"怎么走"' },
      { t: 1.6, text: 'path[w] = v 表示"到 w 的最短路是从 v 过来的"' },
      { t: 3.6, text: '想知道从源点到 3 的完整路线，就从 3 出发一路找 path：' },
      { t: 4.4, text: '3 → path[3]=2 → path[2]=1 → path[1]=0 → path[0]=-1 停' },
      { t: 6.0, text: '结果是 3 2 1 0 —— **倒的**' },
      { t: 7.0, text: '用递归把它们翻正：先递归打印前面一段，再打印自己', code: 'PrintPath(path, path[v]);\n printf(" -> %d", v);' },
      { t: 8.4, text: '这和二叉树后序遍历是同一个套路：先处理更深的一层，再处理自己' },
      { t: 9.2, text: '另一种写法是倒着走一遍收集到数组，再倒着打印 —— 效果一样但要多一个数组' },
    ],
  }),

  // =========================================================================
  CAP('05-main', 'main —— 换个源点再跑一次', '同一张图，不同起点的结果完全不同', 10, {
    gnodes: nodes([[0.6, 10]], {
      '2': { vis: [[1.6, 10]], accent: 'hot', badge: '新源点' },
      '0': { badge: 'dist 4' }, '1': { badge: 'dist 3' }, '3': { badge: 'dist 1' },
    }),
    gedges: edges([[0.6, 10]], {
      '1-2': { vis: [[1.6, 10]], accent: 'new' },
      '2-3': { vis: [[1.6, 10]], accent: 'new' },
    }),
    notes: [
      { x: 480, y: 240, anchor: 'middle', text: '从 0 出发：到 1=2，到 2=3，到 3=4', mono: true,
        size: 12.5, color: BLUE, vis: [[0.6, 5.0]] },
      { x: 480, y: 240, anchor: 'middle', text: '从 2 出发：到 1=1，到 3=1，到 0=4', mono: true,
        size: 12.5, color: GREEN, vis: [[5.0, 10]] },
      { x: 480, y: 240, anchor: 'middle', text: 'Dijkstra 求的是"单源"最短路 —— 换起点要重跑一遍', size: 12.5,
        color: AMBER, vis: [[7.6, 10]] },
    ],
    steps: [
      { t: 0, text: '从 0 出发跑一遍，结果：到 1=2、到 2=3、到 3=4' },
      { t: 2.0, text: '特别记住 3 的答案：直连是 5，绕 0→1→2→3 只要 4' },
      { t: 3.6, text: '这就是"松弛"要反复做的原因 —— 第一眼看到的 dist 只是"目前已知"' },
      { t: 5.0, text: '换个源点从 2 出发，结果完全变了' },
      { t: 6.2, text: '到 1 是 1（直连）、到 3 是 1（直连）、到 0 要绕 2→3→0 = 1+5 = 6？' },
      { t: 7.6, text: '不对 —— 应该走 2→1→0 = 1+2 = 3。程序会算出正确答案' },
      { t: 8.4, text: 'Dijkstra 求的是**单源**最短路径：换起点就得重跑一遍' },
      { t: 9.2, text: '想求"任意两点之间"的距离，要么每个点都跑一遍（O(n³)），要么用 Floyd（也是 O(n³)）' },
    ],
  }),

];
