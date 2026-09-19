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
function loadChunks() {
  const tree = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'tree.json'), 'utf8'));
  const chunks = [];
  for (const ch of tree.chapters) {
    for (const sec of ch.sections) {
      let code = {};
      const codeFile = path.join(ROOT, 'data', 'code', `${sec.id}.json`);
      if (fs.existsSync(codeFile)) {
        code = JSON.parse(fs.readFileSync(codeFile, 'utf8')).modules || {};
      }
      let anims = {};
      const animFile = path.join(ROOT, 'data', 'animations', `${sec.id}.json`);
      if (fs.existsSync(animFile)) {
        anims = JSON.parse(fs.readFileSync(animFile, 'utf8')).animations || {};
      }
      for (const mod of sec.modules || []) {
        const body = code[mod.id] || {};
        const detail = (body.modes && body.modes.detail) || '';
        const scaffold = body.scaffold || '';
        const anim = anims[mod.id];
        const animText = anim && anim.steps
          ? anim.steps.map((s) => s.text || '').filter(Boolean).join('；')
          : '';
        chunks.push({
          id: mod.id,
          section: `${sec.id} ${sec.title}`,
          chapter: `${ch.id} ${ch.title}`,
          title: mod.title,
          summary: mod.summary || '',
          difficulty: mod.difficulty,
          deps: mod.depLabels || [],
          detail,
          scaffold,
          animText,
        });
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
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, k)
    .map(([i, s]) => ({ chunk: chunks[i], score: Math.round(s * 10) / 10 }));
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
