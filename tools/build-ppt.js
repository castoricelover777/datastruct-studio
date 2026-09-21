// 生成两份 PPT（共用 tools/ppt/blueprint.js 画法）
//   ① ppt/考核汇报   —— 正式汇报用，7 页
//   ② ppt/准备计划   —— 准备期执行用，7 页
const B = require('./ppt/blueprint');
const { C, ML, txt, rect, hline, vline, contentPage, coverPage, writeDeck } = B;

const FOOT = '数据结构研习社 · DataStruct Studio · 研究所入所第一次考核';

// ══════════════════════════════════════════════════════════
// 第一份：专业知识图谱 / 学习框架（12 页）
//   前 10 页 = 图谱本身；后 2 页 = 用它练过手的一个例子
// ══════════════════════════════════════════════════════════
const deckA = [];

// --- 01 封面 ---
deckA.push(coverPage({
  kicker: '研究所入所第一次考核 · 第一部分',
  title: '我的专业知识图谱',
  bigLines: '我的\n专业图谱',
  subLines: '大一，开学第二周开始整理的\n整个专业分成六块，每块标上我学到哪',
  footer: '软件工程（本科）· 深信息 · 2026-09-23',
  boxes: [
    [654, 176, '一块一块问自己', 16],
    [654, 258, '标上我现在在哪', 16],
    [654, 340, '再照着去学', 16],
  ],
  notes: '封面。主题是专业知识图谱，不是项目。三个盒子=整理这张图的三个动作。',
}));

// --- 02 图谱全景 ---
{
  const b = [];
  b.push(txt(ML, 152, 610, 22, '整个专业分成六块 · 每块标注我现在的状态', { size: 12, color: C.mut }));
  b.push(rect(ML, 284, 168, 92, { fill: C.red, stroke: null }));
  b.push(txt(60, 296, 148, 68, '软件工程\n大一 · 开学第二周', { size: 15, bold: true, color: C.paper, lh: 1.4 }));
  const rows = [
    ['01', '编程与算法', '写程序、写对、写快', '两样写过题', true],
    ['02', '系统基础', '机器怎么造、怎么管、怎么连', '四门课还没上', false],
    ['03', '软件工程方法', '一个东西从想法到做完的全过程', '项目里跟过一遍', true],
    ['04', '开发技术', '把东西做出来给人用', '跟做过', false],
    ['05', 'AI 与 Agent', '让机器自己找答案', '我的兴趣在这儿', true],
    ['06', '网络与信息安全', '让东西不被看、不被改、一直能用', '还没碰过', false],
  ];
  rows.forEach((r, i) => {
    const y = 152 + i * 52;
    b.push(txt(232, y, 34, 26, r[0], { size: 15, color: C.mut, bold: true }));
    b.push(txt(272, y - 2, 220, 26, r[1], { size: 17, bold: true }));
    b.push(txt(272, y + 22, 300, 22, r[2], { size: 12, color: C.mut }));
    b.push(txt(566, y + 2, 100, 24, r[3], { size: 12, color: r[4] ? C.red : C.mut }));
    if (i < rows.length - 1) b.push(hline(232, y + 44, 432, { color: C.rule, width: 0.5 }));
  });
  b.push(vline(700, 152, 312, { color: C.rule, width: 0.5 }));
  b.push(txt(726, 156, 186, 24, '这张图想说什么', { size: 12, color: C.mut }));
  b.push(txt(724, 190, 190, 130, '六块里我真正\n动过手的，\n只有一块半。', { size: 22, bold: true, lh: 1.3 }));
  b.push(txt(724, 310, 190, 130, '但我知道每一块\n讲什么、\n大概什么时候学。\n这就够了。', { size: 15, color: C.mut, lh: 1.45 }));
  deckA.push(contentPage(2, '', '专业全景：六块', b,
    '六分支全景。状态为学生自评：两样写过题 / 四门课还没上 / 项目里跟过一遍 / 跟做过 / 兴趣在这儿 / 还没碰过。'));
}

// --- 03 图谱是怎么建出来的 ---
{
  const b = [];
  b.push(txt(ML, 152, 700, 24, '我没有去学每一块，只是先把"要学什么"弄清楚。', { size: 16, bold: true }));
  const steps = [
    ['01', '先问自己一个问题', '我这四年到底要学什么？课本目录只讲一门课，讲不了整个专业。'],
    ['02', '把答案分成六块', '按"这东西是干嘛的"分：写程序 / 懂机器 / 做工程 / 做产品 / 搞智能 / 保安全'],
    ['03', '去找每块大概讲什么', '搜"计算机专业核心课程"、看培养方案；课程内容只是初步了解，没真正去学'],
    ['04', '标上我现在在哪', '每块写一句：写过题 / 跟做过 / 还没上到。写不出"会"就不写。'],
  ];
  steps.forEach((s, i) => {
    const y = 190 + i * 62;
    b.push(rect(ML, y, 864, 50, { fill: i === 3 ? C.red : C.paper, stroke: i === 3 ? null : '#b3b0a8' }));
    b.push(txt(64, y + 12, 40, 28, s[0], { size: 16, bold: true, color: i === 3 ? C.paper : C.mut }));
    b.push(txt(116, y + 12, 200, 28, s[1], { size: 17, bold: true, color: i === 3 ? C.paper : C.ink }));
    b.push(txt(326, y + 14, 570, 28, s[2], { size: 13, color: i === 3 ? C.paper : C.mut }));
  });
  b.push(hline(ML, 440, 864, { color: '#a9a49b', width: 0.8 }));
  b.push(txt(ML, 452, 864, 26, '这次只做到"知道每块大概讲什么、大概什么时候学"，没有往下学。', { size: 13, bold: true }));
  b.push(txt(ML, 478, 864, 26, '先把地图画出来，比急着啃某一门课有用。', { size: 13, color: C.mut }));
  deckA.push(contentPage(3, '', '图谱是怎么建出来的', b,
    '四步构建法为学生的真实做法。第 3 步如实写明：课程内容只是初步了解，没有真正去学。'));
}

// --- 04 六块里具体有什么（三级标注）---
{
  const b = [];
  // ● 写过题 / ○ 跟做过或看得懂写不出 / · 还没碰过
  const blocks = [
    ['01', '编程与算法', ['● C 语言与指针（牛客 50 题）', '● 数据结构（在学，链表的增删查改刷过题）', '· 算法与复杂度', '· 设计模式']],
    ['02', '系统基础', ['· 计算机组成原理', '· 操作系统', '· 计算机网络', '· 数据库']],
    ['03', '软件工程方法', ['○ 版本控制 Git', '○ 构建打包交付', '· 需求与设计', '· 测试与质量']],
    ['04', '开发技术', ['· 前端 HTML/CSS/JS', '· 后端与服务器', '○ 桌面应用（跟做过）', '○ 数据可视化（跟做过）']],
    ['05', 'AI 与 Agent', ['○ 大模型与 Prompt（天天在用）', '· 数学基础', '· 机器学习 / 深度学习', '· RAG 与 Agent 原理']],
    ['06', '网络与信息安全', ['· 密码学', '· 网络安全', '· Web 安全', '· 安全开发习惯']],
  ];
  blocks.forEach((blk, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 48 + col * 448, y = 140 + row * 116;
    b.push(txt(x, y, 44, 28, blk[0], { size: 16, color: C.mut, bold: true }));
    b.push(txt(x + 48, y - 2, 260, 26, blk[1], { size: 17, bold: true, color: i === 4 ? C.red : C.ink }));
    b.push(txt(x, y + 30, 424, 84, blk[2].join('\n'), { size: 12, color: C.mut, lh: 1.55 }));
  });
  b.push(hline(ML, 496, 864, { color: '#a9a49b', width: 0.8 }));
  b.push(txt(ML, 504, 864, 24, '● 写过题　　○ 跟做过，或看得懂但写不出　　· 还没碰过', { size: 11, bold: true }));
  deckA.push(contentPage(4, '', '每一块里具体有什么', b,
    '三级标注：● 写过题 / ○ 跟做过或看得懂写不出 / · 还没碰过。只有 C 语言与数据结构标为 ●。'));
}

// --- 05 这些认识是从哪来的 ---
{
  const b = [];
  b.push(txt(ML, 152, 700, 24, '我没有把六块都学会，只是先搞清楚每块在讲什么。', { size: 16, bold: true }));
  b.push(txt(ML, 184, 240, 22, '分支', { size: 11, color: C.mut }));
  b.push(txt(300, 184, 270, 22, '这一块讲什么', { size: 11, color: C.mut }));
  b.push(txt(580, 184, 292, 22, '我的认识从哪来', { size: 11, color: C.mut }));
  b.push(hline(ML, 206, 864, { color: '#c3bfb7' }));
  const rows = [
    ['01 编程与算法', '写程序、写对、写快', '自己学过：C 语言 50 题、链表增删查改', true],
    ['02 系统基础', '机器怎么造、怎么管、怎么连', '看培养方案知道这四门在大二', false],
    ['03 软件工程方法', '一个东西从想法到做完的全过程', '看过软件工程课的概要描述', true],
    ['04 开发技术', '把东西做出来给人用', '做项目的时候跟着做过', true],
    ['05 AI 与 Agent', '让机器自己找答案', '平时天天在用，还没学过原理', false],
    ['06 网络与信息安全', '让东西不被看、不被改、一直能用', '还没有，只听说过大概', false],
  ];
  rows.forEach((r, i) => {
    const y = 218 + i * 38;
    if (r[3]) {
      b.push(rect(ML, y - 6, 864, 36, { fill: C.band, stroke: null }));
      b.push(rect(ML, y - 6, 3, 36, { fill: C.ink, stroke: null }));
    }
    b.push(txt(60, y, 240, 28, r[0], { size: 14, bold: true }));
    b.push(txt(300, y + 2, 270, 26, r[1], { size: 12, color: C.mut }));
    b.push(txt(580, y + 2, 300, 26, r[2], { size: 12, color: r[3] ? C.ink : C.mut }));
  });
  b.push(hline(ML, 456, 864, { color: '#c3bfb7' }));
  b.push(txt(ML, 466, 864, 26, '加底色的三行是我真碰过的；另外三行我只是知道它讲什么，还没学。', { size: 12, color: C.mut }));
  deckA.push(contentPage(5, '', '这些认识是从哪来的', b,
    '如实区分：加底色的三行为真正接触过的（自学、看过概要、跟做过）；其余三行只是初步了解。'));
}

// --- 06 我是拿什么标准标"会"的 ---
{
  const b = [];
  b.push(txt(ML, 152, 700, 24, '标之前先定规矩，不然容易把"看过"当成"会"。', { size: 16, bold: true }));
  const rules = [
    ['●', '写过题的', '有能查到的产出：牛客过了 50 题、链表增删查改刷过题', C.red, true],
    ['○', '跟做过的', '只在项目里用过，或者看得懂但自己写不出来', C.ink, false],
    ['·', '还没碰过的', '连"它大概讲什么"都只是听来的', C.mut, false],
  ];
  rules.forEach((r, i) => {
    const y = 200 + i * 74;
    b.push(txt(ML, y + 6, 44, 40, r[0], { size: 30, bold: true, color: r[3] }));
    b.push(txt(104, y + 4, 200, 28, r[1], { size: 18, bold: true }));
    b.push(txt(104, y + 32, 760, 26, r[2], { size: 13, color: C.mut }));
    if (i < 2) b.push(hline(ML, y + 62, 864, { color: C.rule, width: 0.5 }));
  });
  b.push(hline(ML, 448, 864, { color: '#a9a49b', width: 0.8 }));
  b.push(txt(ML, 458, 864, 26, '为什么先定规矩：不先定，我就会把"看过视频"也算成"会"，那这张图就没用了。', { size: 13, bold: true }));
  deckA.push(contentPage(6, '', '我是拿什么标准标"会"的', b,
    '三级标准与判断依据：● 有可查的产出；○ 只在项目里用过或看得懂写不出；· 只是听来的。'));
}

// --- 07 学习框架：三件事循环 ---
{
  const b = [];
  b.push(txt(ML, 152, 700, 24, '这是我给自己定的学法，也是我做那个练习工具的原因。', { size: 16, bold: true }));
  const loop = [
    ['01', '看懂', '把一块代码分开读，先弄明白它在干嘛'],
    ['02', '写出来', '把注释遮掉，自己默写一遍，写完编译看对不对'],
    ['03', '讲出来', '用自己的话讲一遍。讲不顺，就是还没懂'],
  ];
  loop.forEach((s, i) => {
    const x = 48 + i * 288;
    b.push(rect(x, 196, 264, 116, { fill: i === 2 ? C.red : C.paper, stroke: i === 2 ? null : '#b3b0a8' }));
    b.push(txt(x + 18, 210, 200, 26, s[0], { size: 15, color: i === 2 ? C.paper : C.mut, bold: true }));
    b.push(txt(x + 18, 240, 228, 30, s[1], { size: 19, bold: true, color: i === 2 ? C.paper : C.ink }));
    b.push(txt(x + 18, 276, 246, 34, s[2], { size: 11.5, color: i === 2 ? C.paper : C.mut, lh: 1.4 }));
    if (i < 2) b.push(txt(x + 264, 240, 24, 28, '→', { size: 16, color: C.mut, align: 'center' }));
  });
  b.push(txt(ML, 336, 864, 26, '第一步最好糊弄，第三步最不好糊弄。', { size: 15, bold: true }));
  b.push(txt(ML, 364, 864, 26, '我看视频的时候经常觉得"懂了"，第二天默写就写不出来；能讲顺的，才是真记住了。', { size: 13, color: C.mut }));
  b.push(hline(ML, 408, 864, { color: '#a9a49b', width: 0.8 }));
  const fill = [
    ['每块学完填三样', '它讲什么 / 我练到哪一步 / 下一步学什么'],
    ['先填"讲什么"', '这一块是干嘛的，一句话说不出来就说明还没搞清'],
    ['再填"练到哪"', '按 ● ○ · 标，写不出"会"就不写'],
  ];
  fill.forEach((r, i) => {
    const y = 422 + i * 28;
    b.push(txt(ML, y, 200, 24, r[0], { size: 14, bold: true, color: C.red }));
    b.push(txt(252, y, 660, 24, r[1], { size: 12, color: C.mut }));
  });
  deckA.push(contentPage(7, '', '学习框架：三件事循环', b,
    '学习框架为看懂 → 写出来 → 讲出来三步，以及每块学完后要填的三样。'));
}

// --- 08 第一步"写过题"的产出 ---
{
  const b = [];
  b.push(txt(ML, 152, 700, 24, '按上面那套标准，我能拿出来的是这些。', { size: 16, bold: true }));
  const rows = [
    ['牛客 C 语言基础题', '50 题', '写了提交、有对有错，不是只看'],
    ['链表增删查改', '刷过题', '数据结构里最先练的一块'],
    ['自己做的一个练习工具', '186 个模块', '学数据结构的时候顺手做的'],
    ['那个工具的代码', '全部 AI 写的', '我不会写代码，这点先说明'],
  ];
  rows.forEach((r, i) => {
    const y = 196 + i * 52;
    if (i === 3) {
      b.push(rect(ML, y - 8, 864, 48, { fill: C.band, stroke: null }));
      b.push(rect(ML, y - 8, 3, 48, { fill: C.ink, stroke: null }));
    }
    b.push(txt(60, y, 280, 32, r[0], { size: 17, bold: true }));
    b.push(txt(360, y - 2, 160, 34, r[1], { size: 21, bold: true, color: i === 3 ? C.ink : C.red }));
    b.push(txt(540, y + 3, 372, 28, r[2], { size: 13, color: C.mut }));
  });
  b.push(hline(ML, 420, 864, { color: '#a9a49b', width: 0.8 }));
  b.push(txt(ML, 432, 864, 26, '所以六块里我敢写 ● 的只有第一块；其它块现在都还是 ○ 和 ·。', { size: 14, bold: true }));
  b.push(txt(ML, 460, 864, 26, '最后一行我放在这儿，是怕前面几行看起来像在夸自己。', { size: 12, color: C.mut }));
  deckA.push(contentPage(8, '', '我现在拿得出手的东西', b,
    '按三级标准列出真实产出：牛客 50 题、链表刷题、练习工具 186 模块；并主动标注工具代码为 AI 所写。'));
}

// --- 09 接下来的顺序 ---
{
  const b = [];
  b.push(txt(ML, 152, 700, 24, '按上面那张图和标准，我给自己排的顺序。', { size: 16, bold: true }));
  const lanes = [
    ['现在', '把数据结构学完', '树后面还有图、排序、散列，现在学到二叉树'],
    ['接着', 'C 语言再多写一点', '50 题只是入门，想练到能独立写小的程序'],
    ['然后', '补 Python', '初中学过，忘得差不多了'],
    ['大二', '四门地基课', '计组、操作系统、网络、数据库，学校里开'],
  ];
  lanes.forEach((L, i) => {
    const y = 200 + i * 62;
    b.push(txt(ML, y, 90, 30, L[0], { size: 16, bold: true, color: i === 0 ? C.red : C.mut }));
    b.push(txt(148, y + 2, 260, 30, L[1], { size: 17, bold: true }));
    b.push(txt(430, y + 4, 480, 28, L[2], { size: 12.5, color: C.mut }));
    if (i < 3) b.push(hline(ML, y + 50, 864, { color: C.rule, width: 0.5 }));
  });
  b.push(hline(ML, 456, 864, { color: '#a9a49b', width: 0.8 }));
  b.push(txt(ML, 466, 864, 26, '顺序的根据是"哪块是别块的前提"，不是"哪块听起来厉害"。', { size: 13, bold: true }));
  deckA.push(contentPage(9, '', '接下来的顺序', b,
    '四步顺序为学生自述规划，依据是先修关系；大二四门课依据培养方案。'));
}

// --- 10 这张图之后要怎么用 ---
{
  const b = [];
  b.push(txt(ML, 152, 700, 24, '画完不能用，就只是一张图。', { size: 16, bold: true }));
  const use = [
    ['01', '每学完一块，回来改状态', '从 · 改到 ○ 再改到 ●，改不动就说明没学到'],
    ['02', '被卡住的时候，看它属于哪一块', '知道自己在哪一块卡住，比瞎补有用'],
    ['03', '选方向的时候，看哪块最想深挖', '我现在最想去的是 AI 那一块'],
  ];
  use.forEach((u, i) => {
    const y = 200 + i * 66;
    b.push(rect(ML, y, 56, 46, { fill: C.red, stroke: null }));
    b.push(txt(64, y + 10, 40, 28, u[0], { size: 17, bold: true, color: C.paper }));
    b.push(txt(124, y + 2, 400, 28, u[1], { size: 18, bold: true }));
    b.push(txt(124, y + 30, 760, 24, u[2], { size: 12.5, color: C.mut }));
  });
  b.push(hline(ML, 410, 864, { color: '#a9a49b', width: 0.8 }));
  b.push(txt(ML, 422, 864, 26, '这张图会一直改。现在它有六块、24 个小项，其中只有 2 个是 ●。', { size: 14, bold: true }));
  b.push(txt(ML, 450, 864, 26, '下次汇报的时候我想让它多几个 ● —— 那才算真的往下走了。', { size: 13, color: C.mut }));
  deckA.push(contentPage(10, '', '这张图之后要怎么用', b,
    '三条约定了这张图以后的用法：学完回来改状态、卡住时定位、选方向时参考。'));
}

// --- 11 第二部分封面 ---
{
  const b = [];
  b.push(rect(ML, 236, 6, 100, { fill: C.red, stroke: null }));
  b.push(txt(76, 232, 700, 40, '第二部分', { size: 15, color: C.mut, bold: true }));
  b.push(txt(76, 262, 800, 50, '拿第一块练手：我做的一个数据结构练习工具', { size: 30, bold: true }));
  b.push(txt(76, 330, 800, 30, '为什么放它：它是"写过题"那一条里唯一像样的产出，代码不是我写的。', { size: 14, color: C.mut }));
  b.push(hline(ML, 392, 864, { color: '#a9a49b', width: 0.8 }));
  b.push(txt(ML, 404, 864, 26, '顺着说三件事：我是怎么做起来的 / 这东西做出来什么样 / 我意识到自己缺什么。', { size: 13 }));
  deckA.push(contentPage(11, '', '第二部分：拿第一块练手', b,
    '第二部分的过渡页，明确说明项目只作为「写过题」这一条的证据，并再次交代代码为 AI 所写。'));
}

// --- 12 收尾 ---
{
  const b = [];
  b.push(txt(ML, 152, 860, 30, '我做的唯一一件不算小事的事，是把"我该学什么"想清楚了。', { size: 22, bold: true }));
  b.push(hline(ML, 200, 864, { color: '#a9a49b', width: 0.8 }));
  const pts = [
    ['六块', '整个专业分六块：写程序、懂机器、做工程、做产品、搞智能、保安全'],
    ['24 项', '每一块底下列了具体要学的东西，一共 24 项'],
    ['2 个 ●', '其中真正写过题的只有 2 项：C 语言和数据结构'],
    ['一路标到底', '每学完一块回来改状态，从 · 改到 ○ 再改到 ●'],
  ];
  pts.forEach((p, i) => {
    const y = 220 + i * 46;
    b.push(txt(ML, y, 160, 34, p[0], { size: 19, bold: true, color: C.red }));
    b.push(txt(230, y + 4, 680, 30, p[1], { size: 14 }));
  });
  b.push(hline(ML, 418, 864, { color: '#a9a49b', width: 0.8 }));
  b.push(txt(ML, 432, 864, 28, '我大一，刚开学两周多，专业课大部分还没上到。', { size: 15, bold: true }));
  b.push(txt(ML, 462, 864, 26, '所以我先做的事不是学某一门课，是先知道自己要学哪些课、大概什么时候学。', { size: 14, color: C.mut }));
  deckA.push(contentPage(12, '', '我做的唯一一件不算小事的事', b,
    '收尾页。四点概括图谱本身：六块、24 项、2 个 ●、持续更新。'));
}


// ══════════════════════════════════════════════════════════
// 第二份：准备计划（7 页，照着执行用）
// ══════════════════════════════════════════════════════════
const deckB = [];

// --- 01 封面 ---
deckB.push(coverPage({
  kicker: 'PREPARATION PLAN / 09-19 → 09-23',
  title: '研究所入所第一次考核 · 准备计划',
  bigLines: '6 小时\n准备计划',
  subLines: '9/19 至 9/23 · 线下 · 汇报 9/23 19:30\n大一新生 · 开学第二周 · 6 小时以内',
  footer: '软件工程（本科）· 深信息 · 配套《考核准备规划》文档',
  boxes: [
    [660, 176, '读代码 · 2.5 h'],
    [660, 258, '做 PPT 与讲稿 · 1.75 h'],
    [660, 340, '问答与演练 · 1.75 h'],
  ],
  notes: '准备计划封面。总投入 6 小时，分配依据见第 3 页。',
}));

// --- 02 项目选型 ---
{
  const b = [];
  b.push(txt(ML, 152, 400, 24, '三个方案对比 · 结论是方案 A', { size: 12, color: C.mut }));
  b.push(txt(ML, 186, 240, 24, '方案', { size: 11, color: C.mut }));
  b.push(txt(300, 186, 130, 24, '需时', { size: 11, color: C.mut }));
  b.push(txt(430, 186, 120, 24, '可讲深度', { size: 11, color: C.mut }));
  b.push(txt(560, 186, 352, 24, '结论', { size: 11, color: C.mut }));
  b.push(hline(ML, 210, 864, { color: '#c3bfb7' }));
  const rows = [
    ['A 包装现有项目', '6 h 全用于读懂', '★★★★★', '推荐。风险只有一个：自己没读透', false],
    ['B 新写命令行 Agent', '3 h 写 + 3 h 准备', '★★☆', '骨架级，被问一句就答不上', false],
    ['C 两者都要', '6 h 完全不够', '★', '两个都讲不透', false],
  ];
  rows.forEach((r, i) => {
    const y = 222 + i * 44;
    b.push(txt(60, y, 240, 28, r[0], { size: 17, bold: true }));
    b.push(txt(300, y + 3, 130, 26, r[1], { size: 13, color: C.mut }));
    b.push(txt(430, y + 1, 120, 28, r[2], { size: 16, color: i === 0 ? C.red : C.mut }));
    b.push(txt(560, y + 3, 360, 26, r[3], { size: 13, color: C.mut }));
    if (i < rows.length - 1) b.push(hline(ML, y + 36, 864, { color: C.rule, width: 0.5 }));
  });
  b.push(rect(ML, 366, 864, 62, { fill: C.band, stroke: null }));
  b.push(rect(ML, 366, 3, 62, { fill: C.ink, stroke: null }));
  b.push(txt(72, 380, 830, 28, '为什么是 A：考核要的是「真正理解自己做了什么，并能讲清楚」。', { size: 15, bold: true }));
  b.push(txt(72, 406, 830, 24, '你手里的项目有构建流水线、10738 条自动检查、6 个已发版本——这是别人没有的现成弹药。', { size: 12, color: C.mut }));
  b.push(txt(ML, 442, 864, 26, '6 小时里前 2.5 小时必须用来把代码真正读懂，否则上台就是复述 README，一问就穿。', { size: 12, color: C.mut }));
  deckB.push(contentPage(2, 'PROJECT SELECTION', '项目选型：不新做，用现有项目', b,
    '方案对比为本规划的建议，非考核方要求。'));
}

// --- 03 六小时分配 ---
{
  const b = [];
  b.push(txt(ML, 152, 500, 24, '总投入 6 小时 · 三块时间', { size: 12, color: C.mut }));
  const blocks = [
    ['读代码', 2.5, '只读 4 个文件，合计 826 行', true],
    ['做 PPT 与讲稿', 1.75, '汇报 7 页 + 计划 7 页 + 5 个锚点', false],
    ['问答与演练', 1.75, '22 问 + 掐表演练 2 遍 + 演示准备', false],
  ];
  const x0 = 260, unit = 120;
  blocks.forEach((r, i) => {
    const y = 200 + i * 80;
    b.push(txt(ML, y + 2, 200, 30, r[0], { size: 18, bold: true }));
    b.push(rect(x0, y, Math.round(r[1] * unit), 30, { fill: r[3] ? C.red : '#b9b6ad', stroke: null }));
    b.push(txt(x0 + Math.round(r[1] * unit) + 12, y + 4, 80, 26, `${r[1]} h`, { size: 18, bold: true, color: r[3] ? C.red : C.ink }));
    b.push(txt(x0, y + 38, 620, 24, r[2], { size: 12, color: C.mut }));
  });
  b.push(vline(680, 152, 312, { color: C.rule, width: 0.5 }));
  b.push(txt(704, 152, 210, 24, '为什么这样分', { size: 12, color: C.mut }));
  b.push(txt(704, 186, 208, 140, '线下汇报，面试官\n大概率会说\n「打开我看看」\n或「这段讲讲」。', { size: 18, lh: 1.4 }));
  b.push(txt(704, 320, 208, 140, '所以「跑得起来」\n和「读得懂代码」\n优先于 PPT 好看。', { size: 16, color: C.mut, lh: 1.4 }));
  deckB.push(contentPage(3, 'TIME BUDGET · 6 HOURS', '6 小时怎么花', b,
    '时间分配为本规划建议；白天有课时按文档第 6 节压缩版执行。'));
}

// --- 04 两张交付物 ---
{
  const b = [];
  b.push(txt(ML, 152, 400, 24, '考核任务两项 · 各自的交付物', { size: 12, color: C.mut }));
  const cards = [
    [48, '任务 1', '专业知识图谱 / 学习框架', ['六分支三色图', '标注已学 · 在学 · 待学', '附权威来源'], 'PPT 第 2 页'],
    [504, '任务 2', '选一个方向做小项目', ['知识框架里选方向', '做完并能讲清楚', '思路 · 过程 · 成果'], 'PPT 第 4-6 页'],
  ];
  cards.forEach(([x, num, name, items, out]) => {
    b.push(rect(x, 186, 408, 250, { fill: C.paper, stroke: '#b3b0a8' }));
    b.push(rect(x, 186, 408, 4, { fill: C.red, stroke: null }));
    b.push(txt(x + 24, 206, 100, 24, num, { size: 13, color: C.mut }));
    b.push(txt(x + 24, 230, 360, 30, name, { size: 20, bold: true }));
    items.forEach((it, i) => b.push(txt(x + 24, 278 + i * 32, 360, 28, `· ${it}`, { size: 15, color: C.mut })));
    b.push(hline(x + 24, 386, 360, { color: C.rule, width: 0.5 }));
    b.push(txt(x + 24, 398, 360, 26, `交付在 ${out}`, { size: 13, color: C.red }));
  });
  b.push(txt(ML, 452, 864, 26, '两项都已基本完成，唯一真正缺的是：任务 1 的图还没画出来。', { size: 13, color: C.mut }));
  deckB.push(contentPage(4, 'TWO TASKS · TWO DELIVERABLES', '任务 1 与任务 2', b,
    '对应考核通知的两项任务；当前完成度自查见规划文档第 0.2 节。'));
}

// --- 05 时间表 ---
{
  const b = [];
  b.push(txt(ML, 152, 500, 24, '9/19 至 9/23 · 精确到小时', { size: 12, color: C.mut }));
  b.push(txt(ML, 182, 130, 24, '日期', { size: 11, color: C.mut }));
  b.push(txt(170, 182, 130, 24, '时段', { size: 11, color: C.mut }));
  b.push(txt(330, 182, 110, 24, '时长', { size: 11, color: C.mut }));
  b.push(txt(450, 182, 462, 24, '做什么 · 完成标准', { size: 11, color: C.mut }));
  b.push(hline(ML, 206, 864, { color: '#c3bfb7' }));
  const rows = [
    ['9/19 周五', '20:00-21:15', '1.25 h', '读 verify.js 与 make-animations.js', false],
    ['', '21:25-22:25', '1.0 h', '读 build-data.js，手画出四层流水线图', true],
    ['9/20 周六', '机动', '0-1 h', '补读；或跑一次 verify 看 10738 条全过', false],
    ['9/21 周日', '19:00-20:00', '1.0 h', '画六分支知识图谱 + PPT 第 1-4 页', false],
    ['', '20:10-21:10', '1.0 h', 'PPT 第 5-7 页 + 写 5 个讲稿锚点', false],
    ['9/22 周一', '19:30-20:30', '1.0 h', '掐表演练第 1 遍（目标 6 分钟）', false],
    ['', '20:40-21:40', '1.0 h', '演练第 2 遍 + 过 22 问 + 备演示三保险', true],
    ['9/23 周三', '白天 30 分钟', '0.5 h', '过锚点 + 检查 U 盘与电脑电量', false],
    ['', '19:30', '—', '汇报', true],
  ];
  rows.forEach((r, i) => {
    const y = 218 + i * 26;
    if (r[4]) {
      b.push(rect(ML, y - 3, 864, 26, { fill: C.band, stroke: null }));
      b.push(rect(ML, y - 3, 3, 26, { fill: C.ink, stroke: null }));
    }
    b.push(txt(60, y, 120, 24, r[0], { size: 13, bold: !!r[0] }));
    b.push(txt(170, y, 160, 24, r[1], { size: 13, color: C.mut }));
    b.push(txt(330, y, 110, 24, r[2], { size: 13, bold: true }));
    b.push(txt(450, y, 462, 24, r[3], { size: 13 }));
  });
  b.push(txt(ML, 462, 864, 24, '绝对不能砍：读 verify.js 与 build-data.js · PPT 第 2 页知识图谱 · PPT 第 5 页架构图。', { size: 12, color: C.red }));
  deckB.push(contentPage(5, 'SCHEDULE · 09-19 TO 09-23', '五天时间表', b,
    '9/20 为机动缓冲；白天有课时改走规划文档第 6.2 节压缩版。'));
}

// --- 06 三张牌 ---
{
  const b = [];
  b.push(txt(ML, 152, 500, 24, '你手里已经有的东西 · 全部可验证', { size: 12, color: C.mut }));
  const cards = [
    ['01', '开学第五天就动手', '9/12 立项，', '那时才开学第一周'],
    ['02', '执行力有数据', '两周 56 次提交，', '一天最多 43 次'],
    ['03', '自己加的自己删了', '加了一章，判定不合格，', '退回去删掉'],
  ];
  cards.forEach((c, i) => {
    const x = 48 + i * 296;
    b.push(rect(x, 186, 272, 190, { fill: i === 1 ? C.red : C.paper, stroke: i === 1 ? null : '#b3b0a8' }));
    b.push(txt(x + 20, 204, 232, 26, c[0], { size: 14, color: i === 1 ? C.paper : C.mut }));
    b.push(txt(x + 20, 234, 232, 60, c[1], { size: 19, bold: true, color: i === 1 ? C.paper : C.ink, lh: 1.3 }));
    b.push(txt(x + 20, 302, 232, 60, c[2], { size: 16, color: i === 1 ? C.paper : C.mut, lh: 1.3 }));
  });
  b.push(hline(ML, 398, 864, { color: '#a9a49b', width: 0.8 }));
  b.push(txt(ML, 410, 864, 28, '考核原话：现阶段技术基础不是决定性因素，但需要具备较强的学习主动性和执行力。', { size: 15, bold: true }));
  b.push(txt(ML, 444, 864, 26, '这三样都不是「我技术强」，而是「我真的在做事」——正好是考核要的。', { size: 12, color: C.mut }));
  deckB.push(contentPage(6, 'THREE PROVEN STRENGTHS', '上台要打的三张牌', b,
    '三项均有仓库提交记录作为证据；均与「技术基础」无关，与「执行力」有关。'));
}

// --- 07 必背清单 ---
{
  const b = [];
  b.push(txt(ML, 152, 500, 24, '22 问里优先背这 6 道', { size: 12, color: C.mut }));
  const qs = [
    ['Q1', '你大几？学过什么？', '大一开学第二周；C 暑假自学，数据结构提前在学'],
    ['Q5', '数据怎么流动', '真源 → 数据 → 动画 → 交付，四层 + 一条检查'],
    ['Q7', '动画怎么生成', '数据写每帧状态，算坐标，生成 SVG 动画标签'],
    ['Q10', '举个修过的 bug', 'keyTimes 末项必须正好为 1，否则动画被静默丢弃'],
    ['Q14', 'Agent 与普通程序的区别', '路线定死 对 自己在循环里决定下一步'],
    ['Q16', 'RAG 是什么', '先在自己知识库里搜片段，再让模型照片段答'],
    ['Q22', '如果给你更多时间', '接好生成层 · 检查上 GitHub · 补可访问性'],
  ];
  qs.forEach((q, i) => {
    const y = 182 + i * 40;
    b.push(txt(ML, y, 50, 28, q[0], { size: 15, bold: true, color: C.red }));
    b.push(txt(110, y, 300, 28, q[1], { size: 17, bold: true }));
    b.push(txt(430, y + 3, 482, 26, q[2], { size: 12, color: C.mut }));
    if (i < qs.length - 1) b.push(hline(ML, y + 32, 864, { color: C.rule, width: 0.5 }));
  });
  b.push(hline(ML, 430, 864, { color: '#a9a49b', width: 0.8 }));
  b.push(txt(ML, 442, 864, 26, 'Q9 那段 keyTimes 的故事要练到能一口气讲完——它是你最能打的一张牌。', { size: 13, color: C.red }));
  b.push(txt(ML, 470, 864, 24, '代码不是我写的——这件事第一句就主动说清，别等人问。被问出来 = 一票否决。', { size: 12, color: C.red }));
  deckB.push(contentPage(7, 'MUST-PREPARE ANSWERS', '上台前必背', b,
    '完整 22 问与应答骨架见规划文档第 5 节。'));
}

// ── 写盘 ──
const nA = writeDeck('ppt/考核汇报', '研究所入所第一次考核 · 汇报', deckA);
const nB = writeDeck('ppt/准备计划', '研究所入所第一次考核 · 准备计划', deckB);
console.log(`考核汇报：${nA} 页`);
console.log(`准备计划：${nB} 页`);
