'use strict';
/**
 * 单链表 12 个模块的演示动画（场景定义）
 *
 * 时间轴约定：每个场景 total 秒循环一次，元素用 vis:[[起,止],…] 声明自己
 * 在哪些时间段可见；箭头额外的 at 控制"生长"动画的起点。
 */

const { NODE_Y, NODE_H } = require('../../tools/anim/render');

const TOP = NODE_Y;                 // 结点上沿 96
const BOT = NODE_Y + NODE_H;        // 结点下沿 142
const MID = (TOP + BOT) / 2;        // 119
const OUT_Y = 186;                  // 结点下方的"输出/结果"行

module.exports = [

  // =========================================================================
  {
    id: '02-02-singly-01-typedef',
    no: '01',
    title: '头文件与 typedef',
    sub: '一个结点里到底装了什么',
    bookTag: '单链表',
    variant: 'singly',
    total: 8,
    nodes: [
      { id: 'n', slot: 0, value: '10', tag: 'LNode', vis: [[0, 8]] },
    ],
    leaders: [
      { from: [344, 121], to: [446, MID], vis: [[1.2, 8]] },
      { from: [514, MID], to: [616, 121], vis: [[2.4, 8]] },
    ],
    notes: [
      { x: 336, y: MID + 4, anchor: 'end', text: '数据域 data', size: 13.5,
        color: '#1F2328', vis: [[1.2, 8]] },
      { x: 624, y: MID + 4, anchor: 'start', text: '指针域 next', size: 13.5,
        color: '#1F2328', vis: [[2.4, 8]] },
      { x: 336, y: MID + 24, anchor: 'end', text: '存具体元素', size: 11.5, vis: [[1.2, 8]] },
      { x: 624, y: MID + 24, anchor: 'start', text: '存下一个结点在哪', size: 11.5, vis: [[2.4, 8]] },
      { x: 480, y: TOP - 22, anchor: 'middle', text: 'struct LNode', mono: true, size: 12.5,
        color: '#6E7781', vis: [[0, 8]] },
    ],
    steps: [
      { t: 0, text: '一个链表结点由两部分组成：数据域 + 指针域' },
      { t: 1.2, text: 'data 存具体元素；它是什么类型由 ElemType 决定' },
      { t: 2.4, text: 'next 存"下一个结点的地址"，它就是链表能串起来的原因' },
      { t: 3.9, text: 'typedef 把这套写法包成两个短名字：',
        code: 'typedef struct LNode { ElemType data; struct LNode *next; } LNode, *LinkList;' },
      { t: 6.0, text: 'LNode 是结点类型，LinkList 是指向结点的指针类型（少写一个 *）' },
    ],
  },

  // =========================================================================
  {
    id: '02-02-singly-04-applist',
    no: '04',
    title: 'applist —— 尾部追加节点',
    sub: '从头走到尾，把新结点挂上去',
    bookTag: '单链表',
    variant: 'singly',
    total: 8.4,
    nodes: [
      { id: 'head', slot: 0, role: 'head', tag: 'L', vis: [[0, 8.4]] },
      { id: 'n1', slot: 1, value: '10', vis: [[0, 8.4]] },
      { id: 'n2', slot: 2, value: '20', vis: [[0, 8.4]] },
      { id: 'n3', slot: 3, value: '30', vis: [[0, 8.4]] },
      { id: 's', slot: 4, value: '40', tag: 's', accent: 'new', vis: [[3.5, 8.4]], rise: 3.5 },
    ],
    arrows: [
      { from: 'head', to: 'n1', at: 0, vis: [[0, 8.4]] },
      { from: 'n1', to: 'n2', at: 0, vis: [[0, 8.4]] },
      { from: 'n2', to: 'n3', at: 0, vis: [[0, 8.4]] },
      { from: 'n3', to: 's', kind: 'next', at: 4.5, accent: 'new', vis: [[4.5, 8.4]] },
    ],
    cursors: [
      { label: 'p', vis: [[0.9, 8.4]], move: [{ t: 0.9, slot: 0 }, { t: 2.8, slot: 3 }] },
    ],
    notes: [
      { x: 214 + 34, y: OUT_Y, anchor: 'start', text: 'p 出发 → 沿 next 一路向后', mono: true,
        size: 12.5, vis: [[0.9, 2.8]] },
      { x: 678 + 34, y: OUT_Y, anchor: 'middle', text: '新结点挂到尾部', mono: true,
        size: 12.5, color: '#10B981', vis: [[5.6, 8.4]] },
    ],
    steps: [
      { t: 0, text: '尾插不改变已有结点的顺序，但要先找到"最后一个结点"' },
      { t: 0.9, text: '游标 p 从头结点出发向后走', code: 'while (p->next != NULL)   p = p->next;' },
      { t: 2.8, text: 'p 停下来了：它后面是 NULL，它就是尾结点' },
      { t: 3.5, text: '造出新结点 s（数据域填 e，next 先置 NULL）', code: 's = creatNode(e);' },
      { t: 4.5, text: '把尾结点的 next 指向 s —— 链表就延长了一节', code: 'p->next = s;' },
      { t: 6.0, text: '代价是每次都要从头走到尾：时间复杂度 O(n)' },
    ],
  },

  // =========================================================================
  {
    id: '02-02-singly-10-printList',
    no: '10',
    title: 'printList —— 打印链表',
    sub: '走一遍，把每个数据打出来',
    bookTag: '单链表',
    variant: 'singly',
    total: 8.4,
    nodes: [
      { id: 'head', slot: 0, role: 'head', tag: 'L', vis: [[0, 8.4]] },
      { id: 'n1', slot: 1, value: '10', vis: [[0, 8.4]] },
      { id: 'n2', slot: 2, value: '20', vis: [[0, 8.4]] },
      { id: 'n3', slot: 3, value: '30', vis: [[0, 8.4]] },
    ],
    arrows: [
      { from: 'head', to: 'n1', at: 0, vis: [[0, 8.4]] },
      { from: 'n1', to: 'n2', at: 0, vis: [[0, 8.4]] },
      { from: 'n2', to: 'n3', at: 0, vis: [[0, 8.4]] },
    ],
    cursors: [
      { label: 'p', vis: [[0.8, 8.4]], move: [{ t: 0.8, slot: 1 }, { t: 2.7, slot: 3 }] },
    ],
    notes: [
      { x: 272, y: OUT_Y, anchor: 'start', text: '> 10 ->', mono: true, size: 14,
        color: '#1F2328', vis: [[1.2, 1.9]] },
      { x: 272, y: OUT_Y, anchor: 'start', text: '> 10 -> 20 ->', mono: true, size: 14,
        color: '#1F2328', vis: [[1.9, 2.6]] },
      { x: 272, y: OUT_Y, anchor: 'start', text: '> 10 -> 20 -> 30 ->', mono: true, size: 14,
        color: '#1F2328', vis: [[2.6, 3.3]] },
      { x: 272, y: OUT_Y, anchor: 'start', text: '> 10 -> 20 -> 30 -> NULL', mono: true, size: 14,
        color: '#1F2328', vis: [[3.3, 8.4]] },
    ],
    steps: [
      { t: 0, text: '遍历的固定套路：从第一个数据结点开始，一直走到 NULL' },
      { t: 0.8, text: '每访问一个结点，就打印它的数据域，然后指针后移',
        code: 'while (p != NULL) { printf("%d -> ", p->data); p = p->next; }' },
      { t: 2.7, text: '最后打印一个 NULL 收尾，让人一眼看出链表到哪里结束', code: 'printf("NULL\\n");' },
      { t: 4.4, text: '别忘了 p = p->next —— 漏了这句就是死循环' },
      { t: 6.0, text: '空表要单独处理，否则会解引用空指针' },
    ],
  },

  // =========================================================================
  {
    id: '02-02-singly-02-creatNode',
    no: '02',
    title: 'creatNode —— 创建新结点',
    sub: '申请一块内存，填好两个域',
    bookTag: '单链表',
    variant: 'singly',
    total: 8.4,
    nodes: [
      { id: 'n', slot: 0, value: '7', tag: 'p', accent: 'new', vis: [[1.0, 8.4]] },
    ],
    highlights: [
      { slot: 0, part: 'node', vis: [[1.0, 2.4]] },
      { slot: 0, part: 'data', vis: [[3.8, 5.0]] },
      { slot: 0, part: 'next', vis: [[5.0, 6.4]] },
    ],
    cursors: [{ label: 'p', slot: 0, vis: [[1.2, 8.4]] }],
    notes: [
      { x: 480, y: 182, anchor: 'middle', text: 'malloc(sizeof(LNode)) —— 申请到一块内存',
        mono: true, size: 12.5, color: '#3B82F6', vis: [[1.0, 2.4]] },
      { x: 480, y: 182, anchor: 'middle', text: '必须检查 p == NULL，否则后面全是非法访问',
        size: 12.5, vis: [[2.4, 3.8]] },
      { x: 480, y: 182, anchor: 'middle', text: 'p->data = e', mono: true, size: 12.5,
        color: '#3B82F6', vis: [[3.8, 5.0]] },
      { x: 480, y: 182, anchor: 'middle', text: 'p->next = NULL', mono: true, size: 12.5,
        color: '#3B82F6', vis: [[5.0, 6.4]] },
      { x: 480, y: 182, anchor: 'middle', text: 'return p —— 把地址交给调用者', mono: true,
        size: 12.5, color: '#10B981', vis: [[6.4, 8.4]] },
    ],
    steps: [
      { t: 0, text: '任何插入操作的第一步都一样：先造出一个新结点' },
      { t: 1.0, text: '向系统要一块正好的内存', code: 'LNode *p = (LNode *)malloc(sizeof(LNode));' },
      { t: 2.4, text: '要养成习惯：申请完立刻检查是否失败', code: 'if (p == NULL) { printf("内存分配失败\\n"); exit(OVERFLOW); }' },
      { t: 3.8, text: '填入数据域', code: 'p->data = e;' },
      { t: 5.0, text: '指针域必须置 NULL —— 漏了它就是野指针', code: 'p->next = NULL;' },
      { t: 6.4, text: '最后把地址返回，这个"孤立的结点"就交给调用者了' },
    ],
  },

  // =========================================================================
  {
    id: '02-02-singly-03-InitList',
    no: '03',
    title: 'InitList —— 初始化链表',
    sub: '建立只有头结点的空表',
    bookTag: '单链表',
    variant: 'singly',
    total: 7.2,
    nodes: [
      { id: 'head', slot: 0, role: 'head', tag: 'L', vis: [[1.0, 7.2]] },
    ],
    highlights: [
      { slot: 0, part: 'node', vis: [[1.0, 2.6]] },
      { slot: 0, part: 'next', vis: [[3.4, 5.0]] },
    ],
    notes: [
      { x: 480, y: 182, anchor: 'middle', text: '头结点不存数据，它只当"哨兵"', size: 12.5,
        vis: [[1.2, 3.4]] },
      { x: 480, y: 182, anchor: 'middle', text: '(*L)->next = NULL  →  这就是空表',
        mono: true, size: 12.5, color: '#3B82F6', vis: [[3.4, 5.4]] },
      { x: 546, y: MID + 4, anchor: 'start', text: 'NULL', mono: true, size: 13,
        color: '#8C959F', vis: [[3.4, 7.2]] },
      { x: 480, y: 182, anchor: 'middle', text: '有了头结点，插入删除就不用特判第一个位置',
        size: 12.5, vis: [[5.4, 7.2]] },
    ],
    steps: [
      { t: 0, text: '初始化 = 建一个"只有头结点"的空表' },
      { t: 1.0, text: '头结点是哨兵：不存有效数据，只为让代码不用特判第一个位置',
        code: '*L = (LinkList)malloc(sizeof(LNode));' },
      { t: 3.4, text: '头结点的 next 置 NULL，空表就建好了', code: '(*L)->next = NULL;' },
      { t: 5.4, text: '注意参数是 LinkList *（二级指针）—— 要改调用者手里的 L 本身',
        code: 'if (*L == NULL) return ERROR;   (*L)->next = NULL;   return OK;' },
    ],
  },

  // =========================================================================
  {
    id: '02-02-singly-05-HeadInsert',
    no: '05',
    title: 'HeadInsert —— 头插法插入',
    sub: '不遍历，直接插在头结点后面',
    bookTag: '单链表',
    variant: 'singly',
    total: 8.6,
    nodes: [
      { id: 'head', slot: 0, role: 'head', tag: 'L', vis: [[0, 8.6]] },
      { id: 's', slot: 1, value: '5', tag: 's', accent: 'new', vis: [[2.6, 8.6]], rise: 2.6 },
      { id: 'n1', slot: 2, value: '10', vis: [[0, 8.6]] },
      { id: 'n2', slot: 3, value: '20', vis: [[0, 8.6]] },
    ],
    arrows: [
      { from: 'head', to: 'n1', at: 0, vis: [[0, 3.6]] },
      { from: 'n1', to: 'n2', at: 0, vis: [[0, 8.6]] },
      { from: 'head', to: 's', kind: 'next', at: 4.6, accent: 'new', vis: [[4.6, 8.6]] },
      { from: 's', to: 'n1', kind: 'next', at: 3.6, accent: 'new', vis: [[3.6, 8.6]] },
    ],
    highlights: [
      { slot: 0, part: 'next', vis: [[4.6, 5.8]] },
    ],
    notes: [
      { x: 214 + 34, y: 186, anchor: 'start', text: '① s->next = L->next', mono: true,
        size: 12.5, color: '#10B981', vis: [[3.6, 4.6]] },
      { x: 214 + 34, y: 186, anchor: 'start', text: '② L->next = s', mono: true,
        size: 12.5, color: '#10B981', vis: [[4.6, 6.4]] },
      { x: 214 + 34, y: 186, anchor: 'start', text: '全程没有遍历任何一个结点', mono: true,
        size: 12.5, color: '#D29922', vis: [[6.4, 8.6]] },
    ],
    steps: [
      { t: 0, text: '头插法：新结点直接插到头结点后面，成为第 1 个结点' },
      { t: 1.2, text: '和尾插最大的区别：它完全不需要遍历 —— 时间复杂度 O(1)',
        code: '/* 尾插要走到尾：O(n)   头插原地完成：O(1) */' },
      { t: 2.6, text: '造出新结点 s', code: 's = creatNode(e);' },
      { t: 3.6, text: '第一步：让 s 先接住原来的第一个结点', code: 's->next = L->next;' },
      { t: 4.6, text: '第二步：头结点改指 s —— s 正式成为第 1 个', code: 'L->next = s;' },
      { t: 6.4, text: '代价：头插会颠倒顺序，依次头插 1、2、3 得到 3、2、1' },
    ],
  },

  // =========================================================================
  {
    id: '02-02-singly-06-GetElem_L',
    no: '06',
    title: 'GetElem_L —— 按位查找',
    sub: '数到第 i 个结点，把它的数据取出来',
    bookTag: '单链表',
    variant: 'singly',
    total: 8.4,
    nodes: [
      { id: 'head', slot: 0, role: 'head', tag: 'L', vis: [[0, 8.4]] },
      { id: 'n1', slot: 1, value: '10', vis: [[0, 8.4]] },
      { id: 'n2', slot: 2, value: '20', vis: [[0, 8.4]] },
      { id: 'n3', slot: 3, value: '30', vis: [[0, 8.4]] },
    ],
    arrows: [
      { from: 'head', to: 'n1', at: 0, vis: [[0, 8.4]] },
      { from: 'n1', to: 'n2', at: 0, vis: [[0, 8.4]] },
      { from: 'n2', to: 'n3', at: 0, vis: [[0, 8.4]] },
    ],
    cursors: [
      { label: 'p', vis: [[0.8, 8.4]], move: [{ t: 0.8, slot: 1 }, { t: 3.0, slot: 3 }] },
    ],
    highlights: [
      { slot: 3, part: 'data', vis: [[4.6, 8.4]] },
    ],
    notes: [
      { x: 272 + 34, y: 186, anchor: 'start', text: 'j = 1', mono: true, size: 12.5,
        color: '#D29922', vis: [[1.0, 1.75]] },
      { x: 272 + 34, y: 186, anchor: 'start', text: 'j = 2', mono: true, size: 12.5,
        color: '#D29922', vis: [[1.75, 2.5]] },
      { x: 272 + 34, y: 186, anchor: 'start', text: 'j = 3  →  找到第 3 个结点', mono: true,
        size: 12.5, color: '#D29922', vis: [[2.5, 4.6]] },
      { x: 480, y: 186, anchor: 'middle', text: '*e = p->data  →  e = 30', mono: true,
        size: 13, color: '#3B82F6', vis: [[4.6, 7.0]] },
      { x: 480, y: 186, anchor: 'middle', text: '越界时 p == NULL 或 j > i，必须返回 ERROR',
        size: 12.5, color: '#EF4444', vis: [[7.0, 8.4]] },
    ],
    steps: [
      { t: 0, text: '按位查找：从头数到第 i 个结点' },
      { t: 0.8, text: '起点是 L->next（跳过不存数据的头结点），j 从 1 开始数',
        code: 'LNode *p = L->next;   int j = 1;' },
      { t: 3.0, text: '边数边走，直到数到第 i 个', code: 'while (p != NULL && j < i) { p = p->next; j++; }' },
      { t: 4.6, text: '把找到的数据通过指针参数带回去', code: '*e = p->data;   return OK;' },
      { t: 7.0, text: '两种越界都要挡住：i 太大（走成 NULL）、i 小于 1', code: 'if (p == NULL || j > i) return ERROR;' },
    ],
  },

  // =========================================================================
  {
    id: '02-02-singly-07-LocateElem',
    no: '07',
    title: 'LocateElem —— 按值查找',
    sub: '逐个比对数据域，返回命中的结点',
    bookTag: '单链表',
    variant: 'singly',
    total: 8.4,
    nodes: [
      { id: 'head', slot: 0, role: 'head', tag: 'L', vis: [[0, 8.4]] },
      { id: 'n1', slot: 1, value: '10', vis: [[0, 8.4]] },
      { id: 'n2', slot: 2, value: '20', vis: [[0, 8.4]] },
      { id: 'n3', slot: 3, value: '30', vis: [[0, 8.4]] },
    ],
    arrows: [
      { from: 'head', to: 'n1', at: 0, vis: [[0, 8.4]] },
      { from: 'n1', to: 'n2', at: 0, vis: [[0, 8.4]] },
      { from: 'n2', to: 'n3', at: 0, vis: [[0, 8.4]] },
    ],
    cursors: [
      { label: 'p', vis: [[0.9, 8.4]], move: [{ t: 0.9, slot: 1 }, { t: 2.4, slot: 2 }] },
    ],
    highlights: [
      { slot: 1, part: 'data', vis: [[1.1, 2.4]] },
      { slot: 2, part: 'data', vis: [[2.4, 8.4]], color: '#10B981' },
    ],
    notes: [
      { x: 272 + 34, y: 186, anchor: 'start', text: '10 != 20，继续往后', mono: true, size: 12.5,
        vis: [[1.1, 2.4]] },
      { x: 388 + 34, y: 186, anchor: 'start', text: '20 == 20，命中！', mono: true, size: 12.5,
        color: '#10B981', vis: [[2.4, 4.6]] },
      { x: 480, y: 186, anchor: 'middle', text: '返回结点地址，而不是数据值', size: 12.5,
        color: '#10B981', vis: [[4.6, 6.8]] },
      { x: 480, y: 186, anchor: 'middle', text: '找不到时 p 走到 NULL，直接返回 NULL', size: 12.5,
        color: '#EF4444', vis: [[6.8, 8.4]] },
    ],
    steps: [
      { t: 0, text: '按值查找：拿数据域挨个比，找到就返回那个结点' },
      { t: 0.9, text: '两个条件缺一不可：没走到尾、且当前值不等于目标',
        code: 'while (p != NULL && p->data != e)   p = p->next;' },
      { t: 2.4, text: '一旦相等循环立刻停下，p 就停在第一个命中的结点上' },
      { t: 4.6, text: '返回的是"结点地址"而不是"值"', code: 'return p;' },
      { t: 6.8, text: '因为返回地址，调用者还能继续拿到它的前驱后继，而不只是一个数字' },
    ],
  },

  // =========================================================================
  {
    id: '02-02-singly-08-ListInsert',
    no: '08',
    title: 'ListInsert —— 按位插入',
    sub: '先定位前驱，再改两根指针',
    bookTag: '单链表',
    variant: 'singly',
    total: 9.2,
    nodes: [
      { id: 'head', slot: 0, role: 'head', tag: 'L', vis: [[0, 9.2]] },
      { id: 'n1', slot: 1, value: '10', vis: [[0, 9.2]] },
      { id: 's', slot: 2, value: '15', tag: 's', accent: 'new', vis: [[3.6, 9.2]], rise: 3.6 },
      { id: 'n2', slot: 3, value: '20', vis: [[0, 9.2]] },
      { id: 'n3', slot: 4, value: '30', vis: [[0, 9.2]] },
    ],
    arrows: [
      { from: 'head', to: 'n1', at: 0, vis: [[0, 9.2]] },
      { from: 'n1', to: 'n2', at: 0, vis: [[0, 5.0]] },
      { from: 'n2', to: 'n3', at: 0, vis: [[0, 9.2]] },
      { from: 's', to: 'n2', kind: 'next', at: 4.6, accent: 'new', vis: [[4.6, 9.2]] },
      { from: 'n1', to: 's', kind: 'next', at: 5.6, accent: 'new', vis: [[5.6, 9.2]] },
    ],
    highlights: [
      { slot: 1, part: 'next', vis: [[1.2, 3.4]] },
      { slot: 1, part: 'next', vis: [[5.6, 6.8]] },
    ],
    cursors: [
      { label: 'p', vis: [[1.2, 9.2]], move: [{ t: 1.2, slot: 0 }, { t: 3.4, slot: 1 }] },
    ],
    notes: [
      { x: 214 + 20, y: 186, anchor: 'start', text: '① s->next = p->next', mono: true, size: 12.5,
        color: '#10B981', vis: [[4.6, 5.6]] },
      { x: 214 + 20, y: 186, anchor: 'start', text: '② p->next = s', mono: true, size: 12.5,
        color: '#10B981', vis: [[5.6, 7.4]] },
      { x: 214 + 20, y: 186, anchor: 'start', text: '顺序反了：先执行②，20 的地址就丢了', mono: true,
        size: 12.5, color: '#EF4444', vis: [[7.4, 9.2]] },
    ],
    steps: [
      { t: 0, text: '按位插入分两步：先定位，再改指针' },
      { t: 1.2, text: '让 p 走到第 i-1 个结点 —— 也就是待插位置的"前驱"',
        code: 'while (p != NULL && j < i - 1) { p = p->next; j++; }' },
      { t: 3.4, text: 'p 停在 10 上，接下来把新结点插到它后面' },
      { t: 3.6, text: '造新结点 —— 注意要先检查位置合法，再造结点，否则会产生"孤儿结点"',
        code: 'if (p == NULL || j > i - 1) return ERROR;   s = creatNode(e);' },
      { t: 4.6, text: '第一步：新结点先接住后面那一串', code: 's->next = p->next;' },
      { t: 5.6, text: '第二步：前驱改指新结点，链表正式接上', code: 'p->next = s;' },
      { t: 7.4, text: '这两句顺序不能反 —— 反了先执行②，20 的地址就再也找不回来了' },
    ],
  },

  // =========================================================================
  {
    id: '02-02-singly-09-ListDelete',
    no: '09',
    title: 'ListDelete —— 按位删除',
    sub: '定位前驱，摘掉结点再释放',
    bookTag: '单链表',
    variant: 'singly',
    total: 9.2,
    nodes: [
      { id: 'head', slot: 0, role: 'head', tag: 'L', vis: [[0, 9.2]] },
      { id: 'n1', slot: 1, value: '10', vis: [[0, 9.2]] },
      { id: 'q', slot: 2, value: '15', tag: 'q', vis: [[3.2, 6.9]] },
      { id: 'n2', slot: 3, value: '20', vis: [[0, 9.2]] },
      { id: 'n3', slot: 4, value: '30', vis: [[0, 9.2]] },
    ],
    arrows: [
      { from: 'head', to: 'n1', at: 0, vis: [[0, 9.2]] },
      { from: 'n1', to: 'q', at: 0, vis: [[0, 5.6]] },
      { from: 'q', to: 'n2', at: 0, vis: [[0, 6.9]] },
      { from: 'n2', to: 'n3', at: 0, vis: [[0, 9.2]] },
      { from: 'n1', to: 'n2', kind: 'next', at: 5.6, accent: 'new', vis: [[5.6, 9.2]] },
    ],
    highlights: [
      { slot: 2, part: 'node', vis: [[5.0, 6.9]], color: '#EF4444' },
    ],
    cursors: [
      { label: 'p', vis: [[1.2, 9.2]], move: [{ t: 1.2, slot: 0 }, { t: 3.2, slot: 1 }] },
    ],
    notes: [
      { x: 214 + 20, y: 186, anchor: 'start', text: 'q = p->next  →  q 记住待删结点', mono: true,
        size: 12.5, color: '#EF4444', vis: [[3.2, 4.4]] },
      { x: 214 + 20, y: 186, anchor: 'start', text: '*e = q->data  （必须在 free 之前取出）',
        mono: true, size: 12.5, vis: [[4.4, 5.6]] },
      { x: 214 + 20, y: 186, anchor: 'start', text: 'p->next = q->next  →  绕过 q', mono: true,
        size: 12.5, color: '#10B981', vis: [[5.6, 6.9]] },
      { x: 214 + 20, y: 186, anchor: 'start', text: 'free(q)  结点还给系统', mono: true,
        size: 12.5, color: '#EF4444', vis: [[6.9, 9.2]] },
    ],
    steps: [
      { t: 0, text: '删除第 i 个结点：单链表必须先找到它的前驱' },
      { t: 1.2, text: 'p 走到第 i-1 个结点 —— 因为只有前驱能改 next 把待删结点绕过去',
        code: 'while (p->next != NULL && j < i - 1) { p = p->next; j++; }' },
      { t: 3.2, text: '用 q 记住待删结点', code: 'q = p->next;' },
      { t: 4.4, text: '先把数据取出来 —— 必须在 free 之前做', code: '*e = q->data;' },
      { t: 5.6, text: '摘链：前驱直接跨过 q，指向 q 的后继', code: 'p->next = q->next;' },
      { t: 6.9, text: '最后释放 q，否则这块内存就泄漏了', code: 'free(q);' },
    ],
  },

  // =========================================================================
  {
    id: '02-02-singly-11-freeList',
    no: '11',
    title: 'freeList —— 释放整条链表',
    sub: '逐个 free，最后把头结点也还回去',
    bookTag: '单链表',
    variant: 'singly',
    total: 9.6,
    nodes: [
      { id: 'head', slot: 0, role: 'head', tag: 'L', vis: [[0, 7.4]] },
      { id: 'n1', slot: 1, value: '10', vis: [[0, 2.4]] },
      { id: 'n2', slot: 2, value: '20', vis: [[0, 4.0]] },
      { id: 'n3', slot: 3, value: '30', vis: [[0, 5.6]] },
    ],
    arrows: [
      { from: 'head', to: 'n1', at: 0, vis: [[0, 2.4]] },
      { from: 'n1', to: 'n2', at: 0, vis: [[0, 3.8]] },
      { from: 'n2', to: 'n3', at: 0, vis: [[0, 5.4]] },
    ],
    highlights: [
      { slot: 1, part: 'node', vis: [[1.6, 2.4]], color: '#EF4444' },
      { slot: 2, part: 'node', vis: [[3.2, 4.0]], color: '#EF4444' },
      { slot: 3, part: 'node', vis: [[4.8, 5.6]], color: '#EF4444' },
      { slot: 0, part: 'node', vis: [[6.6, 7.4]], color: '#EF4444' },
    ],
    cursors: [
      { label: 'p', vis: [[0.8, 6.2]], move: [{ t: 0.8, slot: 1 }, { t: 4.8, slot: 3 }] },
    ],
    notes: [
      { x: 214 + 34, y: 186, anchor: 'start', text: 'q = p;  p = p->next;  free(q);', mono: true,
        size: 12.5, color: '#3B82F6', vis: [[0.8, 6.2]] },
      { x: 214 + 34, y: 186, anchor: 'start', text: '顺序固定：先记住 → 再后移 → 最后释放', mono: true,
        size: 12.5, color: '#EF4444', vis: [[6.2, 7.6]] },
      { x: 480, y: 186, anchor: 'middle', text: '释放完把 L 置 NULL —— 否则调用者手里是野指针',
        size: 12.5, vis: [[7.6, 9.6]] },
    ],
    steps: [
      { t: 0, text: '链表是用 malloc 一个结点一个结点搭起来的，也必须逐个还回去' },
      { t: 0.8, text: '三步一组，顺序不能变', code: 'q = p;      /* 先记住当前 */\np = p->next; /* 再往后走 */\nfree(q);     /* 最后才释放 */' },
      { t: 2.4, text: '如果先 free(p) 再去读 p->next，读到的就是垃圾值（use after free）' },
      { t: 6.2, text: '数据结点清完，头结点也要还回去', code: 'free(*L);   *L = NULL;' },
      { t: 7.6, text: '最后把调用者的指针置 NULL，避免它继续指向已释放的内存' },
    ],
  },

  // =========================================================================
  {
    id: '02-02-singly-12-main',
    no: '12',
    title: 'main —— 把操作串起来跑一遍',
    sub: '一步一打印，让输出自己说明对错',
    bookTag: '单链表',
    variant: 'singly',
    total: 11.4,
    nodes: [
      { id: 'head', slot: 0, role: 'head', tag: 'L', vis: [[0.8, 9.6]] },
      { id: 'a', slot: 1, value: '10', vis: [[2.0, 7.2]], rise: 2.0 },
      { id: 'b', slot: 2, value: '20', vis: [[2.4, 8.0]], rise: 2.4 },
      { id: 'c', slot: 3, value: '30', vis: [[2.8, 8.8]], rise: 2.8 },
    ],
    arrows: [
      { from: 'head', to: 'a', at: 2.0, vis: [[2.0, 7.2]] },
      { from: 'a', to: 'b', at: 2.4, vis: [[2.4, 8.0]] },
      { from: 'b', to: 'c', at: 2.8, vis: [[2.8, 8.8]] },
    ],
    highlights: [
      { slot: 1, part: 'node', vis: [[7.2, 7.9]], color: '#EF4444' },
      { slot: 2, part: 'node', vis: [[8.0, 8.7]], color: '#EF4444' },
      { slot: 3, part: 'node', vis: [[8.8, 9.5]], color: '#EF4444' },
      { slot: 0, part: 'node', vis: [[9.6, 10.3]], color: '#EF4444' },
    ],
    notes: [
      { x: 36, y: 186, anchor: 'start', text: '> (空表)', mono: true, size: 13,
        vis: [[1.2, 2.0]] },
      { x: 36, y: 186, anchor: 'start', text: '> 10 -> 20 -> 30 -> NULL', mono: true, size: 13,
        vis: [[3.6, 7.2]] },
      { x: 36, y: 186, anchor: 'start', text: '> 逐个释放结点……', mono: true, size: 13,
        color: '#EF4444', vis: [[7.2, 9.6]] },
      { x: 36, y: 186, anchor: 'start', text: '> 释放完成，L = NULL', mono: true, size: 13,
        color: '#10B981', vis: [[9.6, 11.4]] },
    ],
    steps: [
      { t: 0, text: 'main 的价值：把各个操作串成一条能跑通的流水线' },
      { t: 0.8, text: '① 先初始化，打印确认是空表', code: 'InitList(&L);   printList(L);' },
      { t: 2.0, text: '② 尾部依次追加 10、20、30',
        code: 'applist(L, 10);   applist(L, 20);   applist(L, 30);' },
      { t: 3.6, text: '③ 打印看看顺序对不对', code: 'printList(L);      /* 10 -> 20 -> 30 -> NULL */' },
      { t: 7.2, text: '④ 释放整表 —— 每个 malloc 都要有对应的 free', code: 'freeList(&L);' },
      { t: 9.6, text: '关键是"一步一打印"：出错时一眼就能看出是从哪一步开始不对的' },
    ],
  },

];
