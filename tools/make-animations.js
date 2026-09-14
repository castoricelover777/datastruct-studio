'use strict';
/**
 * 数据结构研习社 —— 动画 SVG 生成
 * ---------------------------------------------------------------------------
 * 读 resources/animations/<节>.js 里的场景定义，输出：
 *
 *   docs/animations/<场景 id>.svg    单段动画（README 里 <img> 引用即可播放）
 *   docs/animations/index.html       自包含画廊页（按节分组）
 *
 *   node tools/make-animations.js            全部
 *   node tools/make-animations.js 02-02      只生成 id 含该串的（调试）
 */

const fs = require('fs');
const path = require('path');
const { renderScene } = require('./anim/render');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'resources', 'animations');
const OUT = path.join(ROOT, 'docs', 'animations');
const filter = process.argv[2] || '';

/** 按节收集场景：一个文件就是一节，导出的是场景数组 */
function loadScenes() {
  if (!fs.existsSync(SRC)) return [];
  const out = [];
  for (const f of fs.readdirSync(SRC).filter((x) => x.endsWith('.js')).sort()) {
    const section = f.replace(/\.js$/, '');
    let scenes = [];
    try {
      scenes = require(path.join(SRC, f));
    } catch (e) {
      console.error(`  ✗ 加载 ${f} 失败：${e.message}`);
      continue;
    }
    for (const s of Array.isArray(scenes) ? scenes : []) out.push({ section, scene: s });
  }
  return out;
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const all = loadScenes().filter((x) => !filter || x.scene.id.includes(filter));
  if (!all.length) {
    console.error('没有匹配的场景：' + filter);
    process.exit(1);
  }

  const written = [];
  for (const { section, scene } of all) {
    const svg = renderScene(scene);
    fs.writeFileSync(path.join(OUT, `${scene.id}.svg`), svg, 'utf8');
    written.push({ section, scene });
    console.log(`  ${scene.id.padEnd(30)} ${(svg.length / 1024).toFixed(1)} KB`);
  }
  console.log(`\n生成 ${written.length} 段动画 -> docs/animations/`);

  if (!filter) writeGallery(written);
}

/** 画廊：按节分组，自包含单文件 */
function writeGallery(items) {
  const bySection = new Map();
  for (const it of items) {
    if (!bySection.has(it.section)) bySection.set(it.section, []);
    bySection.get(it.section).push(it.scene);
  }

  const sections = [...bySection.entries()].map(([sec, scenes]) => `
    <section class="group">
      <h2>${sec} <span class="count">${scenes.length} 段动画</span></h2>
      <div class="grid">
        ${scenes.map((s) => `
        <figure class="card">
          <div class="frame">${renderScene(s)}</div>
          <figcaption>
            <b>${s.id}</b>
            <span>${s.title}${s.sub ? ' · ' + s.sub : ''}</span>
          </figcaption>
        </figure>`).join('')}
      </div>
    </section>`).join('');

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>数据结构研习社 · 模块演示动画</title>
<style>
  :root{
    --bg:#F6F8FA; --panel:#FFFFFF; --line:#E4E8EC; --ink:#1F2328; --dim:#6E7781;
    --mono:ui-monospace,'Cascadia Code',Consolas,monospace;
    --ui:'Segoe UI','Microsoft YaHei UI',system-ui,sans-serif;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--ui);
       -webkit-font-smoothing:antialiased;padding:48px 32px 80px}
  header{max-width:1120px;margin:0 auto 40px}
  h1{margin:0 0 10px;font-size:30px;letter-spacing:-.4px}
  .lede{margin:0;color:var(--dim);font-size:15px;line-height:1.75;max-width:76ch}
  .lede b{color:var(--ink);font-weight:600}
  .group{max-width:1120px;margin:0 auto 52px}
  h2{font-size:15px;font-weight:600;letter-spacing:.2px;margin:0 0 18px;
     padding-bottom:10px;border-bottom:1px solid var(--line);display:flex;
     align-items:baseline;gap:10px;font-family:var(--mono)}
  .count{font-weight:400;color:var(--dim);font-size:12.5px}
  .grid{display:grid;gap:22px}
  .card{margin:0;background:var(--panel);border:1px solid var(--line);border-radius:12px;
        overflow:hidden;box-shadow:0 1px 2px rgba(27,31,36,.04)}
  .frame{border-bottom:1px solid var(--line);background:#fff}
  .frame svg{display:block;width:100%;height:auto}
  figcaption{padding:13px 18px 15px;display:flex;flex-direction:column;gap:3px}
  figcaption b{font-size:13px;font-weight:600;font-family:var(--mono)}
  figcaption span{font-size:12.5px;color:var(--dim)}
  footer{max-width:1120px;margin:0 auto;color:var(--dim);font-size:12.5px;
         border-top:1px solid var(--line);padding-top:18px}
  code{font-family:var(--mono);font-size:12px;background:#EDF1F5;padding:1.5px 6px;border-radius:4px}
</style>
</head>
<body>
<header>
  <h1>数据结构研习社 · 模块演示动画</h1>
  <p class="lede">
    每个代码模块一段动画，把 <b>那一句关键语句到底改变了什么</b> 演出来。
    动画用 SVG 内联 SMIL 写成，所以放进 README 也能直接播放；
    在桌面版与在线版里，它还能被<b>进度条拖动、变速、单步</b>，并与代码行联动高亮。
  </p>
</header>
${sections}
<footer>
  由 <code>node tools/make-animations.js</code> 生成 · 场景定义见 <code>resources/animations/</code>
</footer>
</body>
</html>`;

  fs.writeFileSync(path.join(OUT, 'index.html'), html, 'utf8');
  console.log('画廊 -> docs/animations/index.html');
}

main();
