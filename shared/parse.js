'use strict';
/*
 * LinkList Studio —— 参考源码解析器
 * ---------------------------------------------------------------------------
 * 把 resources/reference/ 下的参考源码解析成"模块 / 三档注释"的结构化数据。
 * 目前支持两种语言，标记语法完全一样，只差注释前缀（C 是 //，Python 是 #）：
 *
 *   C：      resources/reference/<节>/modules.c
 *   Python： resources/reference/<节>/modules.py
 *
 * 标记语法（都是该语言的合法注释，所以参考文件本身可以直接编译/运行）：
 *
 *   //%module | 编号 | 函数名 | 中文标题 | 难度 | 依赖编号(逗号分隔)     # 同上
 *   //%summary | 一句话作用                                            # 同上
 *   //@s  关键步骤注释    → 详细模式 + 精简模式 都显示                 # 同上
 *   //@d  逐行补充/ASCII  → 只有详细模式显示                          # 同上
 *   //%end                                                            # 同上
 *   //%driver | 模块编号   ... //%driver-end     （练习模式脚手架用的测试驱动）
 *
 * 三档模式的唯一差别就是"保留哪些 @ 行"：
 *     详细 = @s + @d      精简 = @s      无注释 = 都不保留
 * 代码行原样输出，所以签名、变量名、缩进在三种模式下逐字节一致（Python 的
 * 缩进也要逐字节一致，否则会报 IndentationError）。
 */

const MODULE_RE = /^\/\/%module\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*(.*)$/;
const SUMMARY_RE = /^\/\/%summary\s*\|\s*(.*)$/;
const DRIVER_RE = /^\/\/%driver\s*\|\s*(.*)$/;

/**
 * 判断这份文件是 C 还是 Python。
 *
 * 不能只看第一行：Python 版 modules.py 顶上完全可能先有一段普通 `# 注释`
 * （文件干嘛的、注意什么），只看首行就会把它误判成 C，结果一个模块都解析
 * 不出来 —— 而且上层只会看到"缺全部模块"，很误导。
 *
 * 改成扫描全文，找第一个标记出现的位置：
 * 先出现 `#%`/`#@` 就是 Python，先出现 `//%`/`//@` 就是 C。
 */
function prefixOf(text) {
  const src = String(text || '');
  const py = src.search(/^[ \t]*#[%@]/m);
  const c = src.search(/^[ \t]*\/\/[%@]/m);
  if (py === -1 && c === -1) return '//';   // 没有标记，按 C 处理（老文件兼容）
  if (c === -1) return '#';
  if (py === -1) return '//';
  return py < c ? '#' : '//';
}

/** 标记与渲染全部按前缀参数化，C 和 Python 走同一套逻辑 */
function mres(p) {
  const e = p === '#' ? '#' : '\\/\\/';
  return {
    module: new RegExp(`^${e}%module\\s*\\|\\s*([^|]*)\\|\\s*([^|]*)\\|\\s*([^|]*)\\|\\s*([^|]*)\\|\\s*(.*)$`),
    summary: new RegExp(`^${e}%summary\\s*\\|\\s*(.*)$`),
    driver: new RegExp(`^${e}%driver\\s*\\|\\s*(.*)$`),
    end: new RegExp(`^${e}%end\\s*$`),
    driverEnd: new RegExp(`^${e}%driver-end\\s*$`),
  };
}

/** 判断一行是否是"注释型"行（决定它在三档模式中是否出现） */
function classify(rawLine, prefix = '//') {
  const t = rawLine.trim();
  const at = prefix + '@';
  const pl = prefix.length;
  if (t.startsWith(at + 's')) return { kind: 'short-detail', text: t.slice(pl + 2).replace(/^\s?/, '') };
  if (t.startsWith(at + 'd')) return { kind: 'detail', text: t.slice(pl + 2).replace(/^\s?/, '') };
  const plain = new RegExp(`^${prefix === '#' ? '#' : '\\/\\/'}[^@%]`);
  if (plain.test(t) || t === prefix) {
    return { kind: 'plain-comment', text: t.replace(new RegExp(`^${prefix === '#' ? '#' : '\\/\\/'}\\s?`), '') };
  }
  return null;
}

/** 把原始行还原成"输出行"：注释行 → 前缀 + 文本，代码行 → 原样 */
function toOutputLine(rawLine, info, prefix = '//') {
  const indent = rawLine.slice(0, rawLine.length - rawLine.trimStart().length);
  if (info) return indent + prefix + (info.text ? ' ' + info.text : '');
  return rawLine;
}

/**
 * 解析单个模块体，产出三档渲染结果。
 * body: string[]  模块内的原始行（不含 %module 与 %end）
 */
function renderModes(body, prefix = '//') {
  const out = { detail: [], short: [], none: [] };
  for (const raw of body) {
    const info = classify(raw, prefix);
    if (info) {
      if (info.kind !== 'detail') out.short.push(toOutputLine(raw, info, prefix));
      out.detail.push(toOutputLine(raw, info, prefix));
    } else {
      out.detail.push(raw);
      out.short.push(raw);
      out.none.push(raw);
    }
  }
  return {
    detail: out.detail.join('\n'),
    short: out.short.join('\n'),
    none: out.none.join('\n'),
  };
}

/** 去掉尾部连续空行 */
function trimTrailingBlank(lines) {
  const copy = lines.slice();
  while (copy.length && copy[copy.length - 1].trim() === '') copy.pop();
  return copy;
}

/**
 * 解析一份或多份 .c 文本。
 * @param {Array<{name:string, text:string}>} sources
 */
function parse(sources) {
  const modules = [];
  const drivers = {};
  const preambles = [];
  let current = null;
  let driver = null;

  for (const src of sources) {
    // 按文件内容判断这是 C 还是 Python：两种语言走同一套标记逻辑，
    // 只差注释前缀。C 文件里 //% 在前，Python 文件里 #% 在前。
    const prefix = prefixOf(src.text);
    const R = mres(prefix);
    preambles.push(prefix === '#' ? '' : extractPreamble(src.text));
    const lines = src.text.replace(/\r\n?/g, '\n').split('\n');
    for (const raw of lines) {
      // —— driver 块 ——
      const dm = raw.match(R.driver);
      if (dm) {
        driver = { id: dm[1].trim(), lines: [] };
        continue;
      }
      if (driver) {
        if (R.driverEnd.test(raw.trim())) {
          drivers[driver.id] = trimTrailingBlank(driver.lines).join('\n');
          driver = null;
          continue;
        }
        driver.lines.push(raw);
        continue;
      }

      // —— module 块 ——
      const mm = raw.match(R.module);
      if (mm) {
        current = {
          id: mm[1].trim(),
          key: mm[2].trim(),
          title: mm[3].trim(),
          difficulty: parseInt(mm[4].trim(), 10) || 1,
          // 依赖字段可能写成 "01,02" 也可能写成表格风格的 "01,02 |"，
          // 所以先砍掉最后一个竖线之后的内容，再按逗号切
          deps: (() => {
            const raw5 = mm[5].split('|')[0].trim();
            return raw5 ? raw5.split(',').map((s) => s.trim()).filter(Boolean) : [];
          })(),
          summary: '',
          body: [],
        };
        continue;
      }
      if (current && R.end.test(raw)) {
        const modes = renderModes(trimTrailingBlank(current.body), prefix);
        const codeLines = modes.none.split('\n');
        modules.push({
          id: current.id,
          key: current.key,
          title: current.title,
          difficulty: current.difficulty,
          deps: current.deps,
          summary: current.summary,
          modes,
          code: modes.none,
          codeLineCount: codeLines.filter((l) => l.trim() !== '').length,
        });
        current = null;
        continue;
      }
      if (current) {
        const sm = raw.match(R.summary);
        if (sm) {
          current.summary = sm[1].trim();
        } else {
          current.body.push(raw);
        }
      }
      // 模块之外的裸行（文件头注释等）直接忽略
    }
  }

  modules.sort((a, b) => a.id.localeCompare(b.id));
  // 把各文件的前置代码合并去重（脚手架要用）
  const preamble = [...new Set(preambles.filter(Boolean))].join('\n');
  return { modules, drivers, preamble };
}

/** 去掉块注释与行注释，只留代码 */
function stripComments(code) {
  return String(code)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((l) => l.replace(/\/\/.*$/, ''))
    .join('\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/**
 * 取出「第一个模块标记之前」的代码 —— 也就是 #include、#define 这类
 * 每个模块都要用到、但不值得单独做成一个模块的公共前缀。
 *
 * v1.0 的链表把它们放进了"模块 01 头文件与 typedef"；新章节直接写在文件头
 * 更自然，所以这里统一提取出来，脚手架会自动带上。
 */
function extractPreamble(text) {
  const head = [];
  for (const line of String(text).split('\n')) {
    // 遇到任何训练标记就停：//%module 或 //%driver 都算
    if (/^\s*\/\/%(module|driver)\b/.test(line)) break;
    head.push(line);
  }
  return stripComments(head.join('\n'));
}

/** 拼装视图：模块 01..N 的代码首尾相接，就是可编译的完整源码 */
function assemble(modules, mode = 'none', preamble = '') {
  const body = modules.map((m) => m.modes[mode]).join('\n\n');
  // 带上公共前缀（#include / #define）：v1.0 把它们放在"模块 01 头文件"里，
  // 新章节直接写在文件头，不带上就编不过
  return (preamble ? preamble + '\n\n' : '') + body + '\n';
}

/**
 * 函数名 → 模块编号。
 * 直接取自 //%module 声明的函数名，比正则猜函数定义可靠得多。
 */
/** C 语言的关键字，提取函数名时要排除掉 */
const C_KEYWORDS = new Set([
  'if', 'else', 'while', 'for', 'do', 'switch', 'case', 'return', 'sizeof',
  'struct', 'union', 'enum', 'typedef', 'static', 'const', 'void', 'int',
  'char', 'long', 'short', 'float', 'double', 'unsigned', 'signed',
]);

/**
 * 从一段 C 代码里提取所有**定义的**函数名。
 * 匹配"返回类型 + 名字 + (...) {"这种形式，跳过 if/while 之类的关键字。
 * 一个模块里定义多个函数是很常见的（比如 Height 模块里有 GetHeight、
 * UpdateHeight、BalanceFactor），只靠 key 建索引会漏掉后面几个。
 */
function definedFunctions(code) {
  const out = [];
  const re = /(?:^|\n)[ \t]*(?:static\s+)?[A-Za-z_][A-Za-z0-9_ \t*]*?\b([A-Za-z_][A-Za-z0-9_]*)\s*\([^;{}]*\)\s*\n?[ \t]*\{/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    const name = m[1];
    if (!C_KEYWORDS.has(name) && out.indexOf(name) < 0) out.push(name);
  }
  return out;
}

function buildFunctionIndex(modules) {
  const index = new Map();
  for (const m of modules) {
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(m.key) && !index.has(m.key)) {
      index.set(m.key, m.id);
    }
    // 模块代码里定义的其他函数也归到这个模块名下
    for (const fn of definedFunctions(m.code)) {
      if (!index.has(fn)) index.set(fn, m.id);
    }
  }
  return index;
}

/**
 * 找出某段代码里引用到的、已知的参考函数名。
 * @param {Set<string>|string|null} exclude 要忽略的函数名
 */
function referencedFunctions(code, fnIndex, exclude) {
  const skip = exclude instanceof Set ? exclude : new Set(exclude ? [exclude] : []);
  const found = new Set();
  for (const fn of fnIndex.keys()) {
    if (skip.has(fn)) continue;
    const re = new RegExp('\\b' + fn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\(');
    if (re.test(code)) found.add(fn);
  }
  return found;
}

/**
 * 为某个模块生成"练习脚手架"：给定代码 + 待默写空白 + 测试驱动。
 * 目标是让用户填空之后立刻就能编译运行，形成闭环。
 *
 * @param {object} [options]
 * @param {string} [options.fillCode] 传入目标模块的参考实现时，直接把空白处填好
 *                                    （自检用：验证脚手架填完必能编译运行）
 */
function buildScaffold(modules, drivers, moduleId, options = {}) {
  const byId = new Map(modules.map((m) => [m.id, m]));
  const target = byId.get(moduleId);
  if (!target) return null;

  const fnIndex = buildFunctionIndex(modules);
  const driverCode = drivers[moduleId] || '';

  const neededIds = new Set();
  if (moduleId !== '01') neededIds.add('01');
  // 目标模块自己声明依赖的函数也必须给出：
  // 用户写的 applist 会调用 creatNode，那就得先把 creatNode 放进来
  for (const d of target.deps) {
    const depId = d.padStart(2, '0');
    if (depId !== moduleId) neededIds.add(depId);
  }

  // 推导"已给出"的模块集合：
  //   有测试驱动 → 从驱动里用到的函数出发（驱动自身那个 main 不算依赖）；
  //   没有驱动（模块 11 main）→ 从目标模块自己的参考实现出发。
  // 再沿调用图做传递闭包，例如 applist 会带出 creatNode。
  const seed = driverCode || target.code;
  const excluded = new Set([target.key, 'main']);
  const queue = [...referencedFunctions(seed, fnIndex, excluded)];
  const seenFn = new Set(queue);
  const enqueue = (code) => {
    for (const fn of referencedFunctions(code, fnIndex, excluded)) {
      if (!seenFn.has(fn)) {
        seenFn.add(fn);
        queue.push(fn);
      }
    }
  };
  for (const id of [...neededIds]) {
    const owner = byId.get(id);
    if (owner) enqueue(owner.code);
  }
  while (queue.length) {
    const fn = queue.shift();
    const owner = fnIndex.get(fn);
    if (!owner || owner === moduleId) continue;
    if (neededIds.has(owner)) continue;
    neededIds.add(owner);
    enqueue(byId.get(owner).code);
  }

  const given = [...neededIds]
    .sort((a, b) => a.localeCompare(b))
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((m) => `/* ======== [已给出] 模块 ${m.id} ${m.key} ======== */\n${m.code}`)
    .join('\n\n');

  const blankMarker = options.fillCode
    ? options.fillCode
    : [
        '/* ====================================================================',
        ` *  轮到你了：模块 ${target.id}  ${target.key}`,
        ` *  作用：${target.summary}`,
        ' *  提示：先写函数签名，再写循环定位，最后写指针操作。',
        ' *  写完按 Ctrl + Enter 编译运行，点"对比"看与参考实现的差异。',
        ' * ==================================================================== */',
      ].join('\n');

  const parts = [];
  // 公共前缀（#include / #define）必须放在最前面，否则 printf 之类的会报未声明
  if (options.preamble) parts.push(options.preamble);
  if (given) parts.push(given);
  parts.push(blankMarker);
  parts.push('');
  if (driverCode) parts.push(`/* ======== 测试驱动（已给出，可自行修改） ======== */\n${driverCode}`);
  return parts.join('\n\n') + '\n';
}

module.exports = {
  parse,
  assemble,
  renderModes,
  buildScaffold,
  buildFunctionIndex,
  referencedFunctions,
};
