/* ==========================================================================
   LinkList Studio —— 界面主逻辑
   ========================================================================== */
(function () {
  'use strict';

  const HL = window.LS.highlight;

  const $ = (id) => document.getElementById(id);

  const el = {
    html: document.documentElement,
    bookSwitch: $('bookSwitch'),
    moduleList: $('moduleList'),
    searchInput: $('searchInput'),
    progressMiniFill: $('progressMiniFill'),
    progressMiniText: $('progressMiniText'),

    mhId: $('mhId'),
    mhName: $('mhName'),
    mhSummary: $('mhSummary'),
    mhDiff: $('mhDiff'),
    mhDeps: $('mhDeps'),
    mhLines: $('mhLines'),

    commentModes: $('commentModes'),
    viewModes: $('viewModes'),
    btnPrev: $('btnPrev'),
    btnNext: $('btnNext'),
    btnTheme: $('btnTheme'),

    paneRead: $('paneRead'),
    panePractice: $('panePractice'),
    readCardTitle: $('readCardTitle'),
    readHint: $('readHint'),
    btnCopyCode: $('btnCopyCode'),
    codeView: $('codeView'),

    practiceSplit: $('practiceSplit'),
    refCard: $('refCard'),
    refCardTitle: $('refCardTitle'),
    refBody: $('refBody'),
    refView: $('refView'),
    btnDiff: $('btnDiff'),
    btnCollapseRef: $('btnCollapseRef'),
    btnScaffold: $('btnScaffold'),
    btnBlank: $('btnBlank'),

    editor: $('editor'),
    editorGutter: $('editorGutter'),
    editorHighlightCode: $('editorHighlightCode'),
    editorInput: $('editorInput'),

    outputPanel: $('outputPanel'),
    btnToggleOutput: $('btnToggleOutput'),
    outputCaret: $('outputCaret'),
    outputStatus: $('outputStatus'),
    outputBody: $('outputBody'),
    outputPlaceholder: $('outputPlaceholder'),
    outputContent: $('outputContent'),
    btnRun: $('btnRun'),
    btnReset: $('btnReset'),
    btnCompare: $('btnCompare'),

    sbCompilerDot: $('sbCompilerDot'),
    sbCompiler: $('sbCompiler'),
    sbModule: $('sbModule'),
    sbState: $('sbState'),
    sbRight: $('sbRight'),
  };

  const state = {
    books: [],          // 全部教材：[{ id, name, subtitle, modules, scaffolds }]
    bookIndex: 0,       // 当前教材下标
    modules: [],        // 当前教材的模块列表
    scaffolds: {},      // 当前教材的脚手架
    index: 0,
    mode: 'detail',
    view: 'read',
    theme: 'light',
    compilers: [],
    drafts: {},         // { 教材id: { 模块id: 文本 } } —— 按教材分开存
    edited: {},         // { 教材id: Set(模块id) }
    lastModule: {},     // { 教材id: 模块id } —— 每本教材各自记住看到哪
    refCollapsed: false,
    compareMode: false,
    running: false,
    lastResult: null,
    filter: '',
  };

  let editor = null;

  const currentBook = () => state.books[state.bookIndex] || { id: '', name: '' };
  const current = () => state.modules[state.index];

  /** 当前教材的"练过的模块"集合 */
  function editedSet() {
    const id = currentBook().id;
    if (!state.edited[id]) state.edited[id] = new Set();
    return state.edited[id];
  }

  /** 当前教材的草稿表 */
  function draftMap() {
    const id = currentBook().id;
    if (!state.drafts[id]) state.drafts[id] = {};
    return state.drafts[id];
  }

  // ======================================================================
  // 主题
  // ======================================================================
  function applyTheme(theme) {
    state.theme = theme === 'dark' ? 'dark' : 'light';
    el.html.dataset.theme = state.theme;
    el.btnTheme.textContent = state.theme === 'dark' ? '浅色' : '深色';
  }

  // ======================================================================
  // 侧栏
  // ======================================================================
  function draftCount() {
    const edited = editedSet();
    return state.modules.filter((m) => edited.has(m.id)).length;
  }

  /** 教材切换器（侧栏顶部） */
  function renderBookSwitch() {
    el.bookSwitch.innerHTML = state.books.map((b) => (
      `<button type="button" data-book="${b.id}" class="${b.id === currentBook().id ? 'is-active' : ''}"
        title="${escapeAttr(b.name + ' · ' + b.subtitle)}">${escapeHtml(b.name)}</button>`
    )).join('');
  }

  function renderSidebar() {
    const filter = state.filter.trim().toLowerCase();
    const edited = editedSet();
    let html = '';
    let assemblyAdded = false;

    for (const m of state.modules) {
      if (filter) {
        const hay = `${m.id} ${m.key} ${m.title}`.toLowerCase();
        if (!hay.includes(filter)) continue;
      }
      if (m.isAssembly && !assemblyAdded) {
        html += '<div class="module-group-label">拼装视图</div>';
        assemblyAdded = true;
      }
      const active = state.modules[state.index] && state.modules[state.index].id === m.id;
      const stars = m.difficulty > 0 ? '★'.repeat(m.difficulty) : '';
      const hasDraft = edited.has(m.id);
      html += `<button type="button" class="module-item${active ? ' is-active' : ''}${m.isAssembly ? ' is-assembly' : ''}${hasDraft ? ' has-draft' : ''}" data-id="${m.id}" title="${escapeAttr(m.title)}">
        <span class="mi-id">${m.id}</span>
        <span class="mi-name">${escapeHtml(m.key)}</span>
        <span class="mi-stars">${stars}</span>
        <span class="mi-flag"></span>
      </button>`;
    }

    el.moduleList.innerHTML = html || '<div class="empty-note">没有匹配的模块。</div>';

    const practiceCount = state.modules.filter((m) => !m.isAssembly).length;
    const done = draftCount();
    el.progressMiniFill.style.width = `${Math.round((done / Math.max(1, practiceCount)) * 100)}%`;
    el.progressMiniText.textContent = `练习进度 ${done} / ${practiceCount}`;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ======================================================================
  // 模块头部
  // ======================================================================
  function renderHeader() {
    const m = current();
    if (!m) return;
    el.mhId.textContent = m.id;
    el.mhName.textContent = m.key;
    el.mhSummary.textContent = m.summary;

    el.mhDiff.hidden = m.isAssembly;
    if (!m.isAssembly) {
      el.mhDiff.textContent = `难度 ${'★'.repeat(m.difficulty)}${'☆'.repeat(Math.max(0, 3 - m.difficulty))}`;
    }

    if (m.isAssembly) {
      el.mhDeps.hidden = true;
    } else {
      el.mhDeps.hidden = false;
      el.mhDeps.textContent = m.depLabels.length ? `依赖: ${m.depLabels.join('  ')}` : '依赖: 无（最底层模块）';
    }

    el.mhLines.textContent = `约 ${m.codeLineCount} 行代码`;
    el.readCardTitle.textContent = m.isAssembly ? '完整源码（拼装视图）' : `模块 ${m.id} · ${m.key}`;
    el.sbModule.textContent = `${currentBook().name} · 模块 ${m.id} / ${state.modules.length}`;
    syncViewButtons();
  }

  // ======================================================================
  // 阅读模式
  // ======================================================================
  function renderRead() {
    const m = current();
    if (!m) return;
    const hot = state.lastResult && state.lastResult.diagnostics
      ? state.lastResult.diagnostics.map((d) => d.line)
      : [];
    el.codeView.innerHTML = HL.codeViewHtml(m.modes[state.mode], { hotLines: hot });
    el.codeView.parentElement.classList.remove('pane-fade');
    void el.codeView.offsetWidth;
    el.codeView.parentElement.classList.add('pane-fade');
  }

  // ======================================================================
  // 练习模式
  // ======================================================================

  /**
   * 脚手架里，用户真正的答案位于"轮到你了"提示块和"测试驱动"之间。
   * 直接拿整个编辑器内容去和官方实现对比，会把其它模块的代码也算成"多写"，
   * 所以这里先把答案区截出来。
   */
  function extractAnswer(text) {
    const src = String(text || '');
    const startRe = /\/\* =+[^\n]*\n \*  轮到你了[\s\S]*?\*\//;
    const startMatch = src.match(startRe);
    if (!startMatch) return src;
    let rest = src.slice(startMatch.index + startMatch[0].length);
    const endRe = /\/\* =+ 测试驱动/;
    const endMatch = rest.match(endRe);
    if (endMatch) rest = rest.slice(0, endMatch.index);
    return rest;
  }

  /** 「轮到你了」提示块结束后的那一行 —— 也就是用户该开始写的位置 */
  function blankStartLine(text) {
    const src = String(text || '');
    const start = src.search(/\/\* =+[^\n]*\n \*  轮到你了/);
    if (start < 0) return 0;
    const end = src.indexOf('*/', start);
    if (end < 0) return 0;
    return src.slice(0, end).split('\n').length + 1;
  }

  /** 默写区是不是还空着（忽略注释和空白） */
  function isAnswerEmpty(text) {
    return extractAnswer(text)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '')
      .trim().length === 0;
  }

  function renderReference() {
    const m = current();
    if (!m || !m.hasPractice) return;

    if (state.compareMode) {
      const answer = extractAnswer(editor.getValue());
      const result = window.LS.diff.render(answer, m.modes[state.mode]);
      el.refView.innerHTML = result.html;
      el.refCardTitle.textContent = '对比结果（- 漏写 / + 多写 / ~ 写法不同）';
      const s = result.stats;
      el.sbRight.textContent = `一致 ${s.same} 行 · 写法不同 ${s.changed} 行 · 漏写 ${s.missing} 行 · 多写 ${s.extra} 行`;
    } else {
      el.refView.innerHTML = HL.codeViewHtml(m.modes[state.mode]);
      el.refCardTitle.textContent = `官方实现 · ${modeLabel(state.mode)}`;
      el.sbRight.textContent = '';
    }
  }

  function modeLabel(mode) {
    return { detail: '详细注释', short: '精简注释', none: '无注释' }[mode] || mode;
  }

  /** 脚手架在启动时就随 init 一起下发，取用是同步的 */
  function getScaffold(moduleId) {
    return (state.scaffolds && state.scaffolds[moduleId]) || '';
  }

  function enterPractice(forceScaffold) {
    const m = current();
    if (!m || !m.hasPractice) return;

    const draft = draftMap()[m.id];
    const text = (draft != null && !forceScaffold) ? draft : getScaffold(m.id);
    editor.setValue(text);

    // 关键：把视图停在「轮到你了」那块空白上。
    // 否则用户一进来看到的是文件末尾的测试驱动，会以为那就是全部内容，
    // 直接点运行就会撞上一堆 implicit declaration —— 那不是写错了，是还没开始写。
    const blank = blankStartLine(text);
    if (blank > 0) editor.goToLine(blank);

    renderReference();
    updateStateLabel();
  }

  // ======================================================================
  // 输出面板
  // ======================================================================
  function setOutputCollapsed(collapsed) {
    el.outputPanel.classList.toggle('is-collapsed', collapsed);
    el.btnToggleOutput.setAttribute('aria-expanded', String(!collapsed));
  }

  function clearOutput() {
    el.outputContent.hidden = true;
    el.outputContent.innerHTML = '';
    el.outputPlaceholder.hidden = false;
    el.outputStatus.innerHTML = '';
  }

  function pill(text, kind) {
    return `<span class="pill pill-${kind}">${escapeHtml(text)}</span>`;
  }

  /**
   * @param {object} result 主进程返回的编译/运行结果
   * @param {string} [hint] 额外插在最前面的引导提示（允许内联标签）
   */
  function renderOutput(result, hint) {
    const blocks = [];

    // 有了针对性的引导，编译器那几句通用提示（"没有 main 函数"之类）
    // 就是在重复同一件事，反而显得吵，这里跳过。
    const skipGeneric = !!hint;

    // —— 引导提示 ——
    if (hint) {
      blocks.push(`<div class="out-block"><div class="out-hint"><span>${hint}</span></div></div>`);
    }

    // —— 结果摘要 ——
    // 「没有编译器」「编辑器是空的」「跑太久被终止」这类信息必须让用户看到，
    // 它们没有 stdout / stderr / 诊断，只存在于 message 里。
    if (result.message && !skipGeneric) {
      const emphasise = result.stage === 'empty'
        || result.stage === 'no-compiler'
        || result.timedOut;
      blocks.push(`<div class="out-block">${emphasise
        ? `<div class="out-hint"><span>${escapeHtml(result.message)}</span></div>`
        : `<div class="out-line is-message">${escapeHtml(result.message)}</div>`}</div>`);
    }

    // —— 诊断信息 ——
    if (result.diagnostics && result.diagnostics.length) {
      const items = result.diagnostics.map((d) => {
        const kind = d.severity === 'warning' ? 'warning' : d.severity === 'note' ? 'note' : 'error';
        const loc = `${d.line}:${d.col || 0}`;
        return `<button type="button" class="diag is-${kind}" data-line="${d.line}">
          <span class="diag-loc">${loc}</span>
          <span class="diag-msg">${escapeHtml(d.message)}</span>
        </button>`;
      }).join('');
      blocks.push(`<div class="out-block"><div class="out-label">编译器诊断（点行号跳转）</div>${items}</div>`);
    }

    // —— 标准输出 ——
    if (result.stdout && result.stdout.trim()) {
      const lines = result.stdout.replace(/\s+$/, '').split('\n')
        .map((l) => `<div class="out-line is-stdout">${escapeHtml(l) || '&nbsp;'}</div>`).join('');
      blocks.push(`<div class="out-block"><div class="out-label">程序输出 (stdout)</div>${lines}</div>`);
    }

    // —— 标准错误 ——
    if (result.stderr && result.stderr.trim()) {
      const lines = result.stderr.replace(/\s+$/, '').split('\n')
        .map((l) => `<div class="out-line is-stderr">${escapeHtml(l) || '&nbsp;'}</div>`).join('');
      blocks.push(`<div class="out-block"><div class="out-label">错误输出 (stderr)</div>${lines}</div>`);
    }

    // —— 编译失败、解析不出任何诊断、而且前面也没展示过 stderr ——
    // 这时才需要把编译器的原始输出摊出来，否则就是同一段内容显示两遍
    const stderrShown = !!(result.stderr && result.stderr.trim());
    if (!result.ok && !stderrShown
      && (!result.diagnostics || result.diagnostics.length === 0)
      && result.stdout && result.stdout.trim()) {
      const lines = result.stdout.replace(/\s+$/, '').split('\n')
        .map((l) => `<div class="out-line is-stderr">${escapeHtml(l) || '&nbsp;'}</div>`).join('');
      blocks.push(`<div class="out-block"><div class="out-label">编译器原始输出</div>${lines}</div>`);
    }

    // —— 缺少 main 的友好提示 ——
    if (result.hasMain === false && !skipGeneric) {
      blocks.push(`<div class="out-block"><div class="out-hint">
        <span>这段代码没有 main 函数，无法直接运行。</span>
        <button type="button" class="btn btn-mini" id="btnFillScaffold">补全脚手架</button>
      </div></div>`);
    }

    if (!blocks.length) {
      blocks.push('<div class="out-block"><div class="out-line is-message">程序没有任何输出。</div></div>');
    }

    el.outputContent.innerHTML = blocks.join('');
    el.outputPlaceholder.hidden = true;
    el.outputContent.hidden = false;

    // —— 顶部状态 ——
    const pills = [];
    if (result.compiler) pills.push(pill(`${result.compiler}${result.compilerVersion ? ' ' + result.compilerVersion : ''}`, 'info'));
    if (result.ok) pills.push(pill('运行成功', 'ok'));
    else if (result.stage === 'compile') pills.push(pill('编译失败', 'err'));
    else if (result.stage === 'no-compiler') pills.push(pill('没有编译器', 'err'));
    else pills.push(pill('运行异常', 'err'));
    if (typeof result.compileMs === 'number') pills.push(pill(`编译 ${result.compileMs} ms`, 'info'));
    if (typeof result.runMs === 'number') pills.push(pill(`运行 ${result.runMs} ms`, 'info'));
    if (typeof result.exitCode === 'number' && result.exitCode !== 0) pills.push(pill(`退出码 ${result.exitCode}`, 'warn'));
    const warnCount = (result.diagnostics || []).filter((d) => d.severity === 'warning').length;
    if (warnCount) pills.push(pill(`${warnCount} 个警告`, 'warn'));

    el.outputStatus.innerHTML = pills.join('');

    // —— 点行号跳转 ——
    el.outputContent.querySelectorAll('.diag').forEach((btn) => {
      btn.addEventListener('click', () => {
        const line = parseInt(btn.dataset.line, 10);
        if (state.view !== 'practice') switchView('practice');
        editor.goToLine(line);
      });
    });
    const fill = el.outputContent.querySelector('#btnFillScaffold');
    if (fill) fill.addEventListener('click', () => fillScaffold(true));
  }

  function updateStateLabel() {
    const m = current();
    const edited = m && editedSet().has(m.id);
    if (!m || !m.hasPractice) {
      el.sbState.textContent = '阅读中';
      el.sbState.className = 'sb-group sb-state';
      return;
    }
    el.sbState.textContent = edited ? '已修改' : '未修改';
    el.sbState.className = `sb-group sb-state ${edited ? 'is-dirty' : ''}`;
  }

  // ======================================================================
  // 运行
  // ======================================================================
  /**
   * 统一的运行入口。
   * @param {string} source 要编译运行的源码
   * @param {boolean} fromEditor 是否来自编辑器（决定要不要标错误行、跳行）
   */
  async function runSource(source, fromEditor) {
    const m = current();
    state.running = true;
    el.btnRun.disabled = true;
    el.outputStatus.innerHTML = pill('编译中…', 'info');
    setOutputCollapsed(false);
    el.outputPlaceholder.hidden = true;
    el.outputContent.hidden = false;
    el.outputContent.innerHTML = '<div class="out-block"><div class="out-line is-message">正在调用编译器…</div></div>';

    // 默写区还是空的：这时编译必然失败，但那不是"写错了"，先把原因讲清楚
    const notStarted = fromEditor && isAnswerEmpty(source);

    try {
      const result = await window.studio.run(source);
      state.lastResult = result;

      let hint = '';
      if (notStarted) {
        // 不同模块"没写会怎样"的说法不一样，别硬套同一句话
        let why;
        if (m.key === 'main') {
          why = '整个程序还缺一个 <b>main</b> 函数，链接会失败';
        } else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(m.key)) {
          why = `脚手架后面的测试驱动会调用 <b>${escapeHtml(m.key)}(…)</b>，`
            + '编译器会说它 “implicit declaration”';
        } else {
          why = '脚手架后面的测试驱动要用到这里定义的类型，'
            + '编译器会一路报 “unknown type name”';
        }
        hint = `模块 ${m.id} 的「轮到你了」下面还是空的 —— ${why}。`
          + '把「轮到你了」下面那一段补上，再按 Ctrl + Enter 就好。';
      }
      renderOutput(result, hint);

      const errLines = (result.diagnostics || [])
        .filter((d) => d.severity === 'error')
        .map((d) => d.line);
      editor.setErrorLines(fromEditor && !notStarted ? errLines : []);

      if (notStarted) {
        // 别把用户丢到测试驱动的报错行上去，送回到他该写字的地方
        const blank = blankStartLine(source);
        if (blank > 0) editor.goToLine(blank);
      } else if (fromEditor) {
        const firstError = (result.diagnostics || []).find((d) => d.severity === 'error');
        if (firstError) editor.goToLine(firstError.line);
      }

      // 阅读模式下重新渲染一次，让出错的行在行号栏标红
      if (state.view === 'read') renderRead();
    } catch (err) {
      renderOutput({
        ok: false,
        stage: 'run',
        message: '调用编译器时出错。',
        stdout: '',
        stderr: String((err && err.message) || err),
        diagnostics: [],
      });
    } finally {
      state.running = false;
      el.btnRun.disabled = false;
    }
  }

  async function run() {
    if (state.running) return;
    const m = current();
    if (!m) return;

    // 「完整源码」本身就是一份可以直接编译运行的完整程序，
    // 所以阅读模式下点运行就是跑它 —— 绝不能去碰编辑器里
    // 可能残留的、别的模块的草稿（那样报的错和屏幕上看到的代码毫无关系）。
    if (m.isAssembly) {
      await runSource(m.modes[state.mode], false);
      return;
    }

    if (state.view !== 'practice') {
      switchView('practice');
      // 兜底：万一没能切进练习模式，就不要拿编辑器内容去编译
      if (state.view !== 'practice') return;
      await new Promise((r) => setTimeout(r, 30));
    }
    await runSource(editor.getValue(), true);
  }

  function fillScaffold(confirmFirst) {
    const m = current();
    if (!m || !m.hasPractice) return;
    if (confirmFirst && editor.getValue().trim()) {
      const yes = window.confirm('补全脚手架会覆盖编辑器里的内容（草稿仍会保留到下次进入）。确定继续吗？');
      if (!yes) return;
    }
    const scaffold = getScaffold(m.id);
    editor.setValue(scaffold);
    draftMap()[m.id] = scaffold;
    editedSet().add(m.id);
    renderSidebar();
    updateStateLabel();
    saveDrafts();
    editor.focus();
  }

  // ======================================================================
  // 视图 / 模块切换
  // ======================================================================
  function switchView(view) {
    const m = current();
    let target = view;
    if (view === 'practice' && (!m || !m.hasPractice)) target = 'read';
    state.view = target;

    syncViewButtons();
    el.paneRead.hidden = target !== 'read';
    el.panePractice.hidden = target !== 'practice';

    if (target === 'read') {
      renderRead();
    } else {
      enterPractice(false);
    }
    saveSettings();
  }

  /**
   * 视图按钮的"选中态"和"是否可用"必须跟着当前模块走。
   * 模块 13（完整源码）是拼装视图，没有默写练习，切到它时：
   *   - 「练习模式」置灰（并在 title 里说明原因）
   *   - 「重置」「对比」也一并置灰，它们都是练习相关的操作
   *   - 运行按钮改叫「运行完整源码」，因为这时跑的就是屏幕上的那份完整程序
   */
  function syncViewButtons() {
    const m = current();
    const noPractice = !!(m && !m.hasPractice);

    el.viewModes.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.view === state.view);
    });

    const practiceBtn = el.viewModes.querySelector('[data-view="practice"]');
    if (practiceBtn) {
      practiceBtn.disabled = noPractice;
      practiceBtn.title = noPractice
        ? '「完整源码」是把各模块拼起来的视图，没有默写练习'
        : '进入练习模式：默写 + 编译运行';
    }

    el.btnReset.disabled = noPractice;
    el.btnReset.title = noPractice
      ? '「完整源码」视图没有默写练习，不需要重置'
      : '清空编辑器，恢复空白默写';
    el.btnCompare.disabled = noPractice;
    el.btnCompare.title = noPractice
      ? '「完整源码」视图没有默写练习，无法对比'
      : '和当前模块的官方实现做 diff 对比';

    el.btnRun.innerHTML = noPractice
      ? '<span class="play" aria-hidden="true">▶</span> 运行完整源码'
      : '<span class="play" aria-hidden="true">▶</span> 运行';
    el.btnRun.title = noPractice
      ? '编译并运行这份拼装出来的完整程序'
      : '编译并运行编辑器里的代码（Ctrl + Enter）';
  }

  // ======================================================================
  // 教材切换
  // ======================================================================
  /** 把当前教材的模块与脚手架装进 state */
  function applyBook() {
    const book = currentBook();
    state.modules = book.modules || [];
    state.scaffolds = book.scaffolds || {};
  }

  /**
   * 换一本教材。参考代码、草稿、进度、上次看的模块都是分开的，
   * 所以这里除了换数据，还要把"属于上一本教材"的现场清干净。
   */
  function switchBook(id) {
    const idx = state.books.findIndex((b) => b.id === id);
    if (idx < 0 || idx === state.bookIndex) return;

    saveDraftForCurrent();
    state.bookIndex = idx;
    applyBook();

    // 回到这本教材上次看的模块
    const lastId = state.lastModule[id];
    const mi = state.modules.findIndex((m) => m.id === lastId);
    state.index = mi >= 0 ? mi : 0;

    // 换了教材，编辑器内容 / 输出 / 对比状态都不再适用
    state.compareMode = false;
    state.lastResult = null;
    clearOutput();
    editor.setValue('');
    editor.setErrorLines([]);
    el.sbRight.textContent = '';

    renderBookSwitch();
    renderSidebar();
    renderHeader();
    updateStateLabel();

    const m = current();
    if (state.view === 'practice' && m && m.hasPractice) {
      enterPractice(false);
    } else if (m && !m.hasPractice) {
      switchView('read');
    } else {
      renderRead();
    }
    saveSettings();
  }

  function switchModule(id) {
    const idx = state.modules.findIndex((m) => m.id === id);
    if (idx < 0 || idx === state.index) return;
    saveDraftForCurrent();
    state.index = idx;
    state.lastModule[currentBook().id] = id; // 每本教材各自记住看到哪
    state.compareMode = false;
    state.lastResult = null;
    clearOutput();
    renderSidebar();
    renderHeader();
    el.codeView.scrollTop = 0;

    const m = current();
    if (state.view === 'practice' && m.hasPractice) {
      enterPractice(false);
    } else {
      if (!m.hasPractice) switchView('read');
      else renderRead();
    }
    updateStateLabel();
    saveSettings();
    el.sbRight.textContent = '';
  }

  function step(delta) {
    const next = state.index + delta;
    if (next < 0 || next >= state.modules.length) return;
    switchModule(state.modules[next].id);
  }

  // ======================================================================
  // 设置 / 草稿
  // ======================================================================
  let settingsTimer = null;
  function saveSettings() {
    clearTimeout(settingsTimer);
    settingsTimer = setTimeout(() => {
      window.studio.saveSettings({
        theme: state.theme,
        mode: state.mode,
        view: state.view,
        bookId: currentBook().id,
        lastModule: { ...state.lastModule },
        refCollapsed: state.refCollapsed,
      });
    }, 250);
  }

  let draftsTimer = null;
  function saveDrafts() {
    clearTimeout(draftsTimer);
    draftsTimer = setTimeout(() => {
      window.studio.saveDrafts(state.drafts);
    }, 400);
  }

  function saveDraftForCurrent() {
    const m = current();
    if (!m || !m.hasPractice) return;
    if (state.view !== 'practice') return;
    if (editedSet().has(m.id)) draftMap()[m.id] = editor.getValue();
  }

  function onEditorChange() {
    const m = current();
    if (!m) return;
    editedSet().add(m.id);
    if (state.compareMode) renderReference();
    updateStateLabel();
    renderSidebar();
    saveDrafts();
  }

  // ======================================================================
  // 事件绑定
  // ======================================================================
  function bind() {
    el.bookSwitch.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-book]');
      if (btn) switchBook(btn.dataset.book);
    });

    el.moduleList.addEventListener('click', (e) => {
      const btn = e.target.closest('.module-item');
      if (btn) switchModule(btn.dataset.id);
    });

    el.searchInput.addEventListener('input', () => {
      state.filter = el.searchInput.value;
      renderSidebar();
    });

    el.commentModes.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-mode]');
      if (!btn) return;
      setCommentMode(btn.dataset.mode);
    });

    el.viewModes.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-view]');
      if (!btn || btn.disabled) return;
      switchView(btn.dataset.view);
    });

    el.btnPrev.addEventListener('click', () => step(-1));
    el.btnNext.addEventListener('click', () => step(1));

    el.btnTheme.addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
      saveSettings();
    });

    el.btnCopyCode.addEventListener('click', async () => {
      await window.studio.copy(current().modes[state.mode]);
      const old = el.btnCopyCode.textContent;
      el.btnCopyCode.textContent = '已复制';
      setTimeout(() => { el.btnCopyCode.textContent = old; }, 1200);
    });

    el.btnRun.addEventListener('click', run);
    el.btnReset.addEventListener('click', () => {
      if (state.view !== 'practice') switchView('practice');
      editor.setValue('');
      const m = current();
      if (m) {
        draftMap()[m.id] = '';
        editedSet().add(m.id);
        renderSidebar();
      }
      editor.setErrorLines([]);
      updateStateLabel();
      saveDrafts();
      editor.focus();
    });
    el.btnCompare.addEventListener('click', () => {
      state.compareMode = !state.compareMode;
      if (state.view !== 'practice') switchView('practice');
      else renderReference();
      el.refCard.classList.remove('is-collapsed');
      state.refCollapsed = false;
      el.btnCollapseRef.textContent = '折叠';
    });

    el.btnDiff.addEventListener('click', () => {
      state.compareMode = !state.compareMode;
      renderReference();
    });

    el.btnCollapseRef.addEventListener('click', () => {
      state.refCollapsed = !state.refCollapsed;
      el.refCard.classList.toggle('is-collapsed', state.refCollapsed);
      el.btnCollapseRef.textContent = state.refCollapsed ? '展开' : '折叠';
      saveSettings();
    });

    el.btnScaffold.addEventListener('click', () => fillScaffold(true));
    el.btnBlank.addEventListener('click', () => {
      if (editor.getValue().trim() && !window.confirm('清空编辑器，恢复空白默写？')) return;
      editor.setValue('');
      editor.setErrorLines([]);
      const m = current();
      if (m) { draftMap()[m.id] = ''; editedSet().add(m.id); renderSidebar(); }
      updateStateLabel();
      saveDrafts();
      editor.focus();
    });

    el.btnToggleOutput.addEventListener('click', () => {
      setOutputCollapsed(!el.outputPanel.classList.contains('is-collapsed'));
    });

    // 快捷键
    document.addEventListener('keydown', (e) => {
      const tag = (e.target && e.target.tagName) || '';
      const typing = tag === 'TEXTAREA' || tag === 'INPUT';

      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        run();
        return;
      }
      if (typing) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === '1') setCommentMode('detail');
      else if (e.key === '2') setCommentMode('short');
      else if (e.key === '3') setCommentMode('none');
    });

    window.addEventListener('beforeunload', () => {
      saveDraftForCurrent();
      window.studio.saveDrafts(state.drafts);
      window.studio.saveSettings({
        theme: state.theme, mode: state.mode, view: state.view,
        bookId: currentBook().id,
        lastModule: { ...state.lastModule },
        refCollapsed: state.refCollapsed,
      });
    });
  }

  function syncCommentButtons() {
    el.commentModes.querySelectorAll('button[data-mode]').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.mode === state.mode);
    });
  }

  /** 切换注释模式：阅读模式刷新代码视图，练习模式刷新右侧参照物 */
  function setCommentMode(mode) {
    if (!['detail', 'short', 'none'].includes(mode)) return;
    state.mode = mode;
    syncCommentButtons();
    if (state.view === 'practice' && current() && current().hasPractice) renderReference();
    else renderRead();
    saveSettings();
  }

  function setCompilerStatus() {
    const gcc = state.compilers.find((c) => c.kind === 'gcc');
    const tcc = state.compilers.find((c) => c.kind === 'tcc');
    if (gcc) {
      el.sbCompilerDot.className = 'sb-dot is-ok';
      el.sbCompiler.textContent = `gcc ${gcc.version} 已就绪`;
      el.sbCompiler.title = gcc.path;
      return;
    }
    if (tcc) {
      el.sbCompilerDot.className = 'sb-dot is-ok';
      el.sbCompiler.textContent = `未检测到 gcc，已启用内置 TCC ${tcc.version}`;
      el.sbCompiler.title = tcc.path;
      return;
    }
    el.sbCompilerDot.className = 'sb-dot is-err';
    el.sbCompiler.textContent = '没有找到可用的 C 编译器';
  }

  // ======================================================================
  // 启动
  // ======================================================================
  async function init() {
    const data = await window.studio.init();
    state.books = data.books || [];
    state.compilers = data.compilers;
    state.drafts = data.drafts || {};

    const s = data.settings || {};
    state.lastModule = s.lastModule || {};

    // 有草稿且内容非空的模块算作"练习过"（按教材分别统计）
    for (const book of state.books) {
      const set = new Set();
      for (const [id, text] of Object.entries(state.drafts[book.id] || {})) {
        if (typeof text === 'string' && text.trim()) set.add(id);
      }
      state.edited[book.id] = set;
    }

    applyTheme(s.theme || 'light');
    state.mode = ['detail', 'short', 'none'].includes(s.mode) ? s.mode : 'detail';
    state.refCollapsed = !!s.refCollapsed;
    el.refCard.classList.toggle('is-collapsed', state.refCollapsed);
    el.btnCollapseRef.textContent = state.refCollapsed ? '展开' : '折叠';

    // 定位到上次那本教材、那本教材上次看的模块
    const bookIdx = Math.max(0, state.books.findIndex((b) => b.id === s.bookId));
    state.bookIndex = bookIdx;
    applyBook();

    const lastId = state.lastModule[currentBook().id];
    state.index = Math.max(0, state.modules.findIndex((m) => m.id === lastId));
    if (state.index < 0) state.index = 0;

    editor = window.LS.createEditor({
      input: el.editorInput,
      highlightCode: el.editorHighlightCode,
      gutter: el.editorGutter,
      onChange: onEditorChange,
      onRun: run,
    });

    syncCommentButtons();
    setCompilerStatus();
    renderBookSwitch();
    renderSidebar();
    renderHeader();
    updateStateLabel();
    el.sbRight.textContent = `LinkList Studio v${data.appVersion}`;

    bind();

    const initialView = ['read', 'practice'].includes(s.view) ? s.view : 'read';
    switchView(initialView === 'practice' && !current().hasPractice ? 'read' : initialView);

    // 没有 gcc 时提示一次
    if (!state.compilers.some((c) => c.kind === 'gcc') && state.compilers.some((c) => c.kind === 'tcc')) {
      el.outputStatus.innerHTML = pill('已启用内置 TCC', 'info');
      el.outputContent.hidden = true;
      el.outputPlaceholder.hidden = false;
      el.outputPlaceholder.textContent = '这台机器上没有检测到 gcc，已自动启用内置的 TCC 编译器 —— 打开练习模式后按 Ctrl + Enter 即可编译运行。装了 gcc 之后重启应用会自动优先使用 gcc。';
    }

    // 一切就绪，通知主进程可以显示窗口了（避免启动时闪白屏）
    window.studio.ready();
  }

  init().catch((err) => {
    document.body.innerHTML = `<div class="empty-note">启动失败：${escapeHtml(String((err && err.message) || err))}</div>`;
    try { window.studio.ready(); } catch { /* ignore */ }
  });
})();
