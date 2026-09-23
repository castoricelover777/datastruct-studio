'use strict';
/*
 * DataStruct Studio —— 预加载脚本
 * 在开启 contextIsolation 的前提下，只向界面暴露这几个明确的能力。
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('studio', {
  /** 界面把章节树渲染完了，可以显示窗口了 */
  ready: () => ipcRenderer.send('app:ready'),

  /** 启动时拿章节树、编译器状态、设置与草稿 */
  init: () => ipcRenderer.invoke('app:init'),

  /** 重新检测编译器（用户中途装了 gcc 也能刷新） */
  detectCompilers: () => ipcRenderer.invoke('app:detectCompilers'),

  /** 按节取数据：三档代码 + 脚手架 + 预期输出 + 动画关键帧（按需加载） */
  loadSection: (sectionId) => ipcRenderer.invoke('section:load', sectionId),

  /** 取动画 SVG 文本（渲染层在 file:// 下 fetch 会被 CORS 拦，所以走 IPC） */
  loadSvg: (relPath) => ipcRenderer.invoke('anim:svg', relPath),

  /** 取模块覆盖清单 */
  loadCoverage: () => ipcRenderer.invoke('coverage:load'),

  /** 编译并运行一段 C 源码；stdin 是「输入」tab 里填的测试数据 */
  run: (source, runTimeoutMs, stdin) =>
    ipcRenderer.invoke('compile:run', { source, runTimeoutMs, stdin }),

  /** 保存设置 / 草稿 */
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  saveDrafts: (drafts) => ipcRenderer.invoke('drafts:save', drafts),

  /** 复制到剪贴板 */
  copy: (text) => ipcRenderer.invoke('clipboard:write', text),

  /**
   * 用系统默认浏览器打开外链（B 站网课）。
   * 走 IPC 而不是 location.href，是因为渲染进程有 CSP 限制，
   * 而且我们要的是"在外面打开"，不是把整个应用导航走。
   */
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
});
