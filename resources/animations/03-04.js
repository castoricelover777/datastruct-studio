'use strict';
/**
 * 03-04 堆 —— 动画场景
 *
 * 用树渲染器（堆就是完全二叉树），数组顺序通过标注说明。
 * 全篇用这个最小堆：
 *          1
 *        /   \
 *       3     2
 *      / \   /
 *     6   7 5
 * 数组（下标从 1 起）：1 3 2 6 7 5
 */

const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';
const BLUE = '#3B82F6';

const H = { v: '1', l: { v: '3', l: { v: '6' }, r: { v: '7' } }, r: { v: '2', l: { v: '5' } } };
const ALL = ['root', 'root.l', 'root.r', 'root.l.l', 'root.l.r', 'root.r.l'];

const vis = (root, v, extra) => {
  const paths = (n, p) => { const o = [p]; if (n.l) paths(n.l, p + '.l').forEach((x) => o.push(x)); if (n.r) paths(n.r, p + '.r').forEach((x) => o.push(x)); return o; };
  const out = {};
  for (const p of paths(root, 'root')) out[p] = Object.assign({ vis: v }, (extra && extra[p]) || {});
  return out;
};
const edg = (root, v, extra) => {
  const o = vis(root, v, extra);
  delete o.root;
  return o;
};

const CAP = (no, title, sub, total, extra) => ({
  id: `03-04-${no}`,
  no,
  title,
  sub,
  bookTag: '堆',
  variant: 'tree',
  accentColor: '#0891B2',
  total,
  tree: H,
  ...extra,
});

module.exports = [

  // =========================================================================
  CAP('01-typedef', 'typedef —— 堆长什么样', '完全二叉树，可以直接用数组存', 9, {
    nodes: vis(H, [[0.6, 9]], {
      root: { badge: '1' }, 'root.l': { badge: '2' }, 'root.r': { badge: '3' },
      'root.l.l': { badge: '4' }, 'root.l.r': { badge: '5' }, 'root.r.l': { badge: '6' },
    }),
    edges: edg(H, [[0.6, 9]]),
    notes: [
      { x: 480, y: 236, anchor: 'middle', text: '数组（下标从 1 起）：1  3  2  6  7  5', mono: true,
        size: 12.5, color: BLUE, vis: [[1.6, 9]] },
      { x: 480, y: 236, anchor: 'middle', text: '父 i 的左孩子 2i、右孩子 2i+1、父亲 i/2', mono: true,
        size: 12.5, color: AMBER, vis: [[3.0, 9]] },
      { x: 480, y: 236, anchor: 'middle', text: '堆只保证「父 <= 子」，兄弟之间没有大小关系', size: 12.5,
        color: GREEN, vis: [[5.6, 9]] },
    ],
    steps: [
      { t: 0, text: '堆是一棵完全二叉树，而且每个结点都不大于（或不小于）它的孩子' },
      { t: 0.6, text: '结点上的小数字是数组下标 —— 层序编号', name: '下标即位置' },
      { t: 1.6, text: '因为形状规整（除最后一层都满、最后一层靠左），父子关系可以直接算出来' },
      { t: 3.0, text: '所以整棵树就是一段连续内存，一个指针都不用', code: 'data: [哨兵, 1, 3, 2, 6, 7, 5]' },
      { t: 4.4, text: '下标从 1 开始，0 号位置放哨兵 —— 这样 i/2、2i、2i+1 三个式子最干净' },
      { t: 5.6, text: '注意：堆只保证「父 <= 子」，**兄弟之间、叔侄之间没有任何大小约定**' },
      { t: 7.0, text: '所以堆能 O(1) 拿到最小值，但查任意值要 O(n) —— 这点和 BST 完全不同' },
      { t: 8.2, text: '别把堆和 BST 搞混：一个管最值，一个管查找' },
    ],
  }),

  // =========================================================================
  CAP('02-CreateHeap', 'CreateHeap —— 建一个空堆', '分配数组、放好哨兵、size 归零', 8, {
    tree: { v: '哨兵' },
    nodes: { root: { vis: [[0.8, 8]], accent: 'hot' } },
    edges: {},
    notes: [
      { x: 480, y: 175, anchor: 'middle', text: '0 号位置放 MINDATA：一个比所有元素都小的值', size: 12.5,
        color: AMBER, vis: [[1.6, 5.4]] },
      { x: 480, y: 175, anchor: 'middle', text: '它让上浮循环不用再写边界判断', size: 12.5,
        color: GREEN, vis: [[5.4, 8]] },
    ],
    steps: [
      { t: 0, text: '建一个空堆：分配数组、size 归零' },
      { t: 0.8, text: '数组要多开一格 —— 0 号位置留给哨兵', code: 'H->data = malloc((capacity + 1) * sizeof(int));' },
      { t: 1.6, text: '哨兵值设成一个比所有元素都小的数', code: 'H->data[0] = MINDATA;' },
      { t: 3.4, text: '哨兵是干什么用的？看后面的上浮就明白了' },
      { t: 5.4, text: '上浮的循环条件是「父亲 > 自己」。走到根时 i/2 = 0，而 data[0] 一定不满足' },
      { t: 6.6, text: '所以循环自然停下，省掉了一次边界判断' },
      { t: 7.4, text: '这是个很典型的小技巧：用一个不可能被越过的值，来省掉边界检查' },
    ],
  }),

  // =========================================================================
  CAP('03-PercDown', 'PercDown —— 向下调整（下沉）', '跟较小的孩子比，比自己小就搬上来', 12, {
    tree: { v: '8', l: { v: '3', l: { v: '6' }, r: { v: '7' } }, r: { v: '2', l: { v: '5' } } },
    nodes: {
      root: { vis: [[0, 12]], accent: 'del', badge: '要沉下去' },
      'root.l': { vis: [[0, 12]], accent: 'hot' },
      'root.r': { vis: [[0, 12]], accent: 'new' },
      'root.l.l': { vis: [[0, 12]] },
      'root.l.r': { vis: [[0, 12]] },
      'root.r.l': { vis: [[0, 12]], accent: 'new' },
    },
    edges: edg({ v: '8', l: { v: '3', l: { v: '6' }, r: { v: '7' } }, r: { v: '2', l: { v: '5' } } }, [[0, 12]]),
    notes: [
      { x: 480, y: 236, anchor: 'middle', text: '根是 8，比它的孩子大 —— 不合规矩，要沉下去', mono: true,
        size: 12.5, color: RED, vis: [[0.6, 3.4]] },
      { x: 480, y: 236, anchor: 'middle', text: '先看两个孩子：3 和 2，2 更小 → 2 搬上来', mono: true,
        size: 12.5, color: AMBER, vis: [[3.4, 6.6]] },
      { x: 480, y: 236, anchor: 'middle', text: '8 落到 2 的位置，再和它的孩子 5 比 → 5 更小 → 5 搬上来', mono: true,
        size: 12.5, color: AMBER, vis: [[6.6, 9.6]] },
      { x: 480, y: 236, anchor: 'middle', text: '8 没有孩子了，停下 —— 整棵树恢复堆序', mono: true,
        size: 12.5, color: GREEN, vis: [[9.6, 12]] },
    ],
    steps: [
      { t: 0, text: '下沉：把位置不对的较大元素一路往下沉' },
      { t: 0.6, text: '根上的 8 比孩子大，破坏规矩了' },
      { t: 2.0, text: '第一步：在两个孩子里挑**更小的那个**', code: 'if (child != H->size && H->data[child] > H->data[child + 1]) child++;' },
      { t: 3.4, text: '3 和 2 比，2 更小 → 把 2 搬上来，8 沉到 2 原来的位置' },
      { t: 5.2, text: '注意 `child != H->size` 这个判断：完全二叉树里常常只有一个左孩子，去比右孩子会读到堆外面' },
      { t: 6.6, text: '接着 8 和它的孩子 5 比 → 5 更小 → 5 搬上来', code: 'if (x <= H->data[child]) break;' },
      { t: 8.6, text: '什么时候停？发现自己已经不大于那个较小的孩子，位置就对了' },
      { t: 9.6, text: '8 现在没有孩子了，自然停下' },
      { t: 10.6, text: '整棵树恢复堆序：1 3 2 6 7 5 变成了 2 3 5 6 7 8' },
    ],
  }),

  // =========================================================================
  CAP('04-PercUp', 'PercUp —— 向上调整（上浮）', '跟父亲比，比自己大就压下来', 11, {
    tree: { v: '0', l: { v: '3', l: { v: '6' }, r: { v: '7' } }, r: { v: '1', l: { v: '5' }, r: { v: '2' } } },
    nodes: {
      root: { vis: [[4.4, 11]], accent: 'new', badge: '升上来了' },
      'root.l': { vis: [[0, 11]] },
      'root.r': { vis: [[0, 11]], accent: 'del', badge: '原来在这' },
      'root.l.l': { vis: [[0, 11]] },
      'root.l.r': { vis: [[0, 11]] },
      'root.r.l': { vis: [[0, 11]] },
      'root.r.r': { vis: [[0, 3.2]], accent: 'del' },
    },
    edges: edg({ v: '0', l: { v: '3', l: { v: '6' }, r: { v: '7' } }, r: { v: '1', l: { v: '5' }, r: { v: '2' } } }, [[0, 11]]),
    notes: [
      { x: 480, y: 236, anchor: 'middle', text: '新元素 0 先放到数组末尾（保持形状），再上浮', mono: true,
        size: 12.5, color: BLUE, vis: [[0.6, 4.4]] },
      { x: 480, y: 236, anchor: 'middle', text: '0 比父亲 1 小 → 1 压下来，0 上去；再比父亲 2 → 0 到根', mono: true,
        size: 12.5, color: AMBER, vis: [[4.4, 8.0]] },
      { x: 480, y: 236, anchor: 'middle', text: '走到 i=1 时 i/2=0，哨兵 MINDATA 一定不大于 0 → 循环自然停',
        mono: true, size: 12.5, color: GREEN, vis: [[8.0, 11]] },
    ],
    steps: [
      { t: 0, text: '上浮和下沉是镜面对称的：一个跟孩子比，一个跟父亲比' },
      { t: 0.6, text: '上浮用在插入：新元素先放到数组末尾，保持完全二叉树的形状', code: 'H->data[++H->size] = x;' },
      { t: 2.6, text: '为什么必须放末尾？随便插会破坏形状，父子下标关系就不成立了' },
      { t: 4.4, text: '然后让它一路往上顶：只要父亲比自己大，就换位', code: 'for (i = p; H->data[i/2] > x; i /= 2) H->data[i] = H->data[i/2];' },
      { t: 6.4, text: '0 比父亲 1 小 → 1 压下来；再比新的父亲 2 → 0 成了根' },
      { t: 8.0, text: '循环为什么不用写 i > 1 这个边界？因为 0 号位置是哨兵' },
      { t: 9.2, text: 'i 走到 1 时 i/2 = 0，data[0] = MINDATA 一定不大于任何元素，循环自然结束' },
      { t: 10.2, text: '这就是哨兵的价值：省掉一次边界判断' },
    ],
  }),

  // =========================================================================
  CAP('05-BuildHeap', 'BuildHeap —— 建堆', '从最后一个非叶结点开始往前下沉', 11, {
    tree: { v: '1', l: { v: '3', l: { v: '6' }, r: { v: '7' } }, r: { v: '2', l: { v: '5' }, r: { v: '4' } } },
    nodes: {
      root: { vis: [[0, 3.0]], accent: 'del', badge: '最后一个非叶是 3 号' },
      'root.l': { vis: [[0, 11]], accent: 'hot' },
      'root.r': { vis: [[0, 11]], accent: 'hot' },
      'root.l.l': { vis: [[0, 11]] },
      'root.l.r': { vis: [[0, 11]] },
      'root.r.l': { vis: [[0, 11]] },
      'root.r.r': { vis: [[0, 11]] },
    },
    edges: edg({ v: '1', l: { v: '3', l: { v: '6' }, r: { v: '7' } }, r: { v: '2', l: { v: '5' }, r: { v: '4' } } }, [[0, 11]]),
    notes: [
      { x: 480, y: 236, anchor: 'middle', text: 'n = 7 时，下标大于 3 的（4~7）全是叶子，不用管', size: 12.5,
        color: BLUE, vis: [[1.4, 5.0]] },
      { x: 480, y: 236, anchor: 'middle', text: '所以从 n/2 = 3 开始，往前逐个下沉', size: 12.5,
        color: AMBER, vis: [[5.0, 8.0]] },
      { x: 480, y: 236, anchor: 'middle', text: '整体是 O(n) —— 不是 O(n log n)', size: 12.5,
        color: GREEN, vis: [[8.0, 11]] },
    ],
    steps: [
      { t: 0, text: '手上有一堆无序的数，怎么整理成堆？' },
      { t: 1.4, text: '关键观察：完全二叉树里，**下标大于 n/2 的结点全是叶子**' },
      { t: 2.6, text: '叶子没有孩子，本来就是一个合法的堆，不用动' },
      { t: 3.8, text: '所以只需要从最后一个有孩子的结点（n/2）开始往前调', code: 'for (i = H->size / 2; i > 0; i--) PercDown(H, i);' },
      { t: 5.0, text: '为什么往前而不是往后？因为下沉要求"子树已经是堆"，从后往前才满足' },
      { t: 6.4, text: '那复杂度为什么不是 O(n log n)？' },
      { t: 8.0, text: '因为**大部分结点都在底层，它们下沉的距离很短**：', name: '为什么是 O(n)' },
      { t: 8.6, text: '倒数第二层最多沉 1 层（结点很多）；根最多沉 log n 层（只有 1 个）' },
      { t: 9.8, text: '把每层"结点数 × 下沉层数"加起来，级数收敛，总和是 O(n)' },
      { t: 10.6, text: '所以一堆数要建堆时用 BuildHeap，不要一个个 Insert（那是 O(n log n)）' },
    ],
  }),

  // =========================================================================
  CAP('06-Insert', 'Insert —— 插入', '放末尾保住形状，再上浮恢复堆序', 9, {
    tree: { v: '0', l: { v: '3', l: { v: '6' }, r: { v: '7' } }, r: { v: '1', l: { v: '5' }, r: { v: '2' } } },
    nodes: {
      root: { vis: [[3.0, 9]], accent: 'new' },
      'root.l': { vis: [[0, 9]] }, 'root.r': { vis: [[0, 9]] },
      'root.l.l': { vis: [[0, 9]] }, 'root.l.r': { vis: [[0, 9]] },
      'root.r.l': { vis: [[0, 9]] }, 'root.r.r': { vis: [[0, 3.0]], accent: 'del' },
    },
    edges: edg({ v: '0', l: { v: '3', l: { v: '6' }, r: { v: '7' } }, r: { v: '1', l: { v: '5' }, r: { v: '2' } } }, [[0, 9]]),
    notes: [
      { x: 480, y: 236, anchor: 'middle', text: '插入 0：先放数组末尾 → 再上浮', mono: true, size: 12.5,
        color: BLUE, vis: [[0.6, 6.0]] },
      { x: 480, y: 236, anchor: 'middle', text: '顺序固定：形状优先，再调顺序', size: 12.5,
        color: AMBER, vis: [[0.6, 6.0]] },
      { x: 480, y: 236, anchor: 'middle', text: '删除正好相反：先调顺序，形状自然保持', size: 12.5,
        color: GREEN, vis: [[6.0, 9]] },
    ],
    steps: [
      { t: 0, text: '插入就两步，顺序不能换' },
      { t: 0.6, text: '① 放到数组末尾 —— 这样完全二叉树的形状一定还是合法的', code: 'H->data[++H->size] = x;' },
      { t: 2.0, text: '② 上浮到合适位置，恢复堆序', code: 'PercUp(H, H->size);' },
      { t: 3.0, text: '0 比父亲小就换位，一路顶到根' },
      { t: 4.6, text: '如果先调顺序再考虑形状，就会顾此失彼 —— 所以顺序是固定的' },
      { t: 6.0, text: '删除最小值正好相反：把末尾元素搬到根上（形状自然保持），再下沉调整顺序' },
      { t: 7.4, text: '记住这一对：插入「先形状后顺序」，删除「先顺序形状自然保持」' },
      { t: 8.4, text: '两者都是 O(log n)，因为树的深度是 log n' },
    ],
  }),

  // =========================================================================
  CAP('07-DeleteMin', 'DeleteMin —— 删除最小值', '把末尾元素搬到根上，再一路下沉', 12, {
    tree: { v: '2', l: { v: '3', l: { v: '6' }, r: { v: '7' } }, r: { v: '5' } },
    nodes: {
      root: { vis: [[4.0, 12]], accent: 'new', badge: '末尾的 5 搬到这' },
      'root.l': { vis: [[0, 12]] },
      'root.r': { vis: [[4.0, 12]] },
      'root.l.l': { vis: [[0, 12]] },
      'root.l.r': { vis: [[0, 12]] },
    },
    edges: edg({ v: '2', l: { v: '3', l: { v: '6' }, r: { v: '7' } }, r: { v: '5' } }, [[0, 12]]),
    notes: [
      { x: 480, y: 236, anchor: 'middle', text: '① 最小值就在根上，直接记下来拿走', mono: true, size: 12.5,
        color: GREEN, vis: [[0.6, 4.0]] },
      { x: 480, y: 236, anchor: 'middle', text: '② 把末尾元素搬到根上，size 减一 —— 形状还是完整', mono: true,
        size: 12.5, color: BLUE, vis: [[4.0, 8.0]] },
      { x: 480, y: 236, anchor: 'middle', text: '③ 让它下沉到位，恢复堆序', mono: true, size: 12.5,
        color: AMBER, vis: [[8.0, 12]] },
    ],
    steps: [
      { t: 0, text: '最小值就在根上，拿走很容易。麻烦的是"补位"' },
      { t: 0.6, text: '① 记下根的值 —— 这是要返回的答案', code: 'minItem = H->data[1];' },
      { t: 2.0, text: '② 把**最后一个元素**搬到根上，size 减一', code: 'H->data[1] = H->data[H->size--];' },
      { t: 4.0, text: '为什么搬末尾元素？因为搬走它之后，剩下的还是一棵完全二叉树' },
      { t: 5.4, text: '如果随便挑一个搬到根上，形状就破了 —— 数组存树的前提也就没了' },
      { t: 6.6, text: '③ 让这个元素下沉到位', code: 'PercDown(H, 1);' },
      { t: 8.0, text: '5 的孩子是 3 和 2，2 更小 → 2 搬上来；5 再往上比，停住' },
      { t: 9.6, text: '删完之后，剩下的仍然是一个合法的堆' },
      { t: 10.6, text: '连着删到空，输出就是从小到大的 —— 这就是堆排序的雏形' },
    ],
  }),

  // =========================================================================
  CAP('08-PrintHeap', 'PrintHeap / CheckHeap —— 打印与自查', '数组顺序看不出堆序，得专门检查', 8, {
    nodes: vis(H, [[0.6, 8]], {
      root: { badge: '1' }, 'root.l': { badge: '3' }, 'root.r': { badge: '2' },
      'root.l.l': { badge: '6' }, 'root.l.r': { badge: '7' }, 'root.r.l': { badge: '5' },
    }),
    edges: edg(H, [[0.6, 8]]),
    notes: [
      { x: 480, y: 236, anchor: 'middle', text: '数组打印：1 3 2 6 7 5 —— 看不出堆序', mono: true,
        size: 12.5, color: BLUE, vis: [[1.4, 5.0]] },
      { x: 480, y: 236, anchor: 'middle', text: 'CheckHeap：逐个结点检查「父 <= 子」', mono: true,
        size: 12.5, color: GREEN, vis: [[5.0, 8]] },
    ],
    steps: [
      { t: 0, text: '写完堆怎么自查？打印数组只能看到一串数字，看不出堆序' },
      { t: 1.4, text: '因为**数组顺序不代表任何大小关系** —— 堆只保证父子之间有序' },
      { t: 3.0, text: '所以要专门写一个检查：逐个结点看看是不是 <= 它的孩子', code: 'if (H->data[i] > H->data[i * 2]) return 0;' },
      { t: 5.0, text: '左右孩子都要查，而且有右孩子时才比右孩子' },
      { t: 6.0, text: '堆的 bug 往往不会崩，只是顺序悄悄错了 —— 比如下沉方向写反' },
      { t: 7.0, text: 'CheckHeap 跑一遍就能把这类问题揪出来' },
    ],
  }),

  // =========================================================================
  CAP('09-main', 'main —— 把堆跑一遍', '建堆、插入、删除，每一步都检查堆序', 11, {
    nodes: vis(H, [[0.8, 11]], {
      root: { accent: 'new' }, 'root.l': {}, 'root.r': {}, 'root.l.l': {}, 'root.l.r': {}, 'root.r.l': {},
    }),
    edges: edg(H, [[0.8, 11]]),
    notes: [
      { x: 480, y: 236, anchor: 'middle', text: '原始 6 3 7 1 5 2 4 → 建堆后 1 3 2 6 5 7 4', mono: true,
        size: 12.5, color: BLUE, vis: [[1.4, 4.4]] },
      { x: 480, y: 236, anchor: 'middle', text: '插入 0 → 堆顶变成 0', mono: true, size: 12.5,
        color: GREEN, vis: [[4.4, 7.0]] },
      { x: 480, y: 236, anchor: 'middle', text: '连续删最小值，输出一定是从小到大', mono: true, size: 12.5,
        color: AMBER, vis: [[7.0, 11]] },
    ],
    steps: [
      { t: 0, text: '把堆的操作串起来跑一遍，每一步都自查' },
      { t: 1.4, text: '一堆无序的数 → BuildHeap → 合法的堆' },
      { t: 3.0, text: '堆顶一定是全堆最小值，这是堆最核心的性质' },
      { t: 4.4, text: '插入一个更小的值，它会自己浮到顶上去' },
      { t: 6.0, text: '删最小值时，末尾元素搬到根上再下沉' },
      { t: 7.0, text: '连续删到空，输出的顺序一定是从小到大' },
      { t: 8.4, text: '这不是巧合 —— 下一章讲堆排序时会用到这一点' },
      { t: 9.6, text: '每一步都用 CheckHeap 检查一遍，比盯着数组看可靠得多' },
    ],
  }),

];
