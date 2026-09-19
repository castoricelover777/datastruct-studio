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
  kicker: 'RESEARCH INSTITUTE / FIRST REVIEW',
  title: '我不会写代码，但我知道该怎么学',
  bigLines: '数据结构\n研习社',
  subLines: '大一新生 · 开学第二周动手\n代码全部 AI 生成 · 学习流程我自己设计',
  footer: '软件工程（本科）· 深信息 · 2026-09-23',
  boxes: [
    [654, 176, '01 / 定学什么', 16],
    [654, 258, '02 / 定怎么学', 16],
    [654, 340, '03 / 看不懂就弄懂', 16],
  ],
  notes: '封面。开场第一句即交代：所有代码为 AI 生成。三个盒子=我做的三件事，取代原来的技术流水线。',
}));

// --- 02 知识图谱 ---
{
  const b = [];
  b.push(txt(ML, 152, 610, 22, '专业全景 · 六个分支 · 每个分支标注我当前的位置', { size: 12, color: C.mut }));
  b.push(rect(ML, 284, 168, 92, { fill: C.red, stroke: null }));
  b.push(txt(60, 296, 148, 68, '软件工程\n大一 · 开学第二周', { size: 15, bold: true, color: C.paper, lh: 1.4 }));
  const rows = [
    ['01', '编程与算法', 'C 语言 · 数据结构 · 算法', '在学', true],
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
  b.push(txt(724, 194, 190, 130, '图上我连一个\n「已掌握」\n都不敢标。', { size: 22, bold: true, lh: 1.3 }));
  b.push(txt(724, 296, 190, 130, '这不是短板，\n是起点——\n我知道每一块\n大概什么时候学。', { size: 16, color: C.mut, lh: 1.4 }));
  b.push(txt(724, 434, 220, 24, '兴趣方向已经明确', { size: 12, color: C.red }));
  deckA.push(contentPage(2, 'PROFESSIONAL KNOWLEDGE MAP', '我的专业知识图谱', b,
    '六分支专业全景；状态标注为学生本人自评。全部代码为 AI 生成，图上标的是「我学到哪」，不是「我写出过什么」。'));
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
  deckA.push(contentPage(3, 'LEARNING PROCESS · COMMIT HISTORY', '学习过程：7 天 56 次提交', b,
    '提交数据来自仓库 git 历史实测；无提交的两天已如实标注。'));
}

// --- 04 我做的四件事 + 五步闭环 ---
{
  const b = [];
  b.push(txt(ML, 152, 300, 22, '代码不是我写的', { size: 11, color: C.red, ls: 1.2 }));
  b.push(txt(ML, 180, 400, 140, '不会写代码，\n那就把「怎么学」\n设计出来。', { size: 28, bold: true, lh: 1.25 }));
  b.push(txt(60, 344, 380, 96, '项目里所有代码，包括 C 语言\n代码，全部由 AI 生成。\n下面四件事是代码替不了的。', { size: 13, color: C.mut, lh: 1.5 }));
  b.push(vline(474, 152, 312, { color: C.rule, width: 0.5 }));
  const four = [
    ['01', '定学什么', '按课程顺序规划 25 节、214 个模块的次序'],
    ['02', '定怎么学', '每个模块要三种注释版本：全 / 精简 / 无'],
    ['03', '看不懂就弄懂', '发现过它写得不对的地方，回去比对教材'],
    ['04', '固定成流程', '做成能一直用的东西，后面每节照着走'],
  ];
  four.forEach((r, i) => {
    const y = 158 + i * 60;
    b.push(rect(508, y, 396, 50, { fill: i === 1 ? C.red : C.box, stroke: i === 1 ? null : '#b3b0a8' }));
    b.push(txt(522, y + 6, 36, 24, r[0], { size: 14, color: i === 1 ? C.paper : C.mut, bold: true }));
    b.push(txt(560, y + 4, 330, 26, r[1], { size: 17, bold: true, color: i === 1 ? C.paper : C.ink }));
    b.push(txt(560, y + 28, 330, 22, r[2], { size: 11, color: i === 1 ? C.paper : C.mut }));
  });
  b.push(txt(ML, 452, 400, 22, '「三种注释版本」是这套东西的核心。', { size: 12, color: C.red }));
  b.push(txt(508, 452, 400, 22, '五步闭环：分块读 → 遮注释 → 默写 → 编译 → 对照', { size: 11, color: C.mut }));
  deckA.push(contentPage(4, 'WHAT AI CANNOT DO FOR ME', '我做的四件事', b,
    '明确交代：全部代码为 AI 生成。四件事是学生本人所做的设计与判断，也是本次汇报的立论。'));
}

// --- 05 架构 ---
{
  const b = [];
  const layers = [
    ['01', '真源层', ['resources', '58 个 .c 与 81 个 .h', '代码全部 AI 生成'], false],
    ['02', '数据层', ['data', '模块 · 三档注释 · 元数据', '所有渲染的唯一输入'], false],
    ['03', '动画层', ['docs/animations', '188 段 SMIL 动画', '由中间层纯计算生成'], false],
    ['04', '交付层', ['便携 exe 与在线版', 'electron-builder 打包', 'GitHub Pages 静态托管'], false],
  ];
  layers.forEach((L, i) => {
    const y = 152 + i * 66;
    b.push(rect(ML, y, 60, 48, { fill: C.red, stroke: null }));
    b.push(txt(52, y + 10, 52, 28, L[0], { size: 18, bold: true, color: C.paper }));
    b.push(txt(124, y + 1, 176, 28, L[1], { size: 18, bold: true }));
    b.push(txt(124, y + 29, 200, 24, L[2][0], { size: 12, color: C.mut }));
    b.push(txt(340, y + 2, 330, 26, L[2][1], { size: 12 }));
    b.push(txt(340, y + 30, 330, 24, L[2][2], { size: 11, color: C.mut }));
  });
  b.push(hline(ML, 424, 592, { color: '#a9a49b', width: 0.8 }));
  b.push(txt(ML, 434, 610, 24, '四条命令串起全链：build-data → make-animations → build-web → verify', { size: 11, color: C.mut }));
  b.push(vline(672, 152, 312, { color: C.rule, width: 0.5 }));
  b.push(txt(700, 152, 212, 22, '我踩过的坑', { size: 12, color: C.mut }));
  b.push(txt(700, 184, 220, 46, '一份真源', { size: 28, bold: true, color: C.red }));
  b.push(txt(700, 236, 212, 90, 'C 文件是唯一一份，\n文档、动画、网页\n都从它生成。', { size: 14, color: C.mut, lh: 1.4 }));
  b.push(hline(700, 326, 212, { color: C.rule, width: 0.5 }));
  b.push(txt(700, 338, 212, 130, '一开始不是这样。\n改一次代码要改三个\n地方，改漏了好几次。\n这套走法是我定的，\n实现是 AI 写的。', { size: 14, lh: 1.4 }));
  deckA.push(contentPage(5, 'ARCHITECTURE · FOUR LAYERS', '我的文件是怎么走的', b,
    '四层流水线。「一份真源」是学生踩坑后提出的做法，代码实现为 AI 生成——图中已如实标注。'));
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
  deckA.push(contentPage(6, 'RESULTS AND QUALITY GATE', '成果与质量门', b,
    '全部指标来自仓库与构建产物实测，无估算。'));
}

// --- 07 从框架到方向 ---
{
  const b = [];
  b.push(txt(ML, 152, 500, 24, '为什么是 Agent 方向 · 一条推导链', { size: 12, color: C.mut }));
  const chain = [
    ['01', '画完六分支', '强项与短板都看清了', false],
    ['02', '选 Agent 方向', '门槛是代码 + API + 循环', false],
    ['03', '先建知识库', 'Agent 的上限取决于上下文', false],
    ['04', '已建成 214 模块', 'RAG 检索那一半已完成', true],
  ];
  chain.forEach((s, i) => {
    const x = 48 + i * 200;
    const hot = s[3];
    b.push(rect(x, 184, 184, 92, { fill: hot ? C.red : C.box, stroke: hot ? null : '#b3b0a8' }));
    b.push(txt(x + 12, 194, 160, 22, s[0], { size: 13, color: hot ? C.paper : C.mut }));
    b.push(txt(x + 12, 216, 160, 26, s[1], { size: 17, bold: true, color: hot ? C.paper : C.ink }));
    b.push(txt(x + 12, 244, 160, 28, s[2], { size: 11, color: hot ? C.paper : C.mut, lh: 1.25 }));
    if (i < chain.length - 1) b.push(txt(x + 184, 220, 16, 24, '→', { size: 14, color: C.mut, align: 'center' }));
  });
  b.push(txt(ML, 292, 400, 26, '下一步 · 三件事', { size: 16, bold: true }));
  const nx = [
    ['01', '把检索层接上 LLM 生成层', '214 个模块天然是分好块的语料'],
    ['02', '接 GitHub Actions', '让 10738 条检查在每次提交自动跑'],
    ['03', '补可访问性', '键盘操作与屏幕阅读器，188 段动画目前不可及'],
  ];
  nx.forEach((s, i) => {
    const y = 324 + i * 44;
    b.push(txt(ML, y, 40, 26, s[0], { size: 16, color: C.red, bold: true }));
    b.push(txt(92, y, 400, 28, s[1], { size: 17, bold: true }));
    b.push(txt(510, y + 3, 400, 26, s[2], { size: 12, color: C.mut }));
    if (i < 2) b.push(hline(ML, y + 36, 864, { color: C.rule, width: 0.5 }));
  });
  b.push(hline(ML, 462, 864, { color: '#a9a49b', width: 0.8 }));
  b.push(txt(ML, 470, 864, 24, '权威来源：陈越《数据结构》教材与课程 · 项目中的真实缺陷复盘', { size: 11, color: C.mut }));
  deckA.push(contentPage(7, 'FROM MAP TO DIRECTION', '从知识框架走到我选的方向', b,
    '推导链把任务一的知识框架与任务二的项目连接起来；三步为真实的后续计划。'));
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
