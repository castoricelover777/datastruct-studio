'use strict';
/**
 * 02-03 堆栈 —— 动画场景
 *
 * 堆栈的动画重点只有一个：**top 这个指针怎么动**。
 * 空栈 top = -1（用 at: -0.5 把它画在 0 号格左边），入栈先动指针再放值，
 * 出栈先取值再退指针 —— 顺序和队列刚好相反，这是最容易记混的地方。
 */

const BLUE = '#3B82F6';
const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';

const CAP = (no, title, sub, total, slots, extra) => ({
  id: `02-03-${no}`,
  no,
  title,
  sub,
  bookTag: '堆栈',
  variant: 'array',
  accentColor: BLUE,
  total,
  slots,
  ...extra,
});

module.exports = [

  // =========================================================================
  CAP('01-typedef', 'typedef —— 顺序栈的结构', '一个定长数组 + 一个 top 下标', 8, 6, {
    cells: [
      { at: 0, value: '10', vis: [[1.0, 8]] },
      { at: 1, value: '20', vis: [[1.7, 8]] },
      { at: 2, value: '30', vis: [[2.4, 8]] },
    ],
    pointers: [
      { label: 'top', at: -0.5, vis: [[3.2, 4.4]], color: AMBER },
      { label: 'top', at: 0, vis: [[4.4, 5.2]], color: AMBER },
      { label: 'top', at: 2, vis: [[5.2, 8]], color: AMBER },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '约定：top 指向"栈顶元素本身"，不是它上面的空位',
        size: 12.5, color: AMBER, vis: [[3.2, 5.2]] },
      { x: 480, y: 200, anchor: 'middle', text: 'top = -1  空栈　　top = 0  一个元素　　top = MAXSIZE-1  装满',
        mono: true, size: 12.5, color: BLUE, vis: [[5.2, 8]] },
    ],
    steps: [
      { t: 0, text: '顺序栈就是顺序表加一条规矩：只准在一端进出' },
      { t: 1.0, text: '压入 10、20、30 —— 都从同一端（栈顶）进' },
      { t: 3.2, text: 'top 是个下标，它指着"最后进来的那个元素"' },
      { t: 4.4, text: 'top = 0 表示栈里有一个元素', code: 'top = -1;   /* 空栈 */' },
      { t: 5.2, text: '三种状态要记牢', code: 'top == -1        空\n top == MAXSIZE-1  满\n 其余             正常' },
      { t: 6.6, text: '为什么空栈用 -1 而不是 0？因为 0 是合法下标，用它会分不清"空"和"有一个"' },
    ],
  }),

  // =========================================================================
  CAP('02-InitStack', 'InitStack —— 初始化', 'top 置成 -1，这就是空栈', 7, 6, {
    cells: [],
    pointers: [
      { label: 'top', at: 3, vis: [[0, 2.0]], color: RED },
      { label: 'top', at: -0.5, vis: [[2.0, 7]], color: AMBER },
    ],
    highlights: [{ at: -0.0, vis: [[2.0, 7]], color: BLUE }],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '没初始化的 top 是随机值 —— 拿它当下标会直接踩到别的内存',
        size: 12.5, color: RED, vis: [[0, 2.0]] },
      { x: 480, y: 200, anchor: 'middle', text: 'S->top = -1;   空栈的唯一标志', mono: true,
        size: 12.5, color: AMBER, vis: [[2.0, 5.4]] },
      { x: 480, y: 200, anchor: 'middle', text: '-1 是合法下标 0 的"前一个"，所以它和"有一个元素"区分得清清楚楚',
        size: 12.5, color: BLUE, vis: [[5.4, 7]] },
    ],
    steps: [
      { t: 0, text: '栈没初始化时，top 里是内存里的随机数' },
      { t: 1.0, text: '如果这个随机数是 3，程序会以为栈里有 4 个元素 —— 完全乱套' },
      { t: 2.0, text: '初始化只做一件事', code: 'S->top = -1;' },
      { t: 4.0, text: '为什么偏偏是 -1？' },
      { t: 5.4, text: '因为 top 要"指着有东西的格子"，没有东西时只能指向一个不存在的位置', code: '/* -1 不是合法下标，正合适表示"没有" */' },
    ],
  }),

  // =========================================================================
  CAP('03-Push', 'Push —— 入栈', '先判满，再 top++ ，最后放元素', 10, 6, {
    cells: [
      { at: 0, value: '10', vis: [[0.6, 10]] },
      { at: 1, value: '20', vis: [[1.3, 10]] },
      { at: 2, value: '30', vis: [[2.0, 10]] },
      { at: 3, value: '40', vis: [[5.0, 10]], accent: 'new', rise: 5.0 },
      { at: 4, value: '50', vis: [[8.2, 10]], accent: 'new', rise: 8.2 },
    ],
    pointers: [
      { label: 'top', at: 1, vis: [[0.6, 3.2]], color: AMBER },
      { label: 'top', at: 2, vis: [[3.2, 5.0]], color: AMBER },
      { label: 'top', at: 3, vis: [[5.0, 8.2]], color: AMBER },
      { label: 'top', at: 4, vis: [[8.2, 10]], color: AMBER },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '判满必须放在最前面 —— 越界写 C 语言不会拦你',
        size: 12.5, color: RED, vis: [[3.2, 5.0]] },
      { x: 480, y: 200, anchor: 'middle', text: 'S->top++;              ① 先让 top 指向那个空位',
        mono: true, size: 12.5, color: GREEN, vis: [[5.0, 6.6]] },
      { x: 480, y: 200, anchor: 'middle', text: 'S->data[S->top] = e;   ② 再放进去 —— 顺序反了会覆盖 30',
        mono: true, size: 12.5, color: GREEN, vis: [[6.6, 8.2]] },
      { x: 480, y: 200, anchor: 'middle', text: 'top 到 MAXSIZE-1 就是满，再来就拒绝', mono: true,
        size: 12.5, color: RED, vis: [[8.2, 10]] },
    ],
    steps: [
      { t: 0, text: '栈里已有 10、20、30，top = 2' },
      { t: 1.3, text: '现在压入 40 —— 它要落到下标 3' },
      { t: 3.2, text: '第一件事永远是判满', code: 'if (S->top >= MAXSIZE - 1) return ERROR;' },
      { t: 5.0, text: '① 先动指针：top 从 2 变成 3', code: 'S->top++;' },
      { t: 6.6, text: '② 再放数据：40 落到 top 现在指的格子里', code: 'S->data[S->top] = e;' },
      { t: 8.2, text: '再压 50，top 走到 4 —— 这已经是最后一格，栈满了', name: 'top == MAXSIZE-1' },
      { t: 9.0, text: '顺序不能反：先写 data[top] 会把 30 覆盖掉' },
    ],
  }),

  // =========================================================================
  CAP('04-Pop', 'Pop —— 出栈', '先判空，取走 data[top]，然后 top--', 9, 6, {
    cells: [
      { at: 0, value: '10', vis: [[0, 9]] },
      { at: 1, value: '20', vis: [[0, 9]] },
      { at: 2, value: '30', vis: [[0, 4.6]], accent: 'del' },
      { at: 3, value: '40', vis: [[4.6, 9]], accent: 'new' },
    ],
    pointers: [
      { label: 'top', at: 3, vis: [[0, 4.6]], color: AMBER },
      { label: 'top', at: 2, vis: [[4.6, 9]], color: AMBER },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '*e = S->data[S->top];  ① 先取走栈顶元素（40）',
        mono: true, size: 12.5, color: GREEN, vis: [[0, 4.6]] },
      { x: 480, y: 200, anchor: 'middle', text: 'S->top--;              ② 再让 top 退一格',
        mono: true, size: 12.5, color: GREEN, vis: [[4.6, 6.4]] },
      { x: 480, y: 200, anchor: 'middle', text: '注意：40 还在数组里，但它已经"不属于这张栈"了',
        size: 12.5, color: AMBER, vis: [[6.4, 9]] },
    ],
    steps: [
      { t: 0, text: '栈里是 10 20 30 40，top = 3' },
      { t: 1.2, text: '出栈 —— 第一件事是判空（top < 0 才是空）', code: 'if (S->top < 0) return ERROR;' },
      { t: 3.0, text: '① 取走栈顶元素 40', code: '*e = S->data[S->top];' },
      { t: 4.6, text: '② top 从 3 退到 2 —— 40 从此不算数了', code: 'S->top--;' },
      { t: 6.4, text: '出栈并不擦数据，只是把 top 往回挪。下次入栈会直接覆盖这一格' },
      { t: 7.6, text: '所以出栈之后别再去读 data[top+1]，那个值随时可能被冲掉' },
    ],
  }),

  // =========================================================================
  CAP('05-main', 'main —— 后进先出', '压入 10 20 30，弹出顺序正好是 30 20 10', 9, 6, {
    cells: [
      { at: 0, value: '10', vis: [[0.8, 9]] },
      { at: 1, value: '20', vis: [[1.5, 9]] },
      { at: 2, value: '30', vis: [[2.2, 9]] },
    ],
    pointers: [
      { label: 'top', at: 2, vis: [[2.2, 3.8]], color: AMBER },
      { label: 'top', at: 1, vis: [[3.8, 5.4]], color: AMBER },
      { label: 'top', at: 0, vis: [[5.4, 7.0]], color: AMBER },
      { label: 'top', at: -0.5, vis: [[7.0, 9]], color: RED },
    ],
    highlights: [
      { at: 2, vis: [[3.8, 5.4]], color: GREEN },
      { at: 1, vis: [[5.4, 7.0]], color: GREEN },
      { at: 0, vis: [[7.0, 8.2]], color: GREEN },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '> 30 20 10        弹出来的顺序和进去的正好相反',
        mono: true, size: 13, color: GREEN, vis: [[7.0, 9]] },
      { x: 480, y: 200, anchor: 'middle', text: '弹出 30 → top 退到 1', mono: true, size: 12.5,
        color: AMBER, vis: [[3.8, 5.4]] },
      { x: 480, y: 200, anchor: 'middle', text: '弹出 20 → top 退到 0', mono: true, size: 12.5,
        color: AMBER, vis: [[5.4, 7.0]] },
    ],
    steps: [
      { t: 0, text: '依次压入 10、20、30', code: 'Push(&S, 10);  Push(&S, 20);  Push(&S, 30);' },
      { t: 2.2, text: '现在 top 在 2，栈顶是最后进来的 30' },
      { t: 3.8, text: '弹出一个 —— 是 30，最后进来的最先出去', name: '弹出 30', code: 'Pop(&S, &e);   /* e = 30 */' },
      { t: 5.4, text: '再弹 —— 20', name: '弹出 20' },
      { t: 7.0, text: '再弹 —— 10，栈空了（top 回到 -1）', name: '弹出 10，栈空' },
      { t: 8.2, text: '这就是 LIFO（后进先出）。后面表达式求值、递归、DFS 全靠它' },
    ],
  }),

];
