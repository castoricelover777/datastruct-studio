'use strict';
/**
 * 03-01 二叉树基础 —— 动画场景
 *
 * 全篇用同一棵树，方便对照四种遍历：
 *         A
 *       /   \
 *      B     C
 *     / \     \
 *    D   E     F
 * 先序序列：ABD##E##C#F##
 */

const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';
const BLUE = '#3B82F6';

/** 标准测试树 */
const T = {
  v: 'A',
  l: { v: 'B', l: { v: 'D' }, r: { v: 'E' } },
  r: { v: 'C', r: { v: 'F' } },
};
const ALL = ['root', 'root.l', 'root.r', 'root.l.l', 'root.l.r', 'root.r.r'];

/** 让所有结点/边从 t0 起可见 */
const allNodes = (t0, extra) => {
  const o = {};
  for (const p of ALL) o[p] = Object.assign({ vis: [[t0, 20]] }, (extra && extra[p]) || {});
  return o;
};
const allEdges = (t0, extra) => {
  const o = {};
  for (const p of ALL) {
    if (p === 'root') continue;
    o[p] = Object.assign({ vis: [[t0, 20]] }, (extra && extra[p]) || {});
  }
  return o;
};

const CAP = (no, title, sub, total, extra) => ({
  id: `03-01-${no}`,
  no,
  title,
  sub,
  bookTag: '二叉树',
  variant: 'tree',
  accentColor: GREEN,
  total,
  tree: T,
  ...extra,
});

module.exports = [

  // =========================================================================
  CAP('01-typedef', 'typedef —— 二叉树结点的结构', '一个数据域 + 左右两个孩子指针', 8, {
    tree: { v: 'A' },
    nodes: { root: { vis: [[0.6, 8]], accent: 'hot' } },
    edges: {},
    notes: [
      { x: 480, y: 175, anchor: 'middle', text: '每个结点要记住"两个孩子在哪"', size: 13,
        color: BLUE, vis: [[0.6, 3.4]] },
      { x: 480, y: 175, anchor: 'middle', text: 't->left = NULL;   t->right = NULL;   两个都要置空',
        mono: true, size: 12.5, color: AMBER, vis: [[3.4, 6.0]] },
      { x: 480, y: 175, anchor: 'middle', text: '没有孩子就是 NULL —— 树里空指针是正常状态，到处都是',
        size: 12.5, color: GREEN, vis: [[6.0, 8]] },
      { x: 480, y: 210, anchor: 'middle', text: '链表一个 next（线），树两个指针（层次）',
        size: 12.5, color: '#8C959F', vis: [[6.0, 8]] },
    ],
    steps: [
      { t: 0, text: '二叉树的结点除了数据，还要存两个孩子' },
      { t: 0.6, text: '一个数据域', code: 'ElemType data;' },
      { t: 2.0, text: '两个指针：左孩子、右孩子', code: 'struct TNode *left;\n struct TNode *right;' },
      { t: 3.4, text: '造结点时两个指针都要置空 —— 少一个就是野指针', code: 't->left = NULL;   t->right = NULL;' },
      { t: 5.2, text: '和链表比：链表一个 next 走成一条线，树两个指针形成层次' },
      { t: 6.0, text: '左右是有区别的：换一下就是另一棵树（这点和"度为 2 的树"不同）' },
    ],
  }),

  // =========================================================================
  CAP('02-NewNode', 'NewNode —— 造一个结点', '申请内存、填数据、两个孩子置空', 8, {
    tree: { v: 'X' },
    nodes: { root: { vis: [[0.6, 8]], accent: 'new', rise: 0.6 } },
    edges: {},
    notes: [
      { x: 480, y: 175, anchor: 'middle', text: '申请一块 TNode 大小的内存', size: 12.5,
        vis: [[0.6, 2.4]] },
      { x: 480, y: 175, anchor: 'middle', text: '填数据：t->data = e;', mono: true, size: 12.5,
        color: BLUE, vis: [[2.4, 4.2]] },
      { x: 480, y: 175, anchor: 'middle', text: 'left / right 都置 NULL —— 和链表的 creatNode 只差这一点',
        size: 12.5, color: AMBER, vis: [[4.2, 6.4]] },
      { x: 480, y: 175, anchor: 'middle', text: '这时候它是个"孤立结点"：不属于任何树',
        size: 12.5, color: '#8C959F', vis: [[6.4, 8]] },
    ],
    steps: [
      { t: 0, text: '树的每一步操作都要先有结点，所以先看怎么造一个' },
      { t: 0.6, text: '申请内存', code: 'BinTree t = (BinTree)malloc(sizeof(TNode));' },
      { t: 2.4, text: '填数据域', code: 't->data = e;' },
      { t: 4.2, text: '两个孩子都置空 —— 千万别只置一个', code: 't->left = NULL;   t->right = NULL;' },
      { t: 6.4, text: '此时它是个孤立结点，谁也没指向它，它也没指向谁' },
      { t: 7.2, text: '接下来就靠 CreateTree 把它接进树里', name: '下一步：建树' },
    ],
  }),

  // =========================================================================
  CAP('03-CreateTree', 'CreateTree —— 先序建树', '读一个字符建一个结点，靠递归接上孩子', 10, {
    tree: { v: 'A' },
    nodes: { root: { vis: [[1.0, 10]], accent: 'new', rise: 1.0 } },
    edges: {},
    notes: [
      { x: 480, y: 175, anchor: 'middle', text: '序列 ABD##E##C#F##   （# 表示空孩子）', mono: true,
        size: 13, color: BLUE, vis: [[0, 3.4]] },
      { x: 480, y: 175, anchor: 'middle', text: "读到 'A' → 建根结点，接着递归建它的左子树", mono: true,
        size: 12.5, vis: [[1.0, 3.4]] },
      { x: 480, y: 175, anchor: 'middle', text: "读到 '#' → 这里没有孩子，返回 NULL", mono: true,
        size: 12.5, color: RED, vis: [[3.4, 6.0]] },
      { x: 480, y: 175, anchor: 'middle', text: '关键：游标 i 要传指针 —— 递归的每一层共享同一个进度',
        size: 12.5, color: AMBER, vis: [[6.0, 9.0]] },
    ],
    steps: [
      { t: 0, text: '用一段字符描述一棵树：先序 + # 表示空' },
      { t: 1.0, text: "读 'A'：建结点，它就是根", code: 'BinTree t = NewNode(c);' },
      { t: 2.2, text: '接着递归建左子树 —— 后面的字符都属于它', code: 't->left = CreateTree(s, i);' },
      { t: 3.4, text: "读到 '#' 就说明这里是空的，直接返回 NULL", code: "if (c == '#' || c == '\\0') return NULL;" },
      { t: 5.0, text: '左子树建完，游标 i 已经自动挪到了右子树的起点', code: 't->right = CreateTree(s, i);' },
      { t: 6.0, text: '为什么 i 必须传指针？因为递归各层要共享同一个读取进度', name: 'i 必须传址', code: 'BinTree CreateTree(const char *s, int *i)' },
      { t: 8.0, text: '整串读完，树就建好了 —— 全程没有一行显式的"接孩子"' },
    ],
  }),

  // =========================================================================
  CAP('04-PreOrder', 'PreOrder —— 先序遍历', '根 → 左 → 右：先打印自己，再管孩子', 9, {
    nodes: allNodes(0, {
      'root': { vis: [[0.8, 9]], accent: 'hot' },
      'root.l': { vis: [[1.6, 9]], accent: 'hot' },
      'root.l.l': { vis: [[2.4, 9]], accent: 'hot' },
      'root.l.r': { vis: [[3.6, 9]], accent: 'hot' },
      'root.r': { vis: [[5.0, 9]], accent: 'hot' },
      'root.r.r': { vis: [[6.0, 9]], accent: 'hot' },
    }),
    edges: allEdges(0),
    notes: [
      { x: 480, y: 210, anchor: 'middle', text: '访问 A → 进左子树', mono: true, size: 12.5,
        color: AMBER, vis: [[0.8, 1.6]] },
      { x: 480, y: 210, anchor: 'middle', text: 'B → 再进它的左子树 D（一路往下钻）', mono: true,
        size: 12.5, color: AMBER, vis: [[1.6, 3.6]] },
      { x: 480, y: 210, anchor: 'middle', text: 'D 没孩子 → 回退，访问 B 的右孩子 E', mono: true,
        size: 12.5, color: AMBER, vis: [[3.6, 5.0]] },
      { x: 480, y: 210, anchor: 'middle', text: '左子树完了 → 访问 C → 再访问 C 的右孩子 F', mono: true,
        size: 12.5, color: AMBER, vis: [[5.0, 7.0]] },
      { x: 480, y: 210, anchor: 'middle', text: '> A B D E C F      （先序：根永远最先）', mono: true,
        size: 13, color: GREEN, vis: [[7.0, 9]] },
    ],
    steps: [
      { t: 0, text: '先序：根 → 左 → 右。代码只有三行' },
      { t: 0.8, text: '先打印自己（先序的关键就在这一句的位置）', code: 'printf("%c ", T->data);' },
      { t: 1.6, text: '再递归左子树 —— 一路钻到最左下角', code: 'PreOrder(T->left);' },
      { t: 3.6, text: 'D 访问完返回，程序自动回到"B 的左子树刚处理完"这个位置' },
      { t: 5.0, text: '然后递归右子树', code: 'PreOrder(T->right);' },
      { t: 6.2, text: '递归为什么能回退？调用栈帮你记着走到哪儿了' },
      { t: 7.0, text: '结果 A B D E C F', name: '先序结果' },
      { t: 8.0, text: '先序的用途：复制一棵树、输出前缀表达式、序列化' },
    ],
  }),

  // =========================================================================
  CAP('05-InOrder', 'InOrder —— 中序遍历', '左 → 根 → 右：只把打印挪了个位置', 9, {
    nodes: allNodes(0, {
      'root.l.l': { vis: [[0.8, 9]], accent: 'hot' },
      'root.l': { vis: [[1.8, 9]], accent: 'hot' },
      'root.l.r': { vis: [[3.0, 9]], accent: 'hot' },
      'root': { vis: [[4.2, 9]], accent: 'hot' },
      'root.r': { vis: [[5.4, 9]], accent: 'hot' },
      'root.r.r': { vis: [[6.4, 9]], accent: 'hot' },
    }),
    edges: allEdges(0),
    notes: [
      { x: 480, y: 210, anchor: 'middle', text: '先把左边走到底：D', mono: true, size: 12.5,
        color: AMBER, vis: [[0.8, 1.8]] },
      { x: 480, y: 210, anchor: 'middle', text: '左子树空了 → 这才打印 B → 再走 B 的右边 E', mono: true,
        size: 12.5, color: AMBER, vis: [[1.8, 4.2]] },
      { x: 480, y: 210, anchor: 'middle', text: '左子树全部处理完 → 打印根 A', mono: true,
        size: 12.5, color: AMBER, vis: [[4.2, 5.4]] },
      { x: 480, y: 210, anchor: 'middle', text: '> D B E A C F      （中序：根夹在左右之间）', mono: true,
        size: 13, color: GREEN, vis: [[6.4, 9]] },
    ],
    steps: [
      { t: 0, text: '中序：左 → 根 → 右。和先序相比只挪了 printf 的位置' },
      { t: 0.8, text: '先递归左子树 —— 必须先把左边全部处理完', code: 'InOrder(T->left);' },
      { t: 1.8, text: '左子树处理完了，这才打印自己', code: 'printf("%c ", T->data);' },
      { t: 3.0, text: '然后才是右子树', code: 'InOrder(T->right);' },
      { t: 4.2, text: '同一个位置的一个"挪动"，序列完全变了：D B E A C F' },
      { t: 6.4, text: '中序的特殊地位：对**二叉搜索树**做中序，结果一定递增有序' },
      { t: 7.6, text: '所以验证一棵 BST 对不对，最省事的办法就是中序打一遍', name: 'BST 验证靠它' },
      { t: 8.4, text: '反过来，题目给的序列有序，多半在提示你用中序' },
    ],
  }),

  // =========================================================================
  CAP('06-PostOrder', 'PostOrder —— 后序遍历', '左 → 右 → 根：孩子都处理完才轮到自己', 9, {
    nodes: allNodes(0, {
      'root.l.l': { vis: [[0.8, 9]], accent: 'hot' },
      'root.l.r': { vis: [[1.8, 9]], accent: 'hot' },
      'root.l': { vis: [[2.8, 9]], accent: 'hot' },
      'root.r.r': { vis: [[3.8, 9]], accent: 'hot' },
      'root.r': { vis: [[4.8, 9]], accent: 'hot' },
      'root': { vis: [[5.8, 9]], accent: 'del' },
    }),
    edges: allEdges(0),
    notes: [
      { x: 480, y: 210, anchor: 'middle', text: '> D E B F C A      （根跑到了最后）', mono: true,
        size: 13, color: GREEN, vis: [[5.8, 9]] },
      { x: 480, y: 210, anchor: 'middle', text: '先左、再右、最后自己 —— 顺序不能反', size: 12.5,
        color: BLUE, vis: [[0.8, 3.4]] },
      { x: 480, y: 210, anchor: 'middle', text: '凡是"必须等孩子处理完才能处理自己"的事，都得用后序',
        size: 12.5, color: AMBER, vis: [[5.8, 9]] },
      { x: 480, y: 210, anchor: 'middle', text: '释放整棵树就是典型：先 free 根，孩子就再也找不到了',
        size: 12.5, color: RED, vis: [[5.8, 9]] },
    ],
    steps: [
      { t: 0, text: '后序：左 → 右 → 根' },
      { t: 0.8, text: '先递归左子树', code: 'PostOrder(T->left);' },
      { t: 1.8, text: '再递归右子树', code: 'PostOrder(T->right);' },
      { t: 2.8, text: '都处理完了，最后才打印自己', code: 'printf("%c ", T->data);' },
      { t: 3.8, text: '结果 D E B F C A —— 根跑到了最末尾' },
      { t: 5.8, text: '后序的独特价值：必须等孩子处理完的事，只能用它', name: '为什么需要后序' },
      { t: 6.8, text: '① 释放整棵树 ② 算表达式树的值 ③ 求树高', code: '/* 先 free 了根，就再也找不到孩子了 */' },
      { t: 8.0, text: '这三个的共同点：先递归拿到结果，再处理自己' },
    ],
  }),

  // =========================================================================
  CAP('07-LevelOrder', 'LevelOrder —— 层序遍历', '一层一层来，靠队列把下一层排好队', 11, {
    nodes: allNodes(0, {
      'root': { vis: [[0, 11]], accent: 'hot' },
      'root.l': { vis: [[1.6, 11]], accent: 'hot' },
      'root.r': { vis: [[2.4, 11]], accent: 'hot' },
      'root.l.l': { vis: [[4.0, 11]], accent: 'hot' },
      'root.l.r': { vis: [[4.8, 11]], accent: 'hot' },
      'root.r.r': { vis: [[5.6, 11]], accent: 'hot' },
    }),
    edges: allEdges(0),
    notes: [
      { x: 480, y: 210, anchor: 'middle', text: '队列 [A] → 出 A 打印，入 B、C', mono: true,
        size: 12.5, vis: [[0, 2.4]] },
      { x: 480, y: 210, anchor: 'middle', text: '队列 [B C] → 出 B，入 D、E', mono: true,
        size: 12.5, color: BLUE, vis: [[2.4, 4.0]] },
      { x: 480, y: 210, anchor: 'middle', text: '队列 [C D E] → 出 C，入 F（C 没有左孩子）', mono: true,
        size: 12.5, color: BLUE, vis: [[4.0, 6.4]] },
      { x: 480, y: 210, anchor: 'middle', text: '> A B C D E F      横向推进，一层一层', mono: true,
        size: 13, color: GREEN, vis: [[6.4, 11]] },
    ],
    steps: [
      { t: 0, text: '层序要横向推进，递归的纵向调用栈帮不上忙，得借一个队列' },
      { t: 1.0, text: '① 根入队', code: 'q[rear++] = T;' },
      { t: 1.6, text: '② 出队一个、打印、把两个孩子依次入队', code: 'BinTree cur = q[front++];\n printf("%c ", cur->data);' },
      { t: 3.0, text: '入队顺序决定下一层的访问顺序 —— 必须先左后右', code: 'if (cur->left)  q[rear++] = cur->left;\n if (cur->right) q[rear++] = cur->right;' },
      { t: 4.8, text: '循环到队空为止：A B C D E F' },
      { t: 6.4, text: '这里用数组 + 两个下标直接当队列，不用额外依赖队列那一节的代码',
        code: 'BinTree q[64];   int front = 0, rear = 0;' },
      { t: 8.0, text: '层序的用途：求树高、判断完全二叉树、按层打印', name: '层序的用途' },
      { t: 9.4, text: '注意：层序不是递归 —— 它是"用队列模拟递归顺序"的第一个例子' },
    ],
  }),

  // =========================================================================
  // =========================================================================
  CAP('08-FreeTree', 'FreeTree —— 释放整棵树', '后序释放：先孩子、后自己', 9, {
    nodes: {
      'root.l.l': { vis: [[0, 2.2]], accent: 'del' },
      'root.l.r': { vis: [[0, 3.4]], accent: 'del' },
      'root.l':   { vis: [[0, 4.6]], accent: 'del' },
      'root.r.r': { vis: [[0, 5.8]], accent: 'del' },
      'root.r':   { vis: [[0, 7.0]], accent: 'del' },
      'root':     { vis: [[0, 8.2]], accent: 'del' },
    },
    edges: allEdges(0),
    notes: [
      { x: 480, y: 210, anchor: 'middle', text: '先释放 D、E —— 两个叶子最先走', size: 12.5,
        color: RED, vis: [[0.6, 3.4]] },
      { x: 480, y: 210, anchor: 'middle', text: '再释放 B：它的两个孩子已经清空了', size: 12.5,
        color: RED, vis: [[3.4, 5.8]] },
      { x: 480, y: 210, anchor: 'middle', text: '…… 最后才释放根 A', size: 12.5,
        color: RED, vis: [[5.8, 8.2]] },
      { x: 480, y: 210, anchor: 'middle', text: '顺序反了会怎样？先 free 根，孩子就再也找不到了 —— 内存泄漏',
        size: 12.5, color: AMBER, vis: [[8.2, 9]] },
    ],
    steps: [
      { t: 0, text: '释放整棵树，直觉上会想「从根开始 free」—— 但那样是错的' },
      { t: 0.6, text: '先递归释放左子树', code: 'FreeTree(T->left);' },
      { t: 1.6, text: '再递归释放右子树', code: 'FreeTree(T->right);' },
      { t: 2.6, text: '最后才 free 自己 —— 这恰好就是后序', code: 'free(T);' },
      { t: 4.0, text: '看图上的顺序：D E B F C A，根永远最后走' },
      { t: 5.8, text: '为什么必须这样？因为 free 掉根之后，你就再也找不到它的孩子了' },
      { t: 7.2, text: '凡是「必须等孩子处理完才能处理自己」的操作，都得用后序', name: '后序的通用场景' },
      { t: 8.2, text: '同类的还有：算表达式树的值、统计树的高度' },
    ],
  }),

  CAP('09-main', 'main —— 四种遍历对照', '同一棵树，四个完全不同的序列', 10, {
    nodes: allNodes(0.6, {}),
    edges: allEdges(0.6),
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '先序  A B D E C F     根最先', mono: true,
        size: 12.5, color: GREEN, vis: [[1.4, 10]] },
      { x: 480, y: 218, anchor: 'middle', text: '中序  D B E A C F     根居中', mono: true,
        size: 12.5, color: BLUE, vis: [[3.0, 10]] },
      { x: 480, y: 236, anchor: 'middle', text: '后序  D E B F C A     根最后', mono: true,
        size: 12.5, color: '#8250DF', vis: [[4.6, 10]] },
      { x: 480, y: 254, anchor: 'middle', text: '层序  A B C D E F     一层一层', mono: true,
        size: 12.5, color: AMBER, vis: [[6.2, 10]] },
    ],
    steps: [
      { t: 0, text: '建树序列：ABD##E##C#F##' },
      { t: 0.6, text: '四种遍历跑同一棵树，输出四个不同的序列' },
      { t: 1.4, text: '先序：根最先 —— A B D E C F', name: '先序' },
      { t: 3.0, text: '中序：根居中 —— D B E A C F', name: '中序' },
      { t: 4.6, text: '后序：根最后 —— D E B F C A', name: '后序' },
      { t: 6.2, text: '层序：一层一层 —— A B C D E F', name: '层序' },
      { t: 7.6, text: '前三个只差 printf 的位置，序列却完全不同 —— 这就是递归顺序的威力' },
      { t: 9.0, text: '最后别忘了后序遍历释放整棵树（先孩子、后自己）' },
    ],
  }),

];
