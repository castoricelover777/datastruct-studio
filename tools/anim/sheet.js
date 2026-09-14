'use strict';
/**
 * 把多个动画在指定时刻的帧拼成一张总览图，便于一次性核对所有场景。
 *
 *   electron tools/anim/sheet.js <输出 png> [每行几个] [时刻比例]
 *
 * 思路：把各场景的 SVG 内联进一个页面，用 JS 对每个 SVG 调 setCurrentTime()
 * 停在指定时刻，再把整页截下来。SMIL 是 SVG 原生特性，内联后依然可控制。
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const outPath = path.resolve(process.argv[2] || 'sheet.png');
const perRow = Number(process.argv[3] || 2);
const ratio = Number(process.argv[4] || 0.68);
const onlyBook = process.argv[5] || '';

const singly = require('./scenes-singly');
const doubly = require('./scenes-doubly');
const { renderScene } = require('./render');

let scenes = [...singly, ...doubly];
if (onlyBook === 'singly') scenes = singly;
if (onlyBook === 'doubly') scenes = doubly;

const COL_W = Math.floor(1920 / perRow);           // 每格宽度
const SCALE = COL_W / 960;                          // SVG 原始宽 960
const ROW_H = Math.ceil(300 * SCALE) + 26;          // 加标签高度

const cards = scenes.map((s) => {
  const t = (s.total * ratio).toFixed(2);
  const svg = renderScene(s).replace('<svg ', `<svg data-t="${t}" style="width:${COL_W - 12}px;height:auto;display:block" `);
  return `<figure><figcaption>${s.id} <span>@${t}s</span></figcaption>${svg}</figure>`;
}).join('');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}
  body{margin:0;background:#EEF1F4;font-family:'Segoe UI','Microsoft YaHei UI',sans-serif;
       padding:10px;display:grid;grid-template-columns:repeat(${perRow},1fr);gap:10px}
  figure{margin:0;background:#fff;border:1px solid #D8DEE4;border-radius:6px;padding:6px;overflow:hidden}
  figcaption{font-size:12px;color:#57606A;font-family:ui-monospace,Consolas,monospace;margin-bottom:4px}
  figcaption span{color:#8250DF}
  svg{width:100%;height:auto;display:block}
</style></head><body>${cards}
<script>
  document.querySelectorAll('svg[data-t]').forEach(function (s) {
    try { s.pauseAnimations(); s.setCurrentTime(parseFloat(s.dataset.t)); } catch (e) {}
  });
</script>
</body></html>`;

const tmpHtml = path.join(require('os').tmpdir(), 'lls-sheet.html');
fs.writeFileSync(tmpHtml, html, 'utf8');

app.whenReady().then(async () => {
  const rows = Math.ceil(scenes.length / perRow);
  const height = Math.min(6000, rows * ROW_H + 20);
  const win = new BrowserWindow({
    width: 1920,
    height,
    useContentSize: true,
    show: false,
    backgroundColor: '#EEF1F4',
    webPreferences: { backgroundThrottling: false },
  });
  try {
    await win.loadFile(tmpHtml);
    await new Promise((r) => setTimeout(r, 900));
    const img = await win.webContents.capturePage();
    fs.writeFileSync(outPath, img.toPNG());
    console.log(`拼图 -> ${outPath}  (${scenes.length} 个场景, ${perRow} 列, ${height}px 高)`);
  } catch (err) {
    console.error('拼图失败：' + ((err && err.message) || err));
  }
  app.exit(0);
});
