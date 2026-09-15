'use strict';
/**
 * 04-05 拓扑排序 —— 动画场景
 *
 * 全篇用这张 AOV 网：
 *      0 ──→ 2 ──→ 4
 *      ↓           ↑
 *      1 ──→ 3 ────┘
 * 边：(0,2) (0,1) (1,3) (2,4) (3,4)   全部是有向边
 * 一个合法的拓扑序：0 1 2 3 4
 */

const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';
const BLUE = '#3B82F6';

const POS = { '0': [270, 118], '1': [270, 240], '2': [500, 118], '3': [500, 240], '4': [710, 178] };
const ALL = [['0', '2'], ['0', '1'], ['1', '3'], ['2', '4'], ['3', '4']];
const key = (e) => e[0] + '>' + e[1];

const N = (id, state) => ({ id, label: id, x: POS[id][0], y: POS[id][1], state });
const nodes = (vis, extra) => Object.keys(POS).map((id) =>
  N(id, Object.assign({ vis }, (extra && extra[id]) || {})));
/** 全部画成有向边（带箭头） */
const edges = (vis, extra) => ALL.map((e) =>
  ({ from: e[0], to: e[1], directed: true, state: Object.assign({ vis }, (extra && extra[key(e)]) || {}) }));

const CAP = (no, title, sub, total, extra) => ({
  id: `04-05-${no}`,
  no,
  title,
  sub,
  bookTag: '拓扑排序',
  variant: 'graph',
  accentColor: '#8250DF',
  total,
  ...extra,
});

module.exports = [

  // =========================================================================
  CAP('01-typedef', 'typedef —— AOV 网与入度', '入度 = 有多少个任务必须排在我前面', 10, {
    gnodes: nodes([[0.6, 10]], {
      '0': { vis: [[0.6, 10]], accent: 'hot', badge: '入度 0' },
      '1': { badge: '入度 1' }, '2': { badge: '入度 1' },
      '3': { badge: '入度 1' }, '4': { badge: '入度 2' },
    }),
    gedges: edges([[0.6, 10]]),
    notes: [
      { x: 480, y: 262, anchor: 'middle', text: '有向边 A→B 表示「A 必须在 B 之前」', size: 12.5,
        color: BLUE, vis: [[1.4, 5.0]] },
      { x: 480, y: 262, anchor: 'middle', text: '入度为 0 的顶点没有前置任务 —— 现在就能做', size: 12.5,
        color: GREEN, vis: [[5.0, 8.0]] },
      { x: 480, y: 262, anchor: 'middle', text: '矩阵不对称（有向图只填一个格子）', size: 12.5,
        color: AMBER, vis: [[8.0, 10]] },
    ],
    steps: [
      { t: 0, text: '拓扑排序解决的问题：一堆任务有先后依赖，怎么排出一个合法顺序' },
      { t: 1.4, text: '用图表示：**顶点是任务，有向边 A→B 表示 A 必须在 B 之前**' },
      { t: 2.6, text: '这样的有向图叫 AOV 网（Activity On Vertex）' },
      { t: 4.2, text: '入度 = 有多少条边指向我 = **有多少任务必须排在我前面**' },
      { t: 5.0, text: '所以入度为 0 的顶点没有前置任务，随时可以做' },
      { t: 6.2, text: '看这张图：0 的入度是 0（谁都不等），4 的入度是 2（要等 2 和 3）' },
      { t: 7.4, text: '存储上，有向图比无向图只少填一个格子 —— 但矩阵从此**不对称**' },
      { t: 8.0, text: '如果打印出来发现对称了，说明建图时写成了无向图' },
      { t: 9.0, text: '顺便说一句出度：入度是"我要等谁"，出度是"谁要等我"' },
    ],
  }),

  // =========================================================================
  CAP('02-TopSort', 'TopSort —— Kahn 算法', '每次挑入度 0 的输出，然后删掉它的出边', 14, {
    gnodes: nodes([[0.6, 14]], {
      '0': { vis: [[1.0, 14]], accent: 'new', badge: '①id0' },
      '2': { vis: [[0.6, 14]], accent: 'new', badge: '②id0' },
      '1': { vis: [[0.6, 14]], accent: 'new', badge: '③id0' },
      '3': { vis: [[0.6, 14]], accent: 'new', badge: '④id0' },
      '4': { vis: [[0.6, 14]], accent: 'new', badge: '⑤id0' },
    }),
    gedges: edges([[0.6, 14]], {
      '0>2': { vis: [[1.0, 14]], accent: 'new' },
      '0>1': { vis: [[2.4, 14]], accent: 'new' },
      '1>3': { vis: [[4.6, 14]], accent: 'new' },
      '2>4': { vis: [[6.8, 14]], accent: 'new' },
      '3>4': { vis: [[9.0, 14]], accent: 'new' },
    }),
    notes: [
      { x: 480, y: 262, anchor: 'middle', text: '初始只有 0 入度为 0 → 输出 0，删掉它的出边', mono: true,
        size: 12, color: GREEN, vis: [[1.0, 3.6]] },
      { x: 480, y: 262, anchor: 'middle', text: '2 和 1 的入度降成 0 → 入队', mono: true, size: 12,
        color: GREEN, vis: [[3.6, 6.2]] },
      { x: 480, y: 262, anchor: 'middle', text: '依次输出 2、1、3，最后 4 的入度也降到 0', mono: true,
        size: 12, color: GREEN, vis: [[6.2, 11.0]] },
      { x: 480, y: 262, anchor: 'middle', text: '结果：0 2 1 3 4    （每条边都从前往后）', mono: true,
        size: 12.5, color: GREEN, vis: [[11.0, 14]] },
    ],
    steps: [
      { t: 0, text: 'Kahn 算法的思路非常自然：入度为 0 的任务，随时可以做' },
      { t: 1.0, text: '先把所有入度 0 的顶点放进队列 —— 这里只有 0' },
      { t: 2.4, text: '取出 0，输出它' },
      { t: 3.0, text: '然后**把它的出边都删掉**：到 2 和到 1 的边没了' },
      { t: 3.6, text: '等价于让邻居的入度减一。2 的入度 1→0，1 的入度 1→0' },
      { t: 4.8, text: '"删边"用入度减一来表示，不用真的改矩阵', code: 'if (--indegree[i] == 0) queue[rear++] = i;' },
      { t: 6.2, text: '它们入度归零了，进队。队列现在是 [2, 1]' },
      { t: 7.4, text: '取出 2，输出。它的出边到 4 —— 4 的入度从 2 降到 1，还不是 0' },
      { t: 9.0, text: '取出 1，输出。到 3 的边删掉 → 3 入度归零，进队' },
      { t: 10.2, text: '取出 3，输出。到 4 的边删掉 → 4 入度归零，进队' },
      { t: 11.0, text: '取出 4，输出。它没有出边。队列空，结束' },
      { t: 12.0, text: '结果 0 2 1 3 4 —— 每条边都是从前往后的，合法' },
      { t: 13.0, text: '注意：队列里有多个入度 0 的点时，先输出谁都可以 —— 拓扑序不唯一' },
    ],
  }),

  // =========================================================================
  CAP('03-DFSVisit', 'DFSVisit —— 深度优先的后序', '回溯时才把自己填进去', 10, {
    gnodes: nodes([[0, 10]], {
      '0': { vis: [[0.6, 10]], accent: 'hot', badge: '最后填' },
      '1': { vis: [[2.4, 10]], accent: 'visited' },
      '2': { vis: [[4.2, 10]], accent: 'visited' },
      '3': { vis: [[5.6, 10]], accent: 'visited' },
      '4': { vis: [[7.0, 10]], accent: 'new', badge: '最先填' },
    }),
    gedges: edges([[0.6, 10]], {
      '0>1': { vis: [[2.4, 10]], accent: 'new' },
      '0>2': { vis: [[2.4, 10]], accent: 'new' },
      '1>3': { vis: [[5.6, 10]], accent: 'new' },
      '3>4': { vis: [[7.0, 10]], accent: 'new' },
      '2>4': { vis: [[7.0, 10]], accent: 'new' },
    }),
    notes: [
      { x: 480, y: 262, anchor: 'middle', text: 'DFS 先一路钻到底，走不通了才回头', size: 12.5,
        color: BLUE, vis: [[0.6, 5.6]] },
      { x: 480, y: 262, anchor: 'middle', text: '关键在最后一行：**邻居都处理完了，才把自己填进数组**', size: 12.5,
        color: AMBER, vis: [[5.6, 9.0]] },
      { x: 480, y: 262, anchor: 'middle', text: '而且是从数组**尾部往前**填 —— 这就是逆后序', size: 12.5,
        color: GREEN, vis: [[9.0, 10]] },
    ],
    steps: [
      { t: 0, text: '下一个做法用深度优先，代码比 Kahn 还短' },
      { t: 0.6, text: '从 0 出发，先递归到 1，再递归到 3，再递归到 4' },
      { t: 2.4, text: '同时记住：DFS 先走邻居，所以**邻居一定先回溯完**' },
      { t: 4.2, text: '看顺序：4 最先回溯完，然后是 3，再是 1' },
      { t: 5.6, text: '所以把自己填进数组的时机是"**在递归完所有邻居之后**"' },
      { t: 6.8, text: '代码就一行，放在循环之后', code: 'DFSVisit(G, i, visited, order, pos);... order[(*pos)--] = v;' },
      { t: 8.0, text: '这一行和普通 DFS 的唯一区别就是位置 —— 放在循环之后就是后序' },
      { t: 9.0, text: '而且是从数组**最后往前**填的（逆后序），下一个模块就能看出为什么' },
    ],
  }),

  // =========================================================================
  CAP('04-TopSortDFS', 'TopSortDFS —— 逆后序就是拓扑序', '有边 A→B，那 A 一定比 B 晚回溯完', 12, {
    gnodes: nodes([[0.6, 12]], {
      '0': { vis: [[0.6, 12]], accent: 'new', badge: '最早' },
      '1': { vis: [[0.6, 12]], accent: 'new', badge: '②' },
      '3': { vis: [[0.6, 12]], accent: 'new', badge: '③' },
      '4': { vis: [[0.6, 12]], accent: 'new', badge: '④' },
      '2': { vis: [[0.6, 12]], accent: 'new', badge: '⑤最晚' },
    }),
    gedges: edges([[0.6, 12]], {
      '0>1': { vis: [[1.6, 12]], accent: 'new' },
      '1>3': { vis: [[1.6, 12]], accent: 'new' },
      '3>4': { vis: [[1.6, 12]], accent: 'new' },
      '0>2': { vis: [[1.6, 12]], accent: 'new' },
      '2>4': { vis: [[1.6, 12]], accent: 'new' },
    }),
    notes: [
      { x: 480, y: 262, anchor: 'middle', text: '有边 A→B 时，DFS 会先递归到 B，B 先回溯完', size: 12.5,
        color: BLUE, vis: [[1.6, 6.0]] },
      { x: 480, y: 262, anchor: 'middle', text: '所以 B 的后序位置更靠前、A 更靠后', size: 12.5,
        color: AMBER, vis: [[6.0, 9.0]] },
      { x: 480, y: 262, anchor: 'middle', text: '把位置**反过来用**，A 就排在 B 前面了 —— 正是我们要的', size: 12.5,
        color: GREEN, vis: [[9.0, 12]] },
    ],
    steps: [
      { t: 0, text: '为什么"逆后序"一定是拓扑序？关键在于这一句推理' },
      { t: 1.6, text: '假设有一条边 A → B' },
      { t: 2.8, text: 'DFS 从 A 出发时，会**先递归到 B**' },
      { t: 4.0, text: '因为 B 在递归更深处，它会**先回溯完、先拿到后序位置**' },
      { t: 6.0, text: '也就是说：**A 的后序位置比 B 更靠后**' },
      { t: 7.2, text: '那我们反过来用这个位置 —— 谁后序靠后就放前面' },
      { t: 8.4, text: '得到的结果里，A 就排在 B 前面了' },
      { t: 9.0, text: '这正是"A 必须在 B 之前"，也就是拓扑序的定义' },
      { t: 10.0, text: '所以在代码里，只需要**从数组最后往前填**就行' },
      { t: 11.0, text: '注意 DFS 版**不能直接用来检测环** —— 它照样会输出一个序列，只是有环时那个序列没意义' },
    ],
  }),

  // =========================================================================
  CAP('05-main', 'main —— 有环会怎样', '环上的顶点入度永远降不到 0', 11, {
    gnodes: [
      N('0', 380, 128, { vis: [[3.0, 11]], accent: 'del', badge: '入度 1' }),
      N('1', 600, 128, { vis: [[3.0, 11]], accent: 'del', badge: '入度 1' }),
      N('2', 490, 240, { vis: [[3.0, 11]], accent: 'del', badge: '入度 1' }),
    ],
    gedges: [
      { from: '0', to: '1', directed: true, state: { vis: [[3.0, 11]], accent: 'del' } },
      { from: '1', to: '2', directed: true, state: { vis: [[3.0, 11]], accent: 'del' } },
      { from: '2', to: '0', directed: true, state: { vis: [[3.0, 11]], accent: 'del' } },
    ],
    notes: [
      { x: 480, y: 268, anchor: 'middle', text: '0→1→2→0 的环：每个点的入度都是 1，谁也降不到 0', size: 12.5,
        color: RED, vis: [[3.0, 11]] },
      { x: 480, y: 268, anchor: 'middle', text: '一个都进不了队 → 队列一直空 → 输出 0 个', size: 12.5,
        color: AMBER, vis: [[6.0, 11]] },
      { x: 480, y: 268, anchor: 'middle', text: '所以：输出顶点数 < n ⟺ 有环', mono: true, size: 12.5,
        color: GREEN, vis: [[8.0, 11]] },
      { x: 480, y: 268, anchor: 'middle', text: '两个算法算出的序列不一样，但都合法 —— 拓扑排序不唯一', size: 12.5,
        color: BLUE, vis: [[0.6, 3.0]] },
    ],
    steps: [
      { t: 0, text: '正常的 AOV 网跑完之后，顺便看点别的' },
      { t: 0.6, text: 'Kahn 和 DFS 逆后序给出的序列不一样，但都合法 —— 拓扑排序不唯一' },
      { t: 1.8, text: '验证合法性只要检查：每条边的起点是不是都排在终点前面' },
      { t: 3.0, text: '现在换一个有环的图：0→1→2→0' },
      { t: 4.2, text: '每个顶点的入度都是 1 —— 也就是"每个任务都要等另一个"' },
      { t: 6.0, text: '入度为 0 的顶点一个都没有 → 队列从一开始就是空的' },
      { t: 7.2, text: '所以一个顶点也输出不了' },
      { t: 8.0, text: '于是得到一个漂亮的判据：**输出的顶点数 < n，就说明图里有环**' },
      { t: 9.2, text: '这就顺手解决了"判断有向图有没有环"这个问题' },
      { t: 10.2, text: '到这里 04 图这一章就讲完了 —— 下一章进入排序' },
    ],
  }),

];
