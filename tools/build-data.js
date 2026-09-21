'use strict';
/**
 * 数据结构研习社 —— 数据层构建
 * ---------------------------------------------------------------------------
 * 把「作者侧的源」编译成「应用侧的数据」：
 *
 *   源（可编译、可自检）                     数据（应用只读，按章懒加载）
 *   ─────────────────────────────           ─────────────────────────────
 *   resources/course.json             →     data/tree.json
 *   resources/reference/<节>/*.c      →     data/chapters/<章>.json
 *                                           data/code/<节>.json
 *   resources/animations/<节>.js      →     data/animations/<节>.json
 *                                           docs/animations/<模块>.svg
 *
 * 为什么不让应用直接读 .c：PRD 要求数据结构化 + 按章懒加载 + 冷启动 < 3s。
 * 为什么保留 .c 作为源：它是唯一能同时充当「可编译程序」和「三档注释数据源」
 * 的形式，verif 时能直接编译运行验证 —— 这是 v1.0 最值钱的设计，不能丢。
 *
 *   node tools/build-data.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const P = require('../shared/parse');

const ROOT = path.join(__dirname, '..');
const REF = path.join(ROOT, 'resources', 'reference');
const ANIM_SRC = path.join(ROOT, 'resources', 'animations');
const DATA = path.join(ROOT, 'data');
const DOC_ANIM = path.join(ROOT, 'docs', 'animations');
const TMP = path.join(ROOT, 'build-cache', 'datagen');

// ---------------------------------------------------------------------------
function findCompiler() {
  for (const c of ['gcc', path.join('E:', 'w64devkit', 'bin', 'gcc.exe'), path.join('C:', 'mingw64', 'bin', 'gcc.exe')]) {
    try { execFileSync(c, ['--version'], { stdio: 'ignore' }); return c; } catch { /* next */ }
  }
  return null;
}

/** 找一个可用的 python 解释器；找不到返回 null */
let PY_CACHE;
function findPython() {
  if (PY_CACHE !== undefined) return PY_CACHE;
  for (const cand of ['python', 'python3', 'py']) {
    try {
      execFileSync(cand, ['--version'], { stdio: 'ignore', timeout: 8000 });
      PY_CACHE = cand;
      return cand;
    } catch { /* 试下一个 */ }
  }
  PY_CACHE = null;
  return null;
}

/**
 * 用 python 跑一段完整程序，返回 stdout（失败返回 null）。
 * 和 runProgram 一样把 \r\n 归一成 \n 再去尾，这样两边能直接比。
 */
function runPython(py, source, tag) {
  fs.mkdirSync(TMP, { recursive: true });
  const src = path.join(TMP, `${tag}.py`);
  fs.writeFileSync(src, source, 'utf8');
  const PIPE = ['ignore', 'pipe', 'pipe'];
  try {
    const out = execFileSync(py, [src], {
      stdio: PIPE, timeout: 8000, encoding: 'utf8',
      // 不指定的话中文在 Windows 上会按 GBK 编出去，和 C 版比就对不上了
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });
    return out.replace(/\r\n/g, '\n').trimEnd();
  } catch (e) {
    const out = e && e.stdout ? String(e.stdout) : '';
    return out ? out.replace(/\r\n/g, '\n').trimEnd() : null;
  }
}

/** 用 gcc 跑一段完整程序，返回 stdout（失败返回 null） */
function runProgram(gcc, source, tag) {
  fs.mkdirSync(TMP, { recursive: true });
  const src = path.join(TMP, `${tag}.c`);
  const exe = path.join(TMP, `${tag}.exe`);
  fs.writeFileSync(src, source, 'utf8');
  // 注意：stdio 必须是 pipe 才拿得到 stdout，用 'ignore' 会静默拿到空字符串
  const PIPE = ['ignore', 'pipe', 'pipe'];
  try {
    execFileSync(gcc, ['-std=c11', src, '-o', exe], { stdio: PIPE, timeout: 30000 });
  } catch {
    return null;   // 编译不过就没有输出可言
  }
  try {
    const out = execFileSync(exe, [], { stdio: PIPE, timeout: 8000, encoding: 'utf8' });
    return out.replace(/\r\n/g, '\n').trimEnd();
  } catch (e) {
    // 程序可能以非 0 退出，但 stdout 仍然有价值
    const out = e && e.stdout ? String(e.stdout) : '';
    return out ? out.replace(/\r\n/g, '\n').trimEnd() : null;
  }
}

/** 找某个节对应的参考代码目录（目录名以节 id 开头） */
function sectionDir(sectionId) {
  if (!fs.existsSync(REF)) return null;
  const hit = fs.readdirSync(REF).find((d) => d.startsWith(sectionId) && fs.statSync(path.join(REF, d)).isDirectory());
  return hit ? path.join(REF, hit) : null;
}

/** 读一个目录下的模块源码与驱动 */
function loadSources(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.c'));
  const driverFile = files.find((f) => f === 'drivers.c');
  const moduleFiles = files.filter((f) => f !== 'drivers.c').sort();
  const sources = moduleFiles.map((f) => ({ name: f, text: fs.readFileSync(path.join(dir, f), 'utf8') }));
  if (driverFile) sources.push({ name: driverFile, text: fs.readFileSync(path.join(dir, driverFile), 'utf8') });
  return P.parse(sources);
}

/**
 * 把动画关键帧关联到源码行（PRD 4.3 的双向联动要靠它）。
 * 场景里显式写了 line 就用；否则拿这一步展示的代码片段去源码里反查 ——
 * 这样几十个已有场景不必逐个手工标行号。
 */
/**
 * 取出规范化字符串里的"第一个完整子句"。
 * "while(p->next!=NULL)p=p->next;" → "while(p->next!=NULL)"
 * 因为源码里 while 的条件和循环体是分行的，只有前半句能对上。
 */
function firstClause(s) {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth <= 0) return s.slice(0, i + 1); }
    else if (c === ';' && depth === 0) return s.slice(0, i + 1);
  }
  return s;
}

function matchLine(source, snippet) {
  if (!snippet) return null;
  const strip = (s) => String(s)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\s+/g, '');

  const first = String(snippet).split('\n')[0];
  const full = strip(first);
  if (full.length < 4) return null;

  const candidates = [full];
  const clause = firstClause(full);
  if (clause.length >= 6 && clause !== full) candidates.push(clause);
  for (const part of full.split(/[;{}]/)) if (part.length >= 6) candidates.push(part);

  const lines = String(source).split('\n');
  for (const needle of candidates) {
    for (let i = 0; i < lines.length; i++) {
      if (strip(lines[i]).includes(needle)) return i + 1;
    }
  }
  return null;
}

/**
 * 把一个"视图"（普通节本身就是视图；大模块下每个子目录是一个视图）解析成模块列表。
 * @param {string} dir 源码目录
 * @param {string} prefix 模块 id 前缀，如 '01-01' 或 '02-02-singly'
 * @param {object[]} scenes 这个视图对应的动画场景（按 prefix 归属）
 * @param {string} gcc 编译器路径或 null
 * @param {string} py python 解释器路径或 null（用来跑拼装视图，和 C 版对比）
 */
function buildView(dir, prefix, scenes, gcc, py) {
  const { modules, drivers, preamble } = loadSources(dir);
  // Python 版：同一个目录下的 modules.py（大模块的子视图也一样，各自一份），
  // 标记语法与 C 完全一样，只是注释前缀换成 #。
  // 还没写 Python 的节直接跳过，程序里就只显示 C —— 逐节铺开，不用等全部写完。
  const pyFile = path.join(dir, 'modules.py');
  let pyById = new Map();
  let pyModules = [];        // 拼装视图要用"按 C 的顺序排好的 Python 模块"
  if (fs.existsSync(pyFile)) {
    const parsed = P.parse([{ name: 'modules.py', text: fs.readFileSync(pyFile, 'utf8') }]);
    if (parsed.modules.length === 0) {
      console.log(`  ⚠ ${prefix}: modules.py 解析出 0 个模块，可能是标记前缀或 #%end 有问题`);
    }
    pyById = new Map(parsed.modules.map((m) => [m.id, m]));
    // 拼装视图的顺序跟 C 走：C 的模块 01..N 依次取出对应的 Python 模块。
    // 这样两边拼出来的顺序一致，输出才能直接比。
    pyModules = modules.map((m) => pyById.get(m.id)).filter(Boolean);
    // C 有而 Python 缺的模块报一下，别让人以为写完了
    const missing = modules.filter((m) => !pyById.has(m.id)).map((m) => m.id);
    if (missing.length && pyById.size) {
      console.log(`  ⚠ ${prefix}: Python 版还缺 ${missing.length} 个模块（${missing.slice(0, 6).join(', ')}${missing.length > 6 ? '…' : ''}）`);
    }
  }
  const byId = new Map(modules.map((m) => [m.id, m]));
  const out = [];
  const codeMap = {};
  const animOutLocal = {};   // 本视图内 模块 id -> 动画元数据
  let animCount = 0;
  let ranCount = 0;

  for (const m of modules) {
    const id = `${prefix}-${m.id}`;
    const expected = gcc ? runProgram(gcc, P.buildScaffold(modules, drivers, m.id, { fillCode: m.code, preamble }), id) : null;
    if (expected) ranCount++;

    // 动画：场景 id 形如 02-02-singly-04-applist，模块 id 是 02-02-singly-04
    const scene = scenes.find((s) => s.id === id || s.id.startsWith(id + '-'));
    const anim = scene ? {
      id,
      title: scene.title,
      total: scene.total,
      svg: `animations/${scene.id}.svg`,
      steps: (scene.steps || []).map((s, i) => ({
        t: s.t,
        name: s.name || (s.code ? s.code.split('\n')[0].trim().slice(0, 30) : `第 ${i + 1} 步`),
        // 关键帧 → 源码行：场景里写了 line 就用它，否则拿这一步的代码片段
        // 去源码里反查（自动补全，省得给几十个场景手工标行号）
        line: s.line || matchLine(m.code, s.code),
        text: s.text,
        code: s.code || null,
      })),
    } : null;
    if (anim) animCount++;

    out.push({
      id,
      key: m.key,
      title: m.title,
      summary: m.summary,
      difficulty: m.difficulty,
      deps: m.deps.map((d) => `${prefix}-${d.padStart(2, '0')}`),
      depLabels: m.deps.map((d) => {
        const t = byId.get(d.padStart(2, '0'));
        return t ? (/^[A-Za-z_]\w*$/.test(t.key) ? t.key : '结构体定义') : d;
      }),
      codeLineCount: m.codeLineCount,
      isAssembly: false,
      hasPractice: true,
      hasAnimation: !!anim,
    });

    if (anim) animOutLocal[id] = anim;

    const py = pyById.get(m.id) || null;
    codeMap[id] = {
      modes: m.modes,
      scaffold: P.buildScaffold(modules, drivers, m.id, { preamble }),
      expectedOutput: expected,
      // 有 Python 版就把三档代码一起带上；界面上的 C/Python 按钮据此启用
      py: py ? { modes: py.modes, code: py.code, codeLineCount: py.codeLineCount } : null,
    };
  }

  // 完整源码（拼装视图）—— 把本视图所有模块拼起来，是能直接跑的完整程序
  const asmId = `${prefix}-${String(parseInt(modules[modules.length - 1].id, 10) + 1).padStart(2, '0')}`;
  const assembled = {
    detail: P.assemble(modules, 'detail', preamble),
    short: P.assemble(modules, 'short', preamble),
    none: P.assemble(modules, 'none', preamble),
  };
  const cExpected = gcc ? runProgram(gcc, assembled.none, `${asmId}-asm`) : null;

  // Python 侧的拼装视图：Python 模块按同一顺序拼起来。
  // 三档一样拼（P.assemblePy 会把多余的主程序块注释掉），
  // 这样切到 Python 也能看到"整节合起来长什么样"。
  let assembledPy = null;
  let pyExpected = null;
  if (pyModules.length) {
    assembledPy = {
      detail: P.assemblePy(pyModules, 'detail'),
      short: P.assemblePy(pyModules, 'short'),
      none: P.assemblePy(pyModules, 'none'),
    };
    pyExpected = runPython(py, assembledPy.none, `${asmId}-asm-py`);
    // 两边都跑出来了就比一比 —— 不一致说明拼装或翻译有问题，值得当场知道
    if (cExpected != null && pyExpected != null && cExpected !== pyExpected) {
      console.log(`  ⚠ ${asmId}: C 与 Python 的拼装视图输出不一致（C ${cExpected.length} 字符 / Py ${pyExpected.length} 字符）`);
    }
  }

  out.push({
    id: asmId,
    key: '完整源码',
    title: '完整源码（拼装视图）',
    summary: `把上面 ${modules.length} 个模块按顺序拼在一起，就是一份可以直接编译运行的完整程序。`,
    difficulty: 0,
    deps: modules.map((m) => `${prefix}-${m.id}`),
    depLabels: [],
    codeLineCount: assembled.none.split('\n').filter((l) => l.trim()).length,
    isAssembly: true,
    hasPractice: false,
    hasAnimation: false,
  });
  codeMap[asmId] = {
    modes: assembled,
    scaffold: null,
    expectedOutput: cExpected,
    // 拼装视图的 Python 版：切到 Python 时显示整节拼起来的代码
    py: assembledPy ? {
      modes: assembledPy,
      code: assembledPy.none,
      codeLineCount: assembledPy.none.split('\n').filter((l) => l.trim()).length,
    } : null,
  };

  return { modules: out, codeMap, animOutLocal, ranCount, animCount, sourceCount: modules.length };
}

// ---------------------------------------------------------------------------
function main() {
  const course = JSON.parse(fs.readFileSync(path.join(ROOT, 'resources', 'course.json'), 'utf8'));
  const gcc = findCompiler();
  const py = findPython();
  console.log(gcc ? `编译器：${gcc}` : '⚠ 没找到 gcc —— 预期输出会缺失');
  console.log(py ? `Python：${py}（拼装视图会跑一遍，与 C 版输出对比）` : '⚠ 没找到 python —— Python 拼装视图不会有预期输出');

  // 动画场景（按节收集）
  const animScenes = new Map();   // sectionId -> [scene]
  if (fs.existsSync(ANIM_SRC)) {
    for (const f of fs.readdirSync(ANIM_SRC).filter((x) => x.endsWith('.js'))) {
      const secId = f.replace(/\.js$/, '');
      try {
        const scenes = require(path.join(ANIM_SRC, f));
        animScenes.set(secId, Array.isArray(scenes) ? scenes : []);
      } catch (e) {
        console.log(`  ⚠ 动画场景加载失败 ${f}: ${e.message}`);
      }
    }
  }

  fs.mkdirSync(path.join(DATA, 'chapters'), { recursive: true });
  fs.mkdirSync(path.join(DATA, 'code'), { recursive: true });
  fs.mkdirSync(path.join(DATA, 'animations'), { recursive: true });
  fs.mkdirSync(DOC_ANIM, { recursive: true });

  const tree = {
    product: course.product,
    productEn: course.productEn,
    course: course.course,
    version: course.version,
    chapters: [],
  };
  const coverage = [];
  let totalModules = 0;
  let totalAnim = 0;

  for (const ch of course.chapters) {
    const chTree = {
      id: ch.id, title: ch.title, color: ch.color, intro: ch.intro || '',
      sections: [],
    };
    const chDetail = { id: ch.id, title: ch.title, color: ch.color, intro: ch.intro || '', sections: [] };

    for (const sec of ch.sections) {
      const dir = sectionDir(sec.id);
      const isBig = sec.type === 'bigmodule';
      const sectionEntry = {
        id: sec.id, title: sec.title, summary: sec.summary || '',
        status: sec.status || 'pending', type: sec.type || 'section',
      };

      if (sec.status !== 'done' || !dir) {
        chTree.sections.push({ ...sectionEntry, moduleCount: 0, hasContent: false });
        chDetail.sections.push({ ...sectionEntry, modules: [], views: sec.views || null });
        coverage.push({ section: sec.id, title: sec.title, status: sec.status || 'pending', modules: 0, animations: 0 });
        continue;
      }

      const codeOut = { section: sec.id, views: null, modules: null };
      let sectionModules = [];
      let ran = 0;
      const animOut = { section: sec.id, animations: {} };

      if (isBig) {
        const views = [];
        codeOut.views = {};
        codeOut.modules = null;
        for (const v of sec.views || []) {
          const vDir = path.join(dir, v.id);
          if (v.id === 'compare' || !fs.existsSync(vDir)) {
            views.push({ ...v, modules: [], type: v.id === 'compare' ? 'compare' : 'view' });
            continue;
          }
          // 大模块下每个子视图有一套独立的场景文件（02-02-singly.js / 02-02-doubly.js）
          const vPrefix = `${sec.id}-${v.id}`;
          const vScenes = animScenes.get(vPrefix) || [];
          const built = buildView(vDir, vPrefix, vScenes, gcc, py);
          ran += built.ranCount;
          Object.assign(animOut.animations, built.animOutLocal);
          views.push({ id: v.id, title: v.title, summary: v.summary || '', type: 'view', modules: built.modules });
          codeOut.views[v.id] = built.codeMap;
          sectionModules = sectionModules.concat(built.modules);
        }
        sectionEntry.views = views;
        sectionEntry.modules = [];
      } else {
        const built = buildView(dir, sec.id, animScenes.get(sec.id) || [], gcc, py);
        ran = built.ranCount;
        Object.assign(animOut.animations, built.animOutLocal);
        sectionModules = built.modules;
        sectionEntry.modules = built.modules;
        codeOut.modules = built.codeMap;
      }

      totalAnim += Object.keys(animOut.animations).length;

      fs.writeFileSync(path.join(DATA, 'code', `${sec.id}.json`), JSON.stringify(codeOut), 'utf8');
      if (Object.keys(animOut.animations).length) {
        fs.writeFileSync(path.join(DATA, 'animations', `${sec.id}.json`), JSON.stringify(animOut), 'utf8');
      }

      chTree.sections.push({
        ...sectionEntry,
        moduleCount: sectionModules.length,
        // 练习模块数（排除"完整源码"这类拼装视图）——
        // 界面上的总进度要用它，而 tree.json 必须自带这个数，
        // 否则只能数"已加载的章"，进度会随着懒加载越数越多
        practiceCount: sectionModules.filter((m) => !m.isAssembly).length,
        animationCount: Object.keys(animOut.animations).length,
        hasContent: true,
        views: isBig ? (sectionEntry.views || []).map((v) => ({ id: v.id, title: v.title, moduleCount: v.modules.length })) : undefined,
      });
      chDetail.sections.push(sectionEntry);

      totalModules += sectionModules.length;
      coverage.push({
        section: sec.id, title: sec.title, status: 'done',
        modules: sectionModules.length,
        animations: Object.keys(animOut.animations).length,
        ran,
      });
      console.log(`  ${sec.id} ${sec.title}：${sectionModules.length} 个模块，${ran} 个有真跑出来的输出，${Object.keys(animOut.animations).length} 段动画`);
    }

    fs.writeFileSync(path.join(DATA, 'chapters', `${ch.id}.json`), JSON.stringify(chDetail), 'utf8');
    tree.chapters.push(chTree);
  }

  fs.writeFileSync(path.join(DATA, 'tree.json'), JSON.stringify(tree), 'utf8');
  fs.writeFileSync(path.join(DATA, 'coverage.json'), JSON.stringify({ generatedAt: new Date().toISOString(), coverage }, null, 1), 'utf8');

  console.log(`\n共 ${totalModules} 个模块，${totalAnim} 段动画`);
  console.log(`data/tree.json、data/chapters/*.json、data/code/*.json、data/animations/*.json`);
  fs.rmSync(TMP, { recursive: true, force: true });
}

main();
