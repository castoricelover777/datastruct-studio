#!/usr/bin/env node
'use strict';
/**
 * 把 Python 参考文件里的 #@ 注释行缩进对齐到它描述的代码行。
 *
 *   node tools/align-py-comments.js resources/reference/01-02-最大子列和/modules.py
 *   node tools/align-py-comments.js --all      # 处理全部
 *
 * 规则：一段连续的 #@ 行，对齐到它**后面第一条代码行**的缩进。
 *       #%module / #%summary / #%end 这三个结构标记永远放第 0 列。
 *       只改行首空格，正文一个字不动。
 */
const fs = require('fs');
const path = require('path');

const REF = path.join(__dirname, '..', 'resources', 'reference');

function listPyFiles(arg) {
  if (arg && arg !== '--all') return [path.resolve(arg)];
  const out = [];
  for (const d of fs.readdirSync(REF)) {
    const dir = path.join(REF, d);
    if (!fs.statSync(dir).isDirectory()) continue;
    const one = path.join(dir, 'modules.py');
    if (fs.existsSync(one)) out.push(one);
    for (const sub of fs.readdirSync(dir)) {
      const sdir = path.join(dir, sub);
      if (fs.statSync(sdir).isDirectory() && fs.existsSync(path.join(sdir, 'modules.py'))) {
        out.push(path.join(sdir, 'modules.py'));
      }
    }
  }
  return out;
}

const isComment = (l) => /^[ \t]*#@[sd]\b/.test(l);
const isStruct = (l) => /^[ \t]*#%/.test(l);
const isCode = (l) => l.trim() !== '' && !l.trim().startsWith('#');

function alignOne(file) {
  const lines = fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n').split('\n');
  let changed = 0;

  for (let i = 0; i < lines.length; i++) {
    if (!isComment(lines[i])) continue;
    // 找到这段连续 #@ 行之后的第一条代码行，用它的缩进
    let j = i;
    while (j < lines.length && isComment(lines[j])) j++;
    // 跳过空行继续找代码
    let k = j;
    while (k < lines.length && lines[k].trim() === '') k++;
    let indent = '';
    if (k < lines.length && isCode(lines[k])) {
      indent = lines[k].slice(0, lines[k].length - lines[k].trimStart().length);
    } else {
      // 后面没有代码了（模块末尾的收尾注释），就沿用这一段的原缩进
      indent = lines[i].slice(0, lines[i].length - lines[i].trimStart().length);
    }
    for (let m = i; m < j; m++) {
      const body = lines[m].trimStart();
      const next = indent + body;
      if (next !== lines[m]) { lines[m] = next; changed++; }
    }
    i = j - 1;
  }

  // 结构标记永远第 0 列
  for (let i = 0; i < lines.length; i++) {
    if (isStruct(lines[i])) {
      const body = lines[i].trimStart();
      if (body !== lines[i]) { lines[i] = body; changed++; }
    }
  }

  const out = lines.join('\n');
  fs.writeFileSync(file, out, 'utf8');
  return changed;
}

let total = 0;
for (const f of listPyFiles(process.argv[2])) {
  const n = alignOne(f);
  total += n;
  const rel = f.replace(path.join(__dirname, '..') + path.sep, '');
  console.log(`  ${n ? '调整 ' + n + ' 行' : '未变  '}  ${rel}`);
}
console.log(`\n  共调整 ${total} 行`);
