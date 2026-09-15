/* ==========================================================================
   DataStruct Studio —— 界面主逻辑
   ---------------------------------------------------------------------------
   数据全部来自 data/（按需加载，冷启动只读 tree.json）：
     启动      → tree.json                                章节树
     展开某章  → ch:<章>                                   模块元信息
     选中某节  → <节>                                      代码 + 动画关键帧
   ========================================================================== */
(function () {
  'use strict';

  const HL = window.LS.highlight;
  const DF = window.LS.diff;
  const $ = (id) => document.getElementById(id);

  const el = {
    app: document.querySelector('.app'),
    tree: $('tree'), searchInput: $('searchInput'), btnClearSearch: $('btnClearSearch'),
    btnCollapseSidebar: $('btnCollapseSidebar'),
    progressMiniFill: $('progressMiniFill'), progressMiniText: $('progressMiniText'),
    btnCoverage: $('btnCoverage'),

    mhBreadcrumb: $('mhBreadcrumb'), mhId: $('mhId'), mhName: $('mhName'), mhSummary: $('mhSummary'),
    mhDiff: $('mhDiff'), mhDeps: $('mhDeps'), mhLines: $('mhLines'), mhStatus: $('mhStatus'),

    commentModes: $('commentModes'), viewModes: $('viewModes'), kbdHint: $('kbdHint'),
    btnPrev: $('btnPrev'), btnNext: $('btnNext'), bigTabs: $('bigTabs'),

    paneRead: $('paneRead'), readCardTitle: $('readCardTitle'), codeView: $('codeView'), btnCopyCode: $('btnCopyCode'),
    panePractice: $('panePractice'), editorInput: $('editorInput'), editorGutter: $('editorGutter'),
    editorHighlightCode: $('editorHighlightCode'),
    ioTabs: $('ioTabs'), stdinBox: $('stdinBox'), stdinInput: $('stdinInput'),
    refCard: $('refCard'), refView: $('refView'), refCardTitle: $('refCardTitle'),
    btnDiff: $('btnDiff'), btnCollapseRef: $('btnCollapseRef'),
    btnScaffold: $('btnScaffold'), btnBlank: $('btnBlank'),

    paneCompare: $('paneCompare'), compareTitle: $('compareTitle'), syncScroll: $('syncScroll'),
    compareLeftHead: $('compareLeftHead'), compareRightHead: $('compareRightHead'),
    compareLeft: $('compareLeft'), compareRight: $('compareRight'),

    playerPanel: $('playerPanel'), playerHost: $('playerHost'),
    animCard: $('animCard'), animBody: $('animBody'), animCardTitle: $('animCardTitle'),
    btnCollapseAnim: $('btnCollapseAnim'), readSplit: document.querySelector('.read-split'),

    outputPanel: $('outputPanel'), btnToggleOutput: $('btnToggleOutput'), outputCaret: $('outputCaret'),
    outputPlaceholder: $('outputPlaceholder'), outputContent: $('outputContent'),
    outputStatus: $('outputStatus'), btnRun: $('btnRun'), btnCompare: $('btnCompare'),

    sbCompilerDot: $('sbCompilerDot'), sbCompiler: $('sbCompiler'), sbModule: $('sbModule'),
    sbState: $('sbState'), sbVersion: $('sbVersion'),

    coverageModal: $('coverageModal'), coverageBody: $('coverageBody'), btnCloseCoverage: $('btnCloseCoverage'),
  };

  const state = {
    tree: null,
    chapters: {},
    sections: {},
    moduleIndex: new Map(),
    expanded: {},

    moduleId: null,
    sectionId: null,
    viewId: null,
    mode: 'detail',
    view: 'read',
    theme: 'light',

    drafts: {},
    results: {},

    compareMode: false,
    refCollapsed: false,
    sidebarCollapsed: false,
    animCollapsed: false,
    compiler: null,
    runTimeoutMs: 8000,
    player: null,
    currentAnim: null,
    coverage: null,
  };

  const esc = (s) => String(s == null ? '' : s)
    .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const label = (m) => ({ detail: '详细注释', short: '精简注释', none: '无注释' }[m] || m);
  const sectionIdOf = (id) => (/^(\d{2}-\d{2})/.exec(id || '') || [])[1] || null;
  const chapterIdOf = (secId) => (secId ? secId.slice(0, 2) : null);

  const currentModule = () => (state.moduleId ? (state.moduleIndex.get(state.moduleId) || {}).module : null);

  /** 取某个模块的载荷（三档代码 / 脚手架 / 预期输出） */
  function codeOf(moduleId) {
    const secId = sectionIdOf(moduleId);
    const code = state.sections[secId] && state.sections[secId].code;
    if (!code) return null;
    if (code.views) {
      const entry = state.moduleIndex.get(moduleId);
      const v = entry && entry.viewId;
      return v && code.views[v] ? code.views[v][moduleId] : null;
    }
    return code.modules ? code.modules[moduleId] : null;
  }

  function sectionMeta(secId) {
    const ch = state.chapters[chapterIdOf(secId)];
    return ch ? ch.sections.find((s) => s.id === secId) : null;
  }

  // ============================================================ 持久化
  const store = (k, v) => { try { localStorage.setItem('ds.' + k, JSON.stringify(v)); } catch { /* 忽略 */ } };
  const restore = (k, d) => { try { const v = localStorage.getItem('ds.' + k); return v ? JSON.parse(v) : d; } catch { return d; } };

  let draftTimer = null;
  function saveDraftsSoon() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      const plain = { drafts: state.drafts, results: state.results };
      store('drafts', plain);
      if (window.studio && window.studio.saveDrafts) window.studio.saveDrafts(plain);
    }, 400);
  }
  function saveSettings() {
    const s = {
      theme: state.theme, mode: state.mode, view: state.view,
      moduleId: state.moduleId, viewId: state.viewId, expanded: state.expanded,
      refCollapsed: state.refCollapsed, sidebarCollapsed: state.sidebarCollapsed,
    };
    store('settings', s);
    if (window.studio && window.studio.saveSettings) window.studio.saveSettings(s);
  }

  // ============================================================ 三层树
  function modulesOfSection(chId, secId) {
    const ch = state.chapters[chId];
    if (!ch) return [];
    const sec = ch.sections.find((s) => s.id === secId);
    if (!sec) return [];
    if (sec.views) {
      const out = [];
      for (const v of sec.views) if (v.modules) out.push(...v.modules);
      return out;
    }
    return sec.modules || [];
  }

  function renderTree() {
    if (!state.tree) return;
    const q = (el.searchInput.value || '').trim().toLowerCase();
    const parts = [];

    for (const ch of state.tree.chapters) {
      // 只有显式记过 true 的章才是展开的。
      // 用 !== true 而不是 === false，是为了让"没记录过的章"（比如升级后新增的
      // 03~06）默认折叠 —— 否则它们会显示成"展开但空白"，点一下反而折叠。
      const collapsed = state.expanded[ch.id] !== true;
      const secParts = [];

      for (const sec of ch.sections) {
        const mods = sec.hasContent ? modulesOfSection(ch.id, sec.id) : [];
        let shown = mods;
        const secHit = q && `${sec.id} ${sec.title}`.toLowerCase().includes(q);
        if (q) {
          if (secHit) shown = mods;
          else if (mods.length) shown = mods.filter((m) => `${m.id} ${m.key} ${m.title}`.toLowerCase().includes(q));
          else shown = [];
          if (!shown.length && !secHit) continue;
        }

        const modHtml = shown.map((m) => {
          const st = state.results[m.id];
          const cls = st === 'passed' ? ' is-passed' : (state.drafts[m.id] ? ' is-drafting' : '');
          const active = m.id === state.moduleId ? ' is-active' : '';
          const stars = m.difficulty > 0 ? '★'.repeat(m.difficulty) : '';
          return `<button type="button" class="tree-module${active}${cls}" data-module="${m.id}" title="${esc(m.title)}">`
            + `<span class="tm-id">${m.id.slice(-2)}</span>`
            + `<span class="tm-name">${esc(m.key)}</span>`
            + `<span class="tm-stars">${stars}</span>`
            + `<span class="tm-status"></span></button>`;
        }).join('');

        secParts.push(`<div class="tree-section" data-section="${sec.id}">`
          + `<div class="ts-head"><span class="ts-title">${esc(sec.title)}</span>`
          + `<span class="ts-count">${sec.moduleCount || 0}</span></div>${modHtml}</div>`);
      }

      if (q && !secParts.length) continue;

      const hasAnyContent = ch.sections.some((s) => s.hasContent);
      const body = secParts.length
        ? secParts.join('')
        : `<div class="tree-empty">${hasAnyContent
          ? (state.chapters[ch.id] ? '本节暂无可练习的模块' : '点击这一行加载')
          : '内容规划中'}</div>`;

      parts.push(`<div class="tree-chapter${collapsed ? ' is-collapsed' : ''}" data-chapter="${ch.id}">`
        + `<button type="button" class="tc-head">`
        + `<span class="tc-caret">▾</span>`
        + `<span class="tc-color" data-color="${ch.color}"></span>`
        + `<span class="tc-id">${ch.id}</span>`
        + `<span class="tc-title">${esc(ch.title)}</span>`
        + `<span class="tc-meta">${ch.sections.length} 节</span>`
        + `</button><div class="tc-body">${body}</div></div>`);
    }

    el.tree.innerHTML = parts.join('') || '<div class="tree-empty">没有匹配的模块</div>';
    // 章色带：CSP 不允许内联 style，用 CSSOM 上色
    el.tree.querySelectorAll('.tc-color').forEach((n) => { n.style.background = n.dataset.color; });
    updateProgress();
  }

  function rebuildIndex() {
    state.moduleIndex.clear();
    for (const chId of Object.keys(state.chapters)) {
      for (const sec of state.chapters[chId].sections) {
        if (sec.views) {
          for (const v of sec.views) {
            for (const m of v.modules || []) {
              state.moduleIndex.set(m.id, { module: m, sectionId: sec.id, viewId: v.id, chapterId: chId });
            }
          }
        } else {
          for (const m of sec.modules || []) {
            state.moduleIndex.set(m.id, { module: m, sectionId: sec.id, viewId: null, chapterId: chId });
          }
        }
      }
    }
  }

  function updateProgress() {
    // 总数取自 tree.json 自带的 practiceCount —— 它不依赖懒加载，
    // 用 moduleIndex 数的话，进度会随着展开更多章而"越数越多"
    let total = 0;
    for (const ch of state.tree.chapters) {
      for (const sec of ch.sections) {
        if (sec.hasContent) total += (sec.practiceCount || 0);
      }
    }
    const passed = Object.values(state.results).filter((v) => v === 'passed').length;
    el.progressMiniFill.style.width = Math.round((passed / (total || 1)) * 100) + '%';
    el.progressMiniText.textContent = `通过 ${passed} / ${total}`;
  }

  // ============================================================ 按需加载
  async function ensureChapter(chId) {
    if (state.chapters[chId]) return state.chapters[chId];
    try {
      state.chapters[chId] = await window.studio.loadSection('ch:' + chId);
    } catch (e) {
      state.chapters[chId] = { id: chId, sections: [] };
    }
    rebuildIndex();
    return state.chapters[chId];
  }

  async function ensureSection(secId) {
    if (state.sections[secId]) return state.sections[secId];
    state.sections[secId] = await window.studio.loadSection(secId);
    return state.sections[secId];
  }

  // ============================================================ 选择模块
  async function selectModule(moduleId, opts) {
    opts = opts || {};
    const entry = state.moduleIndex.get(moduleId);
    if (!entry) return;

    saveEditorDraft();
    state.moduleId = moduleId;
    state.sectionId = entry.sectionId;
    if (entry.viewId) state.viewId = entry.viewId;
    state.compareMode = false;

    const secId = entry.sectionId;
    await ensureChapter(chapterIdOf(secId));
    if (!state.sections[secId]) {
      el.sbModule.textContent = '正在加载…';
      await ensureSection(secId);
    }

    renderTree();
    renderBigTabs();
    renderHeader();
    clearOutput();

    const m = currentModule();
    if (state.view === 'practice' && m && m.hasPractice) enterPractice();
    else renderRead();

    if (!opts.keepScroll) {
      el.paneRead.scrollTop = 0;
      el.panePractice.scrollTop = 0;
    }
    saveSettings();
  }

  function siblings() {
    const sec = sectionMeta(state.sectionId);
    if (!sec) return [];
    if (sec.views) {
      const v = sec.views.find((x) => x.id === state.viewId);
      return v ? (v.modules || []).map((m) => m.id) : [];
    }
    return (sec.modules || []).map((m) => m.id);
  }

  function stepModule(dir) {
    const list = siblings();
    const next = list.indexOf(state.moduleId) + dir;
    if (next >= 0 && next < list.length) selectModule(list[next]);
  }

  // ============================================================ 头部
  function renderHeader() {
    const m = currentModule();
    if (!m) return;
    const secId = state.sectionId;
    const chId = chapterIdOf(secId);
    const ch = state.tree.chapters.find((c) => c.id === chId);
    const sec = sectionMeta(secId);
    const viewName = state.viewId ? ({ singly: '单链表', doubly: '双链表', compare: '对比' }[state.viewId] || '') : '';

    el.mhBreadcrumb.textContent = (ch ? ch.id + ' ' + ch.title : '')
      + '  ›  ' + secId + ' ' + (sec ? sec.title : '')
      + (viewName ? '  ›  ' + viewName : '');
    el.mhId.textContent = m.id;
    el.mhName.textContent = m.key;
    el.mhSummary.textContent = m.summary || '';

    el.mhDiff.hidden = !!m.isAssembly;
    if (!m.isAssembly) {
      el.mhDiff.textContent = '难度 ' + '★'.repeat(m.difficulty) + '☆'.repeat(Math.max(0, 3 - m.difficulty));
    }
    el.mhDeps.hidden = !!m.isAssembly;
    if (!m.isAssembly) {
      el.mhDeps.textContent = (m.depLabels && m.depLabels.length)
        ? '依赖: ' + m.depLabels.join('  ') : '依赖: 无（最底层模块）';
    }
    el.mhLines.textContent = '约 ' + m.codeLineCount + ' 行';

    const st = state.results[m.id];
    const has = !!(st || state.drafts[m.id]);
    el.mhStatus.hidden = !has;
    el.mhStatus.className = 'chip chip-status' + (st === 'passed' ? ' is-passed' : (state.drafts[m.id] ? ' is-drafting' : ''));
    el.mhStatus.textContent = st === 'passed' ? '已通过' : (state.drafts[m.id] ? '默写中' : '');

    el.readCardTitle.textContent = m.isAssembly ? '完整源码（拼装视图）' : '模块 ' + m.id + ' · ' + m.key;
    const i = siblings().indexOf(state.moduleId);
    el.btnPrev.disabled = i <= 0;
    el.btnNext.disabled = i >= siblings().length - 1;
    el.sbModule.textContent = m.id + ' · ' + m.key;
    document.title = m.key + ' · DataStruct Studio';
    el.kbdHint.textContent = m.hasAnimation ? '空格播放 · ←→ 动画进退 · ,. 单步' : '← → 切换模块';
    syncViewButtons();
  }

  function syncViewButtons() {
    const m = currentModule();
    const noPractice = !!(m && !m.hasPractice);
    el.commentModes.querySelectorAll('button[data-mode]').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.mode === state.mode));
    el.viewModes.querySelectorAll('button[data-view]').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.view === state.view));
    const pb = el.viewModes.querySelector('[data-view="practice"]');
    if (pb) {
      pb.disabled = noPractice;
      pb.title = noPractice ? '「完整源码」是拼装视图，没有默写练习' : '进入练习模式：默写 + 对照';
    }
    el.btnCompare.disabled = noPractice;
    el.btnRun.disabled = noPractice;
  }

  // ============================================================ 大模块三视图
  function renderBigTabs() {
    const sec = sectionMeta(state.sectionId);
    if (!sec || !sec.views || !sec.views.length) {
      el.bigTabs.hidden = true;
      el.bigTabs.innerHTML = '';
      return;
    }
    el.bigTabs.hidden = false;
    el.bigTabs.innerHTML = sec.views.map((v) =>
      `<button type="button" data-view="${v.id}" class="${v.id === state.viewId ? 'is-active' : ''}">${esc(v.title)}</button>`
    ).join('') + `<span class="big-note">${esc(sec.summary || '')}</span>`;
  }

  function switchBigView(viewId) {
    if (viewId === state.viewId) return;
    const sec = sectionMeta(state.sectionId);
    if (!sec) return;
    state.viewId = viewId;
    state.compareMode = false;
    renderBigTabs();

    if (viewId === 'compare') {
      el.playerPanel.hidden = true;
      state.currentAnim = null;
      renderCompareView();
      setPane('compare');
      renderHeader();
      saveSettings();
      return;
    }
    const v = sec.views.find((x) => x.id === viewId);
    const first = v && v.modules && v.modules.length ? v.modules[0].id : null;
    if (first) selectModule(first);
    saveSettings();
  }

  /** 把单链表与双链表里同名的模块配成一对 */
  function pickComparePair() {
    const sec = sectionMeta(state.sectionId);
    if (!sec || !sec.views) return null;
    const s = sec.views.find((v) => v.id === 'singly');
    const d = sec.views.find((v) => v.id === 'doubly');
    if (!s || !d || !s.modules || !d.modules.length) return null;

    const entry = state.moduleId ? state.moduleIndex.get(state.moduleId) : null;
    const wantKey = entry && entry.viewId === 'singly' ? entry.module.key : null;
    const norm = (k) => String(k).toLowerCase().replace(/[^a-z0-9]/g, '');

    let sMod = wantKey ? s.modules.find((m) => m.key === wantKey) : null;
    let dMod = null;
    if (sMod) dMod = d.modules.find((m) => norm(m.key) === norm(sMod.key)) || null;

    if (!sMod || !dMod) {
      // 退而求其次：按位置就近配对（两边都是 typedef / InitList / ... 的顺序）
      const pairs = [
        ['typedef', 'typedef'], ['InitList', 'InitList'], ['ListInsert', 'ListInsert'],
        ['ListDelete', 'ListDelete'], ['applist', 'applist'], ['creatNode', 'creatNode'],
      ];
      for (const [a, b] of pairs) {
        const x = s.modules.find((m) => norm(m.key).startsWith(norm(a)));
        const y = d.modules.find((m) => norm(m.key).startsWith(norm(b)));
        if (x && y) { sMod = sMod || x; dMod = dMod || y; if (sMod && dMod) break; }
      }
    }
    if (!sMod) sMod = s.modules[0];
    if (!dMod) dMod = d.modules[0];
    return { singly: sMod.id, doubly: dMod.id, label: sMod.key + ' / ' + dMod.key };
  }

  function renderCompareView() {
    const pair = pickComparePair();
    const sec = state.sections[state.sectionId];
    if (!pair || !sec || !sec.code || !sec.code.views) {
      el.compareTitle.textContent = '对比视图';
      el.compareLeft.innerHTML = '<div class="out-line is-message">两个视图里还没有可对照的模块。</div>';
      el.compareRight.innerHTML = '';
      return;
    }
    const left = sec.code.views.singly[pair.singly];
    const right = sec.code.views.doubly[pair.doubly];
    el.compareTitle.textContent = '对比：' + pair.label;
    el.compareLeftHead.textContent = '单链表 · ' + pair.singly;
    el.compareRightHead.textContent = '双链表 · ' + pair.doubly;
    el.compareLeft.innerHTML = HL.codeViewHtml(left.modes[state.mode]);
    el.compareRight.innerHTML = HL.codeViewHtml(right.modes[state.mode]);
    // 把双链表里"多出来的 prior 相关行"标出来（PRD 3.2 的对比视图灵魂）
    el.compareRight.querySelectorAll('.code-line').forEach((n) => {
      const t = n.textContent || '';
      if (/prior/.test(t) && !/next\s*=/.test(t.replace(/prior/g, ''))) n.classList.add('is-prior-only');
      else if (/prior/.test(t)) n.classList.add('is-prior-only');
    });
  }

  // ============================================================ 阅读 / 播放器
  function renderRead() {
    const m = currentModule();
    if (!m) return;
    const payload = codeOf(m.id);
    if (!payload) { el.codeView.innerHTML = '<div class="out-line is-message">代码加载中…</div>'; return; }
    el.codeView.innerHTML = HL.codeViewHtml(payload.modes[state.mode]);
    renderPlayer();
    setPane('read');
  }

  function renderPlayer() {
    const m = currentModule();
    const anims = (state.sections[state.sectionId] || {}).animations || { animations: {} };
    const anim = m ? (anims.animations || {})[m.id] : null;
    state.currentAnim = anim || null;

    // 练习模式聚焦默写，不显示动画（画面在阅读面板里，跟着一起隐藏，
    // 否则会出现"播放条在动、画面看不见"的空转）
    const inPractice = state.view === 'practice';

    if (!anim || inPractice) {
      el.playerPanel.hidden = true;
      el.animCard.hidden = true;
      if (el.readSplit) el.readSplit.classList.add('no-anim');
      if (state.player) state.player.pause();
      return;
    }
    if (el.readSplit) el.readSplit.classList.remove('no-anim');
    el.animCard.hidden = false;
    el.animCard.classList.toggle('is-collapsed', state.animCollapsed);
    el.btnCollapseAnim.textContent = state.animCollapsed ? '展开' : '折叠';
    el.animCardTitle.textContent = '动画演示 · ' + (anim.title || m.key);
    el.playerPanel.hidden = false;

    if (!state.player) {
      state.player = window.LS.createPlayer({
        container: el.playerHost,
        canvas: el.animBody,          // 画面画在代码区左边，控件留在底部
        onTick: function (time, stepIndex) { highlightCodeForStep(stepIndex); },
      });
    }
    window.studio.loadSvg(anim.svg).then(function (svgText) {
      if (state.currentAnim !== anim) return;   // 已经切走了
      state.player.load(svgText, anim.steps, anim.total);
      state.player.play();
    });
  }

  /** 把一段代码片段规范化，用于在源码里比对 */
  function normCode(s) {
    return String(s == null ? '' : s)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '')
      .replace(/\s+/g, '');
  }

  /**
   * 关键帧 → 源码行号。
   * 构建时已经尽量把 line 算好了，这里再兜一层：万一没有，就用这一步的
   * 代码片段去当前代码视图里反查，保证联动始终有效。
   */
  /**
   * 关键帧 → 源码行号。
   * **必须优先按内容匹配**：三档注释模式的源码行号完全不同
   * （详细注释比无注释多出几十行注释），构建时算好的行号只在
   * "无注释"模式下成立，直接拿来用会高亮到错误的行上。
   */
  function resolveLine(step) {
    if (!step) return null;
    if (!step.code) return step.line || null;
    const full = normCode(String(step.code).split('\n')[0]);
    if (full.length < 4) return step.line || null;

    const candidates = [full];
    // 第一个完整子句：场景里的 "while (p->next != NULL)  p = p->next;"
    // 在源码里是分行的，只有前半句能对上
    let depth = 0;
    for (let i = 0; i < full.length; i++) {
      const c = full[i];
      if (c === '(') depth++;
      else if (c === ')') { depth--; if (depth <= 0) { candidates.push(full.slice(0, i + 1)); break; } }
      else if (c === ';' && depth === 0) { candidates.push(full.slice(0, i + 1)); break; }
    }
    for (const part of full.split(/[;{}]/)) if (part.length >= 6) candidates.push(part);

    const lines = el.codeView.querySelectorAll('.ln[data-line]');
    for (const needle of candidates) {
      if (needle.length < 6) continue;
      for (const n of lines) {
        if (normCode(n.textContent).includes(needle)) return Number(n.dataset.line);
      }
    }
    return step.line || null;
  }

  /** 动画 → 代码：高亮当前关键帧对应的那行（PRD 4.3） */
  function highlightCodeForStep(stepIndex) {
    const anim = state.currentAnim;
    if (!anim) return;
    el.codeView.querySelectorAll('.ln.is-anim-hit').forEach((n) => n.classList.remove('is-anim-hit'));
    const step = anim.steps[stepIndex];
    const lineNo = resolveLine(step);
    if (!lineNo) return;
    const line = el.codeView.querySelector('.ln[data-line="' + lineNo + '"]');
    if (!line) return;
    line.classList.add('is-anim-hit');
    // 把当前行滚进可视区（滚动量按"行相对视口的位置"算，
    // 之前误用了容器高度做偏移，越滚越往回跑）
    const box = el.codeView.getBoundingClientRect();
    const r = line.getBoundingClientRect();
    if (r.top < box.top + 4 || r.bottom > box.bottom - 4) {
      el.codeView.scrollTop += (r.top - box.top) - box.height * 0.38;
    }
  }

  /** 代码 → 动画：点代码行跳到对应关键帧（PRD 4.3 的反向联动） */
  function codeLineToStep(lineNo) {
    const anim = state.currentAnim;
    if (!anim || !state.player) return false;
    let hit = -1;
    anim.steps.forEach(function (s, i) {
      if (resolveLine(s) === lineNo) hit = i;
    });
    if (hit < 0) return false;
    state.player.pause();
    state.player.goToStep(hit);
    return true;
  }

  // ============================================================ 练习模式
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
    return extractAnswer(text).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').trim().length === 0;
  }

  let editor = null;

  function enterPractice() {
    const m = currentModule();
    if (!m || !m.hasPractice) return;
    const payload = codeOf(m.id);
    if (!payload) return;
    const draft = state.drafts[m.id];
    const text = draft != null ? draft : (payload.scaffold || '');
    editor.setValue(text);
    const blank = blankStartLine(text);
    if (blank > 0) editor.goToLine(blank);
    renderReference();
    updateSbState();
    setPane('practice');
    renderPlayer();
  }

  function renderReference() {
    const m = currentModule();
    const payload = m ? codeOf(m.id) : null;
    if (!payload) return;
    if (state.compareMode) {
      const r = DF.render(extractAnswer(editor.getValue()), payload.modes[state.mode]);
      el.refView.innerHTML = r.html;
      el.refCardTitle.textContent = '对比结果（- 漏写 / + 多写 / ~ 写法不同）';
      const s = r.stats;
      el.outputStatus.textContent = '一致 ' + s.same + ' · 写法不同 ' + s.changed + ' · 漏写 ' + s.missing + ' · 多写 ' + s.extra;
      state.results[m.id] = (s.missing === 0 && s.extra === 0) ? 'passed' : 'drafting';
      renderTree();
      renderHeader();
    } else {
      el.refView.innerHTML = HL.codeViewHtml(payload.modes[state.mode]);
      el.refCardTitle.textContent = '官方实现 · ' + label(state.mode);
      el.outputStatus.textContent = '';
    }
  }

  function saveEditorDraft() {
    const m = currentModule();
    if (!m || !m.hasPractice || state.view !== 'practice' || !editor) return;
    state.drafts[m.id] = editor.getValue();
    if (state.results[m.id] !== 'passed') state.results[m.id] = 'drafting';
    saveDraftsSoon();
  }

  function onEditorChange() {
    const m = currentModule();
    if (!m) return;
    state.drafts[m.id] = editor.getValue();
    if (state.results[m.id] !== 'passed') state.results[m.id] = 'drafting';
    updateSbState();
    if (state.compareMode) renderReference();
    else renderTree();
    saveDraftsSoon();
  }

  function updateSbState() {
    const m = currentModule();
    if (!m || !m.hasPractice) { el.sbState.textContent = '阅读中'; return; }
    const st = state.results[m.id];
    el.sbState.textContent = st === 'passed' ? '已通过' : (state.drafts[m.id] ? '已修改（默写中）' : '未修改');
  }

  // ============================================================ 输出
  function clearOutput() {
    el.outputContent.hidden = true;
    el.outputContent.innerHTML = '';
    el.outputPlaceholder.hidden = false;
    el.outputStatus.textContent = '';
  }

  function showOutput(html, status) {
    el.outputPlaceholder.hidden = true;
    el.outputContent.hidden = false;
    el.outputContent.innerHTML = html;
    el.outputStatus.textContent = status || '';
    el.outputPanel.classList.remove('is-collapsed');
    el.btnToggleOutput.setAttribute('aria-expanded', 'true');
  }

  async function runSource() {
    const m = currentModule();
    if (!m || !m.hasPractice) return;
    const source = editor.getValue();
    if (isAnswerEmpty(source)) {
      showOutput('<div class="out-block"><div class="out-line is-message">提示：模块 ' + m.id
        + ' 的「轮到你了」下面还是空的。先把它写出来，再编译运行。</div></div>', '尚未作答');
      return;
    }
    showOutput('<div class="out-block"><div class="out-line is-message">正在编译…</div></div>', '编译中');
    const res = await window.studio.run(source, state.runTimeoutMs, el.stdinInput.value);
    renderRunResult(res);
  }

  function renderRunResult(res) {
    const blocks = [];
    if (res.stderr && (!res.diagnostics || !res.diagnostics.length)) {
      blocks.push('<div class="out-block"><div class="out-label">编译错误 / 警告</div>'
        + '<div class="out-line is-error">' + esc(res.stderr) + '</div></div>');
    } else if (res.diagnostics && res.diagnostics.length) {
      const d = res.diagnostics.map((x) =>
        '<div class="out-line is-error">' + esc(x.text) + '</div>').join('');
      blocks.push('<div class="out-block"><div class="out-label">编译错误 / 警告</div>' + d + '</div>');
    }
    if (res.stdout) {
      const lines = String(res.stdout).replace(/\r\n/g, '\n').split('\n')
        .map((l) => '<div class="out-line is-stdout">' + (esc(l) || '&nbsp;') + '</div>').join('');
      blocks.push('<div class="out-block"><div class="out-label">程序输出 (stdout)</div>' + lines + '</div>');
    }
    if (!res.stdout && !res.stderr && res.ok) {
      blocks.push('<div class="out-block"><div class="out-line is-message">（程序没有产生输出）</div></div>');
    }
    const status = res.ok
      ? '运行成功 · 编译 ' + (res.compileMs || 0) + ' ms · 运行 ' + (res.runMs || 0) + ' ms'
      : '编译失败';
    showOutput(blocks.join(''), status);
  }

  // ============================================================ 覆盖清单
  async function openCoverage() {
    el.coverageModal.hidden = false;
    if (state.coverage) { renderCoverage(); return; }
    el.coverageBody.innerHTML = '<div class="out-line is-message">加载中…</div>';
    state.coverage = await window.studio.loadCoverage();
    renderCoverage();
  }

  function renderCoverage() {
    const cov = state.coverage;
    if (!cov) {
      el.coverageBody.innerHTML = '<div class="out-line is-message">没有覆盖清单（先运行 npm run data）。</div>';
      return;
    }
    const bySec = new Map(cov.coverage.map((c) => [c.section, c]));
    el.coverageBody.innerHTML = state.tree.chapters.map((ch) => {
      const rows = ch.sections.map((sec) => {
        const c = bySec.get(sec.id) || { status: sec.status, modules: 0, animations: 0 };
        const done = c.status === 'done' && c.modules > 0;
        return '<tr><td><code>' + sec.id + '</code></td><td>' + esc(sec.title) + '</td>'
          + '<td><span class="cov-badge ' + (done ? 'is-done' : 'is-pending') + '">' + (done ? '已完成' : '待补') + '</span></td>'
          + '<td>' + (c.modules || 0) + '</td><td>' + (c.animations || 0) + '</td></tr>';
      }).join('');
      return '<div class="cov-chapter"><h3><span class="cov-dot" data-color="' + ch.color + '"></span>'
        + ch.id + ' ' + esc(ch.title) + '</h3>'
        + '<table class="cov-table"><thead><tr><th>节</th><th>标题</th><th>状态</th><th>模块</th><th>动画</th></tr></thead>'
        + '<tbody>' + rows + '</tbody></table></div>';
    }).join('');
    el.coverageBody.querySelectorAll('.cov-dot').forEach((n) => { n.style.background = n.dataset.color; });
  }

  // ============================================================ 视图切换
  function setPane(which) {
    el.paneRead.hidden = which !== 'read';
    el.panePractice.hidden = which !== 'practice';
    el.paneCompare.hidden = which !== 'compare';
  }

  function switchView(view) {
    const m = currentModule();
    let target = view;
    if (view === 'practice' && (!m || !m.hasPractice)) target = 'read';
    state.view = target;
    syncViewButtons();
    if (target === 'practice') enterPractice();
    else renderRead();
    saveSettings();
  }

  function setCommentMode(mode) {
    if (['detail', 'short', 'none'].indexOf(mode) < 0) return;
    state.mode = mode;
    syncViewButtons();
    if (state.viewId === 'compare') renderCompareView();
    else if (state.view === 'practice' && currentModule() && currentModule().hasPractice) renderReference();
    else renderRead();
    saveSettings();
  }

  // ============================================================ 事件
  function bind() {
    el.tree.addEventListener('click', async function (e) {
      const chBtn = e.target.closest('.tc-head');
      if (chBtn) {
        const chId = chBtn.closest('.tree-chapter').dataset.chapter;
        const chMeta = state.tree.chapters.find((c) => c.id === chId);
        const hasContent = !!chMeta && chMeta.sections.some((s) => s.hasContent);
        // 关键：除了"第一章"之外，其余章初始是**展开但没有内容**的占位状态。
        // 如果不把这种情况算作"需要展开"，第一次点击会被判成折叠 ——
        // 用户看到的就是"点一下没反应（内容没加载），要再点一次才行"。
        const notLoadedYet = hasContent && !state.chapters[chId];
        const willExpand = state.expanded[chId] === false || notLoadedYet;
        state.expanded[chId] = willExpand;
        if (willExpand) await ensureChapter(chId);
        renderTree();
        saveSettings();
        return;
      }
      const modBtn = e.target.closest('.tree-module');
      if (modBtn) {
        const id = modBtn.dataset.module;
        const entry = state.moduleIndex.get(id);
        if (entry && entry.chapterId && !state.chapters[entry.chapterId]) await ensureChapter(entry.chapterId);
        selectModule(id);
      }
    });

    el.searchInput.addEventListener('input', async function () {
      if (el.searchInput.value.trim()) {
        for (const ch of state.tree.chapters) {
          if (ch.sections.some((s) => s.hasContent)) await ensureChapter(ch.id);
        }
      }
      renderTree();
    });
    el.btnClearSearch.addEventListener('click', function () { el.searchInput.value = ''; renderTree(); });

    el.btnCollapseSidebar.addEventListener('click', function () {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      el.app.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
      saveSettings();
    });

    el.commentModes.addEventListener('click', function (e) {
      const b = e.target.closest('button[data-mode]');
      if (b) setCommentMode(b.dataset.mode);
    });
    el.viewModes.addEventListener('click', function (e) {
      const b = e.target.closest('button[data-view]');
      if (b && !b.disabled) switchView(b.dataset.view);
    });
    el.bigTabs.addEventListener('click', function (e) {
      const b = e.target.closest('button[data-view]');
      if (b) switchBigView(b.dataset.view);
    });
    el.btnPrev.addEventListener('click', function () { stepModule(-1); });
    el.btnNext.addEventListener('click', function () { stepModule(1); });

    el.btnCopyCode.addEventListener('click', async function () {
      const m = currentModule();
      const payload = m ? codeOf(m.id) : null;
      if (!payload) return;
      await window.studio.copy(payload.modes[state.mode]);
      const old = el.btnCopyCode.textContent;
      el.btnCopyCode.textContent = '已复制';
      setTimeout(function () { el.btnCopyCode.textContent = old; }, 1200);
    });

    el.codeView.addEventListener('click', function (e) {
      const line = e.target.closest('.ln');
      if (!line || !line.dataset.line) return;
      codeLineToStep(Number(line.dataset.line));
    });

    el.btnRun.addEventListener('click', runSource);
    el.btnToggleOutput.addEventListener('click', function () {
      const c = el.outputPanel.classList.toggle('is-collapsed');
      el.btnToggleOutput.setAttribute('aria-expanded', String(!c));
    });
    el.btnCompare.addEventListener('click', function () {
      state.compareMode = !state.compareMode;
      if (state.view !== 'practice') switchView('practice');
      else renderReference();
      el.refCard.classList.remove('is-collapsed');
      state.refCollapsed = false;
      el.btnCollapseRef.textContent = '折叠';
    });
    el.btnDiff.addEventListener('click', function () {
      state.compareMode = !state.compareMode;
      renderReference();
    });
    el.btnCollapseRef.addEventListener('click', function () {
      state.refCollapsed = !state.refCollapsed;
      el.refCard.classList.toggle('is-collapsed', state.refCollapsed);
      el.btnCollapseRef.textContent = state.refCollapsed ? '展开' : '折叠';
      saveSettings();
    });
    el.btnScaffold.addEventListener('click', function () {
      const m = currentModule();
      const payload = m ? codeOf(m.id) : null;
      if (!payload) return;
      if (editor.getValue().trim() && !confirm('补全脚手架会覆盖编辑器里的内容，确定吗？')) return;
      editor.setValue(payload.scaffold || '');
      const blank = blankStartLine(payload.scaffold || '');
      if (blank > 0) editor.goToLine(blank);
      onEditorChange();
    });
    el.btnBlank.addEventListener('click', function () {
      if (editor.getValue().trim() && !confirm('清空编辑器，恢复空白默写？')) return;
      editor.setValue('');
      onEditorChange();
    });

    el.ioTabs.addEventListener('click', function (e) {
      const b = e.target.closest('button[data-io]');
      if (!b) return;
      const isStdin = b.dataset.io === 'stdin';
      el.ioTabs.querySelectorAll('button').forEach((x) => x.classList.toggle('is-active', x === b));
      el.stdinBox.hidden = !isStdin;
    });

    el.btnCollapseAnim.addEventListener('click', function () {
      state.animCollapsed = !state.animCollapsed;
      el.animCard.classList.toggle('is-collapsed', state.animCollapsed);
      el.btnCollapseAnim.textContent = state.animCollapsed ? '展开' : '折叠';
      if (el.readSplit) el.readSplit.classList.toggle('no-anim', state.animCollapsed);
      saveSettings();
    });

    el.btnCoverage.addEventListener('click', openCoverage);
    el.btnCloseCoverage.addEventListener('click', function () { el.coverageModal.hidden = true; });
    el.coverageModal.addEventListener('click', function (e) {
      if (e.target === el.coverageModal) el.coverageModal.hidden = true;
    });

    let syncing = false;
    function sync(from, to) {
      if (!el.syncScroll.checked || syncing) return;
      syncing = true;
      const ratio = from.scrollTop / Math.max(1, from.scrollHeight - from.clientHeight);
      to.scrollTop = ratio * (to.scrollHeight - to.clientHeight);
      requestAnimationFrame(function () { syncing = false; });
    }
    el.compareLeft.addEventListener('scroll', function () { sync(el.compareLeft, el.compareRight); });
    el.compareRight.addEventListener('scroll', function () { sync(el.compareRight, el.compareLeft); });

    document.addEventListener('keydown', function (e) {
      const tag = (e.target && e.target.tagName) || '';
      const typing = tag === 'TEXTAREA' || tag === 'INPUT';

      if (e.key === 'Escape' && !el.coverageModal.hidden) { el.coverageModal.hidden = true; return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault(); el.btnCollapseSidebar.click(); return;
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (state.view === 'practice') runSource();
        return;
      }
      if (typing) return;

      // 有动画时方向键交给播放器（PRD 4.2），上下键仍用来切模块
      const playerActive = !el.playerPanel.hidden && state.currentAnim && state.view !== 'practice';
      if (playerActive && state.player) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          stepModule(e.key === 'ArrowDown' ? 1 : -1);
          return;
        }
        if (state.player.handleKey(e)) return;
        return;
      }
      if (e.key === 'ArrowLeft') { e.preventDefault(); stepModule(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); stepModule(1); }
      else if (e.key === '1') setCommentMode('detail');
      else if (e.key === '2') setCommentMode('short');
      else if (e.key === '3') setCommentMode('none');
    });

    window.addEventListener('beforeunload', function () {
      saveEditorDraft();
      const plain = { drafts: state.drafts, results: state.results };
      store('drafts', plain);
      if (window.studio && window.studio.saveDrafts) window.studio.saveDrafts(plain);
    });
  }

  /** detectCompilers() 返回的是候选列表（gcc 优先、内置 TCC 兜底） */
  function renderCompiler(list) {
    const c = Array.isArray(list) ? list[0] : list;
    state.compiler = c || null;
    if (!c) {
      el.sbCompilerDot.className = 'sb-dot is-bad';
      el.sbCompiler.textContent = '没有可用的 C 编译器';
      return;
    }
    const isTcc = c.kind === 'tcc';
    el.sbCompilerDot.className = 'sb-dot is-ok';
    el.sbCompiler.textContent = isTcc
      ? `未检测到 gcc，已启用内置 ${c.name}`
      : `${c.name}${c.version ? ' ' + c.version : ''}`;
  }

  // ============================================================ 启动
  async function init() {
    const persisted = restore('settings', {});
    state.theme = persisted.theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = state.theme;
    state.mode = ['detail', 'short', 'none'].indexOf(persisted.mode) >= 0 ? persisted.mode : 'detail';
    state.view = ['read', 'practice'].indexOf(persisted.view) >= 0 ? persisted.view : 'read';
    state.expanded = persisted.expanded || {};
    state.refCollapsed = !!persisted.refCollapsed;
    state.sidebarCollapsed = !!persisted.sidebarCollapsed;
    el.app.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);

    const draftData = restore('drafts', {});
    state.drafts = draftData.drafts || {};
    state.results = draftData.results || {};

    const initData = await window.studio.init();
    state.tree = initData.tree;
    state.runTimeoutMs = initData.runTimeoutMs || 8000;
    renderCompiler(initData.compilers);
    el.sbVersion.textContent = 'v' + initData.appVersion + ' · Electron ' + initData.electron;

    if (initData.drafts && initData.drafts.drafts) {
      state.drafts = Object.assign({}, initData.drafts.drafts, state.drafts);
      state.results = Object.assign({}, initData.drafts.results || {}, state.results);
    }

    // 启动时的初始状态：**所有章一律折叠**，点哪一章才展开哪一章。
    //
    // 这里刻意**不恢复上次的展开状态**。原因是"折叠状态"和"内容有没有加载"
    // 是两件事：如果按上次的记录把某一章显示成展开、但内容又还没加载，
    // 那一章看上去是"展开的空壳"，点一下反而被判成折叠 —— 表现就是点不开。
    // 统一从"全部折叠"开始，交互上就没有歧义了。
    state.expanded = {};
    for (const ch of state.tree.chapters) {
      state.expanded[ch.id] = false;
    }

    // 第一个有内容的章预加载，用户点开时不用等
    const firstCh = state.tree.chapters.find((c) => c.sections.some((s) => s.hasContent));
    if (firstCh) await ensureChapter(firstCh.id);

    el.refCard.classList.toggle('is-collapsed', state.refCollapsed);
    el.btnCollapseRef.textContent = state.refCollapsed ? '展开' : '折叠';

    editor = window.LS.createEditor({
      input: el.editorInput,
      highlightCode: el.editorHighlightCode,
      gutter: el.editorGutter,
      onChange: onEditorChange,
      onRun: function () { if (state.view === 'practice') runSource(); },
    });

    syncViewButtons();
    renderTree();

    const target = persisted.moduleId && state.moduleIndex.has(persisted.moduleId)
      ? persisted.moduleId
      : (state.moduleIndex.keys().next().value || null);
    if (target) await selectModule(target);

    bind();
    window.studio.ready();
  }

  init().catch(function (err) {
    el.sbCompiler.textContent = '启动失败：' + (err && err.message);
    document.title = '启动失败 · DataStruct Studio';
  });
})();
