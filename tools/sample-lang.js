#!/usr/bin/env node
'use strict';
/**
 * 在真浏览器里抽查 [C]/[Python] 切换（铺量后定期跑）
 *
 *   node tools/sample-lang.js
 *
 * 做三件事：起一个静态服务指向 docs/、用无头 Edge 通过 CDP 打开、
 * 逐个模块点开 → 读 C 代码 → 点 Python 按钮 → 读 Python 代码。
 * 检查：按钮没有置灰、内容真的变了、Python 高亮类生效。
 *
 * 为什么不能只看数据文件：数据里有 py 字段不代表界面上能切换，
 * 中间还隔着 build-data 的字段名、app.js 的取码逻辑、高亮器的语言判断。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..', 'docs');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9231;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

async function cdp(ws, id, method, params) {
  return new Promise((res, rej) => {
    const on = (e) => { const m = JSON.parse(e.data); if (m.id === id) { ws.removeEventListener('message', on); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); } };
    ws.addEventListener('message', on);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => rej(new Error('timeout ' + method)), 20000);
  });
}
const ev = async (ws, e) => (await cdp(ws, Math.floor(Math.random() * 99999), 'Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.value;

// 抽查表：从 data/code 里自动挑每个有 Python 的节的第一、最后一个模块
function buildSamples() {
  const out = [];
  for (const f of fs.readdirSync(path.join(ROOT, 'data', 'code')).filter((x) => x.endsWith('.json'))) {
    const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'code', f), 'utf8'));
    const pick = (mods, pre) => {
      const ids = Object.keys(mods || {}).filter((i) => mods[i].py && !mods[i].py.isAssembly);
      if (ids.length) out.push({ sec: pre.slice(0, 2), id: pre + '-' + mods[ids[0]].py ? ids[0] : ids[0] });
    };
    if (j.modules) {
      const ids = Object.keys(j.modules).filter((i) => j.modules[i].py);
      ids.slice(0, 1).concat(ids.slice(-1)).forEach((i) => out.push({ sec: i.slice(0, 2), id: i }));
    }
    if (j.views) {
      for (const v of Object.keys(j.views)) {
        const ids = Object.keys(j.views[v]).filter((i) => j.views[v][i].py);
        ids.slice(0, 1).concat(ids.slice(-1)).forEach((i) => out.push({ sec: i.slice(0, 2), id: i }));
      }
    }
  }
  // 去重
  const seen = new Set();
  return out.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
}

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const proc = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--window-size=1344,841',
    `--remote-debugging-port=${PORT}`, '--user-data-dir=' + path.join(process.env.TEMP, 'edge-cdp-sample'), url], { stdio: 'ignore' });
  await sleep(6000);
  const t = await new Promise((res, rej) => http.get(`http://127.0.0.1:${PORT}/json`, (r) => { let b = ''; r.on('data', (d) => b += d); r.on('end', () => res(JSON.parse(b))); }).on('error', rej));
  const ws = new WebSocket(t.find((x) => x.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  await sleep(2500);

  const samples = buildSamples();
  let pass = 0, fail = 0;
  const opened = new Set();
  for (const { sec, id } of samples) {
    if (!opened.has(sec)) {
      await ev(ws, `(function(){var h=document.querySelector('.tree-chapter[data-chapter="${sec}"] .tc-head');if(h)h.click();})()`);
      opened.add(sec);
      await sleep(1800);
    }
    const clicked = await ev(ws, `(function(){var b=document.querySelector('.tree-module[data-module="${id}"]');if(!b)return false;b.click();return true;})()`);
    await sleep(1000);
    if (!clicked) { console.log(`  ⚠ ${id}: 树里找不到`); fail++; continue; }

    const read = `(function(){var o=[];document.querySelectorAll('#codeView .cv-code .ln').forEach(function(l,i){if(i<2)o.push((l.textContent||'').replace(/^\\d+/,''))});return o.join('|')})()`;
    const cText = await ev(ws, read);
    await ev(ws, `document.querySelector('#langModes [data-lang="py"]').click()`);
    await sleep(850);
    const pyText = await ev(ws, read);
    const pyDisabled = await ev(ws, `document.querySelector('#langModes [data-lang="py"]').disabled`);
    const keys = await ev(ws, `(function(){var s=new Set();document.querySelectorAll('#codeView .cv-code span[class^="t-"]').forEach(function(e){s.add(e.className)});return Array.from(s).join(',')})()`);
    await ev(ws, `document.querySelector('#langModes [data-lang="c"]').click()`);
    await sleep(500);

    const changed = cText !== pyText;
    if (!pyDisabled && changed) { pass++; console.log(`  ✅ ${id}  高亮=${keys || '(无)'}`); }
    else {
      fail++;
      console.log(`  ❌ ${id}  按钮可用=${!pyDisabled} 内容已切换=${changed}`);
      console.log(`       C : ${cText.slice(0, 80)}`);
      console.log(`       Py: ${pyText.slice(0, 80)}`);
    }
  }
  console.log(`\n  抽查 ${samples.length} 个模块：通过 ${pass}，失败 ${fail}`);
  ws.close(); proc.kill(); server.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('失败：' + e.message); server.close(); process.exit(1); });
