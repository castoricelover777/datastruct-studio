// 生成两份 PPT（共用 tools/ppt/blueprint.js 画法）
//   ① ppt/考核汇报   —— 正式汇报用，7 页
//   ② ppt/准备计划   —— 准备期执行用，7 页
const B = require('./ppt/blueprint');
const { C, ML, txt, rect, hline, vline, contentPage, coverPage, writeDeck } = B;

const FOOT = '数据结构研习社 · DataStruct Studio · 研究所入所第一次考核';

// ══════════════════════════════════════════════════════════
// 第一份：考核汇报（7 页）
// ══════════════════════════════════════════════════════════
const deckA = [];

// --- 01 封面 ---
deckA.push(coverPage({
  kicker: '研究所入所第一次考核',
  title: '我做了个东西，用来学数据结构',
  bigLines: '数据结构\n研习社',
  subLines: '大一，开学第二周开始做的\n代码是 AI 写的，我提要求、自己用',
  footer: '软件工程（本科）· 深信息 · 2026-09-23',
  boxes: [
    [654, 176, '01 先想清楚学什么', 16],
    [654, 258, '02 想清楚怎么练', 16],
    [654, 340, '03 自己拿它学，卡手就改', 15],
  ],
  notes: '封面。去除「学习流程我自己设计」等升格表述，改为学生本人的三件事：想清楚学什么、怎么练、自己用着改。',
}));

// --- 02 知识图谱 ---
{
  const b = [];
  b.push(txt(ML, 152, 610, 22, '专业全景 · 六个分支 · 每个分支标注我当前的位置', { size: 12, color: C.mut }));
  b.push(rect(ML, 284, 168, 92, { fill: C.red, stroke: null }));
  b.push(txt(60, 296, 148, 68, '软件工程\n大一 · 开学第二周', { size: 15, bold: true, color: C.paper, lh: 1.4 }));
  const rows = [
    ['01', '编程与算法', 'C 语言 · 数据结构 · 算法', '两样写过题', true],
    ['02', '系统基础', '计组 · 操作系统 · 网络 · 数据库', '还没上到', false],
    ['03', '软件工程方法', '版本控制 · 构建 · 测试 · 交付', '项目让我入门', true],
    ['04', '开发技术', '桌面应用 · 前端 · SVG 可视化', '跟着做过', false],
    ['05', 'AI 与 Agent', 'LLM · Prompt · RAG · Agent', '我的兴趣方向', true],
    ['06', '网络与信息安全', '安全开发 · Web 安全 · 密码学', '还没上到', false],
  ];
  rows.forEach((r, i) => {
    const y = 152 + i * 52;
    b.push(txt(232, y, 34, 26, r[0], { size: 15, color: C.mut, bold: true }));
    b.push(txt(272, y - 2, 200, 26, r[1], { size: 18, bold: true }));
    b.push(txt(272, y + 22, 300, 22, r[2], { size: 12, color: C.mut }));
    b.push(txt(580, y + 2, 84, 24, r[3], { size: 12, color: r[4] ? C.red : C.mut }));
    if (i < rows.length - 1) b.push(hline(232, y + 44, 432, { color: C.rule, width: 0.5 }));
  });
  b.push(vline(700, 152, 312, { color: C.rule, width: 0.5 }));
  b.push(txt(726, 156, 186, 24, '我的真实位置', { size: 12, color: C.mut }));
  b.push(txt(724, 194, 190, 130, '六块里我只写过\n一块半。', { size: 22, bold: true, lh: 1.3 }));
  b.push(txt(724, 296, 190, 140, '一块半 = C 语言（牛客 50\n题）和数据结构（链表的\n增删查改刷过题）。\n其余四块半是 ○ 或 ·。', { size: 14, color: C.mut, lh: 1.45 }));
  b.push(txt(724, 440, 220, 24, '○ 跟做过　· 还没碰过', { size: 11, color: C.red }));
  deckA.push(contentPage(2, '', '我的专业知识图谱', b,
    '六分支专业全景；状态标注为学生本人自评。全部代码为 AI 生成，图上标的是「我学到哪」，不是「我写出过什么」。'));
}

// --- 03 图谱怎么建出来的 ---
{
  const b = [];
  b.push(txt(ML, 152, 700, 24, '我没有去学每一块，只是先把"要学什么"弄清楚。', { size: 16, bold: true }));
  const steps = [
    ['01', '先问自己一个问题', '我这四年到底要学什么？课本目录只讲一门课，讲不了整个专业。'],
    ['02', '把答案分成六块', '按"这东西是干嘛的"分：写程序 / 懂机器 / 做工程 / 做产品 / 搞智能 / 保安全'],
    ['03', '去找每块大概讲什么', '搜"计算机专业核心课程"、看培养方案；课程内容只是初步了解，没真正去学'],
    ['04', '标上我现在在哪', '每块写一句：在学 / 跟着做过 / 还没上到。写不出"会"就不写。'],
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

// --- 04 六个分支里具体有什么 ---
{
  const b = [];
  // ● 学过：真的学过一段时间，能自己写一点
  // ○ 用过：只在项目里跟着做过，或看得懂但写不出
  // · 没学：还没碰过
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
  b.push(txt(ML, 504, 864, 24, '● 学过　　○ 只在项目里跟着做过，或看得懂但写不出　　· 还没碰过', { size: 11, bold: true }));
  deckA.push(contentPage(4, '', '六个分支里具体有什么', b,
    '六个分支的细项为学生自己列的。三级标注：● 学过 / ○ 只在项目里跟做过或看得懂写不出 / · 还没碰过；只有数据结构标为 ●。'));
}

// --- 05 这些认识是从哪来的（真实来源） ---
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
    ['03 软件工程方法', '一个软件从想法到交付的全过程', '看过软件工程课的概要描述', true],
    ['04 开发技术', '把东西做出来给人用', '做这个项目的时候跟着做过', true],
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
  b.push(txt(ML, 466, 864, 26, '说清楚：加底色的三行是我真碰过的；另外三行我只是知道它讲什么，还没学。', { size: 12, color: C.mut }));
  deckA.push(contentPage(5, '', '这些认识是从哪来的', b,
    '六行的「认识从哪来」均为学生自述的真实来源：自己学过的、看过概要描述的、跟着做过的，以及尚未接触的。这一页对应考核任务一里「主动了解专业相关知识」。'));
}

// --- 03 学习过程 ---
{
  const b = [];
  const days = [['09-12', 1], ['09-13', 0], ['09-14', 8], ['09-15', 43], ['09-16', 3], ['09-17', 0], ['09-18', 1]];
  b.push(txt(ML, 152, 560, 22, '开学第二周 · 七日提交曲线 · 共 56 次提交 · 峰值 43 次', { size: 12, color: C.mut }));
  const baseY = 396, maxH = 196, bw = 52;
  days.forEach((d, i) => {
    const x = 56 + i * 78;
    const h = d[1] === 0 ? 2 : Math.max(8, Math.round((d[1] / 43) * maxH));
    const y = baseY - h;
    const peak = d[1] === 43;
    b.push(rect(x, y, bw, h, { fill: peak ? C.red : '#c9c4ba', stroke: null }));
    b.push(txt(x + 2, y - 34, 48, 28, d[1] === 0 ? '—' : String(d[1]), { size: peak ? 22 : 16, bold: true, align: 'center', color: peak ? C.red : C.ink }));
    b.push(txt(x - 14, baseY + 8, 80, 24, d[0], { size: 11, color: C.mut, align: 'center' }));
  });
  b.push(hline(56, baseY, 520, { color: '#a9a49b', width: 0.8 }));
  b.push(txt(ML, 434, 560, 22, '09-13 与 09-17 无提交。', { size: 11, color: C.mut }));
  b.push(vline(620, 152, 300, { color: C.rule, width: 0.5 }));
  const stories = [
    ['01', '开学第五天动手', '9/12 开学第 5 天立项，\n先做了个链表小工具。', false],
    ['02', '主动扩大范围', '发现只覆盖一章没用，\n9/14 重做成全课程平台。', false],
    ['03', '敢加也敢删', '9/16 新增第 07 章，\n判定不达标，主动回退，\n并删除该 Release。', true],
  ];
  stories.forEach((s, i) => {
    const y = 152 + i * 104;
    b.push(txt(640, y, 48, 44, s[0], { size: 26, color: s[3] ? C.red : C.mut }));
    b.push(txt(692, y - 2, 220, 26, s[1], { size: 18, bold: true }));
    b.push(txt(692, y + 28, 220, 70, s[2], { size: 12, color: C.mut, lh: 1.4 }));
    if (i < 2) b.push(hline(640, y + 94, 272, { color: C.rule, width: 0.5 }));
  });
  b.push(txt(640, 434, 272, 24, '第三条分量最重', { size: 12, color: C.red }));
  deckA.push(contentPage(6, '', '这七天我做了什么', b,
    '提交数据来自仓库 git 历史实测；无提交的两天已如实标注。'));
}

// --- 04 我做的四件事 + 五步闭环 ---
{
  const b = [];
  b.push(txt(ML, 152, 300, 22, '代码不是我写的', { size: 11, color: C.red, ls: 1.2 }));
  b.push(txt(ML, 180, 400, 140, '我不会写代码，\n所以我把"怎么学"\n想清楚，让它去做。', { size: 28, bold: true, lh: 1.25 }));
  b.push(txt(60, 344, 380, 96, '整个项目的代码，包括 C 语言\n那些，都是 AI 写的。\n下面这四件事它替不了我。', { size: 13, color: C.mut, lh: 1.5 }));
  b.push(vline(474, 152, 312, { color: C.rule, width: 0.5 }));
  const four = [
    ['01', '想清楚学什么', '照着课程顺序排，先学哪一节后学哪一节'],
    ['02', '想清楚怎么练', '每个模块要三种版本：全注释 / 少注释 / 没注释'],
    ['03', '看不懂就问', '有几处我觉得它讲得不对，回去翻了教材'],
    ['04', '自己拿它学', '哪一步卡住了，我就让它改'],
  ];
  four.forEach((r, i) => {
    const y = 158 + i * 60;
    b.push(rect(508, y, 396, 50, { fill: i === 1 ? C.red : C.box, stroke: i === 1 ? null : '#b3b0a8' }));
    b.push(txt(522, y + 6, 36, 24, r[0], { size: 14, color: i === 1 ? C.paper : C.mut, bold: true }));
    b.push(txt(560, y + 4, 330, 26, r[1], { size: 17, bold: true, color: i === 1 ? C.paper : C.ink }));
    b.push(txt(560, y + 28, 330, 22, r[2], { size: 11, color: i === 1 ? C.paper : C.mut }));
  });
  b.push(txt(ML, 462, 420, 22, '三种注释版本是我提的，这条最关键。', { size: 12, color: C.red }));
  b.push(txt(508, 462, 400, 22, '我自己练的顺序：读一遍 → 遮掉注释 → 默写 → 编译 → 对教材', { size: 11, color: C.mut }));
  deckA.push(contentPage(7, '', '我做的四件事', b,
    '明确交代：全部代码为 AI 生成。四件事为学生的真实角色——想清楚学什么与怎么练、遇疑去查、自己使用并提改进。'));
}

// --- 05 改一次东西要跑几个地方 ---
{
  const b = [];
  const steps = [
    ['01', '内容', 'resources', 'C 代码和注释放这儿，只改这一份'],
    ['02', '整理成数据', 'data', '跑一条命令，把代码拆成模块和三档注释'],
    ['03', '生成动画', 'docs/animations', '再跑一条，出来 188 段动画'],
    ['04', '变成能用的东西', 'exe 和网页', '最后跑一条，打包成便携版和在线版'],
  ];
  steps.forEach((L, i) => {
    const y = 156 + i * 70;
    b.push(rect(ML, y, 52, 50, { fill: C.red, stroke: null }));
    b.push(txt(56, y + 13, 44, 28, L[0], { size: 17, bold: true, color: C.paper }));
    b.push(txt(116, y + 2, 160, 28, L[1], { size: 18, bold: true }));
    b.push(txt(116, y + 30, 190, 24, L[2], { size: 12, color: C.mut }));
    b.push(txt(320, y + 14, 350, 28, L[3], { size: 13, color: C.mut }));
  });
  b.push(hline(ML, 436, 620, { color: '#a9a49b', width: 0.8 }));
  b.push(txt(ML, 446, 620, 26, '每次改完跑一下检查，10738 条，有问题立刻知道。', { size: 12, color: C.mut }));
  b.push(vline(700, 152, 312, { color: C.rule, width: 0.5 }));
  b.push(txt(726, 156, 186, 24, '我做这个的来由', { size: 12, color: C.mut }));
  b.push(txt(724, 192, 200, 46, '改漏过好几次', { size: 26, bold: true, color: C.red }));
  b.push(txt(724, 248, 200, 120, '一开始网页、动画、文档\n是三份，改一处得手动\n把另外两处也改掉。\n我好几次改了一半就忘了。', { size: 14, color: C.mut, lh: 1.5 }));
  b.push(hline(700, 378, 212, { color: C.rule, width: 0.5 }));
  b.push(txt(724, 390, 200, 90, '我就提了一句：能不能\n只改一份，别的自己跟\n着变。具体怎么实现是\nAI 的事。', { size: 14, lh: 1.5 }));
  deckA.push(contentPage(8, '', '改一次东西，要跑几个地方', b,
    '标题与措辞避开架构术语。右侧如实写明：学生只提出「只改一份、其余自动跟进」这个要求，实现由 AI 完成。'));
}

// --- 06 成果与质量门 ---
{
  const b = [];
  b.push(txt(ML, 160, 280, 24, '指标', { size: 11, color: C.mut }));
  b.push(txt(370, 160, 170, 24, '实测值', { size: 11, color: C.mut }));
  b.push(txt(540, 160, 370, 24, '说明', { size: 11, color: C.mut }));
  b.push(hline(ML, 186, 864, { color: '#c3bfb7' }));
  const rows = [
    ['Git 提交', '56', '7 天内完成，峰值一天 43 次', false],
    ['C 源文件', '175', '58 个 .c 与 81 个 .h', false],
    ['覆盖模块', '214', '25 节全课程，不是单章', false],
    ['生成动画', '188', 'SMIL 自动生成，可嵌入 README', false],
    ['自动化检查', '10738', '一条命令跑完，失败 0 个', true],
    ['构建脚本', '3342 行', '20 个脚本的工具链', false],
    ['已发版本', '6', 'v1.0.0 至 v2.1.3，均带 Release', false],
  ];
  rows.forEach((r, i) => {
    const y = 198 + i * 36;
    if (r[3]) {
      b.push(rect(ML, y - 6, 864, 34, { fill: C.band, stroke: null }));
      b.push(rect(ML, y - 6, 3, 34, { fill: C.ink, stroke: null }));
    }
    b.push(txt(60, y, 280, 28, r[0], { size: 17, bold: true }));
    b.push(txt(370, y - 4, 160, 32, r[1], { size: 24, bold: true, color: r[3] ? C.red : C.ink }));
    b.push(txt(540, y + 2, 370, 26, r[2], { size: 13, color: C.mut }));
  });
  b.push(hline(ML, 456, 864, { color: '#c3bfb7' }));
  b.push(txt(ML, 466, 864, 24, '质量门不是「我觉得对」，是 10738 条断言全过——敢连发 6 个版本靠的就是它。', { size: 12, color: C.mut }));
  deckA.push(contentPage(9, '', '现在做出来什么样', b,
    '全部指标来自仓库与构建产物实测，无估算。'));
}

// --- 07 我做这个的来由 ---
{
  const b = [];
  b.push(txt(ML, 152, 560, 24, '从"我想学"到"我试了一下"，中间是这么走的', { size: 12, color: C.mut }));
  const chain = [
    ['01', '想学会数据结构', '看得懂但写不出，\n就自己做了个工具练', false],
    ['02', '顺手攒下 186 模块', '一边学一边做，\n内容就攒在这儿了', false],
    ['03', '六块里对 AI 最感兴趣', '平时本来就在用\n大模型', false],
    ['04', '拿它试了个小实验', '把现成的模块喂给\n模型，让它照着答', true],
  ];
  chain.forEach((s, i) => {
    const x = 48 + i * 200;
    const hot = s[3];
    b.push(rect(x, 180, 184, 104, { fill: hot ? C.red : C.box, stroke: hot ? null : '#b3b0a8' }));
    b.push(txt(x + 12, 190, 160, 22, s[0], { size: 12.5, color: hot ? C.paper : C.mut }));
    b.push(txt(x + 12, 212, 162, 46, s[1], { size: 15, bold: true, color: hot ? C.paper : C.ink, lh: 1.3 }));
    b.push(txt(x + 12, 248, 160, 30, s[2], { size: 10.5, color: hot ? C.paper : C.mut, lh: 1.3 }));
    if (i < chain.length - 1) b.push(txt(x + 184, 220, 16, 24, '→', { size: 14, color: C.mut, align: 'center' }));
  });
  b.push(txt(ML, 296, 500, 26, '说清楚 · 我不是在给 Agent 铺路', { size: 16, bold: true }));
  b.push(txt(ML, 328, 864, 30, '那 186 个模块是学数据结构顺手攒下来的，不是因为要做 Agent 才去建的。', { size: 14, color: C.mut }));
  b.push(txt(ML, 354, 864, 30, '检索那个小实验做得也一般，有时候搜不准。我只做了检索这一半，生成是调现成的接口。', { size: 14, color: C.mut }));
  b.push(txt(ML, 396, 500, 26, '接下来想做的事', { size: 16, bold: true }));
  const nx = [
    ['01', '把那个检索工具做好用一点', '现在搜不准，我想先把这块弄明白'],
    ['02', '继续把数据结构学下去', '图、排序、散列我自己还没学到'],
    ['03', '还想试试让检查自动跑', '现在是每次自己手动跑一遍'],
  ];
  nx.forEach((s, i) => {
    const y = 424 + i * 30;
    b.push(txt(ML, y, 40, 26, s[0], { size: 14, color: C.red, bold: true }));
    b.push(txt(88, y, 330, 26, s[1], { size: 15, bold: true }));
    b.push(txt(430, y + 2, 480, 24, s[2], { size: 12, color: C.mut }));
  });
  deckA.push(contentPage(10, '', '我做这个的来由', b,
    '四步按真实时间顺序：先为学数据结构而做，内容逐年攒下，兴趣在 AI，最后才顺手做了检索实验。并明确写出「不是为 Agent 铺路」。'));
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
