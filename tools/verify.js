'use strict';
/*
 * LinkList Studio —— 自检脚本
 * ---------------------------------------------------------------------------
 * 对每一本教材（单链表 / 双向链表）分别回答这几个问题，
 * 任何一条不通过都说明代码或数据有 bug：
 *
 *   1. 参考源码能否被正确切成模块，编号/函数名/难度/依赖是否齐全？
 *   2. "详细 / 精简 / 无注释"三档模式下的**代码行**是否逐字节一致？
 *      （PRD 3.2 硬性要求：只剥注释，不动代码结构）
 *   3. 拼装出来的完整源码能否用 gcc 编译、运行、输出符合预期？
 *   4. 每个模块的练习脚手架，把目标函数填上之后能否编译并运行成功？
 *   5. 内置 TCC 能不能同样跑通（没装 gcc 的机器靠它）？
 *
 * 运行： node tools/verify.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const P = require('../shared/parse');

const ROOT = path.join(__dirname, '..');
const REF_DIR = path.join(ROOT, 'resources', 'reference');
const TMP = path.join(ROOT, 'build-cache', 'verify');

const BOOKS = [
  {
    id: 'singly',
    name: '单链表',
    dir: 'singly',
    parts: ['part1_basics.c', 'part2_search.c', 'part3_io.c'],
    // [编号, 函数名, 难度, 行数预估, 容差(默认 8)]
    expect: [
      ['01', '头文件与 typedef', 1, 20],
      ['02', 'creatNode', 1, 15],
      ['03', 'InitList', 1, 6],
      ['04', 'applist', 2, 20],
      // 05 是按需求新增的「头插法」，与 04 尾插法形成对照，PRD 里没有
      ['05', 'HeadInsert', 1, 15],
      ['06', 'GetElem_L', 2, 18],
      ['07', 'LocateElem', 2, 15],
      ['08', 'ListInsert', 3, 25],
      ['09', 'ListDelete', 3, 25],
      ['10', 'printList', 1, 15],
      ['11', 'freeList', 2, 12],
      // PRD 预估 main 约 60 行；加入头插法演示后变长，所以容差放宽
      ['12', 'main', 2, 60, 20],
    ],
    snippets: [
      '========== 1. 初始化 ==========',
      '初始化完成，当前链表：(空表)',
      '追加后：10 -> 20 -> 30 -> NULL',
      '========== 3. 头插法插入 ==========',
      '头插后：5 -> 10 -> 20 -> 30 -> NULL',
      '再头插 3 后：3 -> 5 -> 10 -> 20 -> 30 -> NULL',
      '插入后：3 -> 15 -> 5 -> 10 -> 20 -> 30 -> NULL',
      '在第 99 位插入 5 ：失败（越界，符合预期）',
      '第 3 个元素的值是 5',
      '查第 100 个元素失败（越界，符合预期）',
      '找到值为 20 的结点，它的后继是 一个有效结点',
      '查找值 99 返回 NULL（符合预期）',
      '已删除第 1 个结点，它的值是 3',
      '删除后：15 -> 5 -> 10 -> 20 -> 30 -> NULL',
      '删除第 10 个结点：失败（越界，符合预期）',
      '释放完成，L = NULL',
    ],
    // 脚手架必须真的留空：这个模块的答案不能被提前写出来
    leak: { moduleId: '08', marker: '轮到你了：模块 08', forbidden: /ListInsert\s*\(\s*LinkList/ },
  },
  {
    id: 'doubly',
    name: '双向链表',
    dir: 'doubly',
    parts: [
      'part1_basics.c',
      'part2_build.c',
      'part3_search.c',
      'part4_insertdelete.c',
      'part5_io.c',
    ],
    expect: [
      ['01', '头文件与 typedef', 1, 24, 10],
      ['02', 'creatNode', 1, 18],
      ['03', 'InitList', 1, 10],
      ['04', 'applist', 2, 22],
      ['05', 'HeadInsert', 2, 26],
      ['06', 'GetElem_L', 2, 18],
      ['07', 'LocateElem', 2, 15],
      ['08', 'ModifyElem', 2, 18],
      ['09', 'ListInsert', 3, 28],
      ['10', 'ListDelete', 3, 24],
      ['11', 'printList', 1, 20],
      ['12', 'printListReverse', 2, 24],
      ['13', 'freeList', 2, 16],
      ['14', 'main', 2, 110, 40],
    ],
    snippets: [
      '========== 1. 初始化 ==========',
      '初始化完成，当前链表：(空表)',
      '追加后（正向）：10 ⇄ 20 ⇄ 30 ⇄ NULL',
      '追加后（反向）：30 ⇄ 20 ⇄ 10 ⇄ NULL',
      '头插 5 后（正向）：5 ⇄ 10 ⇄ 20 ⇄ 30 ⇄ NULL',
      '头插 5 后（反向）：30 ⇄ 20 ⇄ 10 ⇄ 5 ⇄ NULL',
      '插入后（正向）：5 ⇄ 15 ⇄ 10 ⇄ 20 ⇄ 30 ⇄ NULL',
      '插入后（反向）：30 ⇄ 20 ⇄ 10 ⇄ 15 ⇄ 5 ⇄ NULL',
      '在第 99 位插入 5 ：失败（越界，符合预期）',
      '第 3 个元素的值是 10',
      '查第 100 个元素失败（越界，符合预期）',
      '找到 20：它的前驱是 10，后继是 一个有效结点',
      '查找值 99 返回 NULL（符合预期）',
      '把第 1 个元素改成 99 后：99 ⇄ 15 ⇄ 10 ⇄ 20 ⇄ 30 ⇄ NULL',
      '改第 100 个元素：失败（越界，符合预期）',
      '正向：99 ⇄ 15 ⇄ 10 ⇄ 20 ⇄ 30 ⇄ NULL',
      '反向：30 ⇄ 20 ⇄ 10 ⇄ 15 ⇄ 99 ⇄ NULL',
      '已删除第 2 个结点，它的值是 15',
      '删除后（正向）：99 ⇄ 10 ⇄ 20 ⇄ 30 ⇄ NULL',
      '删除后（反向）：30 ⇄ 20 ⇄ 10 ⇄ 99 ⇄ NULL',
      '删除第 10 个结点：失败（越界，符合预期）',
      '已删除尾结点，它的值是 30',
      '删除尾结点后（正向）：99 ⇄ 10 ⇄ 20 ⇄ NULL',
      '删除尾结点后（反向）：20 ⇄ 10 ⇄ 99 ⇄ NULL',
      '释放完成，L = NULL',
    ],
    leak: { moduleId: '09', marker: '轮到你了：模块 09', forbidden: /ListInsert\s*\(\s*DuLinkList/ },
  },
];

let failures = 0;
let checks = 0;

function ok(label, extra = '') {
  checks++;
  console.log(`  \u2713 ${label}${extra ? '  ' + extra : ''}`);
}
function bad(label, detail = '') {
  checks++;
  failures++;
  console.log(`  \u2717 ${label}${detail ? '\n      ' + detail : ''}`);
}
function section(title) {
  console.log(`\n${title}`);
}

/** 一个"代码行"= 不是纯注释、也不是空行的行 */
function codeLines(text) {
  return text
    .split('\n')
    .filter((l) => {
      const t = l.trim();
      if (t === '') return false;
      if (t.startsWith('//')) return false;
      return true;
    });
}

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
}

/** 精确定位编译器：优先 PATH 里的 gcc，其次 w64devkit */
function findCompiler(name) {
  const candidates = [
    name,
    path.join('E:', 'w64devkit', 'bin', name + '.exe'),
    path.join('C:', 'mingw64', 'bin', name + '.exe'),
  ];
  for (const c of candidates) {
    try {
      run(c, ['--version']);
      return c;
    } catch { /* 继续找下一个 */ }
  }
  return null;
}

function verifyBook(book, gcc, tccPath) {
  const failuresBefore = failures;
  const bookTmp = path.join(TMP, book.id);
  fs.mkdirSync(bookTmp, { recursive: true });

  section(`《${book.name}》[1] 解析参考源码`);
  const sources = book.parts.map((f) => ({
    name: f,
    text: fs.readFileSync(path.join(REF_DIR, book.dir, f), 'utf8'),
  }));
  const driversSrc = fs.readFileSync(path.join(REF_DIR, book.dir, 'drivers.c'), 'utf8');
  const { modules, drivers } = P.parse(sources.concat([{ name: 'drivers.c', text: driversSrc }]));

  if (modules.length === book.expect.length) {
    ok(`解析出 ${modules.length} 个模块`);
  } else {
    bad(`模块数量应为 ${book.expect.length}，实际 ${modules.length}`,
      '实际：' + modules.map((m) => m.id + ':' + m.key).join(', '));
  }

  book.expect.forEach(([id, key, diff, estimate, tol], i) => {
    const m = modules[i];
    if (!m) return void bad(`缺少模块 ${id}`);
    if (m.id !== id || m.key !== key) return void bad(`模块 ${id} 标识不符`, `期望 ${id}/${key}，实际 ${m.id}/${m.key}`);
    if (m.difficulty !== diff) return void bad(`模块 ${id} 难度标记不符`, `期望 ${diff}，实际 ${m.difficulty}`);
    if (!m.summary) return void bad(`模块 ${id} 缺少一句话作用`);
    if (!m.modes.none.trim()) return void bad(`模块 ${id} 无注释模式为空`);

    const lines = m.modes.none.split('\n').length;
    const tolerance = tol || 8;
    const stars = '★'.repeat(m.difficulty);
    if (Math.abs(lines - estimate) > tolerance) {
      bad(`模块 ${id} ${m.key} 行数偏离预估`, `预估 ~${estimate} 行，实际 ${lines} 行`);
    } else {
      ok(`模块 ${id} ${m.key}`, `${lines} 行（~${estimate}）· ${stars} · 依赖[${m.deps.join(',') || '无'}]`);
    }
  });

  const asmNone = P.assemble(modules, 'none').split('\n').length;
  const asmShort = P.assemble(modules, 'short').split('\n').length;
  if (asmNone >= 180 && asmShort <= 700) {
    ok('完整源码拼装视图行数合理', `无注释 ${asmNone} 行 / 精简 ${asmShort} 行`);
  } else {
    bad('完整源码拼装视图行数异常', `无注释 ${asmNone} 行 / 精简 ${asmShort} 行`);
  }

  for (const m of modules) {
    for (const d of m.deps) {
      const depId = d.padStart(2, '0');
      if (!modules.some((x) => x.id === depId)) bad(`模块 ${m.id} 依赖了不存在的模块 ${d}`);
    }
  }
  ok('依赖编号全部有效');

  // -------------------------------------------------------------------------
  section(`《${book.name}》[2] 三档注释模式的代码一致性（PRD 3.2 硬性要求）`);
  let modeMismatch = 0;
  for (const m of modules) {
    const a = codeLines(m.modes.detail);
    const b = codeLines(m.modes.short);
    const c = codeLines(m.modes.none);
    const same = JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(b) === JSON.stringify(c);
    if (!same) {
      modeMismatch++;
      const firstDiff = a.findIndex((l, i) => l !== c[i]);
      bad(`模块 ${m.id} ${m.key} 三档模式代码不一致`,
        `详细 ${a.length} 行 / 精简 ${b.length} 行 / 无注释 ${c.length} 行，首个差异在第 ${firstDiff + 1} 行`);
    }
  }
  if (modeMismatch === 0) ok(`全部 ${modules.length} 个模块：详细 / 精简 / 无注释 的代码行逐字节一致`);

  const leaked = modules.filter((m) => m.modes.none.split('\n').some((l) => l.trim().startsWith('//')));
  if (leaked.length === 0) ok('无注释模式中不含任何 // 注释行');
  else bad('无注释模式残留注释', leaked.map((m) => m.id).join(','));

  let subsetIssue = 0;
  for (const m of modules) {
    const detailComments = m.modes.detail.split('\n').filter((l) => l.trim().startsWith('//')).length;
    const shortComments = m.modes.short.split('\n').filter((l) => l.trim().startsWith('//')).length;
    if (shortComments > detailComments) {
      subsetIssue++;
      bad(`模块 ${m.id} 精简注释多于详细注释`);
    }
  }
  if (subsetIssue === 0) ok('精简注释始终是详细注释的子集');

  // -------------------------------------------------------------------------
  section(`《${book.name}》[3] 完整源码编译运行（gcc）`);
  const fullNoneFile = path.join(bookTmp, 'full_none.c');
  const fullDetailFile = path.join(bookTmp, 'full_detail.c');
  fs.writeFileSync(fullNoneFile, P.assemble(modules, 'none'));
  fs.writeFileSync(fullDetailFile, P.assemble(modules, 'detail'));

  if (!gcc) {
    bad('未找到 gcc，跳过编译验证');
  } else {
    for (const [label, file] of [['无注释', fullNoneFile], ['详细注释', fullDetailFile]]) {
      const exe = file.replace('.c', '.exe');
      try {
        run(gcc, ['-std=c11', '-Wall', '-Wextra', '-O0', file, '-o', exe], { stdio: ['ignore', 'pipe', 'pipe'] });
        const out = run(exe, [], { stdio: ['ignore', 'pipe', 'pipe'] });
        const missing = book.snippets.filter((s) => !out.includes(s));
        if (missing.length === 0) ok(`${label}版完整源码：编译 + 运行 + 输出全部符合预期（${book.snippets.length} 项）`);
        else bad(`${label}版完整源码输出不符`, '缺少：' + missing.join(' | '));
      } catch (err) {
        bad(`${label}版完整源码编译失败`, (err.stderr || err.message || '').toString().slice(0, 900));
      }
    }

    // 原始带标记文件（全部标记都是注释）也应该能直接编译
    const rawFile = path.join(bookTmp, 'raw_concat.c');
    fs.writeFileSync(rawFile, sources.map((s) => s.text).join('\n'));
    try {
      run(gcc, ['-std=c11', rawFile, '-o', path.join(bookTmp, 'raw_concat.exe')], { stdio: ['ignore', 'pipe', 'pipe'] });
      ok('带 //@ 训练标记的原始文件本身也是合法 C（可直接编译）');
    } catch (err) {
      bad('原始参考文件不能直接编译', (err.stderr || '').toString().slice(0, 600));
    }
  }

  // -------------------------------------------------------------------------
  section(`《${book.name}》[4] ${modules.length} 个练习脚手架：填空后必须能编译运行`);
  if (gcc) {
    for (const m of modules) {
      const filled = P.buildScaffold(modules, drivers, m.id, { fillCode: m.code });
      const file = path.join(bookTmp, `scaffold_${m.id}.c`);
      const exe = path.join(bookTmp, `scaffold_${m.id}.exe`);
      fs.writeFileSync(file, filled);
      try {
        run(gcc, ['-std=c11', '-Wall', file, '-o', exe], { stdio: ['ignore', 'pipe', 'pipe'] });
        const out = run(exe, [], { stdio: ['ignore', 'pipe', 'pipe'] });
        if (!out.trim()) bad(`模块 ${m.id} 脚手架运行无输出`);
        else ok(`模块 ${m.id} ${m.key} 脚手架：编译 + 运行通过`, out.trim().split('\n')[0].slice(0, 46));
      } catch (err) {
        bad(`模块 ${m.id} ${m.key} 脚手架失败`, (err.stderr || err.message || '').toString().slice(0, 700));
      }
    }

    // 脚手架必须真的留了空白（不能把答案直接给出）
    const s = P.buildScaffold(modules, drivers, book.leak.moduleId);
    if (!s.includes(book.leak.marker)) {
      bad(`模块 ${book.leak.moduleId} 脚手架缺少默写提示块`);
    } else if (book.leak.forbidden.test(s)) {
      bad(`模块 ${book.leak.moduleId} 脚手架疑似泄露了参考实现`);
    } else {
      ok(`模块 ${book.leak.moduleId} 脚手架确实留空，未泄露答案`);
    }
  }

  // -------------------------------------------------------------------------
  section(`《${book.name}》[5] 内置 TCC 兜底编译器`);
  if (!tccPath) {
    bad('未找到内置 TCC');
  } else {
    try {
      run(tccPath, ['-v'], { stdio: ['ignore', 'pipe', 'pipe'] });
      const exe = path.join(bookTmp, 'tcc_full.exe');
      run(tccPath, [fullNoneFile, '-o', exe], { stdio: ['ignore', 'pipe', 'pipe'] });
      const out = run(exe, [], { stdio: ['ignore', 'pipe', 'pipe'] });
      const missing = book.snippets.filter((s) => !out.includes(s));
      if (missing.length === 0) ok('内置 TCC：编译 + 运行 + 输出全部符合预期');
      else bad('内置 TCC 运行输出不符', '缺少：' + missing.join(' | '));
    } catch (err) {
      bad('内置 TCC 编译或运行失败', (err.stderr || err.message || '').toString().slice(0, 800));
    }
  }

  return failures - failuresBefore;
}

// ---------------------------------------------------------------------------
const gcc = findCompiler('gcc');
const tccPathRaw = path.join(ROOT, 'resources', 'tcc', 'tcc.exe');
const tccPath = fs.existsSync(tccPathRaw) ? tccPathRaw : null;

console.log(`LinkList Studio 自检 —— 共 ${BOOKS.length} 本教材`);
console.log(gcc ? `编译器：${gcc}` : '编译器：未找到 gcc');
console.log(`内置 TCC：${tccPath ? '已就绪' : '缺失'}`);

const perBook = [];
for (const book of BOOKS) {
  perBook.push({ name: book.name, failures: verifyBook(book, gcc, tccPath) });
}

section('汇总');
for (const b of perBook) {
  console.log(`  《${b.name}》：${b.failures === 0 ? '全部通过' : b.failures + ' 项失败'}`);
}
console.log(`\n${'='.repeat(60)}`);
console.log(`检查项 ${checks} 个，失败 ${failures} 个`);
console.log('='.repeat(60));
process.exit(failures === 0 ? 0 : 1);
