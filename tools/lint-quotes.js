'use strict';
/**
 * 找出**代码行**里误用的 ASCII 双引号。
 *
 * 背景：这个坑前后踩过五次。写 printf 的中文提示时想用引号强调某个词，
 * 敲成了 ASCII 的双引号，而 C 字符串里未转义的双引号会直接语法错误。
 * 中文里强调应该用「」。
 *
 * 只查真正的代码行：注释里的引号不影响编译，报出来只是噪音。
 * 块注释是跨行的，所以这里要跟踪块注释的状态。
 *
 *   node tools/lint-quotes.js           检查全部
 *   node tools/lint-quotes.js 05-01     只检查某一节
 */
const fs = require('fs');
const path = require('path');

const REF = path.join(__dirname, '..', 'resources', 'reference');
const filter = process.argv[2];
let problems = 0;

/** 引号两边都是中文汉字 → 几乎一定是在 printf 里把「」敲成了双引号 */
const SUSPECT = /[\u4e00-\u9fa5]"[\u4e00-\u9fa5]/;
/** 这行代码里有没有中文 */
const HAS_CJK = /[\u4e00-\u9fa5]/;

function checkFile(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let inBlockComment = false;

  lines.forEach((line, i) => {
    const t = line.trim();
    let code = line;

    if (inBlockComment) {
      const end = line.indexOf('*/');
      if (end < 0) return;
      inBlockComment = false;
      code = line.slice(end + 2);
    } else if (t.startsWith('//')) {
      return;
    } else {
      const start = line.indexOf('/*');
      if (start >= 0) {
        const end = line.indexOf('*/', start);
        if (end >= 0) {
          code = line.slice(0, start) + line.slice(end + 2);
        } else {
          code = line.slice(0, start);
          inBlockComment = true;
        }
      }
    }

    if (!HAS_CJK.test(code)) return;
    if (!SUSPECT.test(code)) return;

    problems++;
    console.log(`  ${path.relative(REF, file)}:${i + 1}`);
    console.log(`      ${t.slice(0, 78)}`);
  });
}

const dirs = fs.readdirSync(REF).filter((d) => {
  if (filter && !d.startsWith(filter)) return false;
  return fs.statSync(path.join(REF, d)).isDirectory();
});

for (const d of dirs) {
  const walk = (p) => {
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      const fp = path.join(p, e.name);
      if (e.isDirectory()) walk(fp);
      else if (e.name.endsWith('.c')) checkFile(fp);
    }
  };
  walk(path.join(REF, d));
}

if (problems === 0) {
  console.log('代码行里没有误用的引号');
} else {
  console.log(`\n共 ${problems} 处 —— 修法：中文里强调用「」，不要用 ASCII 双引号`);
}
process.exit(problems > 0 ? 1 : 0);
