/* ==========================================================================
   LinkList Studio —— Web 版主逻辑
   ---------------------------------------------------------------------------
   与桌面版的差别只有两处：

     1. 数据来自构建时生成的 app/data.js（含三档注释、脚手架、以及用真 gcc
        跑出来的"参考实现标准输出"），不再有 IPC；
     2. 浏览器里没有 C 编译器，所以「预期输出」展示的是参考实现真跑出来的结果，
        而不是你的代码的运行结果 —— 这一点在界面上明确说明，不糊弄人。

   渲染层（语法高亮 / diff / 编辑器）是与桌面版完全相同的三份文件。
   ========================================================================== */
(function () {
  'use strict';

  const HL = window.LS.highlight;
  const DATA = window.LLS_DATA || { books: [] };
  const $ = (id) => document.getElementById(id);
  const REPO = 'https://github.com/castoricelover777/linklist-studio';
  const RELEASES = REPO + '/releases/latest';

  const el = {
    html: document.documentElement,
    bookSwitch: $('bookSwitch'),
    searchInput: $('searchInput'),
    moduleList: $('moduleList'),
    progressMiniFill: $('progressMiniFill'),
    progressMiniText: $('progressMiniText'),

    mhId: $('mhId'), mhName: $('mhName'), mhSummary: $('mhSummary'),
    mhDiff: $('mhDiff'), mhDeps: $('mhDeps'), mhLines: $('mhLines'),

    commentModes: $('commentModes'), viewModes: $('viewModes'),
    btnPrev: $('btnPrev'), btnNext: $('btnNext'), btnTheme: $('btnTheme'),

    paneRead: $('paneRead'), panePractice: $('panePractice'),
    readCardTitle: $('readCardTitle'), codeView: $('codeView'), btnCopyCode: $('btnCopyCode'),
    animCard: $('animCard'), animImg: $('animImg'), btnToggleAnim: $('btnToggleAnim'),

    editorInput: $('editorInput'), editorGutter: $('editorGutter'),
    editorHighlightCode: $('editorHighlightCode'),
    refCard: $('refCard'), refView: $('refView'), refCardTitle: $('refCardTitle'),
    btnDiff: $('btnDiff'), btnCollapseRef: $('btnCollapseRef'),
    btnScaffold: $('btnScaffold'), btnBlank: $('btnBlank'),

    outputPanel: $('outputPanel'), btnToggleOutput: $('btnToggleOutput'),
    outputContent: $('outputContent'), outputPlaceholder: $('outputPlaceholder'),
    outputStatus: $('outputStatus'), btnRun: $('btnRun'), btnCompare: $('btnCompare'),

    sbModule: $('sbModule'), sbState: $('sbState'), sbCompiler: $('sbCompiler'),
  };

  const state = {
    books: DATA.books,
    bookIndex: 0,
    modules: [],
    index: 0,
    mode: 'detail',
    view: 'read',
    theme: 'light',
    drafts: {},          // { bookId: { moduleId: text } }
    edited: {},          // { bookId: Set(moduleId) }
    lastModule: {},      // { bookId: moduleId }
    compareMode: false,
    refCollapsed: false,
    animCollapsed: false,
    filter: '',
  };

  let editor = null;

  const book = () => state.books[state.bookIndex] || { id: '', name: '', modules: [] };
  const current = () => state.modules[state.index];
  const editedSet = () => (state.edited[book().id] || (state.edited[book().id] = new Set()));
  const draftMap = () => (state.drafts[book().id] || (state.drafts[book().id] = {}));

  // ---------------------------------------------------------------- 存储
  function loadStore() {
    try {
      const d = JSON.parse(localStorage.getItem('lls.drafts') || '{}');
      if (d && typeof d === 'object') state.drafts = d;
    } catch { /* 忽略 */ }
    try {
      const s = JSON.parse(localStorage.getItem('lls.settings') || '{}');
      state.theme = s.theme === 'dark' ? 'dark' : 'light';
      state.mode = ['detail', 'short', 'none'].includes(s.mode) ? s.mode : 'detail';
      state.view = ['read', 'practice'].includes(s.view) ? s.view : 'read';
      state.lastModule = s.lastModule || {};
      state.refCollapsed = !!s.refCollapsed;
      state.animCollapsed = !!s.animCollapsed;
      const bi = state.books.findIndex((b) => b.id === s.bookId);
      state.bookIndex = bi >= 0 ? bi : 0;
    } catch { /* 忽略 */ }
  }

  let draftsTimer = null;
  function saveDrafts() {
    clearTimeout(draftsTimer);
    draftsTimer = setTimeout(() => {
      try { localStorage.setItem('lls.drafts', JSON.stringify(state.drafts)); } catch { /* 配额满 */ }
    }, 350);
  }
  function saveSettings() {
    try {
      localStorage.setItem('lls.settings', JSON.stringify({
        theme: state.theme, mode: state.mode, view: state.view,
        bookId: book().id, lastModule: state.lastModule,
        refCollapsed: state.refCollapsed, animCollapsed: state.animCollapsed,
      }));
    } catch { /* 忽略 */ }
  }

  // ---------------------------------------------------------------- 脚手架辅助
  function extractAnswer(text) {
    const src = String(text || '');
    const m = src.match(/\/\* =+[^\n]*\n \*  轮到你了[\s\S]*?\*\//);
    if (!m) return src;
    let rest = src.slice(m.index + m[0].length);
    const e = rest.match(/\/\* =+ 测试驱动/);
    if (e) rest = rest.slice(0, e.index);
    return rest;
  }
  function blankStartLine(text) {
    const src = String(text || '');
    const start = src.search(/\/\* =+[^\n]*\n \*  轮到你了/);
    if (start < 0) return 0;
    const end = src.indexOf('*/', start);
    if (end < 0) return 0;
    return src.slice(0, end).split('\n').length + 1;
  }
  function isAnswerEmpty(text) {
    return extractAnswer(text)
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').trim().length === 0;
  }

  // ---------------------------------------------------------------- 主题
  function applyTheme(t) {
    state.theme = t === 'dark' ? 'dark' : 'light';
    el.html.dataset.theme = state.theme;
    el.btnTheme.textContent = state.theme === 'dark' ? '浅色' : '深色';
  }

  // ---------------------------------------------------------------- 侧栏
  function renderBookSwitch() {
    el.bookSwitch.innerHTML = state.books.map((b) =>
      `<button type="button" data-book="${b.id}" class="${b.id === book().id ? 'is-active' : ''}"
        title="${esc(b.name + ' · ' + b.subtitle)}">${esc(b.name)}</button>`).join('');
  }

  function draftCount() {
    const e = editedSet();
    return state.modules.filter((m) => e.has(m.id)).length;
  }

  function renderSidebar() {
    const filter = state.filter.trim().toLowerCase();
    const edited = editedSet();
    let html = '';
    let asmAdded = false;
    for (const m of state.modules) {
      if (filter && !`${m.id} ${m.key} ${m.title}`.toLowerCase().includes(filter)) continue;
      if (m.isAssembly && !asmAdded) {
        html += '<div class="module-group-label">拼装视图</div>';
        asmAdded = true;
      }
      const active = current() && current().id === m.id;
      const stars = m.difficulty > 0 ? '★'.repeat(m.difficulty) : '';
      html += `<button type="button" class="module-item${active ? ' is-active' : ''}${m.isAssembly ? ' is-assembly' : ''}${edited.has(m.id) ? ' has-draft' : ''}"
        data-id="${m.id}" title="${esc(m.title)}">
        <span class="mi-id">${m.id}</span>
        <span class="mi-name">${esc(m.key)}</span>
        <span class="mi-stars">${stars}</span>
        <span class="mi-flag"></span></button>`;
    }
    el.moduleList.innerHTML = html || '<div class="empty-note">没有匹配的模块。</div>';
    const total = state.modules.filter((m) => !m.isAssembly).length;
    const done = draftCount();
    el.progressMiniFill.style.width = `${Math.round((done / Math.max(1, total)) * 100)}%`;
    el.progressMiniText.textContent = `练习进度 ${done} / ${total}`;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  // ---------------------------------------------------------------- 头部
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
    el.mhDeps.hidden = m.isAssembly;
    if (!m.isAssembly) {
      el.mhDeps.textContent = m.depLabels.length ? `依赖: ${m.depLabels.join('  ')}` : '依赖: 无（最底层模块）';
    }
    el.mhLines.textContent = `约 ${m.codeLineCount} 行代码`;
    el.readCardTitle.textContent = m.isAssembly ? '完整源码（拼装视图）' : `模块 ${m.id} · ${m.key}`;
    document.title = `${m.id} ${m.key} · LinkList Studio`;
    el.sbModule.textContent = `${book().name} · 模块 ${m.id} / ${state.modules.length}`;
    syncViewButtons();
  }

  function syncViewButtons() {
    const m = current();
    const noPractice = !!(m && !m.hasPractice);
    el.viewModes.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.view === state.view);
    });
    const pb = el.viewModes.querySelector('[data-view="practice"]');
    if (pb) {
      pb.disabled = noPractice;
      pb.title = noPractice ? '「完整源码」是拼装视图，没有默写练习' : '进入练习模式：默写 + 对照';
    }
    el.btnCompare.disabled = noPractice;
    el.btnRun.disabled = noPractice;
    el.btnRun.title = noPractice
      ? '「完整源码」是拼装视图，没有对应的练习输出'
      : '看参考实现真跑出来的标准输出（浏览器无法编译你的代码）';
  }

  // ---------------------------------------------------------------- 阅读模式
  function renderRead() {
    const m = current();
    if (!m) return;
    el.codeView.innerHTML = HL.codeViewHtml(m.modes[state.mode], {});
    el.codeView.parentElement.classList.remove('pane-fade');
    void el.codeView.offsetWidth;
    el.codeView.parentElement.classList.add('pane-fade');

    // 这个模块的动画演示
    if (m.animation) {
      el.animCard.hidden = false;
      el.animImg.src = m.animation;
      el.animImg.alt = `${m.id} ${m.key} 的动画演示`;
      el.animCard.classList.toggle('is-collapsed', state.animCollapsed);
      el.btnToggleAnim.textContent = state.animCollapsed ? '展开' : '折叠';
    } else {
      el.animCard.hidden = true;
      el.animImg.removeAttribute('src');
    }
  }

  // ---------------------------------------------------------------- 练习模式
  function renderReference() {
    const m = current();
    if (!m || !m.hasPractice) return;
    if (state.compareMode) {
      const r = window.LS.diff.render(extractAnswer(editor.getValue()), m.modes[state.mode]);
      el.refView.innerHTML = r.html;
      el.refCardTitle.textContent = '对比结果（- 漏写 / + 多写 / ~ 写法不同）';
      const s = r.stats;
      el.outputStatus.textContent = `一致 ${s.same} · 写法不同 ${s.changed} · 漏写 ${s.missing} · 多写 ${s.extra}`;
    } else {
      el.refView.innerHTML = HL.codeViewHtml(m.modes[state.mode]);
      el.refCardTitle.textContent = `官方实现 · ${label(state.mode)}`;
      el.outputStatus.textContent = '';
    }
  }
  const label = (m) => ({ detail: '详细注释', short: '精简注释', none: '无注释' }[m] || m);

  function enterPractice() {
    const m = current();
    if (!m || !m.hasPractice) return;
    const draft = draftMap()[m.id];
    const text = draft != null ? draft : (m.scaffold || '');
    editor.setValue(text);
    const blank = blankStartLine(text);
    if (blank > 0) editor.goToLine(blank);
    renderReference();
    updateState();
  }

  function updateState() {
    const m = current();
    if (!m || !m.hasPractice) {
      el.sbState.textContent = '阅读中';
      el.sbState.className = 'sb-group sb-state';
      return;
    }
    const dirty = editedSet().has(m.id);
    el.sbState.textContent = dirty ? '已修改' : '未修改';
    el.sbState.className = `sb-group sb-state ${dirty ? 'is-dirty' : ''}`;
  }

  // ---------------------------------------------------------------- 输出面板
  function clearOutput() {
    el.outputContent.hidden = true;
    el.outputContent.innerHTML = '';
    el.outputPlaceholder.hidden = false;
    el.outputStatus.textContent = '';
  }

  function showExpected() {
    const m = current();
    if (!m || !m.hasPractice) return;
    el.btnToggleOutput.setAttribute('aria-expanded', 'true');
    el.outputPanel.classList.remove('is-collapsed');
    el.outputPlaceholder.hidden = true;
    el.outputContent.hidden = false;
    el.outputStatus.textContent = '参考实现的标准输出';

    const started = isAnswerEmpty(editor.getValue());
    const blocks = [];

    blocks.push(`<div class="out-block"><div class="out-hint"><span>
      浏览器里没有 C 编译器，跑不了<b>你的</b>代码 —— 下面是<b>参考实现</b>
      （脚手架填上标准答案）真跑出来的结果，可以拿来对照自己的思路。
      想真编译运行，请用 <a href="${RELEASES}" target="_blank" rel="noopener">桌面版</a>。
    </span></div></div>`);

    if (started) {
      blocks.push(`<div class="out-block"><div class="out-line is-message">
        提示：模块 ${m.id} 的「轮到你了」下面还是空的。先把它写出来，再点「对比」逐行核对。
      </div></div>`);
    }

    if (m.expectedOutput) {
      const lines = m.expectedOutput.split('\n')
        .map((l) => `<div class="out-line is-stdout">${esc(l) || '&nbsp;'}</div>`).join('');
      blocks.push(`<div class="out-block"><div class="out-label">程序输出 (stdout)</div>${lines}</div>`);
    } else {
      blocks.push('<div class="out-block"><div class="out-line is-message">这份构建没有包含运行输出。</div></div>');
    }

    el.outputContent.innerHTML = blocks.join('');
  }

  // ---------------------------------------------------------------- 视图 / 模块
  function syncCommentButtons() {
    el.commentModes.querySelectorAll('button[data-mode]').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.mode === state.mode);
    });
  }

  function setCommentMode(mode) {
    if (!['detail', 'short', 'none'].includes(mode)) return;
    state.mode = mode;
    syncCommentButtons();
    if (state.view === 'practice' && current() && current().hasPractice) renderReference();
    else renderRead();
    saveSettings();
  }

  function switchView(view) {
    const m = current();
    let target = view;
    if (view === 'practice' && (!m || !m.hasPractice)) target = 'read';
    state.view = target;
    syncViewButtons();
    el.paneRead.hidden = target !== 'read';
    el.panePractice.hidden = target !== 'practice';
    if (target === 'read') renderRead(); else enterPractice();
    saveSettings();
  }

  function switchModule(id) {
    const idx = state.modules.findIndex((m) => m.id === id);
    if (idx < 0 || idx === state.index) return;
    saveDraftForCurrent();
    state.index = idx;
    state.lastModule[book().id] = id;
    state.compareMode = false;
    clearOutput();
    renderSidebar();
    renderHeader();
    el.codeView.scrollTop = 0;
    const m = current();
    if (state.view === 'practice' && m.hasPractice) enterPractice();
    else {
      if (!m.hasPractice) switchView('read');
      else renderRead();
    }
    updateState();
    saveSettings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function step(d) {
    const n = state.index + d;
    if (n < 0 || n >= state.modules.length) return;
    switchModule(state.modules[n].id);
  }

  function applyBook() {
    const b = book();
    state.modules = b.modules || [];
  }

  function switchBook(id) {
    const idx = state.books.findIndex((b) => b.id === id);
    if (idx < 0 || idx === state.bookIndex) return;
    saveDraftForCurrent();
    state.bookIndex = idx;
    applyBook();
    const last = state.lastModule[id];
    const mi = state.modules.findIndex((m) => m.id === last);
    state.index = mi >= 0 ? mi : 0;
    state.compareMode = false;
    clearOutput();
    editor.setValue('');
    renderBookSwitch();
    renderSidebar();
    renderHeader();
    updateState();
    const m = current();
    if (state.view === 'practice' && m && m.hasPractice) enterPractice();
    else if (m && !m.hasPractice) switchView('read');
    else renderRead();
    saveSettings();
  }

  // ---------------------------------------------------------------- 草稿
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
    updateState();
    renderSidebar();
    saveDrafts();
  }

  // ---------------------------------------------------------------- 事件
  function bind() {
    el.bookSwitch.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-book]');
      if (b) switchBook(b.dataset.book);
    });
    el.moduleList.addEventListener('click', (e) => {
      const b = e.target.closest('.module-item');
      if (b) switchModule(b.dataset.id);
    });
    el.searchInput.addEventListener('input', () => {
      state.filter = el.searchInput.value;
      renderSidebar();
    });
    el.commentModes.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-mode]');
      if (b) setCommentMode(b.dataset.mode);
    });
    el.viewModes.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-view]');
      if (b && !b.disabled) switchView(b.dataset.view);
    });
    el.btnPrev.addEventListener('click', () => step(-1));
    el.btnNext.addEventListener('click', () => step(1));
    el.btnTheme.addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
      saveSettings();
    });

    el.btnCopyCode.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(current().modes[state.mode]);
        const old = el.btnCopyCode.textContent;
        el.btnCopyCode.textContent = '已复制';
        setTimeout(() => { el.btnCopyCode.textContent = old; }, 1200);
      } catch { /* 剪贴板被拒 */ }
    });

    el.btnToggleAnim.addEventListener('click', () => {
      state.animCollapsed = !state.animCollapsed;
      el.animCard.classList.toggle('is-collapsed', state.animCollapsed);
      el.btnToggleAnim.textContent = state.animCollapsed ? '展开' : '折叠';
      saveSettings();
    });

    el.btnRun.addEventListener('click', showExpected);
    el.btnToggleOutput.addEventListener('click', () => {
      const c = el.outputPanel.classList.toggle('is-collapsed');
      el.btnToggleOutput.setAttribute('aria-expanded', String(!c));
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
    el.btnScaffold.addEventListener('click', () => {
      const m = current();
      if (!m || !m.hasPractice) return;
      if (editor.getValue().trim() && !confirm('补全脚手架会覆盖编辑器里的内容，确定吗？')) return;
      editor.setValue(m.scaffold || '');
      draftMap()[m.id] = m.scaffold || '';
      editedSet().add(m.id);
      renderSidebar();
      updateState();
      saveDrafts();
      const blank = blankStartLine(m.scaffold || '');
      if (blank > 0) editor.goToLine(blank);
    });
    el.btnBlank.addEventListener('click', () => {
      const m = current();
      if (!m) return;
      if (editor.getValue().trim() && !confirm('清空编辑器，恢复空白默写？')) return;
      editor.setValue('');
      draftMap()[m.id] = '';
      editedSet().add(m.id);
      renderSidebar();
      updateState();
      saveDrafts();
    });

    document.addEventListener('keydown', (e) => {
      const tag = (e.target && e.target.tagName) || '';
      const typing = tag === 'TEXTAREA' || tag === 'INPUT';
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        showExpected();
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
      try { localStorage.setItem('lls.drafts', JSON.stringify(state.drafts)); } catch { /* 忽略 */ }
    });
  }

  // ---------------------------------------------------------------- 启动
  function init() {
    if (!state.books.length) {
      document.body.innerHTML = '<div class="empty-note">数据没有加载成功（app/data.js）。</div>';
      return;
    }
    loadStore();
    applyTheme(state.theme);

    el.refCard.classList.toggle('is-collapsed', state.refCollapsed);
    el.btnCollapseRef.textContent = state.refCollapsed ? '展开' : '折叠';

    applyBook();
    const last = state.lastModule[book().id];
    const mi = state.modules.findIndex((m) => m.id === last);
    state.index = mi >= 0 ? mi : 0;

    // 有草稿的模块算"练习过"
    for (const b of state.books) {
      const set = new Set();
      for (const [id, text] of Object.entries(state.drafts[b.id] || {})) {
        if (typeof text === 'string' && text.trim()) set.add(id);
      }
      state.edited[b.id] = set;
    }

    editor = window.LS.createEditor({
      input: el.editorInput,
      highlightCode: el.editorHighlightCode,
      gutter: el.editorGutter,
      onChange: onEditorChange,
      onRun: showExpected,
    });

    syncCommentButtons();
    renderBookSwitch();
    renderSidebar();
    renderHeader();
    updateState();
    bind();

    const m = current();
    const v = state.view === 'practice' && m && m.hasPractice ? 'practice' : 'read';
    switchView(v);
  }

  init();
})();
