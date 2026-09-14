'use strict';
/**
 * 01-02 最大子列和问题 —— 动画场景
 *
 * 数组：-2  11  -4  13  -5  -2        答案 20（11 + (-4) + 13）
 *
 * 四种算法对比，动画的重点是"每一层循环在扫什么"：
 *   算法1 三重：i、j、k 三个指针，每个子列都从头重加
 *   算法2 两重：去掉 k，thisSum 只加"新进来的那个"
 *   算法3 分治：左右两半 + 跨中线扫一遍
 *   算法4 在线：只用一个 thisSum，变负就扔
 */

const BLUE = '#3B82F6';
const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';

const DATA = [
  { v: '-2', i: 0 },
  { v: '11', i: 1 },
  { v: '-4', i: 2 },
  { v: '13', i: 3 },
  { v: '-5', i: 4 },
  { v: '-2', i: 5 },
];

/** 把整组数据铺成格子 */
const row = (vis) => DATA.map((d) => ({ at: d.i, value: d.v, vis }));

const CAP = (no, title, sub, total, extra) => ({
  id: `01-02-${no}`,
  no,
  title,
  sub,
  bookTag: '最大子列和',
  variant: 'array',
  accentColor: BLUE,
  total,
  slots: 6,
  ...extra,
});

module.exports = [

  // =========================================================================
  CAP('01-MaxSubseqSum1', '算法1 —— 三重循环 O(n³)', '枚举所有子列，每个子列都从头重加一遍', 10, {
    cells: row([[0, 10]]),
    highlights: [
      { at: 0, vis: [[1.0, 2.0]], color: AMBER },
      { at: 1, vis: [[2.0, 3.0]], color: AMBER },
      { at: 2, vis: [[3.0, 4.0]], color: AMBER },
    ],
    pointers: [
      { label: 'i', at: 0, vis: [[1.0, 4.0]], color: BLUE },
      { label: 'j', at: 0, vis: [[1.0, 2.0]], color: GREEN },
      { label: 'j', at: 1, vis: [[2.0, 3.0]], color: GREEN },
      { label: 'j', at: 2, vis: [[3.0, 4.0]], color: GREEN },
      { label: 'k', at: 0, vis: [[1.0, 2.0]], color: RED },
      { label: 'k', at: 1, vis: [[2.0, 3.0]], color: RED },
      { label: 'k', at: 2, vis: [[3.0, 4.0]], color: RED },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: 'i=0, j=0：子列就是 -2，thisSum = -2，maxSum 还是 0',
        mono: true, size: 12.5, vis: [[1.0, 2.0]] },
      { x: 480, y: 200, anchor: 'middle', text: 'i=0, j=1：子列是 -2 11，从头加一遍 = 9 → maxSum = 9',
        mono: true, size: 12.5, color: GREEN, vis: [[2.0, 3.0]] },
      { x: 480, y: 200, anchor: 'middle', text: 'i=0, j=2：又从头加一遍 —— 上一轮的 9 明明还能用',
        mono: true, size: 12.5, color: RED, vis: [[3.0, 5.0]] },
      { x: 480, y: 200, anchor: 'middle', text: 'k 这一层就是浪费：N(N+1)/2 个子列，每个都要加 O(N) 次',
        size: 12.5, color: RED, vis: [[5.0, 7.6]] },
      { x: 480, y: 200, anchor: 'middle', text: '记住这个多余的 k 循环 —— 下一个算法就是把它删掉',
        size: 12.5, color: AMBER, vis: [[7.6, 10]] },
    ],
    steps: [
      { t: 0, text: '最笨的办法：把所有子列都枚举一遍' },
      { t: 1.0, text: 'i 是左端，j 是右端 —— 两个下标就确定了一个子列', code: 'for (i = 0; i < N; i++)\n   for (j = i; j < N; j++)' },
      { t: 3.0, text: 'k 从 i 扫到 j，把这个子列的和算出来', code: 'for (k = i; k <= j; k++) thisSum += A[k];' },
      { t: 5.0, text: '问题就在这：每换一个 j，k 都从 i 重新加一遍', name: '重复计算' },
      { t: 6.4, text: '子列一共有 N(N+1)/2 个，每个要加 O(N) 次 → O(N³)', code: '/* N=1000 时约 5 亿次加法 */' },
      { t: 7.6, text: '下一版就把 k 这一层省掉' },
    ],
  }),

  // =========================================================================
  CAP('02-MaxSubseqSum2', '算法2 —— 两重循环 O(n²)', 'thisSum 提到外层，每轮只加"新进来的那个"', 10, {
    cells: row([[0, 10]]),
    highlights: [
      { at: 1, vis: [[1.4, 2.6]], color: GREEN },
      { at: 2, vis: [[2.6, 3.8]], color: GREEN },
      { at: 3, vis: [[3.8, 5.0]], color: GREEN },
      { at: 2, vis: [[6.0, 7.4]], color: RED },
    ],
    pointers: [
      { label: 'i', at: 1, vis: [[1.4, 8.0]], color: BLUE },
      { label: 'j', at: 1, vis: [[1.4, 2.6]], color: GREEN },
      { label: 'j', at: 2, vis: [[2.6, 3.8]], color: GREEN },
      { label: 'j', at: 3, vis: [[3.8, 5.0]], color: GREEN },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: 'i=1, j=1：thisSum = 11 → maxSum = 11', mono: true,
        size: 12.5, color: GREEN, vis: [[1.4, 2.6]] },
      { x: 480, y: 200, anchor: 'middle', text: 'j=2：thisSum = 11 + (-4) = 7 　—— 只加了一个新元素',
        mono: true, size: 12.5, color: GREEN, vis: [[2.6, 3.8]] },
      { x: 480, y: 200, anchor: 'middle', text: 'j=3：thisSum = 7 + 13 = 20 → maxSum = 20 ✔',
        mono: true, size: 12.5, color: GREEN, vis: [[3.8, 5.0]] },
      { x: 480, y: 200, anchor: 'middle', text: 'k 循环没了：thisSum 提到 j 循环外面，每轮只加 A[j]',
        size: 12.5, color: BLUE, vis: [[5.0, 6.6]] },
      { x: 480, y: 200, anchor: 'middle', text: '为什么内层要清零？因为换了左端 i，之前的累加就不算数了',
        size: 12.5, color: RED, vis: [[6.0, 8.0]] },
    ],
    steps: [
      { t: 0, text: '关键观察：固定左端后，j 每右移一格，和只会**增加一个新元素**' },
      { t: 1.4, text: '把 thisSum 提到 j 循环外面，每轮只加 A[j]', code: 'thisSum = 0;\n for (j = i; j < N; j++) {\n     thisSum += A[j];\n     ...\n }' },
      { t: 3.8, text: '扫到 j=3 时 thisSum = 20，这是目前找到的最大值', name: 'maxSum = 20' },
      { t: 5.0, text: '少了一层循环，O(N³) 降到 O(N²)', name: 'O(N³) → O(N²)' },
      { t: 6.0, text: '注意 thisSum 在换 i 的时候必须清零 —— 换了左端，之前的和就作废了', code: 'thisSum = 0;   /* 每个新左端都要重来 */' },
      { t: 8.0, text: '这个手法很通用：**找出重复计算的部分，缓存下来复用**' },
    ],
  }),

  // =========================================================================
  CAP('03-MaxSubseqSum3', '算法3 —— 分治 O(n log n)', '答案要么在左半、要么在右半、要么跨过中线', 11, {
    cells: [
      ...DATA.map((d) => ({ at: d.i, value: d.v, vis: [[0, 11]], accent: d.i <= 2 ? null : 'hot' })),
    ],
    highlights: [
      { at: 0, vis: [[1.4, 3.4]], color: BLUE },
      { at: 1, vis: [[1.4, 3.4]], color: BLUE },
      { at: 2, vis: [[1.4, 3.4]], color: BLUE },
      { at: 3, vis: [[1.4, 3.4]], color: '#8250DF' },
      { at: 4, vis: [[1.4, 3.4]], color: '#8250DF' },
      { at: 5, vis: [[1.4, 3.4]], color: '#8250DF' },
      { at: 2, vis: [[5.4, 7.4]], color: AMBER },
      { at: 1, vis: [[5.4, 7.4]], color: AMBER },
      { at: 3, vis: [[5.4, 7.4]], color: AMBER },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '从中线劈开：左边 -2 11 -4，右边 13 -5 -2', size: 12.5,
        color: BLUE, vis: [[1.4, 5.4]] },
      { x: 480, y: 200, anchor: 'middle', text: '左半递归得 11，右半递归得 13 —— 但答案不一定在两半里面',
        size: 12.5, vis: [[3.4, 5.4]] },
      { x: 480, y: 200, anchor: 'middle', text: '从中线往左扫最大后缀 = 11，往右扫最大前缀 = 13，跨界 = 24',
        mono: true, size: 12.5, color: AMBER, vis: [[5.4, 7.8]] },
      { x: 480, y: 200, anchor: 'middle', text: '等一下，24 和实际答案 20 对不上？因为跨界必须"连续"',
        size: 12.5, color: RED, vis: [[7.8, 9.4]] },
      { x: 480, y: 200, anchor: 'middle', text: '   往左扫到 -2 时和变成 9，不如 11；往右只取 13 就停。三者取大 = 20',
        mono: true, size: 12.5, color: GREEN, vis: [[9.4, 11]] },
    ],
    steps: [
      { t: 0, text: '分治：把数组从中间劈成两半' },
      { t: 1.4, text: '最大子列只可能在三个地方：左半、右半、跨过中线', code: '/* 左半 [0..mid]  右半 [mid+1..right]  跨界 */' },
      { t: 3.4, text: '左半和右半各自递归 —— 这是同一个问题的更小规模' },
      { t: 5.4, text: '跨界那部分只能硬算：从中线出发往两边扫', code: 'for (i = mid; i >= left; i--)      /* 往左：最大后缀 */\n for (i = mid+1; i <= right; i++)   /* 往右：最大前缀 */' },
      { t: 7.8, text: '扫的时候记录的是"累加过程中的最大值"，不是一路加到头的和', name: '关键细节' },
      { t: 9.4, text: '三者取大：11 / 13 / 20 → 20', code: 'T(N) = 2·T(N/2) + O(N)  →  O(N log N)' },
      { t: 10.2, text: '比算法2快，但代码复杂、还要占递归栈 —— 而下一个算法只要 8 行' },
    ],
  }),

  // =========================================================================
  CAP('04-MaxSubseqSum4', '算法4 —— 在线处理 O(n)', '当前和一旦变负就立刻扔掉，只扫一遍', 12, {
    cells: row([[0, 12]]),
    highlights: [
      { at: 0, vis: [[1.4, 2.4]], color: RED },
      { at: 1, vis: [[2.4, 4.0]], color: GREEN },
      { at: 2, vis: [[4.0, 5.6]], color: GREEN },
      { at: 3, vis: [[5.6, 8.0]], color: GREEN },
      { at: 4, vis: [[8.0, 9.4]], color: AMBER },
      { at: 5, vis: [[9.4, 11.0]], color: AMBER },
    ],
    pointers: [
      { label: 'i', at: 0, vis: [[1.0, 2.4]], color: BLUE },
      { label: 'i', at: 1, vis: [[2.4, 4.0]], color: BLUE },
      { label: 'i', at: 2, vis: [[4.0, 5.6]], color: BLUE },
      { label: 'i', at: 3, vis: [[5.6, 8.0]], color: BLUE },
      { label: 'i', at: 4, vis: [[8.0, 9.4]], color: BLUE },
      { label: 'i', at: 5, vis: [[9.4, 11.0]], color: BLUE },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: 'thisSum = -2 < 0 → 扔掉重来（maxSum 仍是 0）',
        mono: true, size: 12.5, color: RED, vis: [[1.4, 2.4]] },
      { x: 480, y: 200, anchor: 'middle', text: 'thisSum = 11 → maxSum = 11', mono: true,
        size: 12.5, color: GREEN, vis: [[2.4, 4.0]] },
      { x: 480, y: 200, anchor: 'middle', text: 'thisSum = 11-4 = 7（没超过 maxSum，也不为负，继续带着）',
        mono: true, size: 12.5, color: GREEN, vis: [[4.0, 5.6]] },
      { x: 480, y: 200, anchor: 'middle', text: 'thisSum = 7+13 = 20 → maxSum = 20 ✔', mono: true,
        size: 12.5, color: GREEN, vis: [[5.6, 8.0]] },
      { x: 480, y: 200, anchor: 'middle', text: 'thisSum = 15 → 13 也不是负，继续；答案保持 20',
        mono: true, size: 12.5, color: AMBER, vis: [[8.0, 11.0]] },
    ],
    steps: [
      { t: 0, text: '最后这个算法只有 8 行，但它凭什么对？' },
      { t: 1.4, text: '当前和一旦变成负数，它对后面**任何一个**子列都是负担 —— 带着不如甩掉', code: 'else if (thisSum < 0) thisSum = 0;' },
      { t: 3.2, text: '所以扫到 -2 时 thisSum = -2，直接归零重来', name: '扔掉负数前缀' },
      { t: 4.8, text: '接着 11 → maxSum = 11；再加 -4 变成 7（还没亏，先带着）', code: 'thisSum += A[i];\n if (thisSum > maxSum) maxSum = thisSum;' },
      { t: 6.4, text: '再加 13 得 20 —— 这就是答案', name: 'maxSum = 20' },
      { t: 8.0, text: '后面的 -5、-2 都不足以让它变负，答案就定在 20' },
      { t: 9.4, text: '只扫一遍、只用一个变量 —— O(N) 时间、O(1) 空间', name: 'O(N) / O(1)' },
      { t: 10.6, text: '"在线"的意思是：数据一边读一边就能给出答案，甚至不需要把数组存下来' },
    ],
  }),

  // =========================================================================
  CAP('05-main', 'main —— 四种算法对账', '思路完全不同，但必须算出同一个数', 9, {
    cells: row([[0.8, 9]]),
    highlights: [{ at: 0, vis: [[2.4, 9]], color: BLUE }],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '算法1 三重循环 O(N³)   → 20', mono: true, size: 12.5,
        vis: [[2.4, 3.6]] },
      { x: 480, y: 200, anchor: 'middle', text: '算法2 两重循环 O(N²)   → 20', mono: true, size: 12.5,
        vis: [[3.6, 4.8]] },
      { x: 480, y: 200, anchor: 'middle', text: '算法3 分治     O(NlogN) → 20', mono: true, size: 12.5,
        vis: [[4.8, 6.0]] },
      { x: 480, y: 200, anchor: 'middle', text: '算法4 在线处理 O(N)     → 20', mono: true, size: 12.5,
        color: GREEN, vis: [[6.0, 7.6]] },
      { x: 480, y: 200, anchor: 'middle', text: '四个答案一致 → 至少说明没写错。这是很有用的调试手段',
        size: 12.5, color: GREEN, vis: [[7.6, 9]] },
    ],
    steps: [
      { t: 0, text: '输入：-2 11 -4 13 -5 -2，正确答案是 20' },
      { t: 0.8, text: '四个算法思路完全不同，但必须给出同一个数' },
      { t: 2.4, text: '算法1：三重循环，最笨也最好懂', name: 'O(N³) → 20' },
      { t: 3.6, text: '算法2：把重复累加省掉', name: 'O(N²) → 20' },
      { t: 4.8, text: '算法3：分治，左半右半跨界三者取大', name: 'O(NlogN) → 20' },
      { t: 6.0, text: '算法4：只扫一遍，负数前缀直接扔掉', name: 'O(N) → 20' },
      { t: 7.6, text: '多解法互验是很有用的调试手段 —— 不一致就说明有 bug' },
      { t: 8.4, text: '从 30 行缩到 8 行，从 O(N³) 到 O(N)：这就是好算法的价值' },
    ],
  }),

];
