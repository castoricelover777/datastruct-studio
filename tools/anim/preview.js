'use strict';
/**
 * LinkList Studio —— 动画 SVG 的逐帧预览工具
 * ---------------------------------------------------------------------------
 * 动画是 SMIL 写的，所以可以用 SVG 原生的 pauseAnimations() / setCurrentTime(t)
 * 精确跳到任意时刻截图，逐帧核对指针步骤有没有错位。
 *
 * 用法：
 *   electron tools/anim/preview.js <svg 路径> <输出 png> [时刻1,时刻2,...]
 *
 * 例：
 *   electron tools/anim/preview.js docs/animations/singly-04-applist.svg out.png 0.5,2.0,4.5
 *   （多个时刻会输出 out-t0.5.png、out-t2.png …）
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const svgPath = path.resolve(process.argv[2] || '');
const outPath = path.resolve(process.argv[3] || 'preview.png');
const times = (process.argv[4] || '0').split(',').map(Number).filter((n) => !Number.isNaN(n));

if (!svgPath || !fs.existsSync(svgPath)) {
  console.error('找不到 SVG：' + svgPath);
  process.exit(1);
}

// 从 SVG 里读出画布尺寸，让窗口与内容严格一致（截图不裁边）
const head = fs.readFileSync(svgPath, 'utf8').slice(0, 600);
const mW = /width="(\d+)"/.exec(head);
const mH = /height="(\d+)"/.exec(head);
const w = mW ? Number(mW[1]) : 960;
const h = mH ? Number(mH[1]) : 300;

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: w,
    height: h,
    useContentSize: true,
    // 注意：这里不要设 frame:false —— 无边框 + 隐藏窗口会让 Chromium 合成器
    // 抛 UnknownVizError，capturePage 直接失败。默认带边框即可，
    // capturePage 只截内容区，尺寸仍由 useContentSize 保证。
    show: false,
    backgroundColor: '#ffffff',
    webPreferences: { backgroundThrottling: false, offscreen: false },
  });

  try {
    await win.loadFile(svgPath);

    for (const t of times) {
      await win.webContents.executeJavaScript(`(function () {
        var svg = document.querySelector('svg');
        if (!svg) return 'no-svg';
        svg.pauseAnimations();
        svg.setCurrentTime(${t});
        return 'ok';
      })()`);
      // 等一帧完成重绘
      await new Promise((r) => setTimeout(r, 320));

      const img = await win.webContents.capturePage();
      const file = times.length > 1
        ? outPath.replace(/\.png$/, `-t${String(t).replace('.', '_')}.png`)
        : outPath;
      fs.writeFileSync(file, img.toPNG());
      console.log('shot t=' + t + 's -> ' + file);
    }
  } catch (err) {
    console.error('预览失败：' + ((err && err.message) || err));
  }
  app.exit(0);
});
