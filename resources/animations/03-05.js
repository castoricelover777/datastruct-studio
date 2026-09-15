'use strict';
/**
 * 03-05 哈夫曼树 —— 动画场景
 *
 * 权值 {5, 2, 7, 1, 4} 建出来的树：
 *           9(19)
 *         /       \
 *      8(12)      7(7)
 *      /   \      /   \
 *   1(5)  3(7)  6(3)  5(4)
 *                /  \
 *              4(1) 2(2)
 *
 * 括号里是权值，前面的数字是数组下标。
 */

const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';
const BLUE = '#3B82F6';

/** 最终建出来的树 */
const T = {
  v: '19',
  l: { v: '12', l: { v: '5' }, r: { v: '7' } },
  r: { v: '7', l: { v: '3', l: { v: '1' }, r: { v: '2' } }, r: { v: '4' } },
};

const pathsOf = (n, p, out) => {
  out = out || [];
  out.push(p);
  if (n.l) pathsOf(n.l, p + '.l', out);
  if (n.r) pathsOf(n.r, p + '.r', out);
  return out;
};
const vis = (root, v, extra) => {
  const out = {};
  for (const p of pathsOf(root, 'root')) out[p] = Object.assign({ vis: v }, (extra && extra[p]) || {});
  return out;
};
const edg = (root, v, extra) => {
  const o = vis(root, v, extra);
  delete o.root;
  return o;
};

const CAP = (no, title, sub, total, extra) => ({
  id: `03-05-${no}`,
  no,
  title,
  sub,
  bookTag: '哈夫曼树',
  variant: 'tree',
  accentColor: '#8250DF',
  total,
  ...extra,
});

module.exports = [

  // =========================================================================
  CAP('01-typedef', 'typedef —— 哈夫曼结点', '数组存树：权值 + 父亲 + 左右孩子', 9, {
    tree: T,
    nodes: vis(T, [[0.6, 9]], {
      root: { badge: '内部' }, 'root.l': { badge: '内部' }, 'root.r': { badge: '内部' },
      'root.l.l': { badge: '叶子' }, 'root.l.r': { badge: '叶子' },
      'root.r.l': { badge: '内部' }, 'root.r.r': { badge: '叶子' },
      'root.r.l.l': { badge: '叶子' }, 'root.r.l.r': { badge: '叶子' },
    }),
    edges: edg(T, [[0.6, 9]]),
    notes: [
      { x: 480, y: 238, anchor: 'middle', text: '结点结构：weight + parent + left + right（都是下标）', mono: true,
        size: 12.5, color: BLUE, vis: [[1.4, 9]] },
      { x: 480, y: 238, anchor: 'middle', text: 'n 个叶子 → 内部结点 n−1 个 → 总共 2n−1 个', mono: true,
        size: 12.5, color: AMBER, vis: [[3.4, 9]] },
      { x: 480, y: 238, anchor: 'middle', text: '为什么要 parent？① 挑选时排除用过的 ② 生成编码要从下往上走',
        size: 12.5, color: GREEN, vis: [[6.0, 9]] },
    ],
    steps: [
      { t: 0, text: '哈夫曼树要反复找"权值最小的两个"，所以用数组存比指针方便' },
      { t: 0.6, text: '所有结点排成一排，下标一扫就知道谁最小', code: 'typedef struct { int weight; int parent, left, right; } HTNode;' },
      { t: 1.4, text: 'parent / left / right 存的都是**数组下标**，0 表示「没有」' },
      { t: 3.4, text: 'n 个叶子要合并 n−1 次，所以内部结点有 n−1 个', code: '#define 总数 = 2n - 1' },
      { t: 5.0, text: '数组开 2n+1 格（下标 0 空着当空指针）' },
      { t: 6.0, text: '两个地方要用到 parent：挑选时排除已合并的、生成编码时从下往上走' },
      { t: 7.4, text: '所以虽然树是"从上往下"的父子关系，算法里大量用的是"从下往上"' },
      { t: 8.4, text: '这一点和普通二叉树很不一样' },
    ],
  }),

  // =========================================================================
  CAP('02-SelectTwoMin', 'SelectTwoMin —— 选出两个最小的', '前提是「还没有父亲」', 9, {
    tree: { v: '候选池：5 2 7 1 4' },
    nodes: { root: { vis: [[0.6, 9]], accent: 'hot' } },
    edges: {},
    notes: [
      { x: 480, y: 175, anchor: 'middle', text: '挑最小的两个 → 4 号（权 1）和 2 号（权 2）', mono: true,
        size: 12.5, color: GREEN, vis: [[1.4, 5.0]] },
      { x: 480, y: 175, anchor: 'middle', text: '给 4 号安上父亲之后，它就不该再被挑中', size: 12.5,
        color: RED, vis: [[5.0, 9]] },
    ],
    steps: [
      { t: 0, text: '建树的每一步都要"挑两个权值最小的"，所以先把这个函数写对' },
      { t: 1.4, text: '遍历所有结点，一边找最小、一边找次小', code: 'if (min1 == -1 || HT[i].weight < HT[min1].weight) { min2 = min1; min1 = i; }' },
      { t: 3.2, text: '一遍扫下来两个都拿到，不用扫两遍' },
      { t: 5.0, text: '关键前提：**parent == 0 的才能参与挑选**' },
      { t: 6.0, text: '已经合并过的结点已经有父亲了，再挑它就重复了' },
      { t: 7.0, text: '这一条漏掉的话，程序照样能跑完 —— 只是建出来的树不对，WPL 偏大' },
      { t: 8.2, text: '这种"不崩但结果是错的" bug 最难查，所以一定要检查 parent' },
    ],
  }),

  // =========================================================================
  CAP('03-HuffmanCreate', 'HuffmanCreate —— 建树', '反复挑两个最小的合并，直到只剩一个', 13, {
    tree: T,
    nodes: vis(T, [[0.6, 13]], {
      root: { vis: [[1.0, 13]], accent: 'new' },
      'root.l': { vis: [[4.0, 13]], accent: 'new' },
      'root.r': { vis: [[8.5, 13]], accent: 'new' },
      'root.l.l': { vis: [[0.6, 13]] }, 'root.l.r': { vis: [[0.6, 13]] },
      'root.r.l': { vis: [[2.5, 13]], accent: 'new' },
      'root.r.r': { vis: [[0.6, 13]] },
      'root.r.l.l': { vis: [[0.6, 13]] }, 'root.r.l.r': { vis: [[0.6, 13]] },
    }),
    edges: edg(T, [[0.6, 13]]),
    notes: [
      { x: 480, y: 238, anchor: 'middle', text: '① 挑 1 和 2 → 合并成 3', mono: true, size: 12.5,
        color: GREEN, vis: [[0.6, 4.0]] },
      { x: 480, y: 238, anchor: 'middle', text: '② 挑 3 和 4 → 合并成 7（新结点也参与挑选）', mono: true,
        size: 12.5, color: GREEN, vis: [[4.0, 8.5]] },
      { x: 480, y: 238, anchor: 'middle', text: '③ 挑 5 和 7 → 合并成 12；④ 挑 7 和 12 → 根 19', mono: true,
        size: 12.5, color: GREEN, vis: [[8.5, 13]] },
    ],
    steps: [
      { t: 0, text: '建树的过程非常朴素：反复挑两个最小的合并' },
      { t: 1.0, text: '第一轮：在五个叶子里挑最小的两个 —— 权值 1 和 2', code: 'SelectTwoMin(HT, i - 1, &s1, &s2);' },
      { t: 2.5, text: '合并成新结点 6，权值是 1 + 2 = 3' },
      { t: 3.2, text: '两个孩子的 parent 都指向 6，6 的左右孩子指向它们', code: 'HT[s1].parent = i;  HT[s2].parent = i;\n HT[i].left = s1;  HT[i].right = s2;\n HT[i].weight = HT[s1].weight + HT[s2].weight;' },
      { t: 4.0, text: '第二轮：候选变成 5、7、4、3（新结点 3 也参与挑选）' },
      { t: 5.4, text: '挑最小的两个：3 和 4 → 合并成 7' },
      { t: 6.8, text: '注意第一轮用过的 1 和 2 已经有父亲了，不再参与' },
      { t: 8.5, text: '第三轮：候选 5、7、7 → 挑 5 和 7 → 合并成 12' },
      { t: 10.0, text: '第四轮：候选 7 和 12 → 合并成 19，它就是根' },
      { t: 11.2, text: '根的特征：parent 还是 0' },
      { t: 12.2, text: '全程没有"谁该在上面"的判断 —— 只挑了 n−1 次最小的两个' },
    ],
  }),

  // =========================================================================
  CAP('04-HuffmanCodes', 'HuffmanCodes —— 生成编码', '从叶子往根走，左 0 右 1', 11, {
    tree: T,
    nodes: vis(T, [[0.6, 11]], {
      root: { badge: '根' },
      'root.l.l': { vis: [[1.6, 11]], accent: 'new', badge: '权 5 → 10' },
      'root.l.r': { vis: [[3.6, 11]], accent: 'hot', badge: '权 7 → 11' },
      'root.r.r': { vis: [[6.0, 11]], accent: 'hot', badge: '权 4 → 01' },
      'root.r.l.l': { vis: [[8.0, 11]], accent: 'hot', badge: '权 1 → 000' },
      'root.r.l.r': { vis: [[9.4, 11]], accent: 'hot', badge: '权 2 → 001' },
    }),
    edges: edg(T, [[0.6, 11]]),
    notes: [
      { x: 480, y: 238, anchor: 'middle', text: '权值最大的 7 拿到最短的编码 11', mono: true, size: 12.5,
        color: GREEN, vis: [[3.6, 11]] },
      { x: 480, y: 238, anchor: 'middle', text: '权值最小的 1 拿到最长的 000', mono: true, size: 12.5,
        color: RED, vis: [[8.0, 11]] },
      { x: 480, y: 238, anchor: 'middle', text: '前缀码：没有任何编码是别人的前缀 —— 所以解码不会歧义',
        size: 12.5, color: BLUE, vis: [[9.4, 11]] },
    ],
    steps: [
      { t: 0, text: '约定：往左走记 0，往右走记 1' },
      { t: 1.6, text: '从根走到某个叶子，路上那串 0/1 就是它的编码' },
      { t: 2.6, text: '但数组里只有父子关系，没有"我是左还是右"的信息 —— 那要往下看才知道' },
      { t: 3.6, text: '所以反过来做：**从叶子往上走到根**，每步判断自己是父亲的左还是右', code: 'for (c = i, p = HT[i].parent; p != 0; c = p, p = HT[p].parent)' },
      { t: 5.4, text: '这样记出来的 0/1 顺序是**倒的**，需要翻转' },
      { t: 6.4, text: '实现上的小技巧：从缓冲区**尾部往前填**，填完就直接是正确顺序', code: 'cd[n - 1] = \'\\0\';   start = n - 1;   ...  cd[--start] = \'0\';' },
      { t: 8.0, text: '权值 1（最小）走了三步，拿到最长的编码 000' },
      { t: 9.4, text: '权值 7（最大）只走两步，拿到最短的 11' },
      { t: 10.2, text: '**权值越大编码越短** —— 这就是压缩的来源' },
    ],
  }),

  // =========================================================================
  CAP('05-GetWPL', 'GetWPL —— 带权路径长度', '每个叶子往上数层数，乘上权值加起来', 10, {
    tree: T,
    nodes: vis(T, [[0.6, 10]], {
      'root.l.l': { badge: '2层 ×5=10' },
      'root.l.r': { badge: '2层 ×7=14' },
      'root.r.r': { badge: '2层 ×4=8' },
      'root.r.l.l': { badge: '3层 ×1=3' },
      'root.r.l.r': { badge: '3层 ×2=6' },
    }),
    edges: edg(T, [[0.6, 10]]),
    notes: [
      { x: 480, y: 238, anchor: 'middle', text: 'WPL = 5×2 + 7×2 + 4×2 + 1×3 + 2×3 = 41', mono: true,
        size: 12.5, color: GREEN, vis: [[4.0, 10]] },
      { x: 480, y: 238, anchor: 'middle', text: 'WPL = Σ (叶子的权值 × 叶子的层数)', mono: true, size: 12.5,
        color: BLUE, vis: [[0.6, 4.0]] },
      { x: 480, y: 238, anchor: 'middle', text: '权值大的放得浅、小的放得深 —— 这个值就是所有方案里最小的',
        size: 12.5, color: AMBER, vis: [[6.4, 10]] },
    ],
    steps: [
      { t: 0, text: '怎么衡量一棵哈夫曼树"好不好"？用带权路径长度 WPL' },
      { t: 1.4, text: 'WPL = Σ (叶子的权值 × 它到根的层数)', code: 'int GetWPL(...) { ... wpl += depth * HT[i].weight; ... }' },
      { t: 3.0, text: '层数怎么数？从叶子顺着 parent 往上走，走一步加一层' },
      { t: 4.0, text: '这棵树：', name: '逐个算' },
      { t: 4.6, text: '权值 5、7、4 都在第 2 层 → 5×2 + 7×2 + 4×2 = 32' },
      { t: 5.8, text: '权值 1、2 在第 3 层 → 1×3 + 2×3 = 9' },
      { t: 6.4, text: '加起来 41。这就是这五个叶子的最小带权路径长度' },
      { t: 7.6, text: '换个组织方式试试：把 7 放到第 3 层，WPL 一定会变大' },
      { t: 8.8, text: '哈夫曼算法的目标就是让这个值最小 —— 而它给出的解确实是最小的',
        name: '哈夫曼定理' },
    ],
  }),

  // =========================================================================
  CAP('06-PrintCoding', 'PrintCoding —— 打印与自查', '权值大的编码短，且互不为前缀', 9, {
    tree: T,
    nodes: vis(T, [[0.6, 9]], {
      'root.l.r': { vis: [[2.0, 9]], accent: 'new' },
      'root.r.l.l': { vis: [[5.0, 9]], accent: 'del' },
    }),
    edges: edg(T, [[0.6, 9]]),
    notes: [
      { x: 480, y: 238, anchor: 'middle', text: '权值 7 → 11　　权值 1 → 000', mono: true, size: 12.5,
        color: BLUE, vis: [[2.0, 9]] },
      { x: 480, y: 238, anchor: 'middle', text: '定长编码要 3 位（5 个字符至少 3 位），哈夫曼平均只要 2.2 位',
        size: 12.5, color: GREEN, vis: [[5.0, 9]] },
      { x: 480, y: 238, anchor: 'middle', text: '自查两件事：① 权值大编码短 ② 没有编码是别人的前缀',
        size: 12.5, color: AMBER, vis: [[6.6, 9]] },
    ],
    steps: [
      { t: 0, text: '生成完编码，要检查两件事' },
      { t: 2.0, text: '① 权值和编码长度成反比 —— 权值大的编码短' },
      { t: 3.0, text: '这是哈夫曼编码能压缩文件的原因：常用的字符用短码' },
      { t: 4.2, text: '这里定长编码要 3 位（5 个字符至少 3 位才能区分开），哈夫曼平均只要 2.2 位' },
      { t: 5.0, text: '② 没有任何编码是另一个的前缀' },
      { t: 6.0, text: '为什么天然成立？因为所有叶子都在树的末端' },
      { t: 6.6, text: '从根到叶子的路径不可能"是到另一个叶子的路径的前缀" —— 走到叶子就停了' },
      { t: 7.8, text: '这个性质叫**前缀码**，它保证解码不歧义：拿一串 0/1 从根走下去，撞到叶子就解出一个字符' },
    ],
  }),

  // =========================================================================
  CAP('07-FreeAll', 'FreeAll —— 释放', '先里后外：编码字符串 → 编码表 → 结点数组', 8, {
    tree: T,
    nodes: vis(T, [[0, 8]]),
    edges: edg(T, [[0, 8]]),
    notes: [
      { x: 480, y: 238, anchor: 'middle', text: 'HC 是 char **，里面每个字符串都是单独 malloc 的', size: 12.5,
        color: BLUE, vis: [[1.4, 8]] },
      { x: 480, y: 238, anchor: 'middle', text: '释放"指针的数组"时，永远从里往外放', size: 12.5,
        color: AMBER, vis: [[5.0, 8]] },
    ],
    steps: [
      { t: 0, text: '哈夫曼树占了两块内存：结点数组、还有编码表' },
      { t: 1.4, text: 'HC 是 char ** —— 一个指针数组，每个元素指向一个单独 malloc 的字符串' },
      { t: 3.0, text: '所以要先一个个 free 掉里面的字符串', code: 'for (i = 1; i <= n; i++) free(HC[i]);' },
      { t: 5.0, text: '再 free HC 数组本身，最后 free 结点数组' },
      { t: 6.0, text: '顺序反了会怎样？HC 已经被释放，就没法再拿到里面那些指针了 —— 直接泄漏' },
      { t: 7.2, text: '记住这个套路：**释放"指针的数组"时，永远从里往外放**' },
    ],
  }),

  // =========================================================================
  CAP('08-main', 'main —— 把哈夫曼树跑一遍', '权值是字符出现次数，编码就是压缩方案', 10, {
    tree: T,
    nodes: vis(T, [[0.8, 10]], {
      root: { accent: 'new' },
      'root.l.l': { badge: '5' }, 'root.l.r': { badge: '7' },
      'root.r.r': { badge: '4' }, 'root.r.l.l': { badge: '1' }, 'root.r.l.r': { badge: '2' },
    }),
    edges: edg(T, [[0.8, 10]]),
    notes: [
      { x: 480, y: 238, anchor: 'middle', text: '权值 5 2 7 1 4 → 建树 → WPL 41 → 编码表', mono: true,
        size: 12.5, color: BLUE, vis: [[1.4, 10]] },
      { x: 480, y: 238, anchor: 'middle', text: '出现最多的字符拿到最短编码 —— 这就是文件压缩', size: 12.5,
        color: GREEN, vis: [[6.0, 10]] },
      { x: 480, y: 238, anchor: 'middle', text: 'gzip、zip、JPEG 里都在用同一套思路', size: 12.5,
        color: AMBER, vis: [[7.6, 10]] },
    ],
    steps: [
      { t: 0, text: '用一个真实场景收尾：权值就是每个字符在文本里出现的次数' },
      { t: 0.8, text: '五个字符 A:5 B:2 C:7 D:1 E:4' },
      { t: 2.2, text: '建树、算 WPL、生成编码 —— 三步走完' },
      { t: 3.6, text: 'WPL = 41，意思是这段文本用哈夫曼编码只需要 41 位' },
      { t: 5.0, text: '如果每个字符都用 3 位定长编码，需要 (5+2+7+1+4) × 3 = 57 位' },
      { t: 6.0, text: '省下来的部分就是压缩率 —— 出现越集中，省得越多' },
      { t: 7.6, text: 'gzip、zip、PNG、JPEG 里都在用同一套思路（不同点只在"权值怎么来"）' },
      { t: 9.0, text: '这一节把树的应用收了个尾：从"怎么组织数据"到"怎么省空间"' },
    ],
  }),

];
