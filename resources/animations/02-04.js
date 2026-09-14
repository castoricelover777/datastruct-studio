'use strict';
/**
 * 02-04 队列 —— 动画场景
 *
 * 队列的动画要讲清楚两件事：
 *   1. rear 指向"下一个空位"（和栈的 top 指栈顶元素刚好相反）
 *   2. 下标走到末尾会**绕回 0** —— 这一个 % 就是"循环队列"的全部秘密
 * 用线性格子表达，靠指针从右端跳回左端来表现"绕圈"。
 */

const BLUE = '#3B82F6';
const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';
const PURPLE = '#8250DF';

const CAP = (no, title, sub, total, slots, extra) => ({
  id: `02-04-${no}`,
  no,
  title,
  sub,
  bookTag: '循环队列',
  variant: 'array',
  accentColor: PURPLE,
  total,
  slots,
  ...extra,
});

module.exports = [

  // =========================================================================
  CAP('01-typedef', 'typedef —— 循环队列的结构', 'front 指队头，rear 指队尾的下一个空位', 9, 6, {
    cells: [
      { at: 0, value: '10', vis: [[1.0, 9]] },
      { at: 1, value: '20', vis: [[1.6, 9]] },
      { at: 2, value: '30', vis: [[2.2, 9]] },
    ],
    pointers: [
      { label: 'front', at: 0, vis: [[2.8, 9]], color: GREEN },
      { label: 'rear', at: 3, vis: [[2.8, 9]], color: AMBER },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: 'front 指着队头元素本身，rear 指着"下次入队该放哪"',
        size: 12.5, vis: [[2.8, 5.0]] },
      { x: 480, y: 200, anchor: 'middle', text: '队空：front == rear　　队满：(rear + 1) % MAXSIZE == front',
        mono: true, size: 12.5, color: PURPLE, vis: [[5.0, 7.4]] },
      { x: 480, y: 200, anchor: 'middle', text: '队满故意浪费一格，就是为了让"空"和"满"能区分开',
        size: 12.5, color: AMBER, vis: [[7.4, 9]] },
    ],
    steps: [
      { t: 0, text: '队列：一端进、另一端出，先进先出' },
      { t: 1.0, text: '入队 10、20、30 —— 都从 rear 那一端进' },
      { t: 2.8, text: '两个指针分工明确', code: 'front → 队头元素\n rear  → 队尾元素的下一个空位' },
      { t: 5.0, text: '空和满都靠这两个指针判断', code: '空：front == rear\n 满：(rear + 1) % MAXSIZE == front' },
      { t: 7.4, text: '注意"满"的写法：rear 的下一格撞上 front 就算满 —— 白白浪费一格' },
      { t: 8.2, text: '不浪费这一格的话，front == rear 既可能是空也可能是满，就没法判断了' },
    ],
  }),

  // =========================================================================
  CAP('02-InitQueue', 'InitQueue —— 初始化', 'front = rear = 0，两者重合即队空', 7, 6, {
    cells: [],
    pointers: [
      { label: 'front', at: 0, vis: [[1.6, 7]], color: GREEN },
      { label: 'rear', at: 0, vis: [[1.6, 7]], color: AMBER },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: 'Q->front = 0;   Q->rear = 0;', mono: true,
        size: 13, color: PURPLE, vis: [[1.6, 4.6]] },
      { x: 480, y: 200, anchor: 'middle', text: '两个指针重合，就是"队空"的标志', size: 12.5,
        vis: [[1.6, 4.6]] },
      { x: 480, y: 200, anchor: 'middle', text: '和栈不一样：栈用 -1 表示空，队列用"两指针相等"表示空',
        size: 12.5, color: AMBER, vis: [[4.6, 7]] },
    ],
    steps: [
      { t: 0, text: '初始化队列：两个指针都归零' },
      { t: 1.6, text: '为什么都归零？', code: 'Q->front = 0;\n Q->rear = 0;' },
      { t: 3.2, text: '因为 rear 表示"下一个可放的位置"—— 队里空着时，下一个位置就是开头' },
      { t: 4.6, text: '记住区别：栈的空是 top == -1，队列的空是 front == rear', code: '/* 栈：top 指栈顶元素 */\n /* 队列：rear 指下一个空位 */' },
      { t: 6.0, text: '这个"指哪儿"的差别，是入队/出队顺序写反的根源' },
    ],
  }),

  // =========================================================================
  CAP('03-EnQueue', 'EnQueue —— 入队', '先放数据，再让 rear 绕环前进一格', 10, 6, {
    cells: [
      { at: 0, value: '10', vis: [[0.6, 10]] },
      { at: 1, value: '20', vis: [[1.2, 10]] },
      { at: 2, value: '30', vis: [[4.6, 10]], accent: 'new', rise: 4.6 },
      { at: 3, value: '40', vis: [[6.6, 10]], accent: 'new', rise: 6.6 },
      { at: 4, value: '50', vis: [[8.4, 10]], accent: 'new', rise: 8.4 },
    ],
    pointers: [
      { label: 'front', at: 0, vis: [[0.6, 10]], color: GREEN },
      { label: 'rear', at: 2, vis: [[0.6, 4.6]], color: AMBER },
      { label: 'rear', at: 3, vis: [[4.6, 6.6]], color: AMBER },
      { label: 'rear', at: 4, vis: [[6.6, 8.4]], color: AMBER },
      { label: 'rear', at: 5, vis: [[8.4, 10]], color: RED },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '① Q->data[Q->rear] = e;   先放进 rear 指着的空位',
        mono: true, size: 12.5, color: GREEN, vis: [[4.6, 6.6]] },
      { x: 480, y: 200, anchor: 'middle', text: '② Q->rear = (Q->rear + 1) % MAXSIZE;   再让 rear 前进（到头绕回 0）',
        mono: true, size: 12.5, color: GREEN, vis: [[6.6, 8.4]] },
      { x: 480, y: 200, anchor: 'middle', text: 'rear 的下一格就是 front 了 → 判满，拒绝入队',
        size: 12.5, color: RED, vis: [[8.4, 10]] },
    ],
    steps: [
      { t: 0, text: '队里已有 10、20，front = 0，rear = 2' },
      { t: 2.0, text: '入队一个元素，第一件事是判满', code: 'if ((Q->rear + 1) % MAXSIZE == Q->front) return ERROR;' },
      { t: 4.6, text: '① 放进 rear 指着的空位 —— 30 落到下标 2', code: 'Q->data[Q->rear] = e;' },
      { t: 6.6, text: '② rear 前进一格：2 → 3', code: 'Q->rear = (Q->rear + 1) % MAXSIZE;' },
      { t: 8.4, text: '一直入队到 rear = 5：这时 (5+1)%6 = 0 == front，判满' },
      { t: 9.2, text: '注意顺序和栈**相反**：栈是"先动指针再放值"，队列是"先放值再动指针"',
        name: '和栈的顺序相反' },
    ],
  }),

  // =========================================================================
  CAP('04-DeQueue', 'DeQueue —— 出队', '先取走 data[front]，再让 front 绕环前进', 9, 6, {
    cells: [
      { at: 0, value: '10', vis: [[0, 3.4]], accent: 'del' },
      { at: 1, value: '20', vis: [[0, 5.2]], accent: 'del' },
      { at: 2, value: '30', vis: [[0, 9]] },
      { at: 3, value: '40', vis: [[0, 9]] },
    ],
    pointers: [
      { label: 'front', at: 0, vis: [[0, 3.4]], color: GREEN },
      { label: 'front', at: 1, vis: [[3.4, 5.2]], color: GREEN },
      { label: 'front', at: 2, vis: [[5.2, 9]], color: GREEN },
      { label: 'rear', at: 4, vis: [[0, 9]], color: AMBER },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '> 10                     ① 取走队头，front 前进一格',
        mono: true, size: 13, color: GREEN, vis: [[3.4, 5.2]] },
      { x: 480, y: 200, anchor: 'middle', text: '> 10 20                  再出队一个',
        mono: true, size: 13, color: GREEN, vis: [[5.2, 7.0]] },
      { x: 480, y: 200, anchor: 'middle', text: '出队不擦数据，只是把 front 往前挪 —— 空出的格子以后还能被 rear 绕回来用',
        size: 12.5, color: AMBER, vis: [[7.0, 9]] },
    ],
    steps: [
      { t: 0, text: '队里是 10 20 30 40，front = 0' },
      { t: 1.2, text: '出队前先判空：front == rear 才是空队', code: 'if (Q->front == Q->rear) return ERROR;' },
      { t: 3.4, text: '① 取走队头 10，front 前进一格', code: '*e = Q->data[Q->front];   Q->front = (Q->front + 1) % MAXSIZE;' },
      { t: 5.2, text: '再出队一个 —— 拿到 20', name: '出队 20' },
      { t: 7.0, text: '10 和 20 还在数组里，但已经不属于这张队列了' },
      { t: 8.0, text: '空出来的下标 0、1 不会被浪费 —— 等 rear 绕一圈回来还能用', name: '这才是循环队列的价值' },
    ],
  }),

  // =========================================================================
  CAP('05-main', 'main —— 边进边出 100 次', '普通顺序队列早就假溢出了，循环队列能一直跑', 10, 6, {
    cells: [
      { at: 0, value: 'a', vis: [[0, 3.0]] },
      { at: 1, value: 'b', vis: [[0, 3.0]] },
      { at: 2, value: 'c', vis: [[0, 3.0]] },
      { at: 4, value: 'x', vis: [[4.6, 10]], accent: 'new' },
      { at: 0, value: 'y', vis: [[6.4, 10]], accent: 'new' },
      { at: 1, value: 'z', vis: [[8.0, 10]], accent: 'new' },
    ],
    pointers: [
      { label: 'front', at: 0, vis: [[0, 4.6]], color: GREEN },
      { label: 'front', at: 2, vis: [[4.6, 10]], color: GREEN },
      { label: 'rear', at: 3, vis: [[0, 4.6]], color: AMBER },
      { label: 'rear', at: 5, vis: [[4.6, 6.4]], color: AMBER },
      { label: 'rear', at: 0, vis: [[6.4, 8.0]], color: RED },
      { label: 'rear', at: 1, vis: [[8.0, 10]], color: RED },
    ],
    highlights: [
      { at: 0, vis: [[6.4, 7.4]], color: GREEN },
      { at: 1, vis: [[8.0, 9.0]], color: GREEN },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '出队 3 个之后：front 走到 3，前面 0、1、2 空着',
        size: 12.5, color: GREEN, vis: [[0, 4.6]] },
      { x: 480, y: 200, anchor: 'middle', text: 'rear 走到头了 —— 普通顺序队列到这里就"假溢出"',
        size: 12.5, color: RED, vis: [[4.6, 6.4]] },
      { x: 480, y: 200, anchor: 'middle', text: 'rear 绕回 0！空出来的格子重新用上 —— 这就是 % MAXSIZE 的功劳',
        size: 12.5, color: RED, vis: [[6.4, 10]] },
    ],
    steps: [
      { t: 0, text: '先入队 a b c，再出队 3 个 —— front 右移，前面留出空位' },
      { t: 3.0, text: '队列里空了，但下标 0、1、2 的位置已经"用过"' },
      { t: 4.6, text: '继续入队到 rear 撞到数组末尾', code: 'EnQueue(&Q, ...);  /* rear 一直涨 */' },
      { t: 6.4, text: '普通顺序队列在这里就废了：明明前面空着，却放不进去（假溢出）', name: '假溢出' },
      { t: 7.2, text: '循环队列怎么做的？', code: 'Q->rear = (Q->rear + 1) % MAXSIZE;' },
      { t: 8.0, text: 'rear 绕回下标 0，把刚才空出来的格子重新用上', name: 'rear 绕回 0' },
      { t: 9.0, text: '所以"边进边出跑 100 次"，循环队列一次都不会满 —— 而普通顺序队列早崩了' },
    ],
  }),

];
