/* ==========================================================================
   LinkList Studio —— 内嵌代码编辑器
   实现方式：透明文字的 <textarea> 叠在"语法高亮结果"之上。
   好处是撤销、选区、输入法、鼠标拖选全部由浏览器原生负责，不用自己造轮子；
   代价是两侧的字体、字号、行高、内边距必须逐像素一致（见 styles.css）。
   ========================================================================== */
(function (global) {
  'use strict';

  const HL = global.LS.highlight;

  const PAIRS = { '(': ')', '[': ']', '{': '}' };
  const CLOSERS = { ')': '(', ']': '[', '}': '{' };
  const INDENT = '    ';

  /** 找配对的括号 */
  function findMatch(text, pos) {
    const ch = text[pos];
    if (!ch) return -1;
    if (PAIRS[ch]) {
      const close = PAIRS[ch];
      let depth = 0;
      for (let i = pos; i < text.length; i++) {
        if (text[i] === ch) depth++;
        else if (text[i] === close) {
          depth--;
          if (depth === 0) return i;
        }
      }
      return -1;
    }
    if (CLOSERS[ch]) {
      const open = CLOSERS[ch];
      let depth = 0;
      for (let i = pos; i >= 0; i--) {
        if (text[i] === ch) depth++;
        else if (text[i] === open) {
          depth--;
          if (depth === 0) return i;
        }
      }
      return -1;
    }
    return -1;
  }

  function lineStartOffsets(text) {
    const starts = [0];
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\n') starts.push(i + 1);
    }
    return starts;
  }

  function createEditor(opts) {
    const input = opts.input;
    const highlightCode = opts.highlightCode;
    const gutter = opts.gutter;
    const onChange = opts.onChange || (() => {});
    const onRun = opts.onRun || (() => {});

    let errorLines = new Set();
    let composing = false;

    function marksFor(text, caret) {
      const marks = new Set();
      // 光标左边的字符，或光标右边的字符，是括号就找它的搭档
      for (const pos of [caret - 1, caret]) {
        if (pos < 0 || pos >= text.length) continue;
        if (!PAIRS[text[pos]] && !CLOSERS[text[pos]]) continue;
        const m = findMatch(text, pos);
        if (m >= 0) { marks.add(pos); marks.add(m); }
      }
      return marks;
    }

    function lineHtml(line, cols, contextText) {
      if (!cols.length) return HL.highlightSingleLine(line, contextText);
      let html = '';
      let prev = 0;
      const sorted = [...cols].sort((a, b) => a - b);
      for (const col of sorted) {
        if (col < prev || col >= line.length) continue;
        html += HL.highlightSingleLine(line.slice(prev, col), contextText);
        html += `<span class="br-match">${HL.escapeHtml(line[col])}</span>`;
        prev = col + 1;
      }
      html += HL.highlightSingleLine(line.slice(prev), contextText);
      return html;
    }

    function refresh() {
      const text = input.value.replace(/\r\n?/g, '\n');
      const caret = input.selectionStart;
      const marks = composing ? new Set() : marksFor(text, caret);
      const starts = lineStartOffsets(text);
      const lines = text.split('\n');

      let body = '';
      let gut = '';
      for (let i = 0; i < lines.length; i++) {
        const lineNo = i + 1;
        const lineStart = starts[i];
        const cols = [];
        for (const m of marks) {
          if (m >= lineStart && m < lineStart + lines[i].length) cols.push(m - lineStart);
        }
        body += lineHtml(lines[i], cols, text) + (i === lines.length - 1 ? '' : '\n');
        gut += `<span class="gl${errorLines.has(lineNo) ? ' is-hot' : ''}">${lineNo}</span>`;
      }

      highlightCode.innerHTML = body;
      gutter.innerHTML = gut;
      syncScroll();
    }

    function syncScroll() {
      const x = input.scrollLeft;
      const y = input.scrollTop;
      gutter.style.transform = `translateY(${-y}px)`;
      highlightCode.style.transform = `translate(-${x}px, -${y}px)`;
    }

    /** 把某一段替换掉，并把光标放到指定位置 */
    function replaceRange(start, end, insert, caretStart, caretEnd) {
      const value = input.value;
      input.value = value.slice(0, start) + insert + value.slice(end);
      const cs = caretStart == null ? start + insert.length : caretStart;
      input.selectionStart = cs;
      input.selectionEnd = caretEnd == null ? cs : caretEnd;
      refresh();
      onChange();
    }

    // ---------------------------------------------------------------- 输入
    input.addEventListener('input', () => {
      refresh();
      onChange();
    });

    input.addEventListener('compositionstart', () => { composing = true; });
    input.addEventListener('compositionend', () => {
      composing = false;
      refresh();
      onChange();
    });

    input.addEventListener('scroll', syncScroll);
    input.addEventListener('click', refresh);
    input.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) refresh();
    });

    input.addEventListener('keydown', (e) => {
      const value = input.value;
      const start = input.selectionStart;
      const end = input.selectionEnd;

      // Ctrl + Enter 编译运行
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation(); // 不要再触发 document 上的全局快捷键，否则会跑两次
        onRun();
        return;
      }

      // Tab / Shift+Tab 缩进整行
      if (e.key === 'Tab') {
        e.preventDefault();
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        if (start !== end && value.slice(start, end).includes('\n')) {
          const lineEnd = value.indexOf('\n', end);
          const blockEnd = lineEnd === -1 ? value.length : lineEnd;
          const block = value.slice(lineStart, blockEnd);
          const lines = block.split('\n');
          const out = lines.map((l) => (e.shiftKey
            ? l.replace(new RegExp('^' + INDENT.replace(/ /g, ' ')), '').replace(/^ {1,4}/, '')
            : INDENT + l));
          const insert = out.join('\n');
          replaceRange(lineStart, blockEnd, insert, lineStart, lineStart + insert.length);
        } else {
          if (e.shiftKey) {
            const before = value.slice(lineStart, start);
            const strip = before.match(/^ {1,4}/);
            if (strip) replaceRange(lineStart, lineStart + strip[0].length, '', Math.max(lineStart, start - strip[0].length));
          } else {
            replaceRange(start, end, INDENT, start + INDENT.length);
          }
        }
        return;
      }

      // 回车：自动缩进；在 { 之后按回车顺手补齐 }
      if (e.key === 'Enter') {
        e.preventDefault();
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const currentLine = value.slice(lineStart, start);
        const indent = (currentLine.match(/^[ \t]*/) || [''])[0];
        const trimmed = currentLine.trimEnd();
        const nextChar = value[end] || '';
        if (/\{\s*$/.test(trimmed) && nextChar === '}') {
          const insert = `\n${indent}${INDENT}\n${indent}`;
          replaceRange(start, end, insert, start + 1 + indent.length + INDENT.length);
          return;
        }
        const extra = /\{\s*$/.test(trimmed) ? INDENT : '';
        replaceRange(start, end, `\n${indent}${extra}`, start + 1 + indent.length + extra.length);
        return;
      }

      // 自动配对括号与引号
      if (PAIRS[e.key]) {
        e.preventDefault();
        const close = PAIRS[e.key];
        if (start !== end) {
          const sel = value.slice(start, end);
          replaceRange(start, end, e.key + sel + close, start + 1, start + 1 + sel.length);
        } else {
          replaceRange(start, end, e.key + close, start + 1);
        }
        return;
      }
      if (e.key === '"' || e.key === "'") {
        e.preventDefault();
        if (start !== end) {
          const sel = value.slice(start, end);
          replaceRange(start, end, e.key + sel + e.key, start + 1, start + 1 + sel.length);
        } else if (value[end] === e.key) {
          input.selectionStart = input.selectionEnd = end + 1;
          refresh();
        } else {
          replaceRange(start, end, e.key + e.key, start + 1);
        }
        return;
      }
      // 右侧已经是同一个收尾括号时，直接跳过而不是再插一个
      if (CLOSERS[e.key] && start === end && value[end] === e.key) {
        e.preventDefault();
        input.selectionStart = input.selectionEnd = end + 1;
        refresh();
      }
    });

    // 粘贴时不让浏览器插入 \r\n
    input.addEventListener('paste', (e) => {
      const text = e.clipboardData && e.clipboardData.getData('text');
      if (text == null) return;
      e.preventDefault();
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const clean = text.replace(/\r\n?/g, '\n');
      replaceRange(start, end, clean, start + clean.length);
    });

    return {
      refresh,
      getValue: () => input.value,
      setValue(v, keepScroll) {
        const y = input.scrollTop;
        input.value = String(v == null ? '' : v).replace(/\r\n?/g, '\n');
        if (keepScroll) input.scrollTop = y; else input.scrollTop = 0;
        input.selectionStart = input.selectionEnd = 0;
        refresh();
      },
      setErrorLines(lines) {
        errorLines = new Set(lines || []);
        refresh();
      },
      /** 跳到某一行的行首，并滚动到可见区域 */
      goToLine(lineNo) {
        const value = input.value;
        const starts = lineStartOffsets(value);
        const idx = Math.max(0, Math.min(starts.length - 1, (lineNo || 1) - 1));
        const offset = starts[idx];
        input.focus();
        input.selectionStart = input.selectionEnd = offset;
        const lineHeight = input.scrollHeight / Math.max(1, starts.length);
        input.scrollTop = Math.max(0, offset && idx * lineHeight - input.clientHeight / 2);
        refresh();
      },
      focus: () => input.focus(),
    };
  }

  global.LS = global.LS || {};
  global.LS.createEditor = createEditor;
})(window);
