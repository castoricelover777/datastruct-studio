'use strict';
/**
 * 动画"文案与画面是否相符"的语义核验。
 * ---------------------------------------------------------------------------
 * lint-anim.js 只能扫机械问题（空画面、越界、重叠）。这个工具往前一步：
 * 把每个 step 时间点的**真实可见画面**抽成快照，和**文案声称的动作**对照，
 * 找出"说的和做的不一致"。
 *
 * 三类检查（都是能客观判定的，不做主观打分）：
 *
 *   ① 结果对得上吗 —— 文案说"结果 1 2 3 4 5 8"，那一刻格子里真该是这串数
 *   ② 说了要交换，画面动了吗 —— 文案说"交换"，但那一刻格子里的值没变
 *   ③ 画面变了，文案提都没提 —— 文案没有任何动作词，格子却整套换掉了
 *      （用户说的"步骤和画面对不上"，这一条最接近）
 *
 *   node tools/check-anim-semantics.js            全部场景
 *   node tools/check-anim-semantics.js 05-01      只看某节
 *   node tools/check-anim-semantics.js --detail 05-01-02   打印某段的完整时间线
 */

const fs = require('fs');
const path = require('path');
const { normalizeScene, visibleAt } = require('./anim/normalize');

const A = path.join(__dirname, '..', 'resources', 'animations');
const filters = process.argv.slice(2).filter((s) => !s.startsWith('--'));
const detailArg = process.argv.indexOf('--detail');
const detailId = detailArg >= 0 ? process.argv[detailArg + 1] : null;

// --detail 模式下不按节过滤（要能直接点名任意一段）
const files = fs.readdirSync(A).filter((f) => f.endsWith('.js')).filter((f) =>
  detailId || !filters.length || filters.some((p) => f.startsWith(p)));

// ---------------------------------------------------------------------------
// 快照：某一时刻画面上"看得见的东西"
// ---------------------------------------------------------------------------

/** 某一时刻每个格子显示的值（同一格多段重叠时取起点最晚的那段） */
function cellValuesAt(scene, t) {
  const best = new Map();   // at -> { value, start }
  for (const c of scene.cells || []) {
    if (!visibleAt(c.vis, t)) continue;
    const start = (c.vis && c.vis[0]) ? c.vis[0][0] : 0;
    const cur = best.get(c.at);
    if (!cur || start >= cur.start) best.set(c.at, { value: String(c.value), start });
  }
  const out = [];
  const slots = scene.slots || 8;
  for (let i = 0; i < slots; i++) out.push(best.has(i) ? best.get(i).value : null);
  return out;
}

/** 某一时刻高亮的格子 */
function highlightsAt(scene, t) {
  return (scene.highlights || [])
    .filter((b) => visibleAt(b.vis, t))
    .map((b) => b.at)
    .sort((a, b) => a - b);
}

/** 某一时刻可见的标注文字 */
function notesAt(scene, t) {
  return (scene.notes || []).filter((n) => visibleAt(n.vis, t)).map((n) => String(n.text));
}

/** 两个快照之间，哪些格子的值变了 */
function changedSlots(a, b) {
  const out = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) out.push({ at: i, from: a[i], to: b[i] });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 文案解析：它声称了什么
// ---------------------------------------------------------------------------

/** 从"下标 0 和 3"这类写法里取槽位号 */
function slotsFromText(text) {
  const out = [];
  const s = String(text);
  for (const m of s.matchAll(/下标\s*(\d+)\s*和\s*(\d+)/g)) out.push([Number(m[1]), Number(m[2])]);
  for (const m of s.matchAll(/位置\s*(\d+)\s*和\s*(\d+)/g)) out.push([Number(m[1]), Number(m[2])]);
  return out;
}

/** "结果 1 2 3 4 5 8" / "最终 ..." 里声称的整串结果 */
function claimedResult(text) {
  const s = String(text);
  const m = s.match(/(?:结果|最终|排好)[^\d]{0,6}((?:\d+\s+){2,}\d+)/);
  if (!m) return null;
  const nums = m[1].trim().split(/\s+/).map(Number);
  return nums.length >= 3 ? nums : null;
}

/** "变成 2 1 3 5 8 4" / "→ 1 4 5 2 8 3" 里声称的整串数组 */
function claimedArray(text) {
  const s = String(text);
  const m = s.match(/(?:变成|得到|排成|成为|→)\s*((?:\d+\s+){3,}\d+)/);
  if (!m) return null;
  const nums = m[1].trim().split(/\s+/).map(Number);
  return nums.length >= 4 ? nums : null;
}

const ACTION_WORDS = ['交换', '互换', '后移', '移动', '插入', '落', '挪', '冒', '沉',
  '合并', '分区', '分两半', '递归', '排序', '排', '比较', '比', '换成', '变成', '赋值', '位置',
  '送', '放', '进', '出', '取', '填', '压', '入', '退', '归位', '下沉', '建', '收集', '分配'];
const NOCHANGE_WORDS = ['不变', '不动', '不用动', '都留', '原样', '保持', '保留', '已经有序的'];
// "讲原理"的句式：这些步骤本来就不该有画面变化，不能当成"说的和做的不一致"
const PRINCIPLE = ['如果', '要保证', '必须', '需', '应该', '为什么', '的区别', '关键是',
  '原理', '规则', '定义', '每次', '每一轮', '每一趟', '可能', '会再', '总结', '一句话',
  '的做法', '不用', '不需要', '不必', '这样遇到', '就会',   // 讲做法/讲规则/否定句
  '代替', '边界检查', '哨兵'];                               // 讲替代方案/讲代码细节，不看画面

/** 这一步是不是在"讲原理"而不是"描述当前动作" */
function isPrinciple(text) {
  const s = String(text);
  return PRINCIPLE.some((w) => s.includes(w));
}

/** 本步里出现的所有数值（用来判断文案是不是在说"此刻的值"） */
function numbersIn(text) {
  return (String(text).match(/\d+/g) || []).map(Number);
}

/**
 * 这个值算不算"真实数据"。
 * 格子里的 '?'（未初始化的随机值）、'·'/'_'（补位用的空位）是示意符号，
 * 它们之间的变化不算"画面改了数据"，否则到处都是误报。
 */
function isDataValue(v) {
  return typeof v === 'string' && v.length > 0 && !/^[?·_\-—…]+$/.test(v);
}

/** 一个场景里出现过的所有取值（用来判断文案里的数字是不是这个场景的） */
function collectSceneValues(sc) {
  const out = new Set();
  for (const c of sc.cells || []) if (isDataValue(String(c.value))) out.add(String(c.value));
  return out;
}

function hasAction(text) {
  const s = String(text);
  return ACTION_WORDS.some((w) => s.includes(w));
}
function saysNoChange(text) {
  const s = String(text);
  return NOCHANGE_WORDS.some((w) => s.includes(w));
}

// ---------------------------------------------------------------------------
// 结点类场景（链表 / 树 / 图）
// ---------------------------------------------------------------------------
//
// 这几类的"画面"不是格子阵列，但语义核验的同一套逻辑照样能用：
// 把每个结点/顶点当成"有值的东西"，看它出现/消失的时刻和文案对不对得上。
//
// 只在**结点出现或消失的那一步**检查，避免把普通讲解步骤误判成不符。

/** 取一个结点的显示值：链表用 value，树用 tree 映射，图用 label */
function nodeTextOf(sc, key) {
  if (/^\d/.test(key)) return key;                    // 图的顶点 id 本身就是数字
  let cur = sc.tree;
  if (cur && key !== 'root') {
    for (const seg of key.split('.').slice(1)) {
      if (!cur || typeof cur !== 'object') { cur = undefined; break; }
      cur = cur[seg];
    }
  }
  if (cur !== undefined && cur !== null && typeof cur !== 'object') return String(cur);
  return null;
}

/** 这个场景里"可见的结点值"在 t 时刻的集合 */
function nodeValuesAt(sc, t) {
  const out = new Set();
  for (const [key, n] of Object.entries(sc.nodes || {})) {
    if (!visibleAt(n.vis, t)) continue;
    const v = nodeTextOf(sc, key);
    if (v !== null) out.add(v);
  }
  for (const g of sc.gnodes || []) {
    if (visibleAt(g.state && g.state.vis, t)) out.add(g.id);
  }
  return out;
}

function checkNodeScene(sc, file) {
  const total = sc.total || 9;
  const steps = (sc.steps || []).filter((s) => typeof s.t === 'number').sort((a, b) => a.t - b.t);
  if (!steps.length) return;
  const EPS = 0.02;

  // 只提供 --detail 的时间线 dump；不做自动判定。
  //
  // 试过"结点出现/消失但文案没点名值"这条，误报 44 处全是噪音 ——
  // 链表里"造出新结点 s（数据域填 e）"这种写法本来就不需要在文案里写数值，
  // 画面出现一个新结点和文案并不矛盾。所以结点类场景目前只保证：
  // 机械问题交给 lint-anim，语义判定只覆盖格子阵列。
  if (!(detailId && sc.id.includes(detailId))) return;

  console.log('\n===== ' + sc.id + '  ' + (sc.title || '') + '  variant=' + sc.variant
    + '  total=' + total + ' =====');
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const end = (i + 1 < steps.length ? steps[i + 1].t : total) - EPS;
    console.log(`  t=${String(s.t).padStart(5)} 画面结点值=[${[...nodeValuesAt(sc, s.t + EPS)].join(' ')}]`
      + `  步末=[${[...nodeValuesAt(sc, Math.max(s.t + EPS, end))].join(' ')}]`);
    console.log(`      ${s.text}`);
  }
  console.log('  终态: [' + [...nodeValuesAt(sc, total - EPS)].join(' ') + ']');
  void file;
}

// ---------------------------------------------------------------------------
// 主循环
// ---------------------------------------------------------------------------
const problems = [];
const add = (file, id, kind, detail) => problems.push({ file, id, kind, detail });

let sceneCount = 0;
let stepCount = 0;

for (const f of files) {
  const p = path.join(A, f);
  let scenes;
  try {
    delete require.cache[require.resolve(p)];
    scenes = require(p).map((s) => normalizeScene(JSON.parse(JSON.stringify(s))));
  } catch (e) {
    add(f, '-', '加载失败', e.message);
    continue;
  }
  if (!Array.isArray(scenes)) continue;

  for (const sc of scenes) {
    if (sc.variant !== 'array') { checkNodeScene(sc, f); continue; }
    sceneCount++;
    const total = sc.total || 9;
    const steps = (sc.steps || []).filter((s) => typeof s.t === 'number')
      .sort((a, b) => a.t - b.t);
    if (!steps.length) continue;
    const EPS = 0.02;
    const sceneValues = collectSceneValues(sc);

    if (detailId && sc.id.includes(detailId)) {
      console.log('\n===== ' + sc.id + '  ' + (sc.title || '') + '  total=' + total + ' =====');
      console.log('格子槽位: ' + (sc.slots || 8));
      for (let i = 0; i < steps.length; i++) {
        const s = steps[i];
        const end = (i + 1 < steps.length ? steps[i + 1].t : total) - EPS;
        const before = cellValuesAt(sc, Math.max(0, s.t - EPS));
        const after = cellValuesAt(sc, s.t + EPS);
        const atEnd = cellValuesAt(sc, end);
        console.log(`  t=${String(s.t).padStart(5)} [${before.map((v) => v === null ? '·' : v).join(' ')}]`
          + ` -> [${atEnd.map((v) => v === null ? '·' : v).join(' ')}]`
          + `  高亮=${JSON.stringify(highlightsAt(sc, s.t + EPS))}`);
        console.log(`      ${s.text}`);
      }
      console.log('  终态: [' + cellValuesAt(sc, total - EPS).map((v) => v === null ? '·' : v).join(' ') + ']');
    }

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      stepCount++;
      const end = (i + 1 < steps.length ? steps[i + 1].t : total) - EPS;
      const before = cellValuesAt(sc, Math.max(0, s.t - EPS));
      const after = cellValuesAt(sc, s.t + EPS);
      const atEnd = cellValuesAt(sc, Math.max(s.t + EPS, end));
      const changed = changedSlots(before, after);
      const changedInStep = changedSlots(before, atEnd)
        .filter((c) => isDataValue(c.from) && isDataValue(c.to));   // 只管真实取值的变化
      const text = String(s.text || '');
      const principle = isPrinciple(text);

      // ① 声称的结果 / 数组，必须在本步窗口内真的出现过
      //
      // 这是最要命的一类：文案说"结果 1 2 3 4 5 8"，画面却还是旧的排列。
      // 之前的做法是拿"本步开头那一瞬间"去比，会误报（结果往往在窗口末尾才成形），
      // 所以这里在**窗口内扫一遍**，只要某个时刻完全吻合就算对得上；
      // 都不吻合才算 bug，并报出"文案说的"和"本步结束时的画面"。
      const claims = [claimedResult(text), claimedArray(text)].filter(Boolean);
      for (const claimed of claims) {
        const target = claimed.map(String);
        let matchedAt = -1;
        for (let t = s.t; t <= Math.max(end, s.t) + 1e-9; t += 0.05) {
          const snap = cellValuesAt(sc, t);
          let ok = 0;
          for (let k = 0; k < target.length; k++) if (snap[k] === target[k]) ok++;
          if (ok === target.length) { matchedAt = t; break; }
        }
        if (matchedAt < 0) {
          const alien = target.filter((v) => !sceneValues.has(v));
          const shown = atEnd.filter((v) => v !== null);
          add(f, sc.id, alien.length ? '① 文案的数列不属于这个场景' : '① 文案的数列在画面里没出现',
            `t=${s.t}～${end.toFixed(2)} 文案「${text.slice(0, 40)}」声称 [${claimed.join(' ')}]，`
            + `本步结束时画面是 [${shown.join(' ')}]`
            + (alien.length ? `；其中 ${alien.join('/')} 这一段动画里根本没有` : '；整个窗口内都没有对上的时刻'));
        }
      }

      // ② 文案说"交换"，但本步里没有任何格子改值
      //    只对"描述当前动作"的句子生效 —— "如果用…就交换"这类讲原理的不算
      //    （"交换律"是数学名词，不是动作，要排除）
      if (/交换(?!律)|互换/.test(text) && !principle) {
        const pairs = slotsFromText(text);
        let relevant = changedInStep;
        if (pairs.length) {
          relevant = changedInStep.filter((c) => pairs.some(([a, b]) => c.at === a || c.at === b));
        }
        if (!relevant.length) {
          add(f, sc.id, '② 说要交换，画面没动',
            `t=${s.t}～${end.toFixed(2)} 文案「${text.slice(0, 44)}」`
            + `但其间没有任何格子改值（画面一直是 [${atEnd.map((v) => v === null ? '·' : v).join(' ')}]）`);
        }
      }

      // ③ 画面变了，文案却没有任何动作词（且不是在讲原理、也没点名那个数）
      //
      // "点名了数值"要免报：像「建完之后 8 被顶到了 A[0]」这种句子，
      // 它把变化前后的值写出来了，等于说明了动作，只是没写"交换/移动"这类词。
      const namedValues = new Set(numbersIn(text).map(String));
      const allNamed = changedInStep.every((c) => namedValues.has(c.from) || namedValues.has(c.to));
      if (changedInStep.length >= 2 && !hasAction(text) && !saysNoChange(text)
        && !principle && !allNamed) {
        add(f, sc.id, '③ 画面变了，文案没提',
          `t=${s.t} 文案「${text.slice(0, 44)}」没有任何动作词，`
          + `但 ${changedInStep.length} 个格子换值：`
          + changedInStep.slice(0, 4).map((c) => `${c.at}:${c.from}→${c.to}`).join(' '));
      }

      // ④ 文案拿"保留/不变"当主干说，画面却在变
      //    只查**点到了具体数值**的句子 —— 纯讲稳定性的元讨论误报太多，不算
      if (saysNoChange(text) && changedInStep.length
        && numbersIn(text).some((n) => n <= 99)) {
        add(f, sc.id, '④ 说不该变，画面变了',
          `t=${s.t} 文案「${text.slice(0, 44)}」说不变，`
          + `但变了：` + changedInStep.slice(0, 4).map((c) => `${c.at}:${c.from}→${c.to}`).join(' '));
      }

      // ⑤ 文案里点名的数值，画面里一个都找不到 —— 文案和画面在说两件事
      //    只查"描述当前状态"的句子，且至少点名两个数，避免误报
      if (!principle && changedInStep.length) {
        const nums = [...new Set(numbersIn(text))].filter((n) => n <= 99);
        const shownVals = new Set(atEnd.filter((v) => v !== null));
        if (nums.length >= 2 && !nums.some((n) => shownVals.has(String(n)))) {
          add(f, sc.id, '⑤ 文案点名的数值画面里没有',
            `t=${s.t} 文案「${text.slice(0, 44)}」点名 ${nums.join('/')}，`
            + `画面是 [${[...shownVals].join(' ')}]`);
        }
      }

      // ⑥ 文案写"下标 N 是 V"这类**位置断言**，格子 N 就必须是 V
      //
      // 这条精确可判定：文案自己把下标和值都写出来了，画面骗不了人。
      // （试过更宽的"文案里的数字要能在画面里找到"，把"h(k)=9−4=5 落在 6"
      //   这种散列探测过程全当成了断言，误报一片，所以收窄成这个格式。）
      for (const m of text.matchAll(/(?:下标|A\[|位置)\s*(\d+)[^\d]{0,4}(?:是|为|=|->|→)\s*(-?\d+)/g)) {
        const at = Number(m[1]);
        const want = m[2];
        if (at >= atEnd.length) continue;
        const snap = atEnd[at];
        if (snap !== null && snap !== want) {
          add(f, sc.id, '⑥ 文案的位置断言和画面对不上',
            `t=${s.t} 文案「${text.slice(0, 44)}」说下标 ${at} 是 ${want}，`
            + `画面那一格是「${snap}」（整行 [${atEnd.map((v) => v === null ? '·' : v).join(' ')}]）`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 输出
// ---------------------------------------------------------------------------
if (detailId) process.exit(0);

console.log(`核验 ${sceneCount} 个格子阵列场景、${stepCount} 个步骤`);
if (!problems.length) {
  console.log('没有发现"文案与画面不符"。');
  process.exit(0);
}

const byKind = {};
for (const p of problems) (byKind[p.kind] = byKind[p.kind] || []).push(p);

console.log(`发现 ${problems.length} 处可疑：\n`);
for (const [kind, arr] of Object.entries(byKind).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`【${kind}】${arr.length} 处`);
  for (const p of arr.slice(0, 12)) {
    console.log(`  ${p.file.replace('.js', '')}  ${p.id}`);
    console.log(`      ${p.detail}`);
  }
  if (arr.length > 12) console.log(`      …还有 ${arr.length - 12} 处同类`);
  console.log();
}
process.exit(1);
