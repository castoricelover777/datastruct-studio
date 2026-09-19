const fs = require('fs');
const F = 'docs/PDR-v2.1.3-修订版.txt';
const t = fs.readFileSync(F, 'utf8');
const lines = t.split('\n');
const body = lines.reduce((a, l) => a + l.length, 0);

console.log(`  正文合计: ${body} 字符（原 5461，减 ${5461 - body}，${Math.round((1 - body / 5461) * 100)}%）`);

// 黑话 / 升格词扫描
const BAD = ['我设计', '我自己设计', '我定的', '我规划', '我负责', '闭环', '架构', '决策',
  '链路', '体系', '赋能', '元数据', '中间层', '复用', '兜底', '校验值', '落地', '沉淀',
  '抓手', '真源', '工作流', '链路化', '维度', '范式', '痛点', '闭环验证'];
const found = BAD.filter((k) => t.includes(k));
console.log(`  黑话/升格词: ${found.length ? '⚠ ' + found.join('、') : '无'}`);

// 该保留的真实细节
const KEEP = [
  '其实我感觉只能从头播的动画等于没有',
  '每换一章重新再vibecoding一个工具太麻烦',
  '真实客户玩不玩的转',
  '宁可少一章，也不要一章错的',
  '代码全是 AI 写的，我不会写代码',
  '改漏过好几次',
  '倒排索引',
];
console.log('  保留的原话/细节:');
for (const k of KEEP) console.log(`    ${t.includes(k) ? '✅' : '❌'} ${k}`);
