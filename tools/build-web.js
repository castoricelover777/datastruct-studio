'use strict';
/**
 * 数据结构研习社 —— Web 版构建
 * ---------------------------------------------------------------------------
 * 思路：**不另写一套界面**。
 *
 * 桌面版的 src/app.js 只通过 window.studio 这一组接口拿数据（原本由 preload
 * 用 IPC 实现）。Web 版提供一个用 fetch 实现的同名 shim（web/studio-web.js），
 * 于是同一份 app.js / player.js / 样式原样就能在浏览器里跑起来 ——
 * 在线版与桌面版的行为天然一致，也不会出现"改了桌面版忘了改网页"。
 *
 * 唯一做不到的是编译：浏览器里没有 C 编译器，shim 的 run() 会如实返回失败。
 *
 *   node tools/build-web.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DATA = path.join(ROOT, 'data');
const WEB = path.join(ROOT, 'web');
const DOCS = path.join(ROOT, 'docs');
const APP = path.join(DOCS, 'app');

/** 复制整个目录（递归） */
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, entry.name);
    const b = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

function main() {
  fs.mkdirSync(APP, { recursive: true });

  // ---------------------------------------------------------------- 1. 渲染层原样复制
  const files = ['app.js', 'player.js', 'highlight.js', 'diff.js', 'editor.js', 'theme-boot.js'];
  for (const f of files) {
    fs.copyFileSync(path.join(SRC, f), path.join(APP, f));
  }
  console.log('复制渲染层：' + files.join(' '));

  // 桌面版的 styles.css 在 Web 版里叫 base.css（避免和 web.css 混淆），
  // 但 src/index.html 引用的是 styles.css，所以保持同名更省事
  fs.copyFileSync(path.join(SRC, 'styles.css'), path.join(APP, 'styles.css'));
  fs.copyFileSync(path.join(SRC, 'styles-v2.css'), path.join(APP, 'styles-v2.css'));
  console.log('复制样式：styles.css styles-v2.css');

  // ---------------------------------------------------------------- 2. 浏览器 shim
  fs.copyFileSync(path.join(WEB, 'studio-web.js'), path.join(APP, 'studio-web.js'));
  console.log('注入 shim：studio-web.js（用 fetch 实现 window.studio）');

  // ---------------------------------------------------------------- 3. 数据
  const dataOut = path.join(DOCS, 'data');
  fs.rmSync(dataOut, { recursive: true, force: true });
  copyDir(DATA, dataOut);
  let bytes = 0;
  const count = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) count(p); else bytes += fs.statSync(p).size;
  });
  count(dataOut);
  console.log(`复制数据：data/ → docs/data/（${(bytes / 1024 / 1024).toFixed(1)} MB）`);

  // ---------------------------------------------------------------- 4. 页面
  let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');

  // CSP：Web 版需要 fetch 同源数据（connect-src 'self'），其余保持严格
  html = html.replace(
    /content="default-src[^"]*"/,
    `content="default-src 'none'; script-src 'self'; style-src 'self'; `
    + `font-src 'self'; img-src 'self' data:; connect-src 'self'; `
    + `object-src 'none'; base-uri 'none'; form-action 'none';"`
  );
  // 标题与描述
  html = html.replace('<title>DataStruct Studio</title>',
    '<title>数据结构研习社 · DataStruct Studio</title>');
  // 桌面版里所有资源都和 index.html 同目录；Web 版把它们放进 app/ 子目录，
  // 所以要把不带目录的 js/css 引用统一加上 app/ 前缀
  html = html.replace(/(src|href)="((?!https?:|app\/|\/)[^"/]+\.(?:js|css))"/g, '$1="app/$2"');

  // shim 必须排在 app.js 之前（app.js 一加载就用 window.studio）
  html = html.replace('<script src="app/app.js"></script>',
    '<script src="app/studio-web.js"></script>\n  <script src="app/app.js"></script>');
  // Web 版没有桌面窗口，状态栏右侧给一个返回仓库的链接
  html = html.replace('<div class="sb-group sb-right" id="sbVersion"></div>',
    '<div class="sb-group sb-right" id="sbVersion"></div>');

  fs.writeFileSync(path.join(DOCS, 'index.html'), html, 'utf8');
  console.log('生成页面：docs/index.html');

  // ---------------------------------------------------------------- 5. 在线版补充样式
  const webCss = `/* 在线版补充：桌面版不需要的那一点点 */
.web-banner {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 20px;
  background: #FFF8E5;
  border-bottom: 1px solid #F0E0B0;
  color: #7A5B00;
  font-size: 12.5px;
}
[data-theme='dark'] .web-banner { background: #3A3320; border-bottom-color: #55492A; color: #E8D9A8; }
.web-banner b { font-weight: 600; }
.web-banner a { color: inherit; text-decoration: underline; }
.web-banner .spacer { flex: 1; }
`;
  fs.writeFileSync(path.join(APP, 'web.css'), webCss, 'utf8');
  html = fs.readFileSync(path.join(DOCS, 'index.html'), 'utf8')
    .replace('<link rel="stylesheet" href="app/styles-v2.css" />',
      '<link rel="stylesheet" href="app/styles-v2.css" />\n  <link rel="stylesheet" href="app/web.css" />')
    .replace('<main class="content">',
      `<main class="content">\n      <div class="web-banner">\n`
      + `        <span>这是<b>在线版</b>：阅读、默写、对照、动画都能用；但浏览器里没有 C 编译器，`
      + `<b>编译运行请用桌面版</b>（自带 TCC）。</span>\n`
      + `        <span class="spacer"></span>\n`
      + `        <a href="https://github.com/castoricelover777/datastruct-studio/releases/latest" target="_blank" rel="noopener">下载桌面版</a>\n`
      + `      </div>`);
  fs.writeFileSync(path.join(DOCS, 'index.html'), html, 'utf8');
  console.log('生成在线版提示条：docs/app/web.css');

  // ---------------------------------------------------------------- 6. 旧 Web 版产物清理
  fs.rmSync(path.join(DOCS, 'app', 'data.js'), { force: true });

  console.log('\nWeb 版构建完成 → docs/');
  console.log('  页面 docs/index.html 与桌面版 src/index.html 同源，只多了 shim 与提示条');
}

main();
