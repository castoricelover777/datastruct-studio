/* ==========================================================================
   LinkList Studio —— 参考实现与默写内容的差异对比
   用 LCS 做行级 diff，并且刻意忽略"空行、整行注释、缩进、行内多余空格"，
   因为默写训练考的是代码逻辑，不是排版。
   ========================================================================== */
(function (global) {
  'use strict';

  const HL = global.LS.highlight;

  /** 去掉块注释，返回每一行的"纯代码"版本（保留原始行号） */
  function toCodeLines(code) {
    const text = String(code == null ? '' : code).replace(/\r\n?/g, '\n');
    const out = [];
    let inBlock = false;
    text.split('\n').forEach((raw, idx) => {
      let line = raw;
      let result = '';
      let i = 0;
      while (i < line.length) {
        if (inBlock) {
          const end = line.indexOf('*/', i);
          if (end === -1) { i = line.length; break; }
          i = end + 2;
          inBlock = false;
          continue;
        }
        if (line[i] === '/' && line[i + 1] === '*') { inBlock = true; i += 2; continue; }
        if (line[i] === '/' && line[i + 1] === '/') break;
        result += line[i];
        i++;
      }
      const trimmed = result.trim();
      if (!trimmed) return; // 空行 / 纯注释行不参与对比
      out.push({ text: trimmed.replace(/\s+/g, ' '), raw: raw.replace(/\s+$/, ''), srcLine: idx + 1 });
    });
    return out;
  }

  /**
   * 经典 LCS 行级 diff。
   * @returns {Array<{type:'same'|'del'|'add', a?:number, b?:number}>}
   */
  function lcsDiff(a, b) {
    const n = a.length;
    const m = b.length;

    // dp[i][j] = a[i..] 与 b[j..] 的最长公共子序列长度
    const dp = new Array(n + 1);
    for (let i = 0; i <= n; i++) dp[i] = new Int32Array(m + 1);
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }

    const ops = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) {
        ops.push({ type: 'same', a: i, b: j });
        i++; j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        ops.push({ type: 'del', a: i });
        i++;
      } else {
        ops.push({ type: 'add', b: j });
        j++;
      }
    }
    while (i < n) ops.push({ type: 'del', a: i++ });
    while (j < m) ops.push({ type: 'add', b: j++ });
    return ops;
  }

  /** 把同一段连续的非 same 操作里的 del / add 配成"写法不同" */
  function pairChanged(ops) {
    const result = [];
    let k = 0;
    while (k < ops.length) {
      if (ops[k].type === 'same') {
        result.push(ops[k]);
        k++;
        continue;
      }
      const hunk = [];
      while (k < ops.length && ops[k].type !== 'same') hunk.push(ops[k++]);
      const dels = hunk.filter((o) => o.type === 'del');
      const adds = hunk.filter((o) => o.type === 'add');
      const pairs = Math.min(dels.length, adds.length);
      // 数量相等时视为"改写了同样的行数"，用 ~ 标注；否则按缺 / 多区分
      for (let x = 0; x < pairs; x++) {
        dels[x].type = 'mod-del';
        adds[x].type = 'mod-add';
      }
      result.push(...dels, ...adds);
    }
    return result;
  }

  /**
   * 生成对比视图。
   * @param {string} userCode 用户默写的内容
   * @param {string} refCode 当前模块的官方实现
   * @returns {{html:string, stats:{same:number, missing:number, extra:number, changed:number}}}
   */
  function render(userCode, refCode) {
    const refLines = toCodeLines(refCode);
    const userLines = toCodeLines(userCode);
    const ops = pairChanged(lcsDiff(refLines.map((l) => l.text), userLines.map((l) => l.text)));

    const stats = { same: 0, missing: 0, extra: 0, changed: 0 };
    let gutter = '';
    let body = '';

    const row = (mark, cls, num, html) => {
      gutter += `<span class="gl">${num || ''}</span>`;
      body += `<span class="ln ${cls}"><span class="dl-mark">${mark}</span>${html}</span>`;
    };

    for (const op of ops) {
      if (op.type === 'same') {
        stats.same++;
        const r = refLines[op.a];
        row('&nbsp;', '', r.srcLine, HL.highlightSingleLine(r.raw, refCode));
      } else if (op.type === 'del') {
        stats.missing++;
        const r = refLines[op.a];
        row('-', 'dl-del', r.srcLine, HL.highlightSingleLine(r.raw, refCode));
      } else if (op.type === 'add') {
        stats.extra++;
        const u = userLines[op.b];
        row('+', 'dl-add', u.srcLine, HL.highlightSingleLine(u.raw, userCode));
      } else if (op.type === 'mod-del') {
        stats.changed++;
        const r = refLines[op.a];
        row('~', 'dl-mod', r.srcLine, HL.highlightSingleLine(r.raw, refCode));
      } else if (op.type === 'mod-add') {
        const u = userLines[op.b];
        row('~', 'dl-mod', u.srcLine, HL.highlightSingleLine(u.raw, userCode));
      }
    }

    if (ops.length === 0) {
      return {
        html: '<div class="empty-note">两边都没有可对比的代码行。<br />先写点东西，或者点「补全脚手架」。</div>',
        stats,
      };
    }

    return {
      html: `<div class="cv-inner"><div class="cv-gutter">${gutter}</div><pre class="cv-code">${body}</pre></div>`,
      stats,
    };
  }

  global.LS = global.LS || {};
  global.LS.diff = { render, toCodeLines, lcsDiff };
})(window);
