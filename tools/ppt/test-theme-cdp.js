// 用 CDP 真点按钮，验证深色模式
// Node 22+ 自带 WebSocket，不需要第三方库
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..', '..', 'docs');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9222;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdp(ws, id, method, params) {
  return new Promise((resolve, reject) => {
    const onMsg = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id === id) { ws.removeEventListener('message', onMsg); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => reject(new Error('CDP 超时: ' + method)), 15000);
  });
}

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/`;
  console.log('  服务:', url);

  const proc = spawn(EDGE, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--window-size=1344,841',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=' + path.join(process.env.TEMP, 'edge-cdp-theme'),
    url,
  ], { stdio: 'ignore' });

  await sleep(3500);

  const targets = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}/json`, (res) => {
      let b = ''; res.on('data', (d) => b += d); res.on('end', () => resolve(JSON.parse(b)));
    }).on('error', reject);
  });
  const page = targets.find((t) => t.type === 'page');
  if (!page) throw new Error('找不到页面 target');
  console.log('  页面:', page.url);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));

  const read = async (label) => {
    const r = await cdp(ws, 100 + Math.floor(Math.random() * 1000), 'Runtime.evaluate', {
      expression: `JSON.stringify({
        theme: document.documentElement.getAttribute('data-theme'),
        btn: (document.getElementById('btnTheme')||{}).textContent || null,
        bg: getComputedStyle(document.body).backgroundColor,
        sidebar: getComputedStyle(document.querySelector('.sidebar')).backgroundColor
      })`,
      returnByValue: true,
    });
    console.log(`  ${label}: ${r.result.value}`);
    return JSON.parse(r.result.value);
  };

  await sleep(1500);
  const before = await read('点击前');

  // 真的去点按钮
  await cdp(ws, 2001, 'Runtime.evaluate', {
    expression: `document.getElementById('btnTheme').click(); 'clicked'`,
    returnByValue: true,
  });
  await sleep(800);
  const after = await read('点击后');

  await cdp(ws, 2002, 'Runtime.evaluate', {
    expression: `document.getElementById('btnTheme').click(); 'clicked'`,
    returnByValue: true,
  });
  await sleep(800);
  const back = await read('再点一次');

  console.log('');
  const ok1 = before.theme !== after.theme;
  const ok2 = after.theme === 'dark' || back.theme === 'dark';
  const ok3 = after.theme === 'dark' && after.bg !== before.bg;
  const ok4 = back.theme === before.theme;
  console.log(`  ${ok1 ? '✅' : '❌'} 点一下，主题变了（${before.theme} → ${after.theme}）`);
  console.log(`  ${ok3 ? '✅' : '❌'} 深色时背景色也跟着变了（${before.bg} → ${after.bg}）`);
  console.log(`  ${ok4 ? '✅' : '❌'} 再点一下能切回来（${after.theme} → ${back.theme}）`);
  console.log(`  ${after.btn ? '✅' : '❌'} 按钮文字：点击前「${before.btn}」→ 点击后「${after.btn}」`);

  ws.close();
  proc.kill();
  server.close();
  process.exit(ok1 && ok3 && ok4 ? 0 : 1);
})().catch((e) => { console.error('失败：' + e.message); server.close(); process.exit(1); });
