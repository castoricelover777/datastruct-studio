'use strict';
/**
 * 02-01 线性表（顺序存储）—— 动画场景
 *
 * 用「格子阵列」表达顺序表：元素挨着放，插入要后移、删除要前移。
 * 这一节动画的重点就是让"搬家"看得见 —— 它是顺序表 O(n) 的根源。
 */

const BLUE = '#3B82F6';
const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';

const CAP = (no, title, sub, total, slots, extra) => ({
  id: `02-01-${no}`,
  no,
  title,
  sub,
  bookTag: '顺序表',
  variant: 'array',
  accentColor: BLUE,
  total,
  slots,
  ...extra,
});

module.exports = [

  // =========================================================================
  CAP('01-typedef', 'typedef —— 顺序表的结构', '一段连续内存 + 一个 length', 8, 6, {
    cells: [
      { at: 0, value: '10', vis: [[0.6, 8]] },
      { at: 1, value: '20', vis: [[1.3, 8]] },
      { at: 2, value: '30', vis: [[2.0, 8]] },
    ],
    highlights: [
      { at: 3, vis: [[4.2, 8]], color: '#8C959F' },
      { at: 4, vis: [[4.2, 8]], color: '#8C959F' },
      { at: 5, vis: [[4.2, 8]], color: '#8C959F' },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: 'length = 3（实际有几个元素）', size: 13,
        mono: true, color: BLUE, vis: [[2.6, 4.2]] },
      { x: 480, y: 200, anchor: 'middle', text: '灰色格子里的内容是垃圾值 —— 永远不要去看',
        size: 12.5, color: '#8C959F', vis: [[4.2, 6.4]] },
      { x: 480, y: 200, anchor: 'middle', text: 'MAXSIZE 是"能装多少"，length 是"实际有几个"',
        size: 12.5, color: AMBER, vis: [[6.4, 8]] },
    ],
    steps: [
      { t: 0, text: '顺序表 = 一段连续内存，元素一个挨一个地放' },
      { t: 0.6, text: '放入 10', code: 'L.data[0] = 10;' },
      { t: 2.0, text: '元素挨着放的好处：能按下标一步跳到任意位置', code: 'L.data[i]  ← O(1)，不用从头数' },
      { t: 2.6, text: 'length 记录实际有几个元素 —— 这一格才是"表有多长"的答案', code: 'L.length = 3;' },
      { t: 4.2, text: '开了 6 个格子但只用了 3 个，后面是垃圾值', code: '#define MAXSIZE 6   /* 容量 */' },
      { t: 6.4, text: '一句话：MAXSIZE 是"能装多少"，length 是"实际有几个" —— 别混用', name: 'MAXSIZE vs length' },
    ],
  }),

  // =========================================================================
  CAP('02-InitList_Sq', 'InitList_Sq —— 初始化', 'length 归零就够了，一格内存都不用清', 7, 6, {
    cells: [
      // 初始化前：整排都是内存里的随机值（这里假装有 2 个元素）。
      // 六格都要写 —— 原来只写了 0/1 两格，画面成了"一半 ? 一半空框"，
      // 而且 t=1.0 讲"拿随机值当个数去遍历会读到越界内存"时整排已经空了，
      // 正是那句话需要看的东西没有了。
      { at: 0, value: '?', vis: [[0, 2.4]] },
      { at: 1, value: '?', vis: [[0, 2.4]] },
      { at: 2, value: '?', vis: [[0, 2.4]] },
      { at: 3, value: '?', vis: [[0, 2.4]] },
      { at: 4, value: '?', vis: [[0, 2.4]] },
      { at: 5, value: '?', vis: [[0, 2.4]] },
      // 初始化之后：数组内容一个字节都没动，所以**继续摆着**，别让画面空掉。
      // 这正是后半段要讲的点（"空表"看的是 length，不是数组内容），
      // 原来这段是空屏（占整段 66%）。
      { at: 0, value: '?', vis: [[2.4, 99]] },
      { at: 1, value: '?', vis: [[2.4, 99]] },
      { at: 2, value: '?', vis: [[2.4, 99]] },
      { at: 3, value: '?', vis: [[2.4, 99]] },
      { at: 4, value: '?', vis: [[2.4, 99]] },
      { at: 5, value: '?', vis: [[2.4, 99]] },
    ],
    highlights: [{ at: 0, vis: [[2.4, 7]], color: BLUE }],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '初始化前：length 是随机值（这里假装是 2）',
        size: 12.5, color: RED, vis: [[0, 2.4]] },
      { x: 480, y: 200, anchor: 'middle', text: 'L->length = 0;   只改这一格，数组一个字节都不用动',
        mono: true, size: 12.5, color: BLUE, vis: [[2.4, 5.4]] },
      { x: 480, y: 200, anchor: 'middle', text: '空表 = length 为 0，而不是"数组里都是 0"',
        size: 12.5, color: AMBER, vis: [[5.4, 7]] },
    ],
    steps: [
      { t: 0, text: '没初始化的顺序表很危险：length 是内存里的随机值' },
      { t: 1.0, text: '如果拿这个随机值当元素个数去遍历，就会读到越界的内存' },
      { t: 2.4, text: '初始化其实只需要一句赋值', code: 'L->length = 0;' },
      { t: 4.0, text: '有人会写循环把数组清零 —— 完全没必要，length 说了算' },
      { t: 5.4, text: '记住："空表"的标志是 length == 0，不是数组内容全为 0' },
    ],
  }),

  // =========================================================================
  CAP('03-ListInsert_Sq', 'ListInsert_Sq —— 插入', '把第 i 个及以后的元素统统后移一位', 10, 6, {
    cells: [
      { at: 0, value: '10', vis: [[0, 10]] },
      { at: 1, value: '20', vis: [[0, 10]] },
      { at: 2, value: '30', vis: [[0, 4.4]], accent: 'del' },
      { at: 3, value: '30', vis: [[4.4, 10]], accent: 'new' },
      { at: 1, value: '20', vis: [[4.4, 6.2]], accent: 'del' },
      { at: 2, value: '20', vis: [[6.2, 10]], accent: 'new' },
      { at: 1, value: '15', vis: [[7.6, 10]], accent: 'new', rise: 7.6 },
    ],
    pointers: [
      { label: 'i', at: 1, vis: [[1.2, 4.4]], color: AMBER },
      { label: 'j', at: 2, vis: [[2.6, 4.4]], color: AMBER },
      { label: 'j', at: 1, vis: [[4.4, 6.2]], color: AMBER },
    ],
    highlights: [{ at: 1, vis: [[7.6, 10]], color: GREEN }],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '目标：在位序 2（下标 1）插入 15 —— 先把位置腾出来',
        size: 12.5, vis: [[1.2, 4.4]] },
      { x: 480, y: 200, anchor: 'middle', text: 'j 从 length 递减到 i：先搬最右边的，空位一路向左让',
        size: 12.5, color: RED, vis: [[4.4, 7.6]] },
      { x: 480, y: 200, anchor: 'middle', text: '顺序反了会怎样？先搬 20 就会把 30 覆盖掉 —— 数据就丢了',
        size: 12.5, color: RED, vis: [[8.4, 10]] },
    ],
    steps: [
      { t: 0, text: '在下标 1 处插入 15，得先给它腾出位置' },
      { t: 1.2, text: '位置合法性：i 必须在 1 到 length+1 之间', code: 'if (i < 1 || i > L->length + 1) return ERROR;' },
      { t: 2.6, text: '搬家的游标 j 从最后一个元素开始', code: 'for (j = L->length; j >= i; j--)' },
      { t: 4.4, text: '把 30 往后挪一格', code: 'L->data[j] = L->data[j - 1];' },
      { t: 6.2, text: '再把 20 往后挪一格 —— 空位就腾到下标 1 了', name: 'data[2]=data[1]', code: 'L->data[j] = L->data[j - 1];' },
      { t: 7.6, text: '填入 15，最后别忘了 length 加一', name: 'data[i-1]=e; length++', code: 'L->data[i - 1] = e;   L->length++;' },
      { t: 8.4, text: '关键：搬家必须**从后往前**，反了就把还没搬的数据覆盖掉' },
    ],
  }),

  // =========================================================================
  CAP('04-ListDelete_Sq', 'ListDelete_Sq —— 删除', '把第 i 个取走后，后面的元素统统前移补位', 10, 6, {
    cells: [
      { at: 0, value: '10', vis: [[0, 10]] },
      { at: 1, value: '15', vis: [[0, 3.2]], accent: 'del' },
      { at: 2, value: '20', vis: [[0, 3.2]], accent: 'del' },
      { at: 3, value: '30', vis: [[0, 5.6]], accent: 'del' },
      { at: 1, value: '20', vis: [[3.2, 10]], accent: 'new' },
      { at: 2, value: '30', vis: [[5.6, 10]], accent: 'new' },
    ],
    pointers: [
      { label: 'i', at: 1, vis: [[1.0, 3.2]], color: AMBER },
      { label: 'j', at: 2, vis: [[1.6, 3.2]], color: AMBER },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '*e = L->data[i-1];   先把被删元素取出来，晚了就被覆盖',
        mono: true, size: 12.5, color: RED, vis: [[1.0, 3.2]] },
      { x: 480, y: 200, anchor: 'middle', text: 'j 从 i 递增到 length-1：空位在左边，所以从前往后搬',
        size: 12.5, color: GREEN, vis: [[3.2, 5.6]] },
      { x: 480, y: 200, anchor: 'middle', text: 'length-- 之后，最后那格虽然还有值，但已经不算数了',
        size: 12.5, color: AMBER, vis: [[7.4, 10]] },
      { x: 480, y: 200, anchor: 'middle', text: '和插入刚好相反：删除要从前往后搬', size: 12.5,
        color: AMBER, vis: [[5.6, 7.4]] },
    ],
    steps: [
      { t: 0, text: '删除位序 2 的元素（15）' },
      { t: 1.0, text: '先把被删元素取出来 —— 它马上要被覆盖了', code: '*e = L->data[i - 1];' },
      { t: 3.2, text: '20 往前补一格', code: 'L->data[j - 1] = L->data[j];' },
      { t: 5.6, text: '30 也往前补一格 —— 空位被填上了', name: 'data[2]=data[3]' },
      { t: 7.4, text: 'length 减一：最后那格还有值，但已经不属于这张表', code: 'L->length--;' },
      { t: 8.4, text: '对比记忆：插入从后往前搬，删除从前往后搬 —— 都是"从空位那一头开始"' },
    ],
  }),

  // =========================================================================
  CAP('05-LocateElem_Sq', 'LocateElem_Sq —— 按值查找', '从头挨个比，返回第一个相等的位序', 9, 6, {
    cells: [
      { at: 0, value: '10', vis: [[0, 9]] },
      { at: 1, value: '20', vis: [[0, 9]] },
      { at: 2, value: '30', vis: [[0, 9]] },
      { at: 3, value: '40', vis: [[0, 9]] },
    ],
    highlights: [
      { at: 0, vis: [[0.9, 2.0]], color: AMBER },
      { at: 1, vis: [[2.0, 3.1]], color: AMBER },
      { at: 2, vis: [[3.1, 9]], color: GREEN },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '比较 1 次：10 != 30', mono: true, size: 12.5,
        color: AMBER, vis: [[0.9, 2.0]] },
      { x: 480, y: 200, anchor: 'middle', text: '比较 2 次：20 != 30', mono: true, size: 12.5,
        color: AMBER, vis: [[2.0, 3.1]] },
      { x: 480, y: 200, anchor: 'middle', text: '比较 3 次：30 == 30 → 返回位序 3', mono: true,
        size: 12.5, color: GREEN, vis: [[3.1, 6.0]] },
      { x: 480, y: 200, anchor: 'middle', text: '返回的是位序（下标+1）：0 表示没找到，不会和"下标 0"混淆',
        size: 12.5, vis: [[6.0, 9]] },
    ],
    steps: [
      { t: 0, text: '在表里找 30 —— 顺序查找，从头挨个比' },
      { t: 0.9, text: '下标 0 是 10，不相等，继续', code: 'if (L.data[i] == e) return i + 1;' },
      { t: 2.0, text: '下标 1 是 20，还不等，继续' },
      { t: 3.1, text: '下标 2 是 30 —— 命中，返回位序 3', code: 'return i + 1;' },
      { t: 6.0, text: '平均要比较 (n+1)/2 次，所以是 O(n)', name: '平均 O(n)' },
      { t: 7.4, text: '如果表是有序的，可以改用二分查找降到 O(log n) —— 这正是顺序表的强项' },
    ],
  }),

  // =========================================================================
  CAP('06-main', 'main —— 把顺序表跑一遍', '插入、删除、查找各走一次，对比链表的差别', 9, 6, {
    cells: [
      { at: 0, value: '10', vis: [[0.8, 9]] },
      { at: 1, value: '20', vis: [[1.6, 9]] },
      { at: 2, value: '30', vis: [[2.4, 9]] },
    ],
    highlights: [
      { at: 0, vis: [[4.0, 5.4]], color: GREEN },
      { at: 1, vis: [[5.4, 6.8]], color: GREEN },
      { at: 2, vis: [[6.8, 8.2]], color: GREEN },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '追加 10、20、30：每次插在末尾，搬 0 次 —— 最省的情形',
        size: 12.5, vis: [[2.8, 4.0]] },
      { x: 480, y: 200, anchor: 'middle', text: '接下来：插入 15、删除下标 1、查找 30、越界插入',
        size: 12.5, vis: [[2.8, 4.0]] },
      { x: 480, y: 200, anchor: 'middle', text: '按下标取值：data[i] 一步到位 —— 这是链表做不到的',
        size: 12.5, color: GREEN, vis: [[4.0, 8.2]] },
      { x: 480, y: 200, anchor: 'middle', text: '但插入删除要搬元素，最坏搬 n 次 —— 这是顺序表的代价',
        size: 12.5, color: AMBER, vis: [[8.2, 9]] },
    ],
    steps: [
      { t: 0, text: '先把三种基本操作串起来跑一遍，每一步都打印出来' },
      { t: 0.8, text: '尾部追加 10、20、30', code: 'ListInsert_Sq(&L, 1, 10);  ... 3, 30);' },
      { t: 2.8, text: '追加是最省的情形：插在末尾，一个元素都不用搬' },
      { t: 4.0, text: '顺序表最强的地方：按下标随机访问', code: 'L.data[i]   /* O(1) —— 链表要走 i 步 */' },
      { t: 6.0, text: '顺序表最弱的地方：插入删除', code: '/* 平均搬 n/2 个元素 → O(n) */' },
      { t: 7.4, text: '所以：查得多就用顺序表，改得多就用链表 —— 这就是下一节要讲的取舍' },
    ],
  }),

];
