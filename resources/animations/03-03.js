'use strict';
/**
 * 03-03 平衡二叉树 AVL —— 动画场景
 *
 * 旋转这件事，单张静态图不好表达"前后对比"，所以这里用
 * **高亮 + 分步说明**：先点出失衡的样子，再显示转完之后的结构，
 * 关键帧的说明文字里写清楚"谁升上去了、谁降下来了"。
 */

const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';
const BLUE = '#3B82F6';

const paths = (root) => {
  const out = [];
  (function walk(n, p) { if (!n) return; out.push(p); walk(n.l, p + '.l'); walk(n.r, p + '.r'); })(root, 'root');
  return out;
};
const visAll = (root, vis, extra) => {
  const o = {};
  for (const p of paths(root)) {
    const skip = p !== 'root' && !paths(root).includes(p);
    if (skip) continue;
    o[p] = Object.assign({ vis }, (extra && extra[p]) || {});
  }
  return o;
};
const edgesAll = (root, vis, extra) => {
  const o = {};
  for (const p of paths(root)) {
    if (p === 'root') continue;
    o[p] = Object.assign({ vis }, (extra && extra[p]) || {});
  }
  return o;
};

const CAP = (no, title, sub, total, extra) => ({
  id: `03-03-${no}`,
  no,
  title,
  sub,
  bookTag: 'AVL 树',
  variant: 'tree',
  accentColor: '#10B981',
  total,
  ...extra,
});

// 旋转前 / 旋转后要用的几棵小树
const T_LL_BEFORE = { v: '5', l: { v: '3', l: { v: '1' } } };
const T_LL_AFTER = { v: '3', l: { v: '1' }, r: { v: '5' } };
const T_RR_BEFORE = { v: '3', r: { v: '5', r: { v: '7' } } };
const T_RR_AFTER = { v: '5', l: { v: '3' }, r: { v: '7' } };
const T_LR_BEFORE = { v: '5', l: { v: '3', r: { v: '4' } } };
const T_LR_AFTER = { v: '4', l: { v: '3' }, r: { v: '5' } };
const T_RL_BEFORE = { v: '3', r: { v: '5', l: { v: '4' } } };
const T_RL_AFTER = { v: '4', l: { v: '3' }, r: { v: '5' } };

module.exports = [

  // =========================================================================
  CAP('01-typedef', 'typedef —— AVL 结点', '比普通二叉树多存一个「高度」', 8, {
    tree: { v: '8', l: { v: '3', l: { v: '1' }, r: { v: '6' } }, r: { v: '10' } },
    nodes: visAll({ v: '8', l: { v: '3', l: { v: '1' }, r: { v: '6' } }, r: { v: '10' } }, [[0.6, 8]], {
      'root': { vis: [[0.6, 8]], accent: 'hot', badge: '0' },
      'root.l': { vis: [[0.6, 8]], badge: '+1' },
      'root.r': { vis: [[0.6, 8]], badge: '-1' },
      'root.l.l': { vis: [[0.6, 8]], badge: '0' },
      'root.l.r': { vis: [[0.6, 8]], badge: '0' },
    }),
    edges: edgesAll({ v: '8', l: { v: '3', l: { v: '1' }, r: { v: '6' } }, r: { v: '10' } }, [[0.6, 8]]),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '结点角上的小字是「平衡因子」= 左高 − 右高', size: 12.5,
        color: AMBER, vis: [[1.4, 5.0]] },
      { x: 480, y: 232, anchor: 'middle', text: 'AVL 要求每个结点的平衡因子都在 −1、0、1 之间', size: 12.5,
        color: GREEN, vis: [[5.0, 8]] },
    ],
    steps: [
      { t: 0, text: 'AVL 是"会自己保持平衡"的二叉搜索树' },
      { t: 0.6, text: '结点比普通二叉树多存一个字段：height', code: 'int height;   /* 以自己为根的子树高度 */' },
      { t: 1.4, text: '有了它才能 O(1) 算出平衡因子', code: 'int BalanceFactor(T) { return GetHeight(T->left) - GetHeight(T->right); }' },
      { t: 3.4, text: '约定：空树高度 0，叶子高度 1' },
      { t: 4.2, text: '这样"高度 = 孩子里高的那个 + 1"这一个式子在所有情况下都成立，不用特判空指针' },
      { t: 5.0, text: '平衡因子只能是 -1、0、1；到 ±2 就必须旋转了' },
      { t: 6.4, text: '为什么存高度而不是每次递归算？因为插入一次要判断很多次，现场算会从 O(log n) 退化' },
    ],
  }),

  // =========================================================================
  CAP('02-Height', 'Height —— 求高度与更新', '两个小函数，却是所有旋转的基础', 8, {
    tree: { v: '3', l: { v: '1' }, r: { v: '5', l: { v: '4' } } },
    nodes: visAll({ v: '3', l: { v: '1' }, r: { v: '5', l: { v: '4' } } }, [[0.6, 8]], {
      'root': { vis: [[0.6, 8]], accent: 'hot', badge: '3' },
      'root.r': { vis: [[0.6, 8]], accent: 'hot', badge: '2' },
      'root.r.l': { vis: [[0.6, 8]], badge: '1' },
      'root.l': { vis: [[0.6, 8]], badge: '1' },
    }),
    edges: edgesAll({ v: '3', l: { v: '1' }, r: { v: '5', l: { v: '4' } } }, [[0.6, 8]]),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '高度 = 两个孩子里高的那个 + 1（空树算 0）', size: 12.5,
        color: BLUE, vis: [[1.4, 5.0]] },
      { x: 480, y: 232, anchor: 'middle', text: 'UpdateHeight 的前提：孩子的高度已经是对的', size: 12.5,
        color: AMBER, vis: [[5.0, 8]] },
    ],
    steps: [
      { t: 0, text: '所有旋转都要用到高度，所以先把这两个小函数写对' },
      { t: 1.4, text: 'GetHeight 单独包一层，是为了不用到处写"空指针判一下"', code: 'int GetHeight(AVLTree T) { return T == NULL ? 0 : T->height; }' },
      { t: 3.4, text: 'UpdateHeight 重新算并写回' },
      { t: 3.8, text: '高度 = 孩子里高的那个 + 1', code: 'T->height = MaxInt(GetHeight(T->left), GetHeight(T->right)) + 1;' },
      { t: 5.0, text: '注意它假设孩子的高度已经正确 —— 所以调用时机永远是"先孩子、后自己"' },
      { t: 6.4, text: '漏掉更新会出现"树看着对、平衡因子是错的"这种最难查的 bug' },
      { t: 7.2, text: '它不崩，只会在某次插入时做出错误的旋转判断' },
    ],
  }),

  // =========================================================================
  CAP('03-RotateLL', 'RotateLL —— 左单旋', '麻烦在「左孩子的左边」，把左孩子提上来', 10, {
    tree: T_LL_BEFORE,
    nodes: visAll(T_LL_BEFORE, [[0, 10]], {
      'root': { vis: [[0, 10]], accent: 'del', badge: '失衡' },
      'root.l': { vis: [[0, 10]], accent: 'new', badge: '↓' },
      'root.l.l': { vis: [[0, 10]], badge: '' },
    }),
    edges: edgesAll(T_LL_BEFORE, [[0, 10]]),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '插入 1 之后：5 的左高 2、右高 0，平衡因子 +2 → 失衡', size: 12.5,
        color: RED, vis: [[0.6, 4.0]] },
      { x: 480, y: 232, anchor: 'middle', text: '从 5 往下走两步都是「左」→ 属于 LL → 用右单旋', size: 12.5,
        color: AMBER, vis: [[4.0, 6.6]] },
      { x: 480, y: 232, anchor: 'middle', text: '转完：3 升上来当根，5 降下去当它的右孩子　中序仍是 1 3 5', size: 12.5,
        color: GREEN, vis: [[6.6, 10]] },
    ],
    steps: [
      { t: 0, text: '先看最典型的失衡：5 → 3 → 1 这条左斜链' },
      { t: 0.6, text: '5 的左子树高 2、右子树高 0，平衡因子 +2', code: '/* 平衡因子 = 左高 - 右高 = 2 */' },
      { t: 2.4, text: '从出问题的结点往下走两步：左（到 3）、再左（到 1）→ LL' },
      { t: 4.0, text: '判断口诀：**两个方向都是左，就是 LL**' },
      { t: 4.8, text: '处理办法是右单旋，四步', code: 'AVLTree newRoot = T->left;      /* ① 左孩子当新根 */\n T->left = newRoot->right;        /* ② 新根的右子树挂过来 */\n newRoot->right = T;              /* ③ 旧根降为右孩子 */' },
      { t: 6.6, text: '第 ② 步最容易漏 —— 忘了它就直接丢一棵子树' },
      { t: 7.6, text: '最后更新高度，注意顺序：先更新旧根，再更新新根' },
      { t: 8.6, text: '为什么转完还是 BST？因为中序都是 1 3 5 —— 旋转不改变中序' },
    ],
  }),

  // =========================================================================
  CAP('04-RotateRR', 'RotateRR —— 右单旋', '麻烦在「右孩子的右边」，和 LL 完全镜像', 10, {
    tree: T_RR_BEFORE,
    nodes: visAll(T_RR_BEFORE, [[0, 10]], {
      'root': { vis: [[0, 10]], accent: 'del', badge: '失衡' },
      'root.r': { vis: [[0, 10]], accent: 'new', badge: '↓' },
      'root.r.r': { vis: [[0, 10]], badge: '' },
    }),
    edges: edgesAll(T_RR_BEFORE, [[0, 10]]),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '插入 7 之后：3 的右高 2、左高 0，平衡因子 −2 → 失衡', size: 12.5,
        color: RED, vis: [[0.6, 4.0]] },
      { x: 480, y: 232, anchor: 'middle', text: '两步都是「右」→ 属于 RR → 用左单旋', size: 12.5,
        color: AMBER, vis: [[4.0, 6.6]] },
      { x: 480, y: 232, anchor: 'middle', text: '名字的坑：RR 用的是「左单旋」，方向和名字是反的', size: 12.5,
        color: BLUE, vis: [[6.6, 10]] },
    ],
    steps: [
      { t: 0, text: '镜像情况：3 → 5 → 7 这条右斜链' },
      { t: 0.6, text: '3 的平衡因子变成 −2（右边太高）' },
      { t: 2.4, text: '从 3 往下走：右（到 5）、再右（到 7）→ RR' },
      { t: 4.0, text: '处理办法是左单旋，代码就是把 LL 的 left/right 全反过来', code: 'AVLTree newRoot = T->right;\n T->right = newRoot->left;\n newRoot->left = T;' },
      { t: 6.6, text: '命名要小心：名字说的是"麻烦在哪"，不是"往哪转"', name: '命名规则' },
      { t: 7.6, text: 'LL 用右旋、RR 用左旋 —— 记混了树会被转歪，而且还照样能跑' },
      { t: 8.8, text: '转完 5 当根，中序仍是 3 5 7' },
    ],
  }),

  // =========================================================================
  CAP('05-RotateLR', 'RotateLR —— 左右双旋', '麻烦在「左孩子的右边」，得分两步走', 11, {
    tree: T_LR_BEFORE,
    nodes: visAll(T_LR_BEFORE, [[0, 11]], {
      'root': { vis: [[0, 11]], accent: 'del', badge: '失衡' },
      'root.l': { vis: [[0, 11]], accent: 'hot' },
      'root.l.r': { vis: [[0, 11]], accent: 'new', badge: '麻烦在这' },
    }),
    edges: edgesAll(T_LR_BEFORE, [[0, 11]]),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '5 的左孩子是 3，3 的右孩子是 4 —— 麻烦藏在「内侧」', size: 12.5,
        color: RED, vis: [[0.6, 4.4]] },
      { x: 480, y: 232, anchor: 'middle', text: '直接右单旋没用：会把那棵子树原样带过去，还是不平衡', size: 12.5,
        color: AMBER, vis: [[4.4, 7.2]] },
      { x: 480, y: 232, anchor: 'middle', text: '① 先对左孩子左旋 → 掰成 LL；② 再对自己右单旋', size: 12.5,
        color: GREEN, vis: [[7.2, 11]] },
    ],
    steps: [
      { t: 0, text: '有些失衡单旋搞不定，比如 5 → 3 → 4 这种"拐弯"的' },
      { t: 0.6, text: '从 5 往下走：左（到 3）、再右（到 4）→ LR' },
      { t: 2.4, text: '直接右单旋会怎样？转完 3 当根，5 还是带着一棵高子树，依旧不平' },
      { t: 4.4, text: '问题是麻烦在"左孩子的右边"（内侧），一转就被原样带走' },
      { t: 5.6, text: '所以分两步：先把内侧的麻烦挪到外侧' },
      { t: 7.2, text: '① 对左孩子做左单旋，把 LR 掰成 LL', code: 'T->left = RotateRR(T->left);' },
      { t: 8.6, text: '② 再对自己做右单旋（这一步就是 LL 的处理方式）', code: 'return RotateLL(T);' },
      { t: 10.0, text: '本质：双旋不是新的旋转类型，只是把两种情况拆成两次单旋' },
    ],
  }),

  // =========================================================================
  CAP('06-RotateRL', 'RotateRL —— 右左双旋', '麻烦在「右孩子的左边」，LR 的镜像', 11, {
    tree: T_RL_BEFORE,
    nodes: visAll(T_RL_BEFORE, [[0, 11]], {
      'root': { vis: [[0, 11]], accent: 'del', badge: '失衡' },
      'root.r': { vis: [[0, 11]], accent: 'hot' },
      'root.r.l': { vis: [[0, 11]], accent: 'new', badge: '麻烦在这' },
    }),
    edges: edgesAll(T_RL_BEFORE, [[0, 11]]),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '3 的右孩子是 5，5 的左孩子是 4 —— 内侧又是麻烦', size: 12.5,
        color: RED, vis: [[0.6, 4.4]] },
      { x: 480, y: 232, anchor: 'middle', text: '① 先对右孩子右旋 → 掰成 RR；② 再对自己左单旋', size: 12.5,
        color: GREEN, vis: [[4.4, 8.0]] },
      { x: 480, y: 232, anchor: 'middle', text: '记忆：单旋 = 麻烦在外侧，双旋 = 麻烦在内侧', size: 12.5,
        color: AMBER, vis: [[8.0, 11]] },
    ],
    steps: [
      { t: 0, text: '最后一种：3 → 5 → 4，麻烦在右孩子的左边' },
      { t: 0.6, text: '从 3 往下：右（到 5）、再左（到 4）→ RL' },
      { t: 2.4, text: '完全是 LR 的镜像，处理方式也对称' },
      { t: 4.4, text: '① 先对右孩子做右单旋，把 RL 掰成 RR', code: 'T->right = RotateLL(T->right);' },
      { t: 6.2, text: '② 再对自己做左单旋', code: 'return RotateRR(T);' },
      { t: 8.0, text: '四种旋转汇总一下：', name: '汇总' },
      { t: 8.6, text: 'LL 左孩子的左边 → 右单旋　　RR 右孩子的右边 → 左单旋', code: '/* 单旋：麻烦在外侧 */' },
      { t: 9.6, text: 'LR 左孩子的右边 → 先左后右　RL 右孩子的左边 → 先右后左', code: '/* 双旋：麻烦在内侧 */' },
    ],
  }),

  // =========================================================================
  CAP('07-AVLInsert', 'AVLInsert —— 插入并自动平衡', '先按 BST 插进去，回溯时发现失衡就转', 12, {
    tree: { v: '4', l: { v: '2', l: { v: '1' }, r: { v: '3' } }, r: { v: '6', l: { v: '5' }, r: { v: '7' } } },
    nodes: visAll({ v: '4', l: { v: '2', l: { v: '1' }, r: { v: '3' } }, r: { v: '6', l: { v: '5' }, r: { v: '7' } } }, [[0.6, 12]], {
      'root': { vis: [[0.6, 12]], accent: 'new', badge: '3' },
      'root.l': { vis: [[0.6, 12]], badge: '2' },
      'root.r': { vis: [[0.6, 12]], badge: '2' },
      'root.l.l': { vis: [[0.6, 12]], badge: '1' },
      'root.l.r': { vis: [[0.6, 12]], badge: '1' },
      'root.r.l': { vis: [[0.6, 12]], badge: '1' },
      'root.r.r': { vis: [[0.6, 12]], badge: '1' },
    }),
    edges: edgesAll({ v: '4', l: { v: '2', l: { v: '1' }, r: { v: '3' } }, r: { v: '6', l: { v: '5' }, r: { v: '7' } } }, [[0.6, 12]]),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '插入 1 2 3 4 5 6 7 之后 —— 树高只有 3', size: 12.5,
        color: GREEN, vis: [[6.0, 12]] },
      { x: 480, y: 232, anchor: 'middle', text: '普通 BST 按这个顺序插会得到高度 7 的一条链', size: 12.5,
        color: RED, vis: [[6.0, 12]] },
      { x: 480, y: 232, anchor: 'middle', text: '插入四步：走下去 → 更新高度 → 算平衡因子 → 失衡就转', size: 12.5,
        color: BLUE, vis: [[1.4, 6.0]] },
    ],
    steps: [
      { t: 0, text: '现在把旋转用起来：让树自己保持平衡' },
      { t: 1.4, text: '插入分四步，前两步和 BST 一样', code: 'T->left = AVLInsert(T->left, x);   /* 先按 BST 插进去 */' },
      { t: 3.0, text: '第三步：回溯的路上更新自己的高度', code: 'UpdateHeight(T);' },
      { t: 4.2, text: '第四步：算平衡因子，绝对值到 2 就判断属于哪种情况并旋转', code: 'int bf = BalanceFactor(T);\n if (bf > 1) { /* LL 或 LR */ }' },
      { t: 6.0, text: '关键：插入只会让"新结点到根"这条路劲上的结点失衡' },
      { t: 7.4, text: '而且最先失衡的一定是离新结点最近的那个 —— 递归回溯天然从下往上' },
      { t: 8.8, text: '所以遇到的第一个失衡结点转一次就够了，不用继续往上修' },
      { t: 10.0, text: '这就是 AVL 插入只要 O(log n) 的原因' },
      { t: 11.0, text: '判断哪种情况要看「左孩子的平衡因子」，不是"新值比左孩子大还是小"' },
    ],
  }),

  // =========================================================================
  CAP('08-InOrder', 'InOrder —— 中序验证', '旋转不改变中序，所以中序有序就还是 BST', 9, {
    tree: { v: '4', l: { v: '2', l: { v: '1' }, r: { v: '3' } }, r: { v: '6', l: { v: '5' }, r: { v: '7' } } },
    nodes: visAll({ v: '4', l: { v: '2', l: { v: '1' }, r: { v: '3' } }, r: { v: '6', l: { v: '5' }, r: { v: '7' } } }, [[0.6, 9]], {
      'root': { vis: [[0.6, 9]], accent: 'new' },
    }),
    edges: edgesAll({ v: '4', l: { v: '2', l: { v: '1' }, r: { v: '3' } }, r: { v: '6', l: { v: '5' }, r: { v: '7' } } }, [[0.6, 9]]),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '> 1 2 3 4 5 6 7', mono: true, size: 13, color: GREEN,
        vis: [[3.0, 9]] },
      { x: 480, y: 232, anchor: 'middle', text: '旋转只换父子关系、不换左右顺序 —— 所以中序不变', size: 12.5,
        color: BLUE, vis: [[0.6, 3.0]] },
      { x: 480, y: 232, anchor: 'middle', text: '验证 AVL 的两把尺子：① 中序递增 ② 每个结点都平衡', size: 12.5,
        color: AMBER, vis: [[5.4, 9]] },
    ],
    steps: [
      { t: 0, text: 'AVL 是"平衡的 BST"，所以它首先得是 BST' },
      { t: 0.6, text: '旋转为什么不破坏 BST？因为中序不变' },
      { t: 1.8, text: '以 LL 为例：5(3(1)) 转成 3(1,5)，两棵树的中序都是 1 3 5', code: '/* 中序就是排序顺序，中序不变 → BST 性质保住 */' },
      { t: 3.0, text: '所以每次旋转完，中序打一遍就能确认没写坏' },
      { t: 5.4, text: '验证 AVL 要两条都过：', name: '两把尺子' },
      { t: 6.0, text: '① 中序递增 → 还是 BST' },
      { t: 7.0, text: '② 每个结点的平衡因子都在 -1..1 → 确实平衡了' },
      { t: 8.2, text: '只查根是不够的 —— 旋转出错时往往是某个子树失衡，根看起来还正常' },
    ],
  }),

  // =========================================================================
  CAP('09-FreeTree', 'FreeTree —— 释放整棵树', '后序释放：先孩子、后自己', 8, {
    tree: { v: '4', l: { v: '2', l: { v: '1' }, r: { v: '3' } }, r: { v: '6' } },
    nodes: visAll({ v: '4', l: { v: '2', l: { v: '1' }, r: { v: '3' } }, r: { v: '6' } }, [[0, 8]], {
      'root.l.l': { vis: [[0, 1.8]], accent: 'del' },
      'root.l.r': { vis: [[0, 2.8]], accent: 'del' },
      'root.l': { vis: [[0, 3.8]], accent: 'del' },
      'root.r': { vis: [[0, 4.8]], accent: 'del' },
      // 根留到结尾：最后 2 秒在讲"顺序反了会怎样"，指的就是这个根
      // （原来和别的结点一起在 5.8s 消失，6.4~8.0s 是空屏）
      'root': { vis: [[0, 8]], accent: 'del' },
    }),
    edges: edgesAll({ v: '4', l: { v: '2', l: { v: '1' }, r: { v: '3' } }, r: { v: '6' } }, [[0, 6.4]]),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '叶子先走、根最后走 —— 和普通二叉树一样', size: 12.5,
        color: RED, vis: [[0.6, 5.8]] },
      { x: 480, y: 232, anchor: 'middle', text: '先 free 根就再也找不到孩子了 —— 内存泄漏', size: 12.5,
        color: AMBER, vis: [[5.8, 8]] },
    ],
    steps: [
      { t: 0, text: 'AVL 的释放和普通二叉树完全一样，必须后序' },
      { t: 0.8, text: '先递归清空左子树', code: 'FreeTree(T->left);' },
      { t: 2.2, text: '再清空右子树', code: 'FreeTree(T->right);' },
      { t: 3.6, text: '最后才 free 自己', code: 'free(T);' },
      { t: 5.8, text: '顺序反了会怎样？先 free 根，孩子就再也找不到了' },
      { t: 6.8, text: '凡是「必须等孩子处理完才能处理自己」的操作都用后序' },
    ],
  }),

  // =========================================================================
  CAP('10-CheckBalance', 'CheckBalance —— 逐结点检查平衡', '验证 AVL 的第二把尺子', 9, {
    tree: { v: '4', l: { v: '2', l: { v: '1' }, r: { v: '3' } }, r: { v: '6', l: { v: '5' }, r: { v: '7' } } },
    nodes: visAll({ v: '4', l: { v: '2', l: { v: '1' }, r: { v: '3' } }, r: { v: '6', l: { v: '5' }, r: { v: '7' } } }, [[0.6, 9]], {
      'root': { vis: [[0.6, 9]], badge: '0' },
      'root.l': { vis: [[0.6, 9]], badge: '0' },
      'root.r': { vis: [[0.6, 9]], badge: '0' },
      'root.l.l': { vis: [[0.6, 9]], badge: '0' },
      'root.l.r': { vis: [[0.6, 9]], badge: '0' },
      'root.r.l': { vis: [[0.6, 9]], badge: '0' },
      'root.r.r': { vis: [[0.6, 9]], badge: '0' },
    }),
    edges: edgesAll({ v: '4', l: { v: '2', l: { v: '1' }, r: { v: '3' } }, r: { v: '6', l: { v: '5' }, r: { v: '7' } } }, [[0.6, 9]]),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '每个结点的平衡因子都落在 −1、0、1 里 → 合格', size: 12.5,
        color: GREEN, vis: [[2.6, 9]] },
      { x: 480, y: 232, anchor: 'middle', text: '递归检查每一个结点，不能只看根', size: 12.5,
        color: BLUE, vis: [[0.6, 2.6]] },
      { x: 480, y: 232, anchor: 'middle', text: '只查根是不够的：旋转出错时常常是子树失衡，根却看着正常', size: 12.5,
        color: AMBER, vis: [[6.0, 9]] },
    ],
    steps: [
      { t: 0, text: '中序能验证"还是 BST"，但验证不了"确实平衡"' },
      { t: 0.6, text: '所以还需要第二个函数：逐个结点算平衡因子', code: 'if (BalanceFactor(T) > 1 || BalanceFactor(T) < -1) return 0;' },
      { t: 2.6, text: '自己平衡还不够，两个孩子也要递归查', code: 'return CheckBalance(T->left) && CheckBalance(T->right);' },
      { t: 4.6, text: '两个函数都过，这棵树才算合格' },
      { t: 6.0, text: '为什么不能只看根？因为旋转写错时，往往是某个子树失衡，而根恰好正常' },
      { t: 7.6, text: '这种"看起来没事"的 bug 最难查，所以要用自动检查把它揪出来' },
    ],
  }),

  // =========================================================================
  CAP('11-main', 'main —— 让 AVL 自己找平衡', '故意用有序序列插入，看它怎么把自己掰回来', 11, {
    tree: { v: '4', l: { v: '2', l: { v: '1' }, r: { v: '3' } }, r: { v: '6', l: { v: '5' }, r: { v: '7' } } },
    nodes: visAll({ v: '4', l: { v: '2', l: { v: '1' }, r: { v: '3' } }, r: { v: '6', l: { v: '5' }, r: { v: '7' } } }, [[0.6, 11]], {
      'root': { vis: [[0.6, 11]], accent: 'new', badge: '高 3' },
    }),
    edges: edgesAll({ v: '4', l: { v: '2', l: { v: '1' }, r: { v: '3' } }, r: { v: '6', l: { v: '5' }, r: { v: '7' } } }, [[0.6, 11]]),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '插入 1 2 3 4 5 6 7（普通 BST 会退化成高度 7 的链）', size: 12.5,
        color: RED, vis: [[0.6, 3.4]] },
      { x: 480, y: 232, anchor: 'middle', text: 'AVL 把它掰成了高度 3 的平衡树', size: 12.5, color: GREEN,
        vis: [[3.4, 7.0]] },
      { x: 480, y: 232, anchor: 'middle', text: '① 中序递增　② 每个结点都平衡 —— 两条都过', size: 12.5,
        color: BLUE, vis: [[7.0, 11]] },
    ],
    steps: [
      { t: 0, text: '用有序序列测 AVL 最能看出价值 —— 那正是普通 BST 的死穴' },
      { t: 1.0, text: '插入 1 2 3 4 5 6 7' },
      { t: 3.4, text: '如果不做平衡，会得到一条高度 7 的右斜链，查找退化成 O(n)' },
      { t: 4.6, text: 'AVL 每次插入后会检查平衡、必要时旋转' },
      { t: 5.6, text: '最后得到一棵高度只有 3 的平衡树（2³ − 1 = 7，正好装下 7 个结点）' },
      { t: 7.0, text: '验证 ①：中序递增 → 还是 BST', name: '第一把尺子' },
      { t: 8.2, text: '验证 ②：每个结点平衡因子都在 -1..1 → 确实平衡', name: '第二把尺子' },
      { t: 9.4, text: '如果树高打出来是 7 而不是 3，说明旋转根本没生效，回去查 UpdateHeight 和判断条件' },
    ],
  }),

];
