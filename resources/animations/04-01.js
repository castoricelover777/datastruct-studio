'use strict';
/**
 * 04-01 图的表示 —— 动画场景
 *
 * 全篇用这张正方形图：0-1，1-2，2-3，3-0
 *        0 ── 1
 *        │    │
 *        3 ── 2
 */

const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';
const BLUE = '#3B82F6';

const N = (id, x, y, state) => ({ id, label: id, x, y, state });
const E = (from, to, state) => ({ from, to, state });

const POS = { '0': [390, 128], '1': [620, 128], '2': [620, 240], '3': [390, 240] };
const nodes = (vis, extra) => Object.keys(POS).map((id) =>
  N(id, POS[id][0], POS[id][1], Object.assign({ vis }, (extra && extra[id]) || {})));
const edges = (vis, extra) => [
  E('0', '1', Object.assign({ vis }, (extra && extra['0-1']) || {})),
  E('1', '2', Object.assign({ vis }, (extra && extra['1-2']) || {})),
  E('2', '3', Object.assign({ vis }, (extra && extra['2-3']) || {})),
  E('3', '0', Object.assign({ vis }, (extra && extra['3-0']) || {})),
];

const CAP = (no, title, sub, total, extra) => ({
  id: `04-01-${no}`,
  no,
  title,
  sub,
  bookTag: '图的表示',
  variant: 'graph',
  accentColor: '#8250DF',
  total,
  ...extra,
});

module.exports = [

  // =========================================================================
  CAP('01-typedef', 'typedef —— 两种存法', '邻接矩阵用二维数组，邻接表用数组加链表', 9, {
    gnodes: nodes([[0.6, 9]]),
    gedges: edges([[0.6, 9]]),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '邻接矩阵：G[i][j] 表示 i 到 j 有没有边', mono: true,
        size: 12.5, color: BLUE, vis: [[1.4, 5.0]] },
      { x: 480, y: 232, anchor: 'middle', text: '邻接表：每个顶点挂一条链表，串着它的所有邻居', size: 12.5,
        color: AMBER, vis: [[5.0, 9]] },
      { x: 480, y: 232, anchor: 'middle', text: '选哪个取决于图是稠密还是稀疏', size: 12.5,
        color: '#8C959F', vis: [[7.2, 9]] },
    ],
    steps: [
      { t: 0, text: '图和树的区别只有一句话：树是「一对多」，图是「多对多」' },
      { t: 0.6, text: '树里每个结点只有一个父亲，所以不会绕圈；图里谁都能连谁' },
      { t: 1.4, text: '第一种存法：**邻接矩阵** —— 一个二维数组', code: 'int g[MAXV][MAXV];   /* g[i][j] 非 0 表示有边 */' },
      { t: 3.0, text: '无向图里，i 到 j 有边就说明 j 到 i 也有边 —— 所以矩阵是对称的' },
      { t: 4.2, text: '好处是判断"两点是否相邻"只要一次数组访问，O(1)' },
      { t: 5.0, text: '第二种存法：**邻接表** —— 每个顶点挂一条链表' , code: 'typedef struct AdjNode { int adjv; struct AdjNode *next; } AdjNode;' },
      { t: 7.2, text: '空间是 O(n+e)：有多少边就占多少空间，稀疏图下省得多' },
      { t: 8.2, text: '但判断相邻要顺着链表找，最坏 O(n)' },
    ],
  }),

  // =========================================================================
  CAP('02-CreateMatrix', 'CreateMatrix —— 建邻接矩阵', '逐条边填两个格子，别忘了另一个方向', 12, {
    gnodes: nodes([[0, 12]]),
    gedges: edges([[0, 12]], {
      '0-1': { vis: [[1.6, 4.2]], accent: 'new' },
      '1-2': { vis: [[4.2, 6.4]], accent: 'new' },
      '2-3': { vis: [[6.4, 8.4]], accent: 'new' },
      '3-0': { vis: [[8.4, 12]], accent: 'new' },
    }),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '① 矩阵清零：G->g[i][j] = 0', mono: true, size: 12.5,
        color: BLUE, vis: [[0.6, 1.6]] },
      { x: 480, y: 232, anchor: 'middle', text: '加边 (0,1)：g[0][1] = 1 且 g[1][0] = 1', mono: true,
        size: 12.5, color: GREEN, vis: [[1.6, 4.2]] },
      { x: 480, y: 232, anchor: 'middle', text: '剩下三条边照做 —— 每条边都填两个格子', mono: true,
        size: 12.5, color: GREEN, vis: [[4.2, 9.6]] },
      { x: 480, y: 232, anchor: 'middle', text: '只填一半是最常见的错误：图能跑，但只能单向走', size: 12.5,
        color: RED, vis: [[9.6, 12]] },
    ],
    steps: [
      { t: 0, text: '建邻接矩阵分两步' },
      { t: 0.6, text: '① 整个矩阵清零，表示「什么边都没有」', code: 'for (i...) for (j...) G->g[i][j] = 0;' },
      { t: 1.6, text: '② 逐条边填格子。第一条边 (0,1)：' },
      { t: 2.6, text: '两个方向都要填', code: 'G->g[u][v] = 1;\n G->g[v][u] = 1;' },
      { t: 4.2, text: '第二条边 (1,2)，同样填两个格子' },
      { t: 6.4, text: '第三条 (2,3)' },
      { t: 8.4, text: '第四条 (3,0) —— 填完之后矩阵就完整了' },
      { t: 9.6, text: '无向图的矩阵**一定是对称的**：G[i][j] == G[j][i]' },
      { t: 10.8, text: '如果只填了 G[u][v]，那这张图只能"从 u 走到 v"，反着走不通' },
      { t: 11.4, text: '有向图才只填一个格子 —— 这是有向和无向在存储上的唯一区别' },
    ],
  }),

  // =========================================================================
  CAP('03-CreateList', 'CreateList —— 建邻接表', '每个顶点一条链表，用头插', 12, {
    gnodes: nodes([[0, 12]], {
      '0': { vis: [[0, 12]], accent: 'hot' },
      '1': { vis: [[0, 12]], accent: 'hot' },
    }),
    gedges: edges([[0, 12]], {
      '0-1': { vis: [[2.0, 4.4]], accent: 'new' },
      '1-2': { vis: [[4.4, 6.4]], accent: 'new' },
      '2-3': { vis: [[6.4, 8.4]], accent: 'new' },
      '3-0': { vis: [[8.4, 12]], accent: 'new' },
    }),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '加边 (0,1)：在 0 的链表插一个 [1]，在 1 的链表插一个 [0]',
        size: 12.5, color: GREEN, vis: [[2.0, 4.4]] },
      { x: 480, y: 232, anchor: 'middle', text: '加边 (2,3)：2 的链表插 [3]，3 的链表插 [2]', size: 12.5,
        color: GREEN, vis: [[6.4, 8.4]] },
      { x: 480, y: 232, anchor: 'middle', text: '加边 (3,0)：0 的链表现在有 [1] 和 [3]', size: 12.5,
        color: GREEN, vis: [[8.4, 12]] },
      { x: 480, y: 232, anchor: 'middle', text: '用头插：不用找尾，O(1) 完成（代价是顺序和插边顺序相反）',
        size: 12.5, color: AMBER, vis: [[4.4, 6.4]] },
    ],
    steps: [
      { t: 0, text: '邻接表也是两步：链表头置空、逐条边插结点' },
      { t: 2.0, text: '加边 (0,1)：u 和 v 两边都要插', code: 'AddEdgeNode(G, u, v, 1);\n AddEdgeNode(G, v, u, 1);' },
      { t: 3.4, text: '于是 0 的链表里有了 [1]，1 的链表里有了 [0]' },
      { t: 4.4, text: '插件点用**头插**：新结点指向原来的第一个，链表头改指新结点', code: 'node->next = G->head[u];\n G->head[u] = node;' },
      { t: 6.4, text: '加边 (2,3)，同样两边各插一个' },
      { t: 8.4, text: '加边 (3,0)：0 的链表里现在有两个结点了 —— [1] 和 [3]' },
      { t: 9.8, text: '头插不用找尾，O(1) 就完成' },
      { t: 10.6, text: '代价是链表里的顺序和插边顺序**相反** —— 要按编号输出就得另外排序' },
      { t: 11.4, text: '邻居之间的先后本来就不重要，所以这个代价通常可以接受' },
    ],
  }),

  // =========================================================================
  CAP('04-PrintMatrix', 'PrintMatrix —— 打印矩阵', '看矩阵要检查三件事', 9, {
    gnodes: nodes([[0.6, 9]]),
    gedges: edges([[0.6, 9]]),
    notes: [
      { x: 480, y: 222, anchor: 'middle', text: '     0  1  2  3', mono: true, size: 12.5,
        color: BLUE, vis: [[1.4, 9]] },
      { x: 480, y: 240, anchor: 'middle', text: ' 0 [ 0  1  0  1 ]      每行 1 的个数 = 该顶点的度', mono: true,
        size: 12.5, color: GREEN, vis: [[3.4, 9]] },
      { x: 480, y: 258, anchor: 'middle', text: ' 1 [ 1  0  1  0 ]      对角线必须全是 0（没有自环）', mono: true,
        size: 12.5, color: AMBER, vis: [[5.4, 9]] },
      { x: 480, y: 276, anchor: 'middle', text: ' 2 [ 0  1  0  1 ]      矩阵必须对称（无向图）', mono: true,
        size: 12.5, color: RED, vis: [[7.0, 9]] },
    ],
    steps: [
      { t: 0, text: '打印出来看一眼，比在脑子里想有用得多' },
      { t: 1.4, text: '先看对角线：全是 0 才说明没有"自己连自己"的自环' },
      { t: 3.4, text: '再看每行 1 的个数 —— 那就是该顶点的度' },
      { t: 5.4, text: '最后看对称性：无向图的矩阵必须关于对角线对称' },
      { t: 6.4, text: '不对称就说明建图时只填了一半格子', name: '最常见的错误' },
      { t: 7.0, text: '这个检查在代码里顺手就能做，是个很好的自我保护' },
      { t: 8.0, text: '顶点一多，矩阵打印出来会很宽 —— 这时邻接表反而更好看' },
    ],
  }),

  // =========================================================================
  CAP('05-PrintList', 'PrintList —— 打印邻接表', '每个顶点一行，顺带数出它的度', 9, {
    gnodes: nodes([[0.6, 9]], {
      '0': { vis: [[0.6, 9]], accent: 'hot' },
    }),
    gedges: edges([[0.6, 9]]),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '0 → [3] [1]   (度 = 2)', mono: true, size: 12.5,
        color: BLUE, vis: [[1.4, 9]] },
      { x: 480, y: 232, anchor: 'middle', text: '链表里的结点数就是这个顶点的度', size: 12.5,
        color: GREEN, vis: [[3.6, 9]] },
      { x: 480, y: 232, anchor: 'middle', text: '顺序是 [3] [1] 而不是 [1] [3] —— 头插的结果', mono: true,
        size: 12.5, color: AMBER, vis: [[5.6, 9]] },
    ],
    steps: [
      { t: 0, text: '打印邻接表：每个顶点一行' },
      { t: 1.4, text: '顶点 0 的邻居是 [3] 和 [1] —— 它的度就是 2' },
      { t: 3.6, text: '无向图里，**每个顶点的度 = 它链表里的结点数**' },
      { t: 5.6, text: '注意输出的顺序：先 [3] 后 [1]，和加边的顺序正好相反' },
      { t: 6.8, text: '因为用的是头插 —— 后插进来的排在最前面' },
      { t: 7.6, text: '如果题目要求"按编号从小到大输出邻居"，就得先把链表收集到数组里再排序' },
      { t: 8.4, text: '这也是邻接表用起来比矩阵稍微麻烦的地方' },
    ],
  }),

  // =========================================================================
  CAP('06-FreeList', 'FreeList —— 释放邻接表', '先记住 next，再 free 当前结点', 9, {
    gnodes: nodes([[0, 4.0]], {
      '0': { vis: [[0, 4.0]], accent: 'del' },
      '1': { vis: [[0, 4.0]], accent: 'del' },
      '2': { vis: [[0, 6.0]], accent: 'del' },
      '3': { vis: [[0, 8.0]], accent: 'del' },
    }),
    gedges: edges([[0, 9]], { '0-1': { vis: [[0, 4.0]], accent: 'del' } }),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '每个边结点都是单独 malloc 的，要一个个放', size: 12.5,
        color: RED, vis: [[0.6, 9]] },
      { x: 480, y: 232, anchor: 'middle', text: '顺序：q = p->next;  free(p);  p = q;', mono: true,
        size: 12.5, color: AMBER, vis: [[3.0, 9]] },
      { x: 480, y: 232, anchor: 'middle', text: '先 free 再取 next 的话，那块内存已经还回去了 —— 读它就是未定义行为',
        size: 12.5, color: RED, vis: [[6.0, 9]] },
    ],
    steps: [
      { t: 0, text: '邻接表和矩阵最大的不同：它里面全是 malloc 出来的结点' },
      { t: 1.4, text: '矩阵是结构体里的固定数组，不用释放；邻接表必须逐个释放' },
      { t: 3.0, text: '释放链表的标准三步：', name: '标准写法' },
      { t: 3.6, text: '① 先记住下一个结点', code: 'q = p->next;' },
      { t: 4.8, text: '② 再释放当前结点', code: 'free(p);' },
      { t: 6.0, text: '③ 往后走', code: 'p = q;' },
      { t: 7.0, text: '顺序反了会怎样？free(p) 之后再读 p->next，那块内存已经还给系统了' },
      { t: 8.0, text: '这就是典型的"释放后使用"，可能读到垃圾值、也可能直接崩' },
      { t: 8.8, text: '最后别忘了把链表头置空，否则留下野指针' },
    ],
  }),

  // =========================================================================
  CAP('07-main', 'main —— 两种存法摆在一起', '同一张图，两种建法、两种查法', 11, {
    gnodes: nodes([[0.8, 11]], {
      root: { vis: [[0.8, 11]] },
      '0': { vis: [[0.8, 11]], accent: 'hot' },
    }),
    gedges: edges([[0.8, 11]]),
    notes: [
      { x: 480, y: 238, anchor: 'middle', text: '矩阵：4×4 = 16 个格子，查边 O(1)', mono: true,
        size: 12.5, color: BLUE, vis: [[2.0, 11]] },
      { x: 480, y: 238, anchor: 'middle', text: '邻接表：4 个链表头 + 8 个边结点，查边 O(n)', mono: true,
        size: 12.5, color: AMBER, vis: [[4.6, 11]] },
      { x: 480, y: 238, anchor: 'middle', text: '1000 个顶点、2000 条边时：矩阵 100 万格，邻接表 5000 个结点',
        size: 12.5, color: RED, vis: [[7.6, 11]] },
    ],
    steps: [
      { t: 0, text: '同一张图，用两种方式建一遍，对比一下' },
      { t: 0.8, text: '先建邻接矩阵，打印出来' },
      { t: 2.0, text: '矩阵最大的好处：判断两点是否相邻只要一次数组访问', code: 'return G->g[i][j] != 0;   /* O(1) */' },
      { t: 4.6, text: '再建邻接表，也打印一遍 —— 每个顶点的度一目了然' },
      { t: 6.0, text: '邻接表查边要顺着链表找，最坏 O(n)', code: 'while (p != NULL) { if (p->adjv == j) return 1; p = p->next; }' },
      { t: 7.6, text: '顶点一多，空间差距就惊人了' },
      { t: 8.4, text: '1000 个顶点、2000 条边：矩阵要 100 万个格子，邻接表只要 5000 个结点' },
      { t: 9.6, text: '差 200 倍 —— 而实际中的图绝大多数都是稀疏的' },
      { t: 10.4, text: '所以：**稠密图用矩阵，稀疏图用邻接表**。这一章后面统一用矩阵，因为它短而直观' },
    ],
  }),

];
