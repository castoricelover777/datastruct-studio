'use strict';
/**
 * 03-02 二叉搜索树 —— 动画场景
 *
 * 全篇用同一棵 BST（插入序列 8 3 10 1 6 14 4 7 13）：
 *          8
 *        /   \
 *       3     10
 *      / \      \
 *     1   6      14
 *        / \    /
 *       4   7  13
 * 中序：1 3 4 6 7 8 10 13 14
 */

const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';
const BLUE = '#3B82F6';

const T = {
  v: '8',
  l: { v: '3', l: { v: '1' }, r: { v: '6', l: { v: '4' }, r: { v: '7' } } },
  r: { v: '10', r: { v: '14', l: { v: '13' } } },
};
const ALL = ['root', 'root.l', 'root.r', 'root.l.l', 'root.l.r',
  'root.l.r.l', 'root.l.r.r', 'root.r.r', 'root.r.r.l'];

const allNodes = (vis, extra) => {
  const o = {};
  for (const p of ALL) o[p] = Object.assign({ vis }, (extra && extra[p]) || {});
  return o;
};
const allEdges = (vis) => {
  const o = {};
  for (const p of ALL) if (p !== 'root') o[p] = { vis };
  return o;
};

const CAP = (no, title, sub, total, extra) => ({
  id: `03-02-${no}`,
  no,
  title,
  sub,
  bookTag: '二叉搜索树',
  variant: 'tree',
  accentColor: '#0891B2',
  total,
  tree: T,
  ...extra,
});

module.exports = [

  // =========================================================================
  CAP('01-typedef', 'typedef —— 什么是二叉搜索树', '左边都比根小，右边都比根大', 9, {
    nodes: allNodes([[0.6, 9]], {
      root: { vis: [[0.6, 9]], accent: 'hot' },
      'root.l': { vis: [[1.6, 9]], accent: 'visited' },
      'root.l.l': { vis: [[2.4, 9]], accent: 'visited' },
      'root.l.r': { vis: [[2.8, 9]], accent: 'visited' },
      'root.r': { vis: [[3.6, 9]], accent: 'new' },
      'root.r.r': { vis: [[4.2, 9]], accent: 'new' },
    }),
    edges: allEdges([[0.6, 9]]),
    notes: [
      { x: 480, y: 228, anchor: 'middle', text: '根 8：左边整片都比它小，右边整片都比它大',
        size: 12.5, color: AMBER, vis: [[1.6, 3.6]] },
      { x: 480, y: 228, anchor: 'middle', text: '注意是「所有结点」不只是直接孩子：13 比 14 小，又比 10 大',
        size: 12.5, color: BLUE, vis: [[4.2, 6.4]] },
      { x: 480, y: 228, anchor: 'middle', text: '中序遍历一定递增：1 3 4 6 7 8 10 13 14',
        mono: true, size: 12.5, color: GREEN, vis: [[6.4, 9]] },
    ],
    steps: [
      { t: 0, text: '二叉搜索树在二叉树之上加一条规矩' },
      { t: 0.6, text: '左子树的所有结点 < 根 < 右子树的所有结点', code: '/* 是「所有结点」，不是「直接孩子」 */' },
      { t: 1.6, text: '看根 8：左边一片（1 3 4 6 7）都比它小' },
      { t: 3.6, text: '右边一片（10 13 14）都比它大' },
      { t: 4.2, text: '13 这个位置值得盯一下：它比 14 小，又比 10 大，所以待在 10 的右子树里' },
      { t: 6.4, text: '这条规矩带来一个漂亮的性质：中序遍历一定递增', name: '中序有序' },
      { t: 7.8, text: '所以检查一棵 BST 对不对，中序打一遍就行' },
    ],
  }),

  // =========================================================================
  CAP('02-NewNode', 'NewNode —— 造一个结点', '结构不变，新结点永远是叶子', 7, {
    tree: { v: '5' },
    nodes: { root: { vis: [[0.8, 7]], accent: 'new', rise: 0.8 } },
    edges: {},
    notes: [
      { x: 480, y: 175, anchor: 'middle', text: '申请 → 填值 → 两个孩子置空', size: 12.5,
        vis: [[0.8, 4.0]] },
      { x: 480, y: 175, anchor: 'middle', text: '和普通二叉树的 NewNode 一模一样，没有区别',
        size: 12.5, color: '#8C959F', vis: [[4.0, 5.8]] },
      { x: 480, y: 175, anchor: 'middle', text: '区别不在结点，而在「怎么把它接进去」',
        size: 12.5, color: AMBER, vis: [[5.8, 7]] },
    ],
    steps: [
      { t: 0, text: 'BST 的结点和普通二叉树完全一样' },
      { t: 0.8, text: '申请内存、填值、两个孩子置空', code: 't->left = NULL;   t->right = NULL;' },
      { t: 2.6, text: '它现在是孤立结点，不属于任何树' },
      { t: 4.0, text: '差别不在结点本身，而在"插到哪里" —— 那是 BSTInsert 的事' },
      { t: 5.8, text: '重要性质：BST 插入的新结点**一定是叶子**，从不改动已有结点的关系' },
    ],
  }),

  // =========================================================================
  CAP('03-BSTFind', 'BSTFind —— 查找', '比当前小就往左、大就往右，每次扔掉一半', 10, {
    nodes: allNodes([[0, 10]], {
      root: { vis: [[0, 10]], accent: 'hot' },
      'root.l': { vis: [[0, 10]], accent: 'hot' },
      'root.l.r': { vis: [[0, 10]], accent: 'hot' },
      'root.l.r.r': { vis: [[0, 10]], accent: 'new' },
    }),
    edges: allEdges([[0, 10]]),
    notes: [
      { x: 480, y: 228, anchor: 'middle', text: '找 7：7 < 8 → 往左', mono: true, size: 12.5,
        color: AMBER, vis: [[1.2, 3.0]] },
      { x: 480, y: 228, anchor: 'middle', text: '7 > 3 → 往右', mono: true, size: 12.5,
        color: AMBER, vis: [[3.0, 5.0]] },
      { x: 480, y: 228, anchor: 'middle', text: '7 > 6 → 往右', mono: true, size: 12.5,
        color: AMBER, vis: [[5.0, 7.0]] },
      { x: 480, y: 228, anchor: 'middle', text: '相等 → 找到！只比较了 4 次', mono: true, size: 12.5,
        color: GREEN, vis: [[7.0, 10]] },
    ],
    steps: [
      { t: 0, text: '查找：拿目标值和当前结点比，小了往左、大了往右' },
      { t: 1.2, text: '7 < 8，只可能在左子树 —— 右边整片直接不用看了', code: 'if (x < T->data) return BSTFind(T->left, x);' },
      { t: 3.0, text: '7 > 3，往右' },
      { t: 5.0, text: '7 > 6，继续往右' },
      { t: 7.0, text: '相等，命中', code: 'return T;   /* 返回结点而不是 1/0 */' },
      { t: 8.2, text: '每走一步就扔掉一半候选 —— 这就是「二叉搜索」这个名字的由来' },
      { t: 9.2, text: '本质上是把二分查找写成了树：平均 O(log n)' },
    ],
  }),

  // =========================================================================
  CAP('04-BSTInsert', 'BSTInsert —— 插入', '像查找一样走下去，走到空位置就挂上去', 10, {
    tree: {
      v: '8',
      l: { v: '3', l: { v: '1' }, r: { v: '6', l: { v: '4' }, r: { v: '7', l: { v: '5' } } } },
      r: { v: '10', r: { v: '14', l: { v: '13' } } },
    },
    nodes: {
      'root': { vis: [[0, 10]], accent: 'hot' },
      'root.l': { vis: [[0, 10]], accent: 'hot' },
      'root.l.r': { vis: [[0, 10]], accent: 'hot' },
      'root.l.r.l': { vis: [[0, 10]] },
      'root.l.r.r': { vis: [[0, 10]], accent: 'hot' },
      'root.l.r.r.l': { vis: [[5.4, 10]], accent: 'new', rise: 5.4 },
      'root.l.l': { vis: [[0, 10]] },
      'root.r': { vis: [[0, 10]] },
      'root.r.r': { vis: [[0, 10]] },
      'root.r.r.l': { vis: [[0, 10]] },
    },
    edges: {
      'root.l': { vis: [[0, 10]] }, 'root.r': { vis: [[0, 10]] },
      'root.l.l': { vis: [[0, 10]] }, 'root.l.r': { vis: [[0, 10]] },
      'root.r.r': { vis: [[0, 10]] }, 'root.r.r.l': { vis: [[0, 10]] },
      'root.l.r.l': { vis: [[0, 10]] }, 'root.l.r.r': { vis: [[0, 10]] },
      'root.l.r.r.l': { vis: [[5.4, 10]], accent: 'new' },
    },
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '插入 5：5 < 8 → 左', mono: true, size: 12.5,
        color: AMBER, vis: [[1.4, 3.0]] },
      { x: 480, y: 232, anchor: 'middle', text: '5 > 3 → 右　　（和查找走完全相同的路）', mono: true,
        size: 12.5, color: AMBER, vis: [[3.0, 5.0]] },
      { x: 480, y: 232, anchor: 'middle', text: '5 < 6 → 左，这里现在是空的 → 挂上去', mono: true,
        size: 12.5, color: GREEN, vis: [[5.0, 8.0]] },
      { x: 480, y: 232, anchor: 'middle', text: '新结点永远是叶子：已有结点的关系一个都没动',
        size: 12.5, color: BLUE, vis: [[8.0, 10]] },
    ],
    steps: [
      { t: 0, text: '插入和查找走的是**完全相同的路径**，区别只在走到空的时候做什么' },
      { t: 1.4, text: '5 < 8 → 去左子树', code: 'if (x < T->data) T->left = BSTInsert(T->left, x);' },
      { t: 3.0, text: '5 > 3 → 去右子树' },
      { t: 5.0, text: '5 < 6 → 去左子树，发现这里空的', code: 'if (T == NULL) return NewNode(x);' },
      { t: 5.4, text: '把新结点挂在这个空位置上', name: '挂到空位' },
      { t: 7.0, text: '查找走到空会返回 NULL，插入则造个结点顶上 —— 就这一点区别' },
      { t: 8.0, text: '所以 BST 插入出来的新结点一定是叶子' },
      { t: 9.0, text: '注意：相等时什么都不做（也可以改成计数），但规矩必须明确' },
    ],
  }),

  // =========================================================================
  CAP('05-FindMin', 'FindMin —— 找最小值', '一路往左走到底，最左下的就是最小', 9, {
    nodes: allNodes([[0, 9]], {
      root: { vis: [[0, 9]], accent: 'hot' },
      'root.l': { vis: [[0, 9]], accent: 'hot' },
      'root.l.l': { vis: [[0, 9]], accent: 'new' },
    }),
    edges: allEdges([[0, 9]]),
    notes: [
      { x: 480, y: 228, anchor: 'middle', text: '8 → 左孩子 3 → 左孩子 1 → 1 没有左孩子，停', mono: true,
        size: 12.5, color: AMBER, vis: [[1.4, 5.0]] },
      { x: 480, y: 228, anchor: 'middle', text: '最小值 = 1', mono: true, size: 13, color: GREEN,
        vis: [[5.0, 7.4]] },
      { x: 480, y: 228, anchor: 'middle', text: '最大值对称：一路往右到底就是 14', mono: true,
        size: 12.5, color: BLUE, vis: [[7.4, 9]] },
    ],
    steps: [
      { t: 0, text: '最小值在哪？一定在"最左边"' },
      { t: 1.4, text: '因为左边都比根小 —— 只要还有左孩子，就一定能找到更小的', code: 'while (T->left != NULL) T = T->left;' },
      { t: 3.0, text: '8 有左孩子 3，继续往左' },
      { t: 4.0, text: '3 有左孩子 1，继续往左' },
      { t: 5.0, text: '1 没有左孩子了 —— 它就是最小值', name: '最小值 1' },
      { t: 6.4, text: '用循环而不是递归：这里不需要回退，循环更直白' },
      { t: 7.4, text: '最大值完全对称：一路往右走到没有右孩子为止', code: 'while (T->right != NULL) T = T->right;' },
      { t: 8.4, text: '下一节删除时要用它找"替身"，所以它不是可有可无的辅助函数' },
    ],
  }),

  // =========================================================================
  CAP('06-BSTDelete', 'BSTDelete —— 删除', '三种情况，最麻烦的是「两个孩子」', 12, {
    tree: {
      v: '10',
      l: { v: '3', l: { v: '1' }, r: { v: '6', l: { v: '4' }, r: { v: '7' } } },
      r: { v: '14', l: { v: '13' } },
    },
    nodes: {
      'root': { vis: [[5.6, 12]], accent: 'new' },
      'root.l': { vis: [[5.6, 12]] },
      'root.l.l': { vis: [[5.6, 12]] },
      'root.l.r': { vis: [[5.6, 12]] },
      'root.l.r.l': { vis: [[5.6, 12]] },
      'root.l.r.r': { vis: [[5.6, 12]] },
      'root.r': { vis: [[5.6, 12]] },
      'root.r.l': { vis: [[5.6, 12]] },
    },
    edges: allEdges([[5.6, 12]]),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '情况① 叶子：直接拿掉', size: 12.5,
        color: GREEN, vis: [[0.6, 3.0]] },
      { x: 480, y: 232, anchor: 'middle', text: '情况② 一个孩子：让孩子顶替自己的位置', size: 12.5,
        color: BLUE, vis: [[3.0, 5.6]] },
      { x: 480, y: 232, anchor: 'middle', text: '情况③ 两个孩子：找右子树的最小值当替身', size: 12.5,
        color: RED, vis: [[5.6, 9.0]] },
      { x: 480, y: 232, anchor: 'middle', text: '删 8 之后：10 顶上来，中序仍然是 1 3 4 6 7 10 13 14',
        mono: true, size: 12.5, color: GREEN, vis: [[9.0, 12]] },
    ],
    steps: [
      { t: 0, text: '删除要分三种情况，前两种很简单' },
      { t: 0.6, text: '① 删叶子：直接拿掉，什么都不用管', code: 'T = (T->left != NULL) ? T->left : T->right;\n free(tmp);' },
      { t: 3.0, text: '② 只有一个孩子：让孩子顶替上来' },
      { t: 5.6, text: '③ 有两个孩子 —— 麻烦在这里' },
      { t: 6.6, text: '不能直接拿掉：那样左右两棵子树就没法拼成一棵树了' },
      { t: 7.4, text: '办法是找替身：用右子树里最小的结点（10）', code: 'tmp = FindMin(T->right);' },
      { t: 8.6, text: '用它的值覆盖被删结点，然后再去右子树里把那个替身删掉', code: 'T->data = tmp->data;\n T->right = BSTDelete(T->right, tmp->data);' },
      { t: 10.0, text: '为什么替身是"右子树最小值"？因为它比右子树都小、又比左子树都大，放根上正好合规矩' },
      { t: 11.0, text: '写这段最容易漏的是把返回值接回去：T->left = BSTDelete(...)' },
    ],
  }),

  // =========================================================================
  CAP('07-InOrder', 'InOrder —— 中序验证', 'BST 的中序一定递增，这是最快的检查手段', 11, {
    nodes: allNodes([[0, 11]], {
      'root.l.l': { vis: [[0, 11]], accent: 'new' },
      'root.l': { vis: [[0, 11]], accent: 'new' },
      'root.l.r.l': { vis: [[0, 11]], accent: 'new' },
      'root.l.r': { vis: [[0, 11]], accent: 'new' },
      'root.l.r.r': { vis: [[0, 11]], accent: 'new' },
      'root': { vis: [[0, 11]], accent: 'new' },
      'root.r': { vis: [[0, 11]], accent: 'new' },
      'root.r.r.l': { vis: [[0, 11]], accent: 'new' },
      'root.r.r': { vis: [[0, 11]], accent: 'new' },
    }),
    edges: allEdges([[0, 11]]),
    notes: [
      { x: 480, y: 228, anchor: 'middle', text: '> 1 3 4 6 7 8 10 13 14', mono: true, size: 13,
        color: GREEN, vis: [[7.0, 11]] },
      { x: 480, y: 228, anchor: 'middle', text: '中序 = 左 根 右 —— 在 BST 上跑出来天然有序', size: 12.5,
        color: BLUE, vis: [[1.0, 5.0]] },
      { x: 480, y: 228, anchor: 'middle', text: '只要递增，就说明结构没被破坏', size: 12.5,
        color: GREEN, vis: [[7.0, 11]] },
      { x: 480, y: 228, anchor: 'middle', text: '哪里乱了序，就是哪一步的插入或删除写错了', size: 12.5,
        color: AMBER, vis: [[9.0, 11]] },
    ],
    steps: [
      { t: 0, text: '中序在普通二叉树里只是三种遍历之一，在 BST 里它有特殊身份' },
      { t: 1.0, text: '中序 = 左 → 根 → 右', code: 'InOrder(T->left);\n printf("%d ", T->data);\n InOrder(T->right);' },
      { t: 3.0, text: '先走完最左边，所以最小的先出来' },
      { t: 5.0, text: '一路走下来，正好是递增顺序' },
      { t: 7.0, text: '结果 1 3 4 6 7 8 10 13 14', name: '中序有序' },
      { t: 8.4, text: '所以写 BST 要养成习惯：每次改完，中序打一遍' },
      { t: 9.0, text: '输出有序 → 结构没坏；乱了序 → 那一步写错了' },
      { t: 10.0, text: '比盯着树看可靠得多 —— 树一深，人是看不出问题的' },
    ],
  }),

  // =========================================================================
  CAP('08-FreeTree', 'FreeTree —— 释放整棵树', '后序释放：先孩子、后自己', 9, {
    nodes: {
      'root.l.l': { vis: [[0, 2.2]], accent: 'del' },
      'root.l.r.l': { vis: [[0, 3.2]], accent: 'del' },
      'root.l.r.r': { vis: [[0, 4.2]], accent: 'del' },
      'root.l.r': { vis: [[0, 5.2]], accent: 'del' },
      'root.l': { vis: [[0, 6.2]], accent: 'del' },
      'root.r.r.l': { vis: [[0, 7.0]], accent: 'del' },
      'root.r.r': { vis: [[0, 7.8]], accent: 'del' },
      'root.r': { vis: [[0, 8.6]], accent: 'del' },
      'root': { vis: [[0, 9.4]], accent: 'del' },
    },
    edges: allEdges([[0, 9]]),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '叶子最先走，根最后走 —— 这就是后序', size: 12.5,
        color: RED, vis: [[1.0, 5.2]] },
      { x: 480, y: 232, anchor: 'middle', text: '先 free 根的话，孩子就再也找不到了 —— 内存泄漏',
        size: 12.5, color: AMBER, vis: [[6.0, 9]] },
    ],
    steps: [
      { t: 0, text: '释放整棵 BST —— 和普通二叉树一样，必须后序' },
      { t: 1.0, text: '先递归清空左子树', code: 'FreeTree(T->left);' },
      { t: 2.6, text: '再清空右子树', code: 'FreeTree(T->right);' },
      { t: 4.2, text: '最后才 free 自己', code: 'free(T);' },
      { t: 6.0, text: '顺序反了会怎样？先 free 根，孩子就再也找不到了' },
      { t: 7.4, text: '凡是「必须等孩子处理完才能处理自己」的操作都用后序' },
      { t: 8.4, text: '同类的还有：算表达式树的值、求树高' },
    ],
  }),

  // =========================================================================
  CAP('09-main', 'main —— 把 BST 跑一遍', '每一步都用中序对账', 11, {
    nodes: allNodes([[0.6, 11]], {}),
    edges: allEdges([[0.6, 11]]),
    notes: [
      { x: 480, y: 232, anchor: 'middle', text: '初始      1 3 4 6 7 8 10 13 14', mono: true,
        size: 12.5, vis: [[1.4, 3.4]] },
      { x: 480, y: 248, anchor: 'middle', text: '删 7 叶子后   1 3 4 6 8 10 13 14', mono: true,
        size: 12.5, color: GREEN, vis: [[3.4, 5.4]] },
      { x: 480, y: 264, anchor: 'middle', text: '删 3 双孩后   1 4 6 8 10 13 14', mono: true,
        size: 12.5, color: BLUE, vis: [[5.4, 7.6]] },
      { x: 480, y: 280, anchor: 'middle', text: '每一步都保持有序 → 结构正确', mono: true,
        size: 12.5, color: '#8C959F', vis: [[7.6, 11]] },
    ],
    steps: [
      { t: 0, text: '把 BST 的几个操作串起来跑一遍' },
      { t: 1.4, text: '插入 9 个值后，中序是递增的 —— 说明建树正确' },
      { t: 3.4, text: '删一个叶子（7），中序依然有序' },
      { t: 5.4, text: '删一个有两个孩子的结点（3），中序依然有序' },
      { t: 7.6, text: '删根也一样 —— 关键是每一步都要保持有序' },
      { t: 8.8, text: '删除不存在的值时什么都不该变' },
      { t: 9.8, text: '这个"改一步、验一次"的习惯，是写树结构时最省心的做法' },
    ],
  }),

];
