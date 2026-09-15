'use strict';
/**
 * 把某一节在 course.json 里标记为已完成，并补上简介。
 *
 *   node tools/mark-done.js 03-01 "二叉树的结点结构与四种遍历：先序、中序、后序、层序。"
 *
 * 之所以做成脚本而不是手工改 JSON：后面还有十几节要标，
 * 而且手工改容易漏掉 summary 或写错引号。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'resources', 'course.json');

const id = process.argv[2];
const summary = process.argv[3] || '';

if (!/^\d{2}-\d{2}$/.test(id || '')) {
  console.error('用法: node tools/mark-done.js <节id，如 03-01> "<一句话简介>"');
  process.exit(1);
}

const course = JSON.parse(fs.readFileSync(FILE, 'utf8'));
let hit = null;
for (const ch of course.chapters) {
  for (const sec of ch.sections) {
    if (sec.id === id) hit = sec;
  }
}
if (!hit) {
  console.error('course.json 里找不到这一节：' + id);
  process.exit(1);
}

hit.status = 'done';
if (summary) hit.summary = summary;
fs.writeFileSync(FILE, JSON.stringify(course, null, 2) + '\n', 'utf8');

console.log(`已标记 ${id} ${hit.title} → done`);
if (summary) console.log(`  简介：${summary}`);
