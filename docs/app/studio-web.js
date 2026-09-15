/* ==========================================================================
   数据结构研习社 —— Web 版的 studio 替身
   ---------------------------------------------------------------------------
   桌面版通过 preload 暴露 window.studio（IPC）。Web 版在这里用 fetch 实现
   同一组接口，于是 **src/app.js 一个字都不用改**就能在浏览器里跑起来 ——
   在线版和桌面版共用同一套渲染层，行为天然一致。

   唯一做不到的是编译：浏览器里没有 C 编译器，所以 run() 明确返回失败，
   界面会照常提示"请用桌面版"。绝不用假编译器糊弄人。
   ========================================================================== */
(function () {
  'use strict';

  // 和 package.json 的 version 保持一致 —— 侧边栏会显示成 v2.1.1-web，
  // 用户才能对上"我拿的是哪一版"
  const VER = '2.1.1';

  async function getJson(path) {
    const r = await fetch(path, { cache: 'no-cache' });
    if (!r.ok) throw new Error(path + ' → HTTP ' + r.status);
    return r.json();
  }

  /** 浏览器里没有 C 编译器 —— 如实说明，并给出桌面版入口 */
  const NO_COMPILER = {
    ok: false,
    stage: 'no-compiler',
    message: '浏览器里没有 C 编译器，在线版不能编译运行。请用桌面版（自带 TCC）。',
    stdout: '',
    stderr: '',
    diagnostics: [],
  };

  window.studio = {
    ready() { /* 浏览器不需要等窗口显示 */ },

    async init() {
      const tree = await getJson('data/tree.json');
      return {
        appVersion: VER + '-web',
        electron: '浏览器',
        tree,
        // 编译器列表：Web 版永远没有（界面会在状态栏如实显示）
        compilers: [{ name: 'Web 版 · 无法编译', kind: 'web', version: '' }],
        settings: {},
        drafts: {},
        runTimeoutMs: 8000,
      };
    },

    async detectCompilers() {
      return [{ name: 'Web 版 · 无法编译', kind: 'web', version: '' }];
    },

    /** 按需取数据，路径规则和桌面版完全一致 */
    async loadSection(sectionId) {
      const id = String(sectionId);
      if (id.startsWith('ch:')) return getJson('data/chapters/' + id.slice(3) + '.json');
      const code = await getJson('data/code/' + id + '.json');
      let animations = { section: id, animations: {} };
      try {
        animations = await getJson('data/animations/' + id + '.json');
      } catch (e) { /* 这一节还没有动画 */ }
      return { code, animations };
    },

    async loadSvg(relPath) {
      const r = await fetch(relPath, { cache: 'no-cache' });
      return r.ok ? r.text() : null;
    },

    async loadCoverage() {
      try { return await getJson('data/coverage.json'); } catch (e) { return null; }
    },

    async run() { return NO_COMPILER; },

    // 桌面版存在 userData 里；Web 版由 app.js 走 localStorage，这两个是空操作
    async saveSettings() { return true; },
    async saveDrafts() { return true; },

    async copy(text) {
      try {
        await navigator.clipboard.writeText(String(text || ''));
        return true;
      } catch (e) {
        // 剪贴板被拒（非 https 或没授权）时退回到老办法
        try {
          const ta = document.createElement('textarea');
          ta.value = String(text || '');
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          return true;
        } catch (e2) { return false; }
      }
    },
  };
})();
