#!/usr/bin/env node
'use strict';
/**
 * rag.js —— 极小的 RAG 演示：检索层 + 生成层
 *
 *   检索（R）：把项目已经生成的 data/ 读成 214 个 chunk，建倒排索引，按相关度取前 K 个
 *   生成（G）：把命中的 chunk 拼进 prompt，调 DeepSeek 回答，并要求标注来源模块编号
 *
 * 用法：
 *   node rag.js "指针和引用有什么区别"        # 检索 + 生成
 *   node rag.js --no-llm "二叉树的遍历"        # 只检索（无网/无 key 时自动降级）
 *   node rag.js                                # 交互式，回车空行退出
 *
 * 环境变量：
 *   DEEPSEEK_API_KEY=sk-xxxx                   # 不设置则自动降级为纯检索
 *
 * 注意：这是 RAG，不是 Agent。它是一条固定管线：一次检索、一次生成。
 *      Agent 需要能在循环里自主决定调什么工具并根据结果调整路径。
 */

const fs = require('fs');
const path = require('path');

// 知识库根目录：默认本脚本的上一级（= 仓库根）。
// 可用 --root=<路径> 或环境变量 DS_ROOT 指定别处，例如：
//   node rag.js --root="E:\deepseek\linklist-studio" "二叉树的遍历"
function findRoot() {
  const arg = process.argv.find((a) => a.startsWith('--root='));
  const cand = [
    arg && arg.slice(7),
    process.env.DS_ROOT,
    path.join(__dirname, '..'),
    process.cwd(),
    path.join(process.cwd(), 'linklist-studio'),
  ].filter(Boolean);
  for (const c of cand) {
    try {
      if (fs.existsSync(path.join(c, 'data', 'tree.json'))) return c;
    } catch { /* 忽略 */ }
  }
  return null;
}

const ROOT = findRoot();
if (!ROOT) {
  console.error('找不到知识库（需要 data/tree.json）。');
  console.error('请用 --root 指定仓库位置，例如：');
  console.error('  node rag.js --root="E:\\deepseek\\linklist-studio" "二叉树的遍历"');
  process.exit(1);
}

const API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';
const TOP_K = 3;
const CTX_CHARS = 900;          // 每个 chunk 送进 prompt 的最大字符数

// ---------------------------------------------------------------- ① 加载
//
// 模块清单从 data/chapters/*.json 读，不从 data/tree.json 读 ——
// tree.json 是**索引**：大模块（02-02 链表）在它里面只有 views 的
// moduleCount，没有模块详情。从 tree 读的后果是链表那一节 26 个模块
// 全部进不了知识库，而且不报错，表现为"查链表什么都搜不到"。
// chapters 里 sec.modules 和每个 view 的 modules 都是完整的，两边都要走。
function loadChunks() {
  const CHAPTERS = path.join(ROOT, 'data', 'chapters');
  const chunks = [];
  const chapterFiles = fs.readdirSync(CHAPTERS).filter((f) => f.endsWith('.json')).sort();

  for (const cf of chapterFiles) {
    const chapter = JSON.parse(fs.readFileSync(path.join(CHAPTERS, cf), 'utf8'));
    for (const sec of chapter.sections || []) {
      let code = {};
      let viewCode = {};
      const codeFile = path.join(ROOT, 'data', 'code', `${sec.id}.json`);
      if (fs.existsSync(codeFile)) {
        const parsed = JSON.parse(fs.readFileSync(codeFile, 'utf8'));
        code = parsed.modules || {};
        viewCode = parsed.views || {};
      }
      let anims = {};
      const animFile = path.join(ROOT, 'data', 'animations', `${sec.id}.json`);
      if (fs.existsSync(animFile)) {
        anims = JSON.parse(fs.readFileSync(animFile, 'utf8')).animations || {};
      }

      const push = (mod, body, sectionLabel) => {
        const anim = anims[mod.id];
        chunks.push({
          id: mod.id,
          section: sectionLabel,
          chapter: `${chapter.id} ${chapter.title}`,
          title: mod.title || mod.key || mod.id,
          summary: mod.summary || '',
          difficulty: mod.difficulty,
          deps: mod.depLabels || [],
          detail: (body.modes && body.modes.detail) || '',
          scaffold: body.scaffold || '',
          animText: anim && anim.steps
            ? anim.steps.map((s) => s.text || '').filter(Boolean).join('；')
            : '',
        });
      };

      // 普通节：模块直接在 sec.modules 里
      for (const mod of sec.modules || []) push(mod, code[mod.id] || {}, `${sec.id} ${sec.title}`);

      // 大模块：模块在 views[].modules 里，section 名字带上视图名，
      // 这样"单链表""双链表"也能作为检索词命中
      for (const v of sec.views || []) {
        const vs = viewCode[v.id] || {};
        const label = `${sec.id} ${sec.title} · ${v.title}`;
        for (const mod of v.modules || []) push(mod, vs[mod.id] || {}, label);
      }
    }
  }
  return chunks;
}

// ------------------------------------------------- ② 倒排索引（检索的地基）
// 英文与数字按词切；中文切成单字 + 相邻二元组。
// 二元组是关键：只按单字切，"树" 这种高频字会把无关模块顶上来；
// 有了二元组，"遍历""指针""队列" 才能作为整体参与打分。
const STOP = new Set(['的', '了', '是', '在', '和', '与', '有', '什', '么', '怎', '样',
  '哪', '些', '这', '那', '一', '个', '为', 'what', 'is', 'the', 'a', 'how', 'and', 'of', 'to']);

function tokenize(text) {
  const out = new Set();
  const lower = String(text).toLowerCase();
  const cjk = [];
  for (const m of lower.matchAll(/[a-z_][a-z0-9_]{1,}|[0-9]+|[\u4e00-\u9fa5]/g)) {
    const t = m[0];
    if (/[\u4e00-\u9fa5]/.test(t)) { cjk.push(t); continue; }
    if (!STOP.has(t)) out.add(t);
  }
  for (let i = 0; i < cjk.length; i++) {
    if (!STOP.has(cjk[i])) out.add(cjk[i]);
    if (i + 1 < cjk.length) {
      const bi = cjk[i] + cjk[i + 1];
      out.add(bi);
    }
  }
  return out;
}

function buildIndex(chunks) {
  const FIELDS = [
    ['section', 5],     // 节标题：用户多半是照着节名查的（"快速排序""拓扑排序"）
    ['chapter', 3],     // 章标题
    ['title', 6],
    ['summary', 3],
    ['animText', 1],
    ['detail', 0.25],   // 代码正文极长，权重必须压低，否则会淹没标题信号
  ];
  const index = new Map();
  chunks.forEach((c, i) => {
    for (const [field, weight] of FIELDS) {
      const text = c[field];
      if (!text) continue;
      for (const tok of tokenize(text)) {
        if (!index.has(tok)) index.set(tok, new Map());
        const m = index.get(tok);
        // 同一词在同一 chunk 内重复出现只算一次，按字段权重计分
        if (!m.has(i)) m.set(i, weight);
      }
    }
  });
  return index;
}

// ------------------------------------------------- KMP（模式匹配）
//
// 倒排索引只回答"这个词在不在这个模块里"，不管出现几次、出现在哪。
// 所以粗筛之后还要在候选里数一遍真实出现次数，把"只是提了一嘴"和
// "整段都在讲它"区分开 —— 这一步用 KMP。
//
// 为什么不用 indexOf 循环：那种写法最坏是 O(n*m)（每失配就回退重来），
// KMP 靠一张 next 表记住"失配后该从哪继续比"，做到 O(n+m)。
// 这正是数据结构课里字符串那一章讲的东西。

/**
 * 求模式串的 next 表。
 * next[i] = 前 i 个字符里，最长的"既是前缀又是后缀"的长度。
 * 它就是 KMP 不用回退主串的原因。
 */
function buildNext(pattern) {
  const m = pattern.length;
  const next = new Array(m).fill(0);
  let len = 0;          // 当前已匹配的前后缀长度
  let i = 1;
  while (i < m) {
    if (pattern[i] === pattern[len]) {
      len++;
      next[i] = len;
      i++;
    } else if (len > 0) {
      // 失配就退到次长的前后缀继续试 —— 主串指针不动
      len = next[len - 1];
    } else {
      next[i] = 0;
      i++;
    }
  }
  return next;
}

/** 在主串 text 里数出 pattern 出现了几次（可重叠） */
function kmpCount(text, pattern) {
  if (!pattern || !text) return 0;
  const n = text.length;
  const m = pattern.length;
  if (m > n) return 0;
  const next = buildNext(pattern);
  let count = 0;
  let j = 0;            // 模式串上已匹配的长度
  for (let i = 0; i < n; i++) {
    while (j > 0 && text[i] !== pattern[j]) j = next[j - 1];
    if (text[i] === pattern[j]) j++;
    if (j === m) {
      count++;
      // 允许重叠：退到次长前后缀再继续找
      j = next[j - 1];
    }
  }
  return count;
}

function retrieve(query, chunks, index, k = TOP_K) {
  const q = tokenize(query);
  const score = new Map();
  for (const tok of q) {
    const hits = index.get(tok);
    if (!hits) continue;
    for (const [i, weight] of hits) {
      score.set(i, (score.get(i) || 0) + weight);
    }
  }

  // 粗筛：先取比 k 多几倍的候选，留给 KMP 精筛的余地
  const rough = [...score.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, Math.max(k * 4, 20));

  // 精筛：用 KMP 在候选的标题类文本里数每个查询词真实出现几次。
  // 三个加权规则：
  //   · 出现次数按 log 压一下 —— 出现 10 次不等于重要 10 倍
  //   · **词越长越具体，权重越高** —— "快速排序"比"排序"值钱得多
  //   · 越"大"的标题越有分量：章节标题 > 模块标题 > 一句话作用
  const FIELD = [
    ['chapter', 4],        // 章标题：用户查"排序"多半是在找那一章
    ['section', 5],        // 节标题：查"快速排序"命中的就是这一节
    ['title', 3],          // 模块标题
    ['summary', 1.5],      // 一句话作用
  ];
  const refined = rough.map(([i, base]) => {
    const c = chunks[i];
    let bonus = 0;
    for (const tok of q) {
      if (tok.length < 2) continue;        // 单字太泛，不参与精筛
      // 长度乘子：2 字词 1.0，3 字 1.4，4 字及以上 1.8
      const lenW = tok.length >= 4 ? 1.8 : tok.length === 3 ? 1.4 : 1.0;
      for (const [field, w] of FIELD) {
        const text = (c[field] || '').toLowerCase();
        if (!text) continue;
        const n = kmpCount(text, tok);
        if (n > 0) bonus += w * lenW * (1 + Math.log(n));
      }
    }
    return {
      chunk: c,
      score: Math.round((base + bonus) * 10) / 10,
      base: Math.round(base * 10) / 10,
      bonus: Math.round(bonus * 10) / 10,
    };
  });

  return refined
    .sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id))
    .slice(0, k);
}

// ---------------------------------------------------------------- ③ 生成
async function generate(query, hits) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    return '[降级] 未设置 DEEPSEEK_API_KEY，跳过生成层。\n' +
           '       设置方式（PowerShell）：$env:DEEPSEEK_API_KEY="sk-xxxx"\n' +
           '       这一步是 RAG 的 G，上面三条命中就是 R。';
  }
  const ctx = hits.map((h) => {
    const c = h.chunk;
    return `【${c.id}】${c.title}\n${c.summary}\n${c.detail.slice(0, CTX_CHARS)}`;
  }).join('\n\n');

  const prompt =
    '你是数据结构助教。只根据下面的资料回答问题。\n' +
    '要求：1) 只讲资料里有的内容，没有的就说「资料中没有」；' +
    '2) 回答末尾用一行注明引用了哪些模块编号。\n\n' +
    `资料：\n${ctx}\n\n问题：${query}`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    return `[生成层失败] HTTP ${res.status} ${(await res.text()).slice(0, 200)}`;
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

// ---------------------------------------------------------------- ④ 串联
async function answer(query, chunks, index, useLlm) {
  const hits = retrieve(query, chunks, index);
  console.log(`\n[检索] 命中 ${hits.length} 个模块：`);
  for (const h of hits) {
    const c = h.chunk;
    console.log(`   · ${c.id}  ${c.title}   （相关度 ${h.score}，难度 ${c.difficulty}）`);
    console.log(`     ${c.chapter} / ${c.section}`);
  }
  if (!hits.length) {
    console.log('   （没有命中。换个说法，或先确认 data/ 已经生成）');
    return;
  }
  if (!useLlm) return;
  console.log('\n[生成] 调用 DeepSeek…');
  console.log('─'.repeat(64));
  console.log(await generate(query, hits));
  console.log('─'.repeat(64));
  console.log('[来源] ' + hits.map((h) => h.chunk.id).join(' / '));
}

async function main() {
  const argv = process.argv.slice(2);
  const useLlm = !argv.includes('--no-llm');
  const qs = argv.filter((a) => !a.startsWith('--'));

  const chunks = loadChunks();
  const index = buildIndex(chunks);
  console.log(`知识库：${ROOT}`);
  console.log(`已就绪：${chunks.length} 个模块 chunk，${index.size} 个索引词条`);

  if (qs.length) {
    await answer(qs.join(' '), chunks, index, useLlm);
    return;
  }
  const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
  for (;;) {
    const q = await new Promise((r) => rl.question('\n问点什么（直接回车退出）：', r));
    if (!q.trim()) break;
    await answer(q.trim(), chunks, index, useLlm);
  }
  rl.close();
}

main().catch((e) => { console.error('出错：', e.message); process.exit(1); });
