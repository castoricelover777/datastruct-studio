'use strict';
/**
 * 截取一个网页（本地服务器或线上地址），用于核对 Web 版的实际渲染。
 *
 * 参数走环境变量，不走命令行 —— 传 URL 当位置参数时 Electron 的启动过程
 * 会异常退出（实测），环境变量则稳定可靠。
 *
 *   $env:WS_URL='http://127.0.0.1:8777/'; $env:WS_OUT='shot.png'
 *   electron tools/web-shot.js
 *
 * 可选：WS_WAIT（等待毫秒，默认 1800）、WS_W（宽，1440）、WS_H（高，900）、
 *       WS_INJECT（加载后执行的 JS）
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const url = process.env.WS_URL || '';
const outPath = path.resolve(process.env.WS_OUT || 'shot.png');
const wait = Number(process.env.WS_WAIT || 1800);
const W = Number(process.env.WS_W || 1440);
const H = Number(process.env.WS_H || 900);
const injectRaw = process.env.WS_INJECT || '';
// 注入脚本也可以从文件读，避免在 shell 里跟引号较劲
const inject = process.env.WS_INJECT_FILE
  ? fs.readFileSync(process.env.WS_INJECT_FILE, 'utf8')
  : injectRaw;

const log = (...a) => console.log('[web-shot]', ...a);
log('url =', url);

if (!url) {
  console.error('缺少 WS_URL');
  app.exit(1);
}

app.whenReady().then(async () => {
  try {
    const win = new BrowserWindow({
      width: W,
      height: H,
      useContentSize: true,
      show: false,
      backgroundColor: '#ffffff',
      webPreferences: { backgroundThrottling: false, contextIsolation: true, nodeIntegration: false },
    });

    await win.loadURL(url);
    log('loaded');
    await new Promise((r) => setTimeout(r, wait));

    if (inject) {
      const r = await win.webContents.executeJavaScript(inject, true).catch((e) => 'inject failed: ' + e.message);
      log('inject ->', String(r).slice(0, 120));
      await new Promise((r2) => setTimeout(r2, 800));
    }

    const img = await win.webContents.capturePage();
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, img.toPNG());
    log('shot ->', outPath, img.getSize());
  } catch (err) {
    log('FAILED:', (err && err.message) || err);
  }
  app.exit(0);
});
