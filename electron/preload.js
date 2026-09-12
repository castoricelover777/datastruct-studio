'use strict';
/*
 * LinkList Studio —— 预加载脚本
 * 在开启 contextIsolation 的前提下，只向界面暴露这几个明确的能力。
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('studio', {
  /** 界面把模块列表渲染完了，可以显示窗口了 */
  ready: () => ipcRenderer.send('app:ready'),

  /** 启动时一次性拿到模块数据、编译器状态、设置与草稿 */
  init: () => ipcRenderer.invoke('app:init'),

  /** 重新检测编译器（用户中途装了 gcc 也能刷新） */
  detectCompilers: () => ipcRenderer.invoke('app:detectCompilers'),

  /** 编译并运行一段 C 源码 */
  run: (source, runTimeoutMs) => ipcRenderer.invoke('compile:run', { source, runTimeoutMs }),

  /** 保存设置 / 草稿 */
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  saveDrafts: (drafts) => ipcRenderer.invoke('drafts:save', drafts),

  /** 复制到剪贴板 */
  copy: (text) => ipcRenderer.invoke('clipboard:write', text),
});
