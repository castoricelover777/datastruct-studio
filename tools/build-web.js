'use strict';
/**
 * LinkList Studio —— Web 版构建
 * ---------------------------------------------------------------------------
 * 桌面版的渲染层（highlight / diff / editor）本来就是浏览器代码，Web 版直接复用，
 * 这里只做三件事：
 *
 *   1. 把两本教材的参考代码解析成模块数据（含三档注释、脚手架）；
 *   2. **用本机 gcc 真跑一遍每个模块的"脚手架 + 答案"**，把标准输出存进数据 ——
 *      浏览器里没有 C 编译器，Web 版无法真的编译，所以"运行结果"必须是
 *      构建时真跑出来的，而不是编造的；
 *   3. 把复用文件和模块数据落到 docs/app/ 下。
 *
 *   node tools/build-web.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const P = require('../shared/parse');

const ROOT = path.join(__dirname, '..');
const REF = path.join(ROOT, 'resources', 'reference');
const DOCS = path.join(ROOT, 'docs');
const APP = path.join(DOCS, 'app');
const TMP = path.join(ROOT, 'build-cache', 'webgen');

const BOOKS = [
  {
    id: 'singly', name: '单链表', subtitle: '带头结点 · 8 个基础操作',
    dir: 'singly',
    parts: ['part1_basics.c', 'part2_search.c', 'part3_io.c'],
  },
  {
    id: 'doubly', name: '双向链表', subtitle: 'DuLinkList · 增删查改',
    dir: 'doubly',
    parts: ['part1_basics.c', 'part2_build.c', 'part3_search.c', 'part4_insertdelete.c', 'part5_io.c'],
  },
];

function findCompiler() {
  for (const c of ['gcc', path.join('E:', 'w64devkit', 'bin', 'gcc.exe'), path.join('C:', 'mingw64', 'bin', 'gcc.exe')]) {
    try {
      execFileSync(c, ['--version'], { stdio: 'ignore' });
      return c;
    } catch { /* 下一个 */ }
  }
  return null;
}

/** 用 gcc 跑一段完整程序，返回 stdout（失败返回 null） */
function runProgram(gcc, source, tag) {
  fs.mkdirSync(TMP, { recursive: true });
  const src = path.join(TMP, `${tag}.c`);
  const exe = path.join(TMP, `${tag}.exe`);
  fs.writeFileSync(src, source, 'utf8');
  try {
    execFileSync(gcc, ['-std=c11', src, '-o', exe], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000 });
    const out = execFileSync(exe, [], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 8000, encoding: 'utf8' });
    return out.replace(/\r\n/g, '\n').trimEnd();
  } catch {
    return null;
  }
}

/** 扫描已生成的动画，建立 模块 → 动画文件 的映射 */
function mapAnimations() {
  const dir = path.join(DOCS, 'animations');
  const map = new Map();
  if (!fs.existsSync(dir)) return map;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.svg')) continue;
    const base = f.replace(/\.svg$/, '');
    // 场景 id 形如 singly-04-applist / doubly-09-ListInsert
    const m = /^(singly|doubly)-(\d{2})-/.exec(base);
    if (m) map.set(`${m[1]}:${m[2]}`, `animations/${f}`);
  }
  return map;
}

function main() {
  fs.mkdirSync(APP, { recursive: true });
  const gcc = findCompiler();
  console.log(gcc ? `使用编译器：${gcc}` : '⚠ 没找到 gcc —— "参考实现的运行结果"这一项会是空的');
  const anim = mapAnimations();
  console.log(`找到 ${anim.size} 个动画文件`);

  const books = [];

  for (const book of BOOKS) {
    const dir = path.join(REF, book.dir);
    const sources = book.parts.map((f) => ({ name: f, text: fs.readFileSync(path.join(dir, f), 'utf8') }));
    sources.push({ name: 'drivers.c', text: fs.readFileSync(path.join(dir, 'drivers.c'), 'utf8') });
    const { modules, drivers } = P.parse(sources);

    const byId = new Map(modules.map((m) => [m.id, m]));
    const payload = [];
    let withOutput = 0;

    for (const m of modules) {
      // 每个模块的"标准输出"：把脚手架填上参考实现，再用 gcc 真跑一遍
      let expectedOutput = null;
      if (gcc) {
        const filled = P.buildScaffold(modules, drivers, m.id, { fillCode: m.code });
        expectedOutput = runProgram(gcc, filled, `${book.id}-${m.id}`);
        if (expectedOutput) withOutput++;
      }
      payload.push({
        id: m.id,
        key: m.key,
        title: m.title,
        summary: m.summary,
        difficulty: m.difficulty,
        deps: m.deps,
        depLabels: m.deps.map((d) => {
          const t = byId.get(d);
          return t ? (/^[A-Za-z_]\w*$/.test(t.key) ? t.key : '结构体定义') : d;
        }),
        modes: m.modes,
        codeLineCount: m.codeLineCount,
        isAssembly: false,
        hasPractice: true,
        scaffold: P.buildScaffold(modules, drivers, m.id),
        expectedOutput,
        animation: anim.get(`${book.id}:${m.id}`) || null,
      });
    }

    // 完整源码（拼装视图）
    const lastId = modules[modules.length - 1].id;
    const asmId = String(parseInt(lastId, 10) + 1).padStart(2, '0');
    payload.push({
      id: asmId,
      key: '完整源码',
      title: '完整源码（拼装视图）',
      summary: `把上面 ${modules.length} 个模块按顺序拼在一起，就是一份可以直接编译运行的完整程序。切换注释模式可以看到它"带注释 / 不带注释"的两种样子——代码部分完全一致。`,
      difficulty: 0,
      deps: modules.map((m) => m.id),
      depLabels: [],
      modes: {
        detail: P.assemble(modules, 'detail'),
        short: P.assemble(modules, 'short'),
        none: P.assemble(modules, 'none'),
      },
      codeLineCount: P.assemble(modules, 'none').split('\n').filter((l) => l.trim()).length,
      isAssembly: true,
      hasPractice: false,
      scaffold: null,
      expectedOutput: gcc ? runProgram(gcc, modules.map((x) => x.code).join('\n\n'), `${book.id}-asm`) : null,
      animation: null,
    });

    console.log(`  ${book.name}: ${modules.length} 个模块 + 完整源码，其中 ${withOutput} 个有真跑出来的输出`);
    books.push({
      id: book.id, name: book.name, subtitle: book.subtitle, modules: payload,
    });
  }

  // 数据文件（用 JSON 内联成 JS，避免 fetch 的跨域/路径问题）
  const data = `/* 由 tools/build-web.js 生成，请勿手改 */\n`
    + `window.LLS_DATA = ${JSON.stringify({ generatedAt: new Date().toISOString(), books }, null, 1)};\n`;
  fs.writeFileSync(path.join(APP, 'data.js'), data, 'utf8');
  console.log(`data.js  ${(Buffer.byteLength(data, 'utf8') / 1024).toFixed(0)} KB`);

  // 复用桌面版的渲染层（它们本来就是浏览器代码）
  for (const f of ['highlight.js', 'diff.js', 'editor.js']) {
    fs.copyFileSync(path.join(ROOT, 'src', f), path.join(APP, f));
    console.log(`  复制 ${f}`);
  }
  // 桌面版的视觉规范整份复用，Web 版只在 web.css 里做布局与响应式补充
  fs.copyFileSync(path.join(ROOT, 'src', 'styles.css'), path.join(APP, 'base.css'));
  console.log('  复制 styles.css -> base.css');

  fs.rmSync(TMP, { recursive: true, force: true });
  console.log('\nWeb 版构建完成 -> docs/');
}

main();
