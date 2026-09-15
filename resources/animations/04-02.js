'use strict';
/**
 * 04-02 图的遍历 —— 动画场景
 *
 * 用三张图：
 *   环图  0-1，1-2，2-3，3-0            （看 DFS 绕圈）
 *   层次图 0 连 1、2；1 连 3、4；2 连 5、6（看 BFS 分层最明显）
 *   非连通 0-1 和 2-3                    （看 TraverseAll 的必要性）
 */

const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';
const BLUE = '#3B82F6';

const N = (id, x, y, state) => ({ id, label: id, x, y, state });
const E = (from, to, state) => ({ from, to, state });

/** 环图 */
const RING_POS = { '0': [390, 125], '1': [620, 125], '2': [620, 240], '3': [390, 240] };
const ringNodes = (vis, extra) => Object.keys(RING_POS).map((id) =>
  N(id, RING_POS[id][0], RING_POS[id][1], Object.assign({ vis }, (extra && extra[id]) || {})));
const ringEdges = (vis, extra) => [
  E('0', '1', Object.assign({ vis }, (extra && extra['0-1']) || {})),
  E('1', '2', Object.assign({ vis }, (extra && extra['1-2']) || {})),
  E('2', '3', Object.assign({ vis }, (extra && extra['2-3']) || {})),
  E('3', '0', Object.assign({ vis }, (extra && extra['3-0']) || {})),
];

/** 层次图（二叉树形状） */
const TREE_POS = {
  '0': [480, 105], '1': [340, 185], '2': [620, 185],
  '3': [265, 255], '4': [415, 255], '5': [545, 255], '6': [695, 255],
};
const treeNodes = (vis, extra) => Object.keys(TREE_POS).map((id) =>
  N(id, TREE_POS[id][0], TREE_POS[id][1], Object.assign({ vis }, (extra && extra[id]) || {})));
const treeEdges = (vis, extra) => [
  E('0', '1', Object.assign({ vis }, (extra && extra['0-1']) || {})),
  E('0', '2', Object.assign({ vis }, (extra && extra['0-2']) || {})),
  E('1', '3', Object.assign({ vis }, (extra && extra['1-3']) || {})),
  E('1', '4', Object.assign({ vis }, (extra && extra['1-4']) || {})),
  E('2', '5', Object.assign({ vis }, (extra && extra['2-5']) || {})),
  E('2', '6', Object.assign({ vis }, (extra && extra['2-6']) || {})),
];

const CAP = (no, title, sub, total, extra) => ({
  id: `04-02-${no}`,
  no,
  title,
  sub,
  bookTag: '图的遍历',
  variant: 'graph',
  accentColor: '#8250DF',
  total,
  ...extra,
});

module.exports = [

  // =========================================================================
  CAP('01-typedef', 'typedef —— 图 + visited 数组', '没有 visited，遍历就会绕圈绕到死', 9, {
    gnodes: ringNodes([[0.6, 9]], { '0': { vis: [[0.6, 9]], accent: 'hot', badge: '起点' } }),
    gedges: ringEdges([[0.6, 9]]),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: 'visited: 0 0 0 0    全是 0 表示都没去过', mono: true,
        size: 12.5, color: BLUE, vis: [[1.4, 4.6]] },
      { x: 480, y: 232, anchor: 'middle', text: '从这个环的 0 出发，没有标记就会：0 → 1 → 2 → 3 → 0 → 1 → …',
        size: 12.5, color: RED, vis: [[4.6, 9]] },
      { x: 480, y: 232, anchor: 'middle', text: '树不会绕圈（每个结点只有一个父亲），图会 —— 这是唯一的新麻烦',
        size: 12.5, color: AMBER, vis: [[6.4, 9]] },
    ],
    steps: [
      { t: 0, text: '树的遍历很轻松：从根出发，每个结点只有一条路能到' },
      { t: 1.4, text: '图里多了一个麻烦：**路会绕回来**' },
      { t: 2.6, text: '看这个图，0 连 1、1 连 2、2 连 3、3 又连回 0 —— 它本身就是一个环' },
      { t: 4.6, text: '从 0 出发一路走：0 → 1 → 2 → 3 → 又回到 0 → 1 → 2 …' },
      { t: 6.4, text: '所以图的遍历**必须**配一个 visited 数组，记录"去过没有"' },
      { t: 7.4, text: '树不需要它，因为树里不会有绕回来的路' },
      { t: 8.2, text: '这就是图和树在遍历上唯一的本质区别' },
    ],
  }),

  // =========================================================================
  CAP('02-DFS', 'DFS —— 深度优先（递归）', '一条路走到底，走不通了才回头', 12, {
    gnodes: ringNodes([[0, 12]], {
      '0': { vis: [[1.0, 12]], accent: 'visited', badge: '①' },
      '1': { vis: [[3.4, 12]], accent: 'visited', badge: '②' },
      '2': { vis: [[5.8, 12]], accent: 'visited', badge: '③' },
      '3': { vis: [[8.2, 12]], accent: 'visited', badge: '④' },
    }),
    gedges: ringEdges([[0, 12]], {
      '0-1': { vis: [[1.0, 12]], accent: 'new' },
      '1-2': { vis: [[3.4, 12]], accent: 'new' },
      '2-3': { vis: [[5.8, 12]], accent: 'new' },
    }),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '访问 0，标记；它的邻居有 1 和 3，先看 1', size: 12.5,
        color: GREEN, vis: [[1.0, 3.4]] },
      { x: 480, y: 232, anchor: 'middle', text: '访问 1 → 0 去过了 → 走 2 → 1 去过了 → 走 3', size: 12.5,
        color: GREEN, vis: [[3.4, 8.2]] },
      { x: 480, y: 232, anchor: 'middle', text: '3 的邻居 0、2 都去过 → 回头 → 一路退回去', size: 12.5,
        color: AMBER, vis: [[8.2, 12]] },
      { x: 480, y: 232, anchor: 'middle', text: '结果：0 1 2 3', mono: true, size: 13,
        color: GREEN, vis: [[10.2, 12]] },
    ],
    steps: [
      { t: 0, text: 'DFS 的思路：一条路走到底，走不通了才回头' },
      { t: 1.0, text: '从 0 出发：标记 0，打印 0', code: 'visited[v] = 1;  printf("%d ", v);' },
      { t: 2.2, text: '0 的邻居有 1 和 3，按编号从小到大先看 1' },
      { t: 3.4, text: '进入 1：标记、打印。它的邻居是 0 和 2' },
      { t: 4.6, text: '0 已经访问过了 → 跳过；走 2' },
      { t: 5.8, text: '进入 2：邻居 1 去过了 → 走 3' },
      { t: 7.0, text: '进入 3：邻居 0 和 2 都去过了' },
      { t: 8.2, text: '没路可走 → **回头**。函数返回就是回头' },
      { t: 9.2, text: '一路退回 2、1、0，都没别的邻居了' },
      { t: 10.2, text: '结果 0 1 2 3 —— 注意它和"一层一层"完全无关' },
      { t: 11.0, text: '标记要放在函数**最前面**。放进循环里的话，有环时还是会重复访问' },
      { t: 11.6, text: '递归版最好懂，但深度受调用栈限制 —— 下一个模块改成显式栈' },
    ],
  }),

  // =========================================================================
  CAP('03-DFSIter', 'DFSIter —— 深度优先（栈）', '把"下一步回哪儿"明确记下来', 10, {
    gnodes: ringNodes([[0, 10]], {
      '0': { vis: [[1.4, 10]], accent: 'visited', badge: '①' },
      '1': { vis: [[3.6, 10]], accent: 'visited', badge: '②' },
      '2': { vis: [[5.6, 10]], accent: 'visited', badge: '③' },
      '3': { vis: [[7.6, 10]], accent: 'visited', badge: '④' },
    }),
    gedges: ringEdges([[0, 10]], {
      '0-1': { vis: [[1.4, 10]], accent: 'new' },
      '1-2': { vis: [[3.6, 10]], accent: 'new' },
      '2-3': { vis: [[5.6, 10]], accent: 'new' },
    }),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '栈里存"待访问的顶点"，出栈时标记和打印', mono: true,
        size: 12.5, color: BLUE, vis: [[1.4, 10]] },
      { x: 480, y: 232, anchor: 'middle', text: '邻居要**逆序压栈**（从大到小），弹出才是从小到大', mono: true,
        size: 12.5, color: AMBER, vis: [[5.0, 10]] },
      { x: 480, y: 232, anchor: 'middle', text: '结果和递归版一样：0 1 2 3', mono: true, size: 12.5,
        color: GREEN, vis: [[8.0, 10]] },
    ],
    steps: [
      { t: 0, text: '递归版最好懂，但递归深度受调用栈限制，顶点一多可能栈溢出' },
      { t: 1.4, text: '改成显式栈：把"下一步要回哪儿"明确记在数组里', code: 'int stack[MAXV];  int top = -1;' },
      { t: 3.0, text: '起点入栈，然后循环：弹出一个、标记、打印、把没去过的邻居压进去' },
      { t: 5.0, text: '关键细节：邻居要**逆序压栈**', code: 'for (i = G->nv - 1; i >= 0; i--)  if (...) stack[++top] = i;' },
      { t: 6.6, text: '因为栈是后进先出 —— 从大到小压进去，弹出来才是从小到大' },
      { t: 8.0, text: '这样结果就和递归版完全一致：0 1 2 3' },
      { t: 9.0, text: '如果正序压栈，结果会变成 0 3 2 1 —— 也是合法的 DFS，但和递归版不一致' },
    ],
  }),

  // =========================================================================
  CAP('04-BFS', 'BFS —— 广度优先', '先把一圈邻居看完，再往外扩一层', 12, {
    gnodes: treeNodes([[0, 12]], {
      '0': { vis: [[1.0, 12]], accent: 'visited', badge: '第0层' },
      '1': { vis: [[3.4, 12]], accent: 'visited', badge: '第1层' },
      '2': { vis: [[3.8, 12]], accent: 'visited', badge: '第1层' },
      '3': { vis: [[6.4, 12]], accent: 'visited', badge: '第2层' },
      '4': { vis: [[6.8, 12]], accent: 'visited', badge: '第2层' },
      '5': { vis: [[7.2, 12]], accent: 'visited', badge: '第2层' },
      '6': { vis: [[7.6, 12]], accent: 'visited', badge: '第2层' },
    }),
    gedges: treeEdges([[0, 12]], {
      '0-1': { vis: [[3.4, 12]], accent: 'new' },
      '0-2': { vis: [[3.8, 12]], accent: 'new' },
      '1-3': { vis: [[6.4, 12]], accent: 'new' },
      '1-4': { vis: [[6.8, 12]], accent: 'new' },
      '2-5': { vis: [[7.2, 12]], accent: 'new' },
      '2-6': { vis: [[7.6, 12]], accent: 'new' },
    }),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '出队 0 → 邻居 1、2 都没去过 → 依次访问并入队', size: 12.5,
        color: GREEN, vis: [[3.4, 6.4]] },
      { x: 480, y: 232, anchor: 'middle', text: '出队 1 → 访问 3、4；出队 2 → 访问 5、6', size: 12.5,
        color: GREEN, vis: [[6.4, 9.4]] },
      { x: 480, y: 232, anchor: 'middle', text: '结果按层来：0 → 1 2 → 3 4 5 6', mono: true, size: 13,
        color: GREEN, vis: [[9.4, 12]] },
      { x: 480, y: 232, anchor: 'middle', text: '入队时就要立刻标记，不能拖到出队 —— 否则会重复入队', size: 12.5,
        color: RED, vis: [[10.6, 12]] },
    ],
    steps: [
      { t: 0, text: 'BFS：先把一圈邻居都看完，再往外扩一层' },
      { t: 1.0, text: '从 0 出发：标记、打印、入队', code: 'visited[v] = 1;  printf(...);  queue[rear++] = v;' },
      { t: 3.4, text: '出队 0，把它的邻居 1、2 都访问掉并入队' },
      { t: 4.6, text: '注意此时队列里是 [1, 2] —— 同一层的点凑在一起了' },
      { t: 6.4, text: '出队 1：访问它的邻居 3、4' },
      { t: 7.6, text: '出队 2：访问它的邻居 5、6' },
      { t: 8.6, text: '出队 3、4、5、6：它们都是叶子，没有新邻居' },
      { t: 9.4, text: '结果 0 1 2 3 4 5 6 —— 严格按层来的' },
      { t: 10.6, text: '一个容易写错的地方：**入队的时候就要立刻标记**' },
      { t: 11.4, text: '如果等出队才标记，同一个点会被多个邻居重复入队 —— 小图上不明显，图一大就暴露' },
    ],
  }),

  // =========================================================================
  CAP('05-TraverseAll', 'TraverseAll —— 遍历整张图', '外层循环负责发现新的连通分量', 10, {
    gnodes: [
      N('0', 300, 130, { vis: [[1.4, 10]], accent: 'visited' }),
      N('1', 440, 130, { vis: [[2.4, 10]], accent: 'visited' }),
      N('2', 640, 130, { vis: [[5.0, 10]], accent: 'new' }),
      N('3', 780, 130, { vis: [[6.0, 10]], accent: 'new' }),
    ],
    gedges: [
      E('0', '1', { vis: [[1.4, 10]], accent: 'new' }),
      E('2', '3', { vis: [[5.0, 10]], accent: 'new' }),
    ],
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '只从 0 出发：只走到 0 和 1，2、3 永远碰不到', size: 12.5,
        color: RED, vis: [[2.4, 5.0]] },
      { x: 480, y: 232, anchor: 'middle', text: '外层套一个循环：谁没去过就从谁出发再来一次', size: 12.5,
        color: GREEN, vis: [[5.0, 8.0]] },
      { x: 480, y: 232, anchor: 'middle', text: '外层循环转了几次，图就有几个连通分量', size: 12.5,
        color: BLUE, vis: [[8.0, 10]] },
    ],
    steps: [
      { t: 0, text: '前面的 DFS、BFS 都只保证"走完起点所在的那一块"' },
      { t: 1.4, text: '如果图是**非连通**的（比如 0-1 和 2-3 两块），从 0 出发永远碰不到 2、3' },
      { t: 3.6, text: '所以遍历整张图要写成两层：外层扫描所有顶点，内层走完一块' },
      { t: 5.0, text: '谁没访问过，就从谁出发再起一次遍历', code: 'for (v = 0; v < nv; v++) if (!visited[v]) { count++; DFS(G, v, visited); }' },
      { t: 6.8, text: '第一次从 0 出发走完 {0,1}，第二次从 2 出发走完 {2,3}' },
      { t: 8.0, text: '外层循环每进入一次内层，就发现了**一个新的连通分量**' },
      { t: 9.0, text: '所以这个循环还有个副产品：转了几次，图就有几个连通分量' },
    ],
  }),

  // =========================================================================
  CAP('06-main', 'main —— 两种遍历对着看', '同一张图，DFS 和 BFS 给出两个序列', 11, {
    gnodes: treeNodes([[0.8, 11]], {
      '0': { vis: [[0.8, 11]], accent: 'hot', badge: '起点' },
    }),
    gedges: treeEdges([[0.8, 11]]),
    notes: [
      { x: 480, y: 244, anchor: 'middle', text: 'DFS：0 1 3 4 2 5 6      一条路走到黑', mono: true,
        size: 12.5, color: BLUE, vis: [[3.0, 11]] },
      { x: 480, y: 244, anchor: 'middle', text: 'BFS：0 1 2 3 4 5 6      按层扩散', mono: true,
        size: 12.5, color: GREEN, vis: [[5.6, 11]] },
      { x: 480, y: 244, anchor: 'middle', text: 'BFS 的"按层"性质，后面求最短路径会用到', size: 12.5,
        color: AMBER, vis: [[8.4, 11]] },
    ],
    steps: [
      { t: 0, text: '用一棵"二叉树形状的图"来看两种遍历的差别最清楚' },
      { t: 0.8, text: '从 0 出发，0 连着 1 和 2；1 连着 3、4；2 连着 5、6' },
      { t: 3.0, text: 'DFS：沿着 0 → 1 → 3 一路钻下去，走完了才回头' },
      { t: 4.2, text: '再回头处理 4，然后才轮到 0 的另一个邻居 2' },
      { t: 5.6, text: 'BFS：先把 0 的两个邻居 1、2 都看完' },
      { t: 7.0, text: '再去看 1 的邻居 3、4 和 2 的邻居 5、6' },
      { t: 8.4, text: 'BFS 的输出严格按"距离起点的层数"排列' },
      { t: 9.4, text: '这个性质后面很有用：**无权图里，BFS 第一次到达某点的路径就是最短路径**' },
      { t: 10.2, text: '下一节的最短路径（Dijkstra）就是在这个思想上加了权值' },
    ],
  }),

];
