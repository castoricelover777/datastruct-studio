#!/usr/bin/env node
'use strict';
/**
 * 更新 GitHub Release 的 exe 资产
 *
 *   node tools/update-release.js <tag> <本地exe路径> <上传后的文件名>
 *   例：node tools/update-release.js v2.1.3 dist/xx.exe DataStruct-Studio-2.1.3-python.exe
 *
 * 需要环境变量 GH_TOKEN_DSH（从 git credential fill 取，不落盘）。
 *
 * 策略：先把新 exe 传上去，成功后再删同名的旧资产 ——
 * 这样万一上传失败，旧资产还在，不会出现"两个都没了"。
 */
const fs = require('fs');
const path = require('path');

const [tag, exePath, assetName] = process.argv.slice(2);
if (!tag || !exePath || !assetName) {
  console.error('用法: node tools/update-release.js <tag> <exe路径> <上传名>');
  process.exit(1);
}
const TOKEN = process.env.GH_TOKEN_DSH;
if (!TOKEN) { console.error('  缺少 GH_TOKEN_DSH 环境变量'); process.exit(1); }

const REPO = 'castoricelover777/datastruct-studio';
const H = {
  Authorization: `token ${TOKEN}`,
  'User-Agent': 'dsh-agent',
  Accept: 'application/vnd.github+json',
};

async function api(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { ...H, ...(opts.headers || {}) } });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`${r.status} ${r.statusText}: ${body.slice(0, 400)}`);
  }
  return r.status === 204 ? null : r.json();
}

(async () => {
  const size = fs.statSync(exePath).size;
  console.log(`  本地文件: ${exePath}`);
  console.log(`  大小: ${size} 字节（${(size / 1024 / 1024).toFixed(1)} MB）`);

  const rel = await api(`https://api.github.com/repos/${REPO}/releases/tags/${tag}`);
  console.log(`  Release: ${rel.name}`);
  console.log('  现有资产:');
  for (const a of rel.assets) console.log(`    [${a.id}] ${a.name}  ${a.size} 字节`);

  const uploadUrl = rel.upload_url.replace('{?name,label}', '');
  console.log('');
  console.log(`  上传 ${assetName} ...`);

  const buf = fs.readFileSync(exePath);
  const started = Date.now();
  const created = await api(`${uploadUrl}?name=${encodeURIComponent(assetName)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(size) },
    body: buf,
  });
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`  ✅ 上传成功（${secs} 秒）`);
  console.log(`     资产 id ${created.id}  ${created.name}  ${created.size} 字节`);
  console.log(`     下载地址 ${created.browser_download_url}`);

  // 删掉同一个文件名的旧资产（如果有）
  const sameName = rel.assets.filter((a) => a.name === created.name && a.id !== created.id);
  const legacy = rel.assets.filter((a) => a.name === 'DataStruct-Studio-2.1.3-portable.exe');
  for (const a of [...sameName, ...legacy]) {
    await api(`https://api.github.com/repos/${REPO}/releases/assets/${a.id}`, { method: 'DELETE' });
    console.log(`  ✅ 已删除旧资产 [${a.id}] ${a.name}`);
  }

  const after = await api(`https://api.github.com/repos/${REPO}/releases/tags/${tag}`);
  console.log('');
  console.log('  复核 Release 现在的资产:');
  for (const a of after.assets) console.log(`    ${a.name}  ${a.size} 字节  状态 ${a.state}`);
})().catch((e) => {
  console.error('  ❌ 失败: ' + e.message);
  process.exit(1);
});
