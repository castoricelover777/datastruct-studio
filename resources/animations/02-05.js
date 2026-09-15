'use strict';
/**
 * 02-05 应用实例 —— 动画场景
 *
 * 中缀转后缀、后缀求值，两个算法都只靠一个栈。
 * 动画用格子表示栈，用「当前扫描到的字符」+「已经输出的后缀」说明进展。
 */

const BLUE = '#3B82F6';
const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#D29922';
const PURPLE = '#8250DF';

const CAP = (no, title, sub, total, extra) => ({
  id: `02-05-${no}`,
  no,
  title,
  sub,
  bookTag: '栈的应用',
  variant: 'array',
  accentColor: PURPLE,
  total,
  slots: 5,
  ...extra,
});

module.exports = [

  // =========================================================================
  CAP('01-priority', 'priority —— 运算符优先级', '左括号在栈内优先级最低，这是个小技巧', 9, {
    cells: [
      { at: 0, value: '+', vis: [[0.8, 9]], accent: 'hot' },
      { at: 1, value: '-', vis: [[1.4, 9]], accent: 'hot' },
      { at: 2, value: '*', vis: [[2.6, 9]], accent: 'new' },
      { at: 3, value: '/', vis: [[3.2, 9]], accent: 'new' },
      { at: 4, value: '(', vis: [[5.0, 9]], accent: 'del' },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '加减同级，优先级 1', mono: true, size: 12.5,
        color: AMBER, vis: [[1.4, 2.6]] },
      { x: 480, y: 200, anchor: 'middle', text: '乘除同级，优先级 2 —— 比加减高，所以先算', mono: true,
        size: 12.5, color: GREEN, vis: [[3.2, 5.0]] },
      { x: 480, y: 200, anchor: 'middle', text: '左括号在栈内给 0 —— 最低，任何运算符来比较都不会弹它',
        mono: true, size: 12.5, color: RED, vis: [[5.0, 7.2]] },
      { x: 480, y: 200, anchor: 'middle', text: '这样它就一直待在栈里，直到遇到自己的右括号', size: 12.5,
        color: PURPLE, vis: [[7.2, 9]] },
    ],
    steps: [
      { t: 0, text: '转后缀时要靠优先级决定"谁可以先结算"' },
      { t: 0.8, text: '加减同级，最低', code: "case '+': case '-':  return 1;" },
      { t: 2.6, text: '乘除同级，比加减高', code: "case '*': case '/':  return 2;" },
      { t: 4.2, text: '同级从左往右算 —— 这一条会在后面用 >= 比较实现' },
      { t: 5.0, text: '最容易忽略的是左括号', code: "case '(':  return 0;   /* 最低 */" },
      { t: 7.2, text: '把它设成最低，任何运算符来比较都觉得"它比我低，不用弹"' },
      { t: 8.2, text: '于是左括号老老实实待在栈里，直到右括号来把它请出去', name: '括号的妙用' },
    ],
  }),

  // =========================================================================
  CAP('02-InfixToPostfix', 'InfixToPostfix —— 中缀转后缀', '3+4*2 → 342*+，括号在后缀式里消失但顺序没丢', 12, {
    cells: [
      // '+' 要留到结尾：从 t=5.0 起栈里是**两个**元素（'+' 在底、'*' 在顶），
      // 8.4s 那句"弹出剩余的 '*' 和 '+'"更是直接指着两格说。
      // 原来 '+' 在 5.0 就消失了，栈里明明有两个却只画出一个。
      { at: 0, value: '+', vis: [[2.4, 12]], accent: 'hot' },
      { at: 1, value: '*', vis: [[5.0, 12]], accent: 'new' },
    ],
    pointers: [
      { label: 'top', at: -0.5, vis: [[1.0, 2.4]], color: AMBER },
      { label: 'top', at: 0, vis: [[2.4, 5.0]], color: AMBER },
      { label: 'top', at: 1, vis: [[5.0, 9.6]], color: AMBER },
      { label: 'top', at: -0.5, vis: [[9.6, 12]], color: RED },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: "读入 '3' → 操作数，直接输出　　　　输出: 3", mono: true,
        size: 12.5, color: GREEN, vis: [[1.0, 2.4]] },
      { x: 480, y: 200, anchor: 'middle', text: "读入 '+' → 栈空，直接入栈　　　　　输出: 3", mono: true,
        size: 12.5, vis: [[2.4, 4.0]] },
      { x: 480, y: 200, anchor: 'middle', text: "读入 '4' → 操作数输出　　　　　　输出: 34", mono: true,
        size: 12.5, color: GREEN, vis: [[4.0, 5.0]] },
      { x: 480, y: 200, anchor: 'middle', text: "读入 '*' → 比栈顶 '+' 高，不弹，入栈　　输出: 34", mono: true,
        size: 12.5, color: BLUE, vis: [[5.0, 7.0]] },
      { x: 480, y: 200, anchor: 'middle', text: "读入 '2' → 输出　　　　　　　　　输出: 342", mono: true,
        size: 12.5, color: GREEN, vis: [[7.0, 8.4]] },
      { x: 480, y: 200, anchor: 'middle', text: "扫完 → 弹出剩余的 '*' 和 '+'　　　输出: 342*+", mono: true,
        size: 12.5, color: RED, vis: [[8.4, 12]] },
    ],
    steps: [
      { t: 0, text: '把 "3+4*2" 转成后缀 —— 从左往右扫一遍' },
      { t: 1.0, text: "读入 '3'：是操作数，直接输出", code: "if (c >= '0' && c <= '9')  dst[k++] = c;" },
      { t: 2.4, text: "读入 '+'：栈是空的，先入栈", code: "while (top >= 0 && priority(stack[top]) >= priority(c)) 出栈;\n stack[++top] = c;" },
      { t: 4.0, text: "读入 '4'：操作数，输出（此时输出是 34）" },
      { t: 5.0, text: "读入 '*'：它比栈顶的 '+' 优先级**高**，所以不弹，自己入栈", code: '/* 高 → 不弹。这就是"先乘后加"的实现方式 */' },
      { t: 7.0, text: "读入 '2'：操作数，输出（342）" },
      { t: 8.4, text: '扫完了，把栈里剩下的依次弹出：* 然后 +', code: "while (top >= 0)  dst[k++] = stack[--top];" },
      { t: 10.0, text: '得到 342*+ —— 运算符跑到了后面', name: '结果 342*+' },
      { t: 11.0, text: '重点：如果来的运算符优先级**不高于**栈顶，就得先把栈顶弹出去（用 >=）' },
    ],
  }),

  // =========================================================================
  CAP('03-EvalPostfix', 'EvalPostfix —— 后缀求值', '操作数入栈，遇运算符弹两个算一下', 12, {
    cells: [
      { at: 0, value: '3', vis: [[0.8, 4.4]], accent: 'hot' },
      { at: 1, value: '4', vis: [[2.0, 5.8]], accent: 'hot' },
      { at: 2, value: '2', vis: [[3.4, 6.4]], accent: 'hot' },
      { at: 1, value: '8', vis: [[6.4, 8.8]], accent: 'new' },
      { at: 0, value: '3', vis: [[4.4, 10.4]], accent: 'hot' },
      { at: 0, value: '11', vis: [[10.4, 12]], accent: 'new' },
    ],
    pointers: [
      { label: 'top', at: 0, vis: [[0.8, 2.0]], color: AMBER },
      { label: 'top', at: 1, vis: [[2.0, 3.4]], color: AMBER },
      { label: 'top', at: 2, vis: [[3.4, 6.4]], color: AMBER },
      { label: 'top', at: 1, vis: [[6.4, 8.8]], color: AMBER },
      { label: 'top', at: 0, vis: [[10.4, 12]], color: GREEN },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: "读 '3' '4' '2' → 三个操作数依次入栈　　栈: [3 4 2]", mono: true,
        size: 12.5, vis: [[3.4, 6.4]] },
      { x: 480, y: 200, anchor: 'middle', text: "读 '*'：弹出 4 和 2 → 4×2 = 8，把 8 压回去　　栈: [3 8]", mono: true,
        size: 12.5, color: GREEN, vis: [[6.4, 8.8]] },
      { x: 480, y: 200, anchor: 'middle', text: "读 '+'：弹出 3 和 8 → 3+8 = 11　　栈: [11]", mono: true,
        size: 12.5, color: GREEN, vis: [[8.8, 11.0]] },
      { x: 480, y: 200, anchor: 'middle', text: '扫完栈里只剩一个数 —— 那就是答案', size: 12.5,
        color: BLUE, vis: [[10.4, 12]] },
    ],
    steps: [
      { t: 0, text: '把 "342*+" 算出来 —— 后缀式不需要括号也不需要优先级' },
      { t: 0.8, text: "读 '3'：操作数，入栈", code: "if (c >= '0' && c <= '9')  stack[++top] = c - '0';" },
      { t: 3.4, text: "读到 '2' 时，栈里已经攒了三个操作数：3、4、2" },
      { t: 4.4, text: "读 '*'：终于可以结算了 —— 弹出两个数" },
      { t: 6.4, text: '弹出的是 4 和 2，4×2 = 8，把 8 压回栈里', code: 'int b = stack[top--];   /* 先弹出的是右操作数 */\n int a = stack[top--];   /* 后弹出的是左操作数 */' },
      { t: 8.8, text: "读 '+'：再弹两个，3 + 8 = 11", code: 'r = a + b;   stack[++top] = r;' },
      { t: 10.4, text: '扫完，栈里只剩一个数：11 —— 这就是答案', name: '答案 11' },
      { t: 11.2, text: '**顺序陷阱**：先弹出的是右操作数，所以减法要写 b 在前、a 在后（a-b）' },
    ],
  }),

  // =========================================================================
  CAP('04-main', 'main —— 拼成一个计算器', '中缀进、后缀转、结果出', 10, {
    cells: [
      { at: 0, value: '3', vis: [[1.0, 10]] },
      { at: 1, value: '+', vis: [[1.8, 10]] },
      { at: 2, value: '4', vis: [[2.6, 10]] },
      { at: 3, value: '*', vis: [[3.4, 10]] },
      { at: 4, value: '2', vis: [[4.2, 10]] },
    ],
    highlights: [
      { at: 0, vis: [[5.4, 6.6]], color: BLUE },
      { at: 2, vis: [[5.4, 6.6]], color: BLUE },
      { at: 4, vis: [[5.4, 6.6]], color: BLUE },
      { at: 1, vis: [[6.6, 7.8]], color: AMBER },
      { at: 3, vis: [[7.8, 9.0]], color: RED },
    ],
    notes: [
      { x: 480, y: 200, anchor: 'middle', text: '输入 "3+4*2" —— 人写的中缀表达式', mono: true,
        size: 13, vis: [[1.0, 5.4]] },
      { x: 480, y: 200, anchor: 'middle', text: '① 转后缀 → "342*+"　（括号和优先级都被编码进顺序里）',
        mono: true, size: 12.5, color: PURPLE, vis: [[5.4, 7.8]] },
      { x: 480, y: 200, anchor: 'middle', text: '② 后缀求值 → 11', mono: true, size: 12.5,
        color: GREEN, vis: [[7.8, 10]] },
      { x: 480, y: 200, anchor: 'middle', text: '两步都靠一个栈 —— 这就是栈最经典的应用', size: 12.5,
        vis: [[9.0, 10]] },
    ],
    steps: [
      { t: 0, text: '把两个算法串起来，就是一个能算数的计算器' },
      { t: 1.0, text: '输入是人写的中缀式：3+4*2' },
      { t: 3.4, text: '计算机不擅长直接算它 —— 括号、优先级、结合性太麻烦' },
      { t: 5.4, text: '第一步：转成后缀', code: 'InfixToPostfix("3+4*2", buf);   /* buf = "342*+" */' },
      { t: 7.0, text: '后缀式把"先算谁"编码进了顺序里，不需要任何规则' },
      { t: 7.8, text: '第二步：从左往右扫一遍就能算出结果', code: 'v = EvalPostfix(buf, &ok);   /* v = 11 */' },
      { t: 9.0, text: '两个算法都只用一个栈 —— 这就是栈最经典的应用场景' },
    ],
  }),

];
