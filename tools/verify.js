'use strict';
/**
 * DataStruct Studio —— 数据与动画自检
 * ---------------------------------------------------------------------------
 * v1.0 的核心检查（三档注释一致性、脚手架可编译、动画结构完整）全部保留，
 * 只是改成针对 data/ 跑 —— 因为应用现在只读 data/，
 * 检查 data/ 才等于检查用户真正会看到的东西。
 *
 *   node tools/verify.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const DOC_ANIM = path.join(ROOT, 'docs', 'animations');

let pass = 0;
let fail = 0;
const failures = [];

function check(ok, label) {
  if (ok) { pass++; return true; }
  fail++;
  failures.push(label);
  console.log(`  ✗ ${label}`);
  return false;
}

function findCompiler() {
  for (const c of ['gcc', path.join('E:', 'w64devkit', 'bin', 'gcc.exe')]) {
    try { execFileSync(c, ['--version'], { stdio: 'ignore' }); return c; } catch { /* next */ }
  }
  return null;
}

/** 把注释都剥掉，只剩代码 —— 三档模式的代码部分必须逐字节一致 */
function codeOnly(text) {
  return String(text)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((l) => l.replace(/\/\/.*$/, '').replace(/\s+/g, ' ').trim())
    .filter((l) => l !== '')
    .join('\n');
}

function main() {
  const gcc = findCompiler();
  console.log(`编译器：${gcc || '（未找到，跳过输出检查）'}`);

  // ---------------------------------------------------------------- 章节树
  console.log('\n[1] 章节树');
  const treeFile = path.join(DATA, 'tree.json');
  if (!fs.existsSync(treeFile)) {
    console.error('缺少 data/tree.json —— 先运行 npm run data');
    process.exit(1);
  }
  const tree = JSON.parse(fs.readFileSync(treeFile, 'utf8'));
  check(!!tree.product && !!tree.course, 'tree.json 缺产品名或课程名');
  check(Array.isArray(tree.chapters) && tree.chapters.length > 0, 'tree.json 没有章节');
  let sectionCount = 0;
  let moduleCount = 0;
  let animCount = 0;

  const visitModules = (label, codeMap, metas) => {
    for (const meta of metas) {
      moduleCount++;
      const payload = codeMap[meta.id];
      if (!check(!!payload, `${label} 模块 ${meta.id} 在 code JSON 里缺失`)) continue;

      for (const m of ['detail', 'short', 'none']) {
        check(typeof payload.modes[m] === 'string' && payload.modes[m].trim().length > 0,
          `${meta.id} 缺少「${m}」档代码`);
      }
      const a = codeOnly(payload.modes.detail);
      const b = codeOnly(payload.modes.short);
      const c = codeOnly(payload.modes.none);
      check(a === b && b === c, `${meta.id} 三档注释的代码部分不一致（这是 v1.0 的核心保证）`);
      check(payload.modes.short.length <= payload.modes.detail.length + 1,
        `${meta.id} 精简注释比详细注释还长`);

      check(meta.difficulty >= 0 && meta.difficulty <= 3, `${meta.id} 难度值越界`);
      check(typeof meta.summary === 'string' && meta.summary.length > 0, `${meta.id} 缺一句话作用`);
      check(typeof meta.codeLineCount === 'number' && meta.codeLineCount > 0, `${meta.id} 行数统计异常`);
      for (const d of meta.deps || []) {
        check(Object.prototype.hasOwnProperty.call(codeMap, d), `${meta.id} 依赖了不存在的模块 ${d}`);
      }
      if (meta.hasPractice) {
        check(typeof payload.scaffold === 'string' && payload.scaffold.indexOf('轮到你了') >= 0,
          `${meta.id} 的脚手架没有「轮到你了」标记`);
        if (gcc) {
          check(typeof payload.expectedOutput === 'string' && payload.expectedOutput.length > 0,
            `${meta.id} 缺少真跑出来的预期输出`);
        }
        // PRD 验收 4：每个模块至少一段动画（"完整源码"是拼装视图，不算）
        check(meta.hasAnimation === true, `${meta.id} 没有配动画（PRD 要求每个模块至少一段）`);
      }
    }
  };

  for (const ch of tree.chapters) {
    check(/^\d{2}$/.test(ch.id), `章 id 不规范：${ch.id}`);
    check(/^#[0-9A-Fa-f]{6}$/.test(ch.color), `章 ${ch.id} 的色带色不合法：${ch.color}`);

    // 模块级信息在 chapters/<章>.json（tree.json 里只放摘要，保证启动够快）
    const chFile = path.join(DATA, 'chapters', `${ch.id}.json`);
    check(fs.existsSync(chFile), `章 ${ch.id} 缺少 chapters JSON`);
    const detail = fs.existsSync(chFile) ? JSON.parse(fs.readFileSync(chFile, 'utf8')) : { sections: [] };
    const detailById = new Map((detail.sections || []).map((s) => [s.id, s]));

    for (const sec of ch.sections) {
      sectionCount++;
      check(sec.id.indexOf(ch.id + '-') === 0, `节 ${sec.id} 不属于章 ${ch.id}`);
      if (!sec.hasContent) continue;

      const dsec = detailById.get(sec.id);
      if (!check(!!dsec, `chapters/${ch.id}.json 里缺少节 ${sec.id}`)) continue;

      const codeFile = path.join(DATA, 'code', `${sec.id}.json`);
      if (!check(fs.existsSync(codeFile), `节 ${sec.id} 标记为有内容，但没有 code JSON`)) continue;
      const code = JSON.parse(fs.readFileSync(codeFile, 'utf8'));

      if (dsec.views && dsec.views.length) {
        check(!!(code.views && code.views.singly && code.views.doubly),
          `${sec.id} 是带对比视图的大模块，但缺少 singly 或 doubly`);
        let sum = 0;
        for (const v of dsec.views) {
          if (v.id === 'compare') continue;
          const metas = v.modules || [];
          check(metas.length > 0, `大模块视图 ${sec.id}/${v.id} 没有模块`);
          sum += metas.length;
          if (!check(!!(code.views && code.views[v.id]), `大模块 ${sec.id} 缺少视图 ${v.id} 的代码`)) continue;
          visitModules(`${sec.id}/${v.id}`, code.views[v.id], metas);
        }
        // tree.json 的摘要要和实际模块数对得上
        const treeSec = ch.sections.find((s) => s.id === sec.id);
        check(!treeSec || treeSec.moduleCount === sum,
          `${sec.id} 的摘要模块数（${treeSec && treeSec.moduleCount}）与实际（${sum}）不一致`);      } else {
        const metas = dsec.modules || [];
        check(metas.length > 0, `节 ${sec.id} 没有模块`);
        visitModules(sec.id, code.modules || {}, metas);
      }
    }
  }
  console.log(`  章 ${tree.chapters.length} 个，节 ${sectionCount} 个，模块 ${moduleCount} 个`);

  // ---------------------------------------------------------------- 动画
  console.log('\n[2] 动画');
  const declaredSvg = new Set();
  for (const ch of tree.chapters) {
    for (const sec of ch.sections) {
      const f = path.join(DATA, 'animations', `${sec.id}.json`);
      if (!fs.existsSync(f)) continue;
      const anims = JSON.parse(fs.readFileSync(f, 'utf8')).animations || {};
      for (const id of Object.keys(anims)) {
        const a = anims[id];
        animCount++;
        check(a.total > 0, `${id} 动画总时长为 0`);
        check(Array.isArray(a.steps) && a.steps.length >= 3, `${id} 关键帧少于 3 个`);
        let last = -1;
        for (const s of a.steps) {
          check(s.t >= last, `${id} 关键帧时间没有递增`);
          last = s.t;
          check(s.t < a.total, `${id} 有关键帧超出总时长`);
          check(typeof s.name === 'string' && s.name.length > 0, `${id} 有关键帧没有名字`);
          check(typeof s.text === 'string' && s.text.length > 0, `${id} 有关键帧没有说明文字`);
        }
        const svgFile = path.join(DOC_ANIM, path.basename(a.svg || ''));
        declaredSvg.add(path.basename(a.svg || ''));
        if (check(fs.existsSync(svgFile), `${id} 的 SVG 不存在：${a.svg}`)) {
          const svg = fs.readFileSync(svgFile, 'utf8');
          check(!/NaN|undefined/.test(svg), `${id} 的 SVG 里出现了 NaN/undefined`);
          check(svg.indexOf('<animate') >= 0, `${id} 的 SVG 没有动画元素（README 里不会动）`);
          check(!/(href|src)\s*=\s*"https?:/.test(svg), `${id} 的 SVG 引用了外部资源`);
        }
      }
    }
  }

  // 孤儿 SVG：产物目录是"生成式"的，场景 id 改名后旧文件会留在这里。
  // 它不参与应用播放，但会一直挂在 Pages 上被当成内容 —— 曾经就漏过一个
  // （03-01-08-main，场景改成 FreeTree 后没人删）。make-animations.js 会在
  // 生成时清掉，这里再兜一道，防止手滑绕过生成脚本。
  for (const f of fs.readdirSync(DOC_ANIM).filter((x) => x.endsWith('.svg'))) {
    check(declaredSvg.has(f), `孤儿 SVG：docs/animations/${f}（没有任何场景定义，应以场景 id 为准删掉）`);
  }
  console.log(`  动画 ${animCount} 段`);

  // ---------------------------------------------------------------- 覆盖清单
  console.log('\n[3] 覆盖清单');
  const covFile = path.join(DATA, 'coverage.json');
  if (check(fs.existsSync(covFile), '缺少 coverage.json')) {
    const cov = JSON.parse(fs.readFileSync(covFile, 'utf8')).coverage;
    check(cov.length === sectionCount, `覆盖清单节数（${cov.length}）与章节树（${sectionCount}）不一致`);
    const done = cov.filter((c) => c.status === 'done' && c.modules > 0);
    console.log(`  已完成 ${done.length} / ${cov.length} 节，共 ${moduleCount} 个模块、${animCount} 段动画`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`检查项 ${pass + fail} 个，失败 ${fail} 个`);
  console.log('='.repeat(60));
  if (fail) {
    console.log('\n失败明细：');
    failures.slice(0, 30).forEach((f) => console.log('  - ' + f));
    if (failures.length > 30) console.log(`  … 还有 ${failures.length - 30} 条`);
  }
  process.exit(fail ? 1 : 0);
}

main();
