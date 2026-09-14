'use strict';
/**
 * 01-01 算法复杂度 —— 动画场景
 *
 * "复杂度"本身是抽象的，所以这里的动画做一件事：**把执行次数数给你看**。
 * 用一排格子代表"加法的次数"，一格一格亮起来：
 *   O(1)  永远只亮一格
 *   O(n)  n 格依次亮
 *   O(n²) 同一排格子被反复点亮（表示 n×n 次）
 */

const BLUE = '#3B82F6';
const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';

/** 生成"第 i 格亮"的可见区间 */
const litAll = [[0, 20]];

const CAP = (no, title, sub, total, extra) => ({
  id: `01-01-${no}`,
  no,
  title,
  sub,
  bookTag: '算法复杂度',
  variant: 'array',
  accentColor: '#6E7781',
  total,
  slots: 6,
  ...extra,
});

module.exports = [

  // =========================================================================
  CAP('01-countConst', 'countConst —— O(1)', '执行次数与 n 完全无关', 8, {
    cells: [
      { at: 0, value: '1', vis: [[1.4, 8]], accent: 'new' },
    ],
    highlights: [{ at: 0, vis: [[3.6, 8]], color: GREEN }],
    pointers: [],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: 'cnt++ 只执行一次 —— 不管 n 是 10 还是一百万',
        size: 13, color: GREEN, vis: [[1.4, 4.4]] },
      { x: 480, y: 200, anchor: 'middle', text: '常数阶不是"很快"，而是"与 n 无关"', size: 12.5,
        color: AMBER, vis: [[4.4, 6.6]] },
      { x: 480, y: 200, anchor: 'middle', text: '哪怕写 1000 行加法，它还是 O(1) —— 因为没有随 n 增长',
        size: 12.5, vis: [[6.6, 8]] },
    ],
    steps: [
      { t: 0, text: '先看最简单的一档：执行次数是个常数' },
      { t: 1.4, text: 'cnt++ 这一句只跑一次', code: 'long cnt = 0;\n cnt++;' },
      { t: 3.6, text: 'n = 10 时是 1 次，n = 1000 时还是 1 次', name: '永远是 1' },
      { t: 4.4, text: '所以叫**常数阶**，写成 O(1)' },
      { t: 5.6, text: '注意：O(1) 不代表快。写 1000 行赋值它也是 O(1)' },
      { t: 6.6, text: '它的真正含义是"代价不随问题规模增长" —— 这才是我们关心的' },
    ],
  }),

  // =========================================================================
  CAP('02-countLinear', 'countLinear —— O(n)', '单层循环走 n 遍，次数与 n 成正比', 9, {
    cells: [
      { at: 0, value: '1', vis: [[1.0, 9]], accent: 'new' },
      { at: 1, value: '2', vis: [[1.7, 9]], accent: 'new' },
      { at: 2, value: '3', vis: [[2.4, 9]], accent: 'new' },
      { at: 3, value: '4', vis: [[3.1, 9]], accent: 'new' },
      { at: 4, value: '5', vis: [[3.8, 9]], accent: 'new' },
      { at: 5, value: '6', vis: [[4.5, 9]], accent: 'new' },
    ],
    pointers: [
      { label: 'i', at: 0, vis: [[1.0, 1.7]], color: AMBER },
      { label: 'i', at: 1, vis: [[1.7, 2.4]], color: AMBER },
      { label: 'i', at: 2, vis: [[2.4, 3.1]], color: AMBER },
      { label: 'i', at: 3, vis: [[3.1, 3.8]], color: AMBER },
      { label: 'i', at: 4, vis: [[3.8, 4.5]], color: AMBER },
      { label: 'i', at: 5, vis: [[4.5, 6.0]], color: AMBER },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: 'n = 6 时加 6 次 —— 每转一圈加一次', mono: true,
        size: 12.5, color: GREEN, vis: [[4.5, 6.2]] },
      { x: 480, y: 200, anchor: 'middle', text: 'n 涨 10 倍，次数也涨 10 倍：这就是"成正比"',
        size: 12.5, color: BLUE, vis: [[6.2, 8.0]] },
      { x: 480, y: 200, anchor: 'middle', text: 'n=10 → 10 次　n=100 → 100 次　n=1000 → 1000 次',
        mono: true, size: 12.5, vis: [[6.2, 8.0]] },
    ],
    steps: [
      { t: 0, text: '第二档：单层循环，走 n 遍' },
      { t: 1.0, text: 'i 从 0 走到 n-1，每走一步加一次', code: 'for (i = 0; i < n; i++)   cnt++;' },
      { t: 2.4, text: '第 1 圈加 1 次，第 2 圈再加 1 次……' },
      { t: 4.5, text: 'n = 6 就走 6 遍，加到 6', name: 'cnt = n' },
      { t: 6.2, text: 'n 翻 10 倍，次数也翻 10 倍 —— 这就是线性阶 O(n)', name: '成正比' },
      { t: 7.4, text: '一眼判断：**单层循环、且循环次数和 n 挂钩 → O(n)**' },
    ],
  }),

  // =========================================================================
  CAP('03-countQuadratic', 'countQuadratic —— O(n²)', '双层循环，n 每涨 10 倍，次数涨 100 倍', 11, {
    cells: [
      { at: 0, value: 'n', vis: litAll, accent: 'new' },
      { at: 1, value: 'n', vis: litAll, accent: 'new' },
      { at: 2, value: 'n', vis: litAll, accent: 'new' },
      { at: 3, value: 'n', vis: litAll, accent: 'new' },
      { at: 4, value: 'n', vis: litAll, accent: 'new' },
      { at: 5, value: 'n', vis: litAll, accent: 'new' },
    ],
    highlights: [
      { at: 0, vis: [[1.0, 1.5], [2.2, 2.7], [3.4, 3.9], [4.6, 5.1]], color: BLUE },
      { at: 1, vis: [[1.3, 1.8], [2.5, 3.0], [3.7, 4.2], [4.9, 5.4]], color: BLUE },
      { at: 2, vis: [[1.6, 2.1], [2.8, 3.3], [4.0, 4.5], [5.2, 5.7]], color: BLUE },
      { at: 3, vis: [[1.9, 2.4], [3.1, 3.6], [4.3, 4.8], [5.5, 6.0]], color: BLUE },
      { at: 4, vis: [[2.1, 2.6], [3.3, 3.8], [4.5, 5.0], [5.7, 6.2]], color: BLUE },
      { at: 5, vis: [[2.3, 2.8], [3.5, 4.0], [4.7, 5.2], [5.9, 6.4]], color: BLUE },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '外层每转一圈，内层都要把 n 个格子全点亮一次',
        size: 12.5, color: BLUE, vis: [[1.0, 6.4]] },
      { x: 480, y: 200, anchor: 'middle', text: '所以总次数是 n × n', mono: true, size: 13,
        color: RED, vis: [[6.4, 8.4]] },
      { x: 480, y: 200, anchor: 'middle', text: 'n=10 → 100 次　n=100 → 10000 次　n=1000 → 100 万次',
        mono: true, size: 12.5, color: RED, vis: [[6.4, 8.4]] },
      { x: 480, y: 200, anchor: 'middle', text: '对比线性阶：n 涨到 1000 时，线性涨 100 倍，平方涨 10000 倍',
        size: 12.5, color: AMBER, vis: [[8.4, 11]] },
    ],
    steps: [
      { t: 0, text: '第三档：两层循环套在一起' },
      { t: 1.0, text: '外层 i 走一遍，内层 j 就要把整排走一遍', code: 'for (i = 0; i < n; i++)\n     for (j = 0; j < n; j++)\n         cnt++;' },
      { t: 3.4, text: '外层每转一圈 → 内层 n 次；外层转 n 圈 → 一共 n × n 次' },
      { t: 6.4, text: '所以是平方阶 O(n²)', name: 'n × n' },
      { t: 7.6, text: '看增长速度：n=1000 时平方阶要 100 万次', code: '/* 同样 n=1000，线性只要 1000 次 */' },
      { t: 8.4, text: '记住几条规则：嵌套循环相乘、并列循环相加' },
      { t: 9.8, text: '这就是为什么数据量大时，O(n²) 的算法会突然"跑不动"' },
    ],
  }),

  // =========================================================================
  CAP('04-main', 'main —— 三种量级摆一起', 'n 从 10 涨到 1000，看谁的代价涨得最凶', 11, {
    cells: [
      { at: 0, value: '1', vis: [[1.0, 11]], accent: 'new' },
      { at: 1, value: 'n', vis: [[2.4, 11]], accent: 'hot' },
      { at: 2, value: 'n²', vis: [[4.6, 11]], accent: 'del' },
    ],
    highlights: [
      { at: 0, vis: [[1.0, 4.0]], color: GREEN },
      { at: 1, vis: [[2.4, 6.2]], color: AMBER },
      { at: 2, vis: [[4.6, 9.0]], color: RED },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: 'n=10   : 1 次　　10 次　　100 次', mono: true,
        size: 12.5, vis: [[1.0, 4.0]] },
      { x: 480, y: 200, anchor: 'middle', text: 'n=100  : 1 次　　100 次　　10000 次', mono: true,
        size: 12.5, vis: [[4.0, 6.2]] },
      { x: 480, y: 200, anchor: 'middle', text: 'n=1000 : 1 次　　1000 次　　1000000 次', mono: true,
        size: 12.5, color: RED, vis: [[6.2, 9.0]] },
      { x: 480, y: 200, anchor: 'middle', text: '理论上"都能算"，但 n=10⁶ 时平方阶要 10¹² 次 —— 再快的机器也救不了',
        size: 12.5, color: AMBER, vis: [[9.0, 11]] },
    ],
    steps: [
      { t: 0, text: '把三种量级并排跑一遍，观察执行次数怎么变' },
      { t: 1.0, text: 'O(1)：n 怎么变都是 1 次', name: '恒定' },
      { t: 2.4, text: 'O(n)：n 涨 10 倍，次数涨 10 倍', name: '成正比' },
      { t: 4.6, text: 'O(n²)：n 涨 10 倍，次数涨 100 倍', name: '涨得最凶' },
      { t: 7.0, text: '同样是 n 从 10 到 1000：线性涨 100 倍，平方涨 10000 倍' },
      { t: 9.0, text: '所以"能不能跑"的关键不是机器多快，而是**量级**有多大' },
      { t: 10.2, text: '这就是复杂度分析的全部意义：在写代码之前就能预判它跑不跑得动' },
    ],
  }),

];
