/* ==========================================================================
   LinkList Studio —— C 语法高亮
   逐行词法扫描，块注释状态跨行保持，因此每一行产出的 HTML 都是自闭合的，
   可以安全地拆成"行数组"用于行号栏、错误行高亮和编辑器的覆盖层。
   ========================================================================== */
(function (global) {
  'use strict';

  const KEYWORDS = new Set([
    'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double',
    'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'inline', 'int', 'long',
    'register', 'restrict', 'return', 'short', 'signed', 'sizeof', 'static', 'struct',
    'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while',
    '_Bool', '_Complex', '_Imaginary', 'NULL', 'true', 'false',
  ]);

  /** 常见标准库类型名，没有 typedef 也要按"类型"上色 */
  const BUILTIN_TYPES = new Set([
    'size_t', 'ssize_t', 'ptrdiff_t', 'wchar_t', 'FILE', 'va_list', 'time_t',
    'int8_t', 'int16_t', 'int32_t', 'int64_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t',
    'bool', 'clock_t', 'off_t', 'errno_t',
  ]);

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  /** 从源码里提取 typedef 出来的类型名：LinkList / LNode / Status / ElemType … */
  function extractTypedefNames(src) {
    const names = new Set();
    const re = /typedef\b([\s\S]*?);/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const body = m[1];
      const brace = body.lastIndexOf('}');
      let tail;
      if (brace >= 0) {
        // typedef struct X { ... } X, *LinkList;
        tail = body.slice(brace + 1);
      } else {
        // typedef int Status;
        const parts = body.trim().split(/\s+/);
        const skip = /^(struct|union|enum)$/.test(parts[0] || '') ? 2 : 1;
        tail = parts.slice(skip).join(' ');
      }
      const ids = tail.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
      for (const id of ids) names.add(id);
    }
    return names;
  }

  /** 从源码里提取 #define 出来的宏名 */
  function extractMacroNames(src) {
    const names = new Set();
    const re = /^[ \t]*#[ \t]*define[ \t]+([A-Za-z_][A-Za-z0-9_]*)/gm;
    let m;
    while ((m = re.exec(src)) !== null) names.add(m[1]);
    return names;
  }

  const ID_START = /[A-Za-z_]/;
  const ID_CHAR = /[A-Za-z0-9_]/;
  const DIGIT = /[0-9]/;

  /**
   * 把一个逻辑行切成 token 并上色。
   * @param {string} line
   * @param {object} state 跨行状态 { inBlockComment: boolean }
   * @param {Set<string>} types
   * @param {Set<string>} macros
   */
  function highlightLine(line, state, types, macros) {
    let out = '';
    let i = 0;
    const n = line.length;

    // 行首的预处理指令整行标绿
    const pre = line.match(/^[ \t]*#/);
    if (pre && !state.inBlockComment) {
      return `<span class="t-pp">${escapeHtml(line)}</span>`;
    }

    while (i < n) {
      if (state.inBlockComment) {
        const end = line.indexOf('*/', i);
        if (end === -1) {
          out += `<span class="t-com">${escapeHtml(line.slice(i))}</span>`;
          i = n;
        } else {
          out += `<span class="t-com">${escapeHtml(line.slice(i, end + 2))}</span>`;
          i = end + 2;
          state.inBlockComment = false;
        }
        continue;
      }

      const c = line[i];

      // 注释
      if (c === '/' && line[i + 1] === '/') {
        out += `<span class="t-com">${escapeHtml(line.slice(i))}</span>`;
        break;
      }
      if (c === '/' && line[i + 1] === '*') {
        const end = line.indexOf('*/', i + 2);
        if (end === -1) {
          out += `<span class="t-com">${escapeHtml(line.slice(i))}</span>`;
          state.inBlockComment = true;
          i = n;
        } else {
          out += `<span class="t-com">${escapeHtml(line.slice(i, end + 2))}</span>`;
          i = end + 2;
        }
        continue;
      }

      // 字符串 / 字符
      if (c === '"' || c === "'") {
        const quote = c;
        let j = i + 1;
        let body = quote;
        while (j < n) {
          if (line[j] === '\\') {
            body += line[j] + (line[j + 1] || '');
            j += 2;
            continue;
          }
          body += line[j];
          if (line[j] === quote) { j++; break; }
          j++;
        }
        out += `<span class="t-str">${escapeHtml(body)}</span>`;
        i = j;
        continue;
      }

      // 标识符 / 关键字 / 类型 / 函数名
      if (ID_START.test(c)) {
        let j = i + 1;
        while (j < n && ID_CHAR.test(line[j])) j++;
        const word = line.slice(i, j);
        let cls = '';
        if (KEYWORDS.has(word)) {
          cls = (word === 'NULL' || word === 'true' || word === 'false') ? 't-macro' : 't-key';
        } else if (types.has(word) || BUILTIN_TYPES.has(word)) {
          cls = 't-type';
        } else if (macros.has(word) || /^[A-Z][A-Z0-9_]*$/.test(word)) {
          cls = 't-macro';
        } else {
          // 后面紧跟 ( 的就是函数名（定义或调用）
          let k = j;
          while (k < n && (line[k] === ' ' || line[k] === '\t')) k++;
          if (line[k] === '(') cls = 't-func';
        }
        out += cls ? `<span class="${cls}">${escapeHtml(word)}</span>` : escapeHtml(word);
        i = j;
        continue;
      }

      // 数字
      if (DIGIT.test(c)) {
        let j = i;
        while (j < n && /[0-9a-fA-FxX.]/.test(line[j])) j++;
        while (j < n && /[uUlLfF]/.test(line[j])) j++;
        out += `<span class="t-num">${escapeHtml(line.slice(i, j))}</span>`;
        i = j;
        continue;
      }

      out += escapeHtml(c);
      i++;
    }

    return out;
  }

  /**
   * 把整段代码按行高亮。
   * @returns {string[]} 每行一个 HTML 片段
   */
  function highlightLines(code) {
    const text = String(code == null ? '' : code).replace(/\r\n?/g, '\n');
    const types = extractTypedefNames(text);
    const macros = extractMacroNames(text);
    const state = { inBlockComment: false };
    return text.split('\n').map((line) => highlightLine(line, state, types, macros));
  }

  /**
   * 生成"行号 + 代码"的只读代码视图。
   * 每一行都是一个 block 级 span，这样 diff 的整行底色能铺满宽度；
   * 行高由 CSS 的 min-height 保证，空行也不会塌陷。
   *
   * @param {string} code
   * @param {object} [opts]
   * @param {number[]|Set<number>} [opts.hotLines] 需要标红的行号（1 基）
   * @param {boolean} [opts.plain] 不做语法高亮，只转义（diff 视图用）
   * @param {string[]} [opts.lineClasses] 逐行的附加 class（diff 着色用）
   * @param {string[]} [opts.linePrefixes] 逐行的前缀标记（+ / - / ~）
   */
  function codeViewHtml(code, opts = {}) {
    const text = String(code == null ? '' : code).replace(/\r\n?/g, '\n');
    const rawLines = text.split('\n');
    const hot = new Set(opts.hotLines || []);
    const lineClasses = opts.lineClasses || null;
    const linePrefixes = opts.linePrefixes || null;
    const hl = opts.plain ? rawLines.map(escapeHtml) : highlightLines(text);

    let gutter = '';
    let body = '';
    for (let i = 0; i < rawLines.length; i++) {
      const ln = i + 1;
      gutter += `<span class="gl${hot.has(ln) ? ' is-hot' : ''}">${ln}</span>`;
      const extra = lineClasses && lineClasses[i] ? ' ' + lineClasses[i] : '';
      const prefix = linePrefixes && linePrefixes[i]
        ? `<span class="dl-mark">${escapeHtml(linePrefixes[i])}</span>`
        : '';
      body += `<span class="ln${extra}">${prefix}${hl[i] || ''}</span>`;
    }

    return `<div class="cv-inner"><div class="cv-gutter">${gutter}</div><pre class="cv-code">${body}</pre></div>`;
  }

  /**
   * 单独高亮一行，类型名/宏名从 contextText 里提取
   * （diff 视图的每一行都是拼出来的，需要借上下文才能认出 LinkList 这类类型）
   */
  function highlightSingleLine(line, contextText) {
    const ctx = contextText || line;
    return highlightLine(line, { inBlockComment: false }, extractTypedefNames(ctx), extractMacroNames(ctx));
  }

  global.LS = global.LS || {};
  global.LS.highlight = {
    escapeHtml,
    highlightLines,
    highlightSingleLine,
    codeViewHtml,
    extractTypedefNames,
    extractMacroNames,
  };
})(window);
