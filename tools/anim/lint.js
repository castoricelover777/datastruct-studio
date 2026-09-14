'use strict';
/**
 * 动画 SVG 的自动体检
 * 捕获那些"肉眼看图容易漏掉"的问题：坐标算成 NaN、动画元素缺失、
 * 文字没转义、引用了不存在的槽位等。
 */

const fs = require('fs');
const path = require('path');
const { renderScene } = require('./render');
const singly = require('./scenes-singly');
const doubly = require('./scenes-doubly');

const DIR = path.join(__dirname, '..', '..', 'docs', 'animations');
const scenes = [...singly, ...doubly];

let problems = 0;
const warn = (id, msg) => { problems++; console.log(`  ✗ ${id}: ${msg}`); };

console.log(`检查 ${scenes.length} 个场景\n`);

for (const scene of scenes) {
  const svg = renderScene(scene);
  const file = path.join(DIR, `${scene.id}.svg`);
  const issues = [];

  // 1) 坐标/属性是否算出非法值
  if (/NaN|undefined|null"/.test(svg)) issues.push('SVG 里出现 NaN / undefined');
  if (svg.includes('x1="NaN"') || svg.includes('width="NaN"')) issues.push('坐标 NaN');

  // 2) 关键帧必须严格递增（SMIL 要求），否则动画会被浏览器忽略
  for (const m of svg.matchAll(/keyTimes="([^"]+)"/g)) {
    const times = m[1].split(';').map(Number);
    for (let i = 1; i < times.length; i++) {
      if (!(times[i] > times[i - 1])) {
        issues.push(`keyTimes 非递增：${m[1]}`);
        break;
      }
    }
  }

  // 3) 每个带 opacity="0" 的组都要有 animate，否则永远不显示
  const groups = svg.match(/<g opacity="0">/g) || [];
  const anims = svg.match(/<animate /g) || [];
  if (groups.length > anims.length) {
    issues.push(`${groups.length} 个隐藏组只有 ${anims.length} 个 animate —— 有元素永远不出现`);
  }

  // 4) 箭头引用的槽位必须存在
  const ids = new Set([...(scene.nodes || []), ...(scene.floating || [])].map((n) => n.id));
  for (const a of scene.arrows || []) {
    if (!ids.has(a.from)) issues.push(`箭头引用了不存在的结点 id: ${a.from}`);
    if (!ids.has(a.to)) issues.push(`箭头引用了不存在的结点 id: ${a.to}`);
  }

  // 5) 步骤字幕必须覆盖整条时间轴、且时间递增
  const steps = scene.steps || [];
  if (!steps.length) issues.push('没有步骤字幕');
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].t <= steps[i - 1].t) issues.push(`步骤时间非递增（第 ${i + 1} 步）`);
  }
  if (steps.length && steps[steps.length - 1].t >= scene.total) {
    issues.push('最后一步的起始时间超过了总时长');
  }

  // 6) 元素可见区间不能超出总时长
  for (const el of [...(scene.nodes || []), ...(scene.arrows || []), ...(scene.notes || [])]) {
    for (const [s, e] of el.vis || []) {
      if (e > scene.total + 0.001) issues.push(`可见区间超出总时长：${s}~${e} > ${scene.total}`);
    }
  }

  // 7) 每个场景都真的写盘了
  if (!fs.existsSync(file)) issues.push('SVG 文件没有生成');

  if (issues.length) {
    for (const i of [...new Set(issues)]) warn(scene.id, i);
  }
}

console.log(problems === 0
  ? `\n全部 ${scenes.length} 个场景通过体检`
  : `\n共 ${problems} 个问题`);
process.exit(problems ? 1 : 0);
