'use strict';
/**
 * LinkList Studio —— 模块演示动画的生成入口
 *
 *   node tools/make-animations.js            生成全部动画 + 画廊
 *   node tools/make-animations.js singly-04  只生成 id 含该字符串的场景（调试用）
 *
 * 产物：
 *   docs/animations/<id>.svg      单个模块的动画（README 里用 <img> 引用即可播放）
 *   docs/animations/index.html    自包含画廊页（全部动画内联，本地双击可看）
 */

const fs = require('fs');
const path = require('path');
const { renderScene } = require('./anim/render');
const singly = require('./anim/scenes-singly');
const doubly = require('./anim/scenes-doubly');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'animations');
const filter = process.argv[2] || '';

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const scenes = [...singly, ...doubly].filter((s) => !filter || s.id.includes(filter));
  if (scenes.length === 0) {
    console.error('没有匹配的场景：' + filter);
    process.exit(1);
  }

  const written = [];
  for (const scene of scenes) {
    const svg = renderScene(scene);
    const file = path.join(OUT_DIR, `${scene.id}.svg`);
    fs.writeFileSync(file, svg, 'utf8');
    written.push({ scene, file, size: Buffer.byteLength(svg, 'utf8') });
    console.log(`  ${scene.id.padEnd(28)} ${(svg.length / 1024).toFixed(1)} KB`);
  }
  console.log(`\n生成 ${written.length} 个动画 -> docs/animations/`);

  if (!filter) writeGallery(scenes);
}

/** 自包含画廊：把所有 SVG 内联进一个页面，按教材分组 */
function writeGallery(scenes) {
  const groups = [
    { name: '单链表', items: scenes.filter((s) => s.variant !== 'doubly') },
    { name: '双向链表', items: scenes.filter((s) => s.variant === 'doubly') },
  ];

  const cards = groups.map((g) => `
    <section class="group">
      <h2>${g.name} <span class="count">${g.items.length} 个模块</span></h2>
      <div class="grid">
        ${g.items.map((s) => `
        <figure class="card">
          <div class="frame">${renderScene(s).replace(/^<svg /, '<svg class="anim" ')}</div>
          <figcaption>
            <b>${s.no} ${s.title}</b>
            <span>${s.sub || ''}</span>
          </figcaption>
        </figure>`).join('')}
      </div>
    </section>`).join('');

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LinkList Studio · 模块演示动画</title>
<style>
  :root{
    --bg:#F6F8FA; --panel:#FFFFFF; --line:#E4E8EC; --ink:#1F2328; --dim:#6E7781;
    --blue:#3B82F6; --mono:ui-monospace,'Cascadia Code',Consolas,monospace;
    --ui:'Segoe UI','Microsoft YaHei UI',system-ui,sans-serif;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--ui);
       -webkit-font-smoothing:antialiased;padding:48px 32px 80px}
  header{max-width:1120px;margin:0 auto 40px}
  h1{margin:0 0 10px;font-size:30px;letter-spacing:-.4px}
  .lede{margin:0;color:var(--dim);font-size:15px;line-height:1.75;max-width:74ch}
  .lede b{color:var(--ink);font-weight:600}
  .group{max-width:1120px;margin:0 auto 52px}
  h2{font-size:15px;font-weight:600;letter-spacing:.2px;margin:0 0 18px;
     padding-bottom:10px;border-bottom:1px solid var(--line);display:flex;
     align-items:baseline;gap:10px}
  .count{font-weight:400;color:var(--dim);font-size:12.5px;font-family:var(--mono)}
  .grid{display:grid;gap:22px}
  .card{margin:0;background:var(--panel);border:1px solid var(--line);border-radius:12px;
        overflow:hidden;box-shadow:0 1px 2px rgba(27,31,36,.04)}
  .frame{border-bottom:1px solid var(--line);background:#fff}
  .anim{display:block;width:100%;height:auto}
  figcaption{padding:13px 18px 15px;display:flex;flex-direction:column;gap:3px}
  figcaption b{font-size:13.5px;font-weight:600}
  figcaption span{font-size:12.5px;color:var(--dim)}
  footer{max-width:1120px;margin:0 auto;color:var(--dim);font-size:12.5px;
         border-top:1px solid var(--line);padding-top:18px}
  code{font-family:var(--mono);font-size:12px;background:#EDF1F5;padding:1.5px 6px;border-radius:4px}
</style>
</head>
<body>
<header>
  <h1>LinkList Studio · 模块演示动画</h1>
  <p class="lede">
    每个代码模块一段动画，把 <b>那一句指针赋值到底改变了什么</b> 演出来。
    动画用 SVG 内联的 SMIL 写成，因此放进 README 也能直接播放。
    结点里的圆点是指针域，<b style="color:#3B82F6">蓝色</b>是已有连接，
    <b style="color:#10B981">绿色</b>是本步新建的结点与新的连接，
    <b style="color:#EF4444">红色</b>是即将被摘除的结点。
  </p>
</header>
${cards}
<footer>
  由 <code>node tools/make-animations.js</code> 生成 · 动画源码见 <code>tools/anim/scenes-*.js</code>
</footer>
</body>
</html>`;

  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');
  console.log('画廊 -> docs/animations/index.html');
}

main();
