'use strict';
/*
 * LinkList Studio —— Electron 主进程
 * ---------------------------------------------------------------------------
 * 职责：
 *   1. 读取并解析参考源码（唯一的真相来源），把模块数据交给界面；
 *   2. 检测可用的 C 编译器：优先系统 gcc，其次内置 TCC；
 *   3. 提供"编译 + 运行"的 IPC 能力，并把编译错误解析成可跳转的行号；
 *   4. 持久化主题、上次浏览的模块和练习草稿。
 */

const { app, BrowserWindow, ipcMain, Menu, clipboard, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, spawnSync } = require('child_process');
const P = require('../shared/parse');

/**
/**
 * 数据结构 / 模块 / 三档注释 / 动画关键帧全部是 JSON，放在 data/ 下。
 * 应用只读这些数据（按章懒加载）；源是 resources/ 下可编译的 .c 与场景脚本，
 * 由 tools/build-data.js 编译过去。
 */
function dataDir() {
  return isPackaged ? path.join(app.getAppPath(), 'data') : path.join(__dirname, '..', 'data');
}

function readData(rel) {
  return JSON.parse(fs.readFileSync(path.join(dataDir(), rel), 'utf8'));
}

/**
 * 动画 SVG 的位置。
 * 生成时落在 docs/animations/（GitHub README 直接 <img> 引用就能播放），
 * 打包时通过 files 一并带上，桌面版和在线版共用同一份文件。
 */
function animDir() {
  return isPackaged
    ? path.join(app.getAppPath(), 'docs', 'animations')
    : path.join(__dirname, '..', 'docs', 'animations');
}

app.setAppUserModelId('com.datastructstudio.app');

/** 冷启动计时的起点（PRD 验收：< 3s） */
const bootAt = Date.now();

// ---------------------------------------------------------------------------
// 路径解析（开发态 / 打包态）
// ---------------------------------------------------------------------------
const isPackaged = app.isPackaged;

/** 参考源码：在 asar 里也能用 fs 直接读 */
function referenceDir() {
  const base = isPackaged ? path.join(app.getAppPath(), 'resources') : path.join(__dirname, '..', 'resources');
  return path.join(base, 'reference');
}

/**
 * 内置 TCC 的位置。
 * 打包时通过 extraResources 原样复制到 resources/tcc（不放进 asar），
 * 因为 asar 里的文件无法被 CreateProcess 启动，解包机制又会漏掉 .a 库文件。
 */
function tccDir() {
  return isPackaged
    ? path.join(process.resourcesPath, 'tcc')
    : path.join(__dirname, '..', 'resources', 'tcc');
}

// ---------------------------------------------------------------------------
// 编译器检测
// ---------------------------------------------------------------------------
const GCC_CANDIDATES = [
  'gcc',
  'gcc.exe',
  path.join('E:', 'w64devkit', 'bin', 'gcc.exe'),
  path.join('C:', 'w64devkit', 'bin', 'gcc.exe'),
  path.join('C:', 'mingw64', 'bin', 'gcc.exe'),
  path.join('C:', 'mingw32', 'bin', 'gcc.exe'),
  path.join('C:', 'MinGW', 'bin', 'gcc.exe'),
  path.join('C:', 'msys64', 'mingw64', 'bin', 'gcc.exe'),
  path.join('C:', 'msys64', 'ucrt64', 'bin', 'gcc.exe'),
  path.join('C:', 'TDM-GCC-64', 'bin', 'gcc.exe'),
  path.join('C:', 'Program Files', 'CodeBlocks', 'MinGW', 'bin', 'gcc.exe'),
];

function probe(exe, args) {
  try {
    const r = spawnSync(exe, args, { encoding: 'utf8', windowsHide: true, timeout: 8000 });
    if (r.error) return null;
    const text = `${r.stdout || ''}${r.stderr || ''}`.trim();
    return { exe, text: text.split('\n')[0].trim() };
  } catch {
    return null;
  }
}

function detectCompilers() {
  const found = [];

  // 排障开关：LS_FORCE_TCC=1 时跳过系统 gcc，强制走内置 TCC。
  // 主要用途是把"没装 gcc 的机器"这条回退路径变成可复现、可测试的状态。
  const forceTcc = process.env.LS_FORCE_TCC === '1';

  if (!forceTcc) {
    for (const cand of GCC_CANDIDATES) {
      const r = probe(cand, ['--version']);
      if (r) {
        found.push({
          kind: 'gcc',
          name: 'gcc',
          path: r.exe,
          version: (r.text.match(/(\d+\.\d+\.\d+)/) || [])[1] || r.text,
          fullVersion: r.text,
        });
        break;
      }
    }
  }

  const tccExe = path.join(tccDir(), 'tcc.exe');
  if (fs.existsSync(tccExe)) {
    const r = probe(tccExe, ['-v']);
    found.push({
      kind: 'tcc',
      name: 'TCC',
      path: tccExe,
      version: ((r && r.text.match(/version\s+([\d.]+)/)) || [])[1] || '0.9.27',
      fullVersion: (r && r.text) || 'tcc（内置）',
    });
  }

  return found;
}

// ---------------------------------------------------------------------------
// 编译 + 运行
// ---------------------------------------------------------------------------
const COMPILE_TIMEOUT = 30000;
const DEFAULT_RUN_TIMEOUT = 8000;

function compilerArgs(compiler, srcFile, outFile) {
  if (compiler.kind === 'gcc') {
    return ['-std=c11', '-Wall', '-fno-diagnostics-color', srcFile, '-o', outFile];
  }
  // TCC：不需要 -std，直接给源文件和输出
  return [srcFile, '-o', outFile];
}

/** 把编译器输出解析成 { line, col, severity, message } 列表 */
function parseDiagnostics(text, sourceLineCount) {
  const out = [];
  const seen = new Set();
  const re = /^(.*?):(\d+):(?:(\d+):)?\s*(fatal error|error|warning|note|错误|警告):\s*(.*)$/;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(re);
    if (!m) continue;
    const ln = parseInt(m[2], 10);
    if (!Number.isFinite(ln) || ln < 1 || ln > sourceLineCount + 50) continue;
    const sevRaw = m[4];
    const severity = /warning|警告/.test(sevRaw) ? 'warning' : /note/.test(sevRaw) ? 'note' : 'error';
    const key = `${ln}:${m[3] || 0}:${severity}:${m[5]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ line: ln, col: m[3] ? parseInt(m[3], 10) : 0, severity, message: m[5].trim() });
  }
  return out;
}

function runProcess(exe, args, options = {}) {
  return new Promise((resolve) => {
    const timeoutMs = options.timeoutMs || COMPILE_TIMEOUT;
    let child;
    try {
      child = spawn(exe, args, {
        cwd: options.cwd,
        windowsHide: true,
        env: { ...process.env, ...(options.env || {}) },
      });
    } catch (err) {
      return resolve({
        failedToStart: true, error: String(err && err.message),
        stdout: '', stderr: '', exitCode: null, timedOut: false,
      });
    }

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    child.stdout.on('data', (d) => { stdout += d.toString('utf8'); });
    child.stderr.on('data', (d) => { stderr += d.toString('utf8'); });

    // 自定义测试输入：把用户填的内容喂给程序的 stdin，喂完就关掉，
    // 否则 scanf 会一直等下去（表现为"运行超时"）
    if (options.stdin) {
      try {
        child.stdin.write(String(options.stdin));
      } catch { /* 忽略 */ }
    }
    try { child.stdin.end(); } catch { /* 忽略 */ }

    const timer = setTimeout(() => {
      timedOut = true;
      // 用户很容易写出不推进的死循环，这里必须能整棵进程树杀掉
      try { spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true }); } catch { /* ignore */ }
    }, timeoutMs);

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ failedToStart: true, error: String(err && err.message), stdout, stderr, exitCode: null, timedOut });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ failedToStart: false, stdout, stderr, exitCode: code, timedOut });
    });
  });
}

async function compileAndRun(source, options = {}) {
  const compilers = options.compilers || detectCompilers();
  if (compilers.length === 0) {
    return {
      ok: false,
      stage: 'no-compiler',
      message: '没有找到可用的 C 编译器。请安装 MinGW-w64 并把 gcc 加入 PATH。',
      stdout: '',
      stderr: '',
      diagnostics: [],
    };
  }

  const compiler = options.prefer === 'tcc'
    ? compilers.filter((c) => c.kind === 'tcc')[0] || compilers[0]
    : compilers[0];

  const sourceLineCount = source.split('\n').length;
  // 去掉注释后再找 main，避免注释里出现 "main(" 造成误判
  const stripped = source.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const hasMain = /\bmain\s*\(/.test(stripped);

  const workDir = path.join(os.tmpdir(), 'LinkListStudio', `run-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
  fs.mkdirSync(workDir, { recursive: true });
  const srcFile = path.join(workDir, 'main.c');
  const outFile = path.join(workDir, 'main.exe');
  fs.writeFileSync(srcFile, source, 'utf8');

  const started = Date.now();
  const compile = await runProcess(compiler.path, compilerArgs(compiler, srcFile, outFile), {
    cwd: compiler.kind === 'tcc' ? path.dirname(compiler.path) : workDir,
    timeoutMs: COMPILE_TIMEOUT,
    // 固定成英文诊断，避免中文语言包在不同区域设置下产生乱码
    env: { LC_ALL: 'C', LANG: 'C' },
  });
  const compileMs = Date.now() - started;

  if (compile.failedToStart) {
    return {
      ok: false,
      stage: 'compile',
      message: `无法启动编译器：${compile.error}`,
      compiler: compiler.name,
      stdout: compile.stdout,
      stderr: compile.stderr,
      diagnostics: [],
      compileMs,
    };
  }

  const rawDiag = `${compile.stderr}\n${compile.stdout}`;
  const diagnostics = parseDiagnostics(rawDiag, sourceLineCount);
  const built = fs.existsSync(outFile);

  if (!built) {
    let message = `${compiler.name} 编译失败。`;
    if (!hasMain) {
      message = '这段代码里没有 main 函数 —— 纯函数片段没法直接运行。点下面的「补全脚手架」会补上头文件、依赖函数和测试主函数。';
    } else if (/undefined reference to [`'"]?main/i.test(rawDiag)) {
      message = '链接失败：缺少 main 函数。';
    }
    return {
      ok: false,
      stage: 'compile',
      message,
      compiler: compiler.name,
      compilerVersion: compiler.version,
      stdout: compile.stdout,
      stderr: compile.stderr,
      diagnostics,
      compileMs,
      hasMain,
    };
  }

  const runStarted = Date.now();
  const run = await runProcess(outFile, [], {
    cwd: workDir,
    timeoutMs: options.runTimeoutMs || DEFAULT_RUN_TIMEOUT,
    stdin: options.stdin || '',
  });
  const runMs = Date.now() - runStarted;
  const limit = Math.round((options.runTimeoutMs || DEFAULT_RUN_TIMEOUT) / 1000);

  return {
    ok: !run.timedOut && run.exitCode === 0,
    stage: 'run',
    message: run.timedOut
      ? `程序运行超过 ${limit} 秒还没结束，已被强制终止 —— 大概率是某个循环没有推进（比如遍历时忘了 p = p->next）。`
      : run.exitCode === 0
        ? '编译成功，输出如下：'
        : `程序运行结束，退出码 ${run.exitCode}。`,
    compiler: compiler.name,
    compilerVersion: compiler.version,
    stdout: run.stdout,
    stderr: run.stderr,
    diagnostics,
    compileMs,
    runMs,
    exitCode: run.exitCode,
    timedOut: run.timedOut,
  };
}

// ---------------------------------------------------------------------------
// 设置与草稿持久化
// ---------------------------------------------------------------------------
function settingsFile() { return path.join(app.getPath('userData'), 'settings.json'); }
function draftsFile() { return path.join(app.getPath('userData'), 'drafts.json'); }

function readJson(file, fallback) {
  try {
    // 有些编辑器（记事本、部分 PowerShell 写法）会写入 UTF-8 BOM，
    // 直接 JSON.parse 会抛异常并让用户所有设置被静默重置，所以先剥掉。
    const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    const value = JSON.parse(text);
    return value && typeof value === 'object' ? value : fallback;
  } catch {
    return fallback;
  }
}

/**
 * 读取设置并做一次规范化。
 * v2.0 不再分教材，但旧版本留下的字段（bookId / lastModule / lastModuleId）
 * 一律忽略而不是报错 —— 老用户的文件读进来不会炸。
 */
function readSettings() {
  const s = readJson(settingsFile(), {});
  return {
    theme: s.theme === 'dark' ? 'dark' : 'light',
    mode: ['detail', 'short', 'none'].includes(s.mode) ? s.mode : 'detail',
    view: ['read', 'practice'].includes(s.view) ? s.view : 'read',
    refCollapsed: !!s.refCollapsed,
    sidebarCollapsed: !!s.sidebarCollapsed,
    moduleId: typeof s.moduleId === 'string' ? s.moduleId : (typeof s.lastModuleId === 'string' ? s.lastModuleId : null),
    viewId: typeof s.viewId === 'string' ? s.viewId : null,
    expanded: (s.expanded && typeof s.expanded === 'object') ? s.expanded : {},
  };
}

/**
 * 读取练习草稿。v2.0 直接按模块 id 存：{ drafts: {模块id: 源码}, results: {模块id: 'passed'} }。
 * 兼容 v1.0 的两层结构（{singly:{01:...}}）与更早的扁平结构，尽量不丢用户的默写。
 */
function readDrafts() {
  const raw = readJson(draftsFile(), {});
  if (raw && typeof raw.drafts === 'object' && raw.drafts !== null) {
    return { drafts: raw.drafts, results: raw.results && typeof raw.results === 'object' ? raw.results : {} };
  }
  const values = Object.values(raw || {});
  if (values.length && values.every((v) => typeof v === 'string')) {
    // v1.0 最早期的扁平结构：只可能是单链表的草稿，键就是模块编号
    return { drafts: raw, results: {} };
  }
  // v1.0 的两层结构：把 singly/doubly 下的模块号补成新 id
  const drafts = {};
  for (const [book, map] of Object.entries(raw || {})) {
    if (!map || typeof map !== 'object') continue;
    const prefix = book === 'singly' ? '02-02-singly' : book === 'doubly' ? '02-02-doubly' : book;
    for (const [mid, text] of Object.entries(map)) {
      if (typeof text !== 'string') continue;
      const key = /^\d{2}$/.test(mid) ? `${prefix}-${mid}` : mid;
      drafts[key] = text;
    }
  }
  return { drafts, results: {} };
}

function writeJson(file, value) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 窗口
// ---------------------------------------------------------------------------
let mainWindow = null;
let compilerCache = null;

/** 章节树很小，启动时读一次缓存起来；其余数据按需读、读完缓存 */
let treeCache = null;
const sectionCache = new Map();

function getTree() {
  if (!treeCache) treeCache = readData('tree.json');
  return treeCache;
}

/** 按需读数据，读完缓存。sectionId 支持两种形式：'ch:01'（章）与 '01-01'（节） */
function getSection(sectionId) {
  const id = String(sectionId);
  if (!/^(ch:\d{2}|\d{2}-\d{2})$/.test(id)) throw new Error('非法的数据 id：' + id);
  if (!sectionCache.has(id)) {
    if (id.startsWith('ch:')) {
      sectionCache.set(id, readData(path.join('chapters', `${id.slice(3)}.json`)));
    } else {
      const code = readData(path.join('code', `${id}.json`));
      const animFile = path.join(dataDir(), 'animations', `${id}.json`);
      const animations = fs.existsSync(animFile)
        ? JSON.parse(fs.readFileSync(animFile, 'utf8'))
        : { section: id, animations: {} };
      sectionCache.set(id, { code, animations });
    }
  }
  return sectionCache.get(id);
}

function getCompilers() {
  if (!compilerCache) compilerCache = detectCompilers();
  return compilerCache;
}

function createWindow() {
  // LS_WINDOW=<宽>x<高> 可以指定窗口尺寸，用来验证"小屏不破版"（PRD 验收 9）
  const sizeMatch = /^(\d+)x(\d+)$/.exec(process.env.LS_WINDOW || '');
  mainWindow = new BrowserWindow({
    width: sizeMatch ? Number(sizeMatch[1]) : 1360,
    height: sizeMatch ? Number(sizeMatch[2]) : 880,
    minWidth: 1024,
    minHeight: 660,
    backgroundColor: '#FAFAFA',
    title: 'DataStruct Studio',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
      // 截图模式下关闭后台节流：窗口被系统判定为不可见时 Chromium 会省掉渲染，
      // 抓图就会拿到"部分瓦片还是旧的"的混合画面。正常运行时保持默认。
      backgroundThrottling: !process.env.LS_CAPTURE,
    },
  });

  Menu.setApplicationMenu(null);

  // 把上次保存的主题通过 URL 参数交给页面，theme-boot.js 会在首帧之前应用，
  // 这样深色主题的用户启动时不会先闪一下白屏。
  const savedTheme = readJson(settingsFile(), {}).theme === 'dark' ? 'dark' : 'light';
  mainWindow.loadFile(path.join(__dirname, '..', 'src', 'index.html'), {
    search: `?theme=${savedTheme}`,
  });

  // 不在 ready-to-show 就显示：那时界面还没拿到数据，会闪一下空壳。
  // 等界面把章节树渲染完，通过 app:ready 通知我们再显示。
  let shown = false;
  const showWindow = () => {
    if (shown || !mainWindow || mainWindow.isDestroyed()) return;
    shown = true;
    // PRD 验收 10：冷启动 < 3s。这里量的是"进程起来到界面可用"的时长
    const ms = Date.now() - bootAt;
    console.log(`[boot] 冷启动到界面就绪：${ms} ms`);
    mainWindow.show();
    if (process.env.LS_CAPTURE) {
      // 截图时把窗口置顶并聚焦：被遮挡的窗口会被 Chromium 节流，
      // 那样抓到的会是上一帧的旧画面。
      mainWindow.setAlwaysOnTop(true);
      mainWindow.focus();
      runCapture();
    }
  };
  ipcMain.on('app:ready', showWindow);
  setTimeout(showWindow, 8000); // 兜底：万一界面报错也要让用户看到窗口

  /* 开发辅助：LS_CAPTURE=<png 路径> 时，界面就绪后截图并退出。
     LS_CAPTURE_JS_FILE=<js 路径> 可以先给页面注入一段脚本，把界面切到某个状态。
     注意：窗口被系统判定为"不可见"时渲染会被节流，直接抓图可能拿到旧帧，
     所以抓图前统一强制一次样式计算 + 两帧动画。 */
  function runCapture() {
    (async () => {
      try {
        let script = process.env.LS_CAPTURE_JS;
        if (process.env.LS_CAPTURE_JS_FILE) {
          script = fs.readFileSync(process.env.LS_CAPTURE_JS_FILE, 'utf8');
        }
        const wc = mainWindow.webContents;

        if (script) await wc.executeJavaScript(script, true);

        // 强制重绘：窗口被系统判定为不可见时，只要页面没有"脏区域"，
        // Chromium 就会一直复用之前那张 surface，抓图拿到的是旧帧。
        // 这里把主题切走再切回，制造一次无害的重绘，最终状态不变。
        const forceRepaint = `(function () {
          var el = document.documentElement;
          var t = el.getAttribute('data-theme') || 'light';
          el.setAttribute('data-theme', t === 'dark' ? 'light' : 'dark');
          void document.body.offsetHeight;
          el.setAttribute('data-theme', t);
          void document.body.offsetHeight;
        })()`;
        await wc.executeJavaScript(forceRepaint, true).catch(() => {});

        const waitFrames = 'new Promise(function (res) {'
          + 'document.body.getBoundingClientRect();'
          + 'requestAnimationFrame(function () { requestAnimationFrame(function () { res(1); }); });'
          + '})';
        await Promise.race([
          wc.executeJavaScript(waitFrames, true),
          new Promise((r) => setTimeout(r, 2500)),
        ]).catch(() => {});

        await new Promise((r) => setTimeout(r, Number(process.env.LS_CAPTURE_DELAY || 1200)));

        const probe = await wc.executeJavaScript(`(function () {
          var q = function (s) { return document.querySelector(s); };
          var active = q('.tree-module.is-active');
          var view = q('#viewModes button.is-active');
          var mode = q('#commentModes button.is-active');
          var ta = q('#editorInput');
          var out = q('#outputContent');
          var pl = q('#playerPanel');
          return JSON.stringify({
            module: active ? active.dataset.module : null,
            activeName: active ? (active.querySelector('.tm-name') || {}).textContent : null,
            view: view ? view.dataset.view : null,
            mode: mode ? mode.dataset.mode : null,
            theme: document.documentElement.dataset.theme,
            bodyBg: getComputedStyle(document.body).backgroundColor,
            compiler: (q('#sbCompiler') || {}).textContent,
            practiceDisabled: !!(q('#viewModes button[data-view="practice"]') || {}).disabled,
            panePracticeHidden: !!q('#panePractice').hidden,
            paneCompareHidden: !!q('#paneCompare').hidden,
            progress: (q('#progressMiniText') || {}).textContent,
            title: document.title,
            editorHead: ta && ta.value ? ta.value.replace(/\\s+/g, ' ').slice(0, 90) : '',
            editorChars: ta && ta.value ? ta.value.length : 0,
            refLines: document.querySelectorAll('#refView .ln').length,
            hasMarker: !!(ta && ta.value && ta.value.indexOf('轮到你了') >= 0),
            outputHead: out ? out.textContent.replace(/\\s+/g, ' ').slice(0, 150) : '',
            playerHidden: pl ? pl.hidden : null,
            playerSvg: !!q('.pl-canvas svg'),
            playerMarks: document.querySelectorAll('.pl-mark').length,
            playerStep: (q('.pl-step') || {}).textContent,
            playerTime: (q('[data-el="cur"]') || {}).textContent,
            animHit: document.querySelectorAll('#codeView .ln.is-anim-hit').length,
            bigTabs: Array.prototype.map.call(document.querySelectorAll('#bigTabs button'), function (b) { return b.dataset.view + (b.classList.contains('is-active') ? '*' : ''); }).join(',')
          });
        })()`);
        console.log(`[state] ${probe}`);

        // 抓图：capturePage 更稳，优先用它；失败再退回 DevTools 协议。
        // 两条路都加超时，避免开发工具本身卡死。
        let png = null;
        try {
          const img = await Promise.race([
            wc.capturePage(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('capturePage 超时')), 6000)),
          ]);
          png = img.toPNG();
        } catch (err) {
          console.log(`[capture] capturePage 失败，改用 CDP：${(err && err.message) || err}`);
          if (!wc.debugger.isAttached()) wc.debugger.attach('1.3');
          const shot = await Promise.race([
            wc.debugger.sendCommand('Page.captureScreenshot', {
              format: 'png',
              fromSurface: true,
              captureBeyondViewport: false,
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('CDP 抓图超时')), 8000)),
          ]);
          png = Buffer.from(shot.data, 'base64');
        }
        fs.writeFileSync(process.env.LS_CAPTURE, png);
        console.log(`captured -> ${process.env.LS_CAPTURE}`);
      } catch (err) {
        console.error('capture failed:', (err && err.message) || err);
      }
      app.exit(0);
    })();
  }

  // F12 / Ctrl+Shift+I 打开开发者工具，方便排查
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isF12 = input.key === 'F12';
    const isCtrlShiftI = input.control && input.shift && input.key.toLowerCase() === 'i';
    if (input.type === 'keyDown' && (isF12 || isCtrlShiftI)) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // 外部链接交给系统浏览器，不在应用内打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ---------------------------------------------------------------------------
// IPC
// ---------------------------------------------------------------------------
ipcMain.handle('app:init', () => {
  return {
    appVersion: app.getVersion(),
    electron: process.versions.electron,
    tree: getTree(),                 // 章节树（很小，启动即得）
    compilers: getCompilers(),
    settings: readSettings(),
    drafts: readDrafts(),
    runTimeoutMs: DEFAULT_RUN_TIMEOUT,
  };
});

/** 按节取一套数据：三档代码 + 脚手架 + 预期输出 + 动画关键帧 */
ipcMain.handle('section:load', (_event, sectionId) => getSection(String(sectionId)));

/**
 * 读取动画 SVG 文本。
 * 不用 fetch 是因为渲染层跑在 file:// 下，fetch 会被 CORS 拦掉；
 * 走 IPC 读文件最稳，也顺便把路径限制在 docs/animations 里。
 */
ipcMain.handle('anim:svg', (_event, relPath) => {
  const safe = path.basename(String(relPath || ''));
  const file = path.join(animDir(), safe);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8');
});

ipcMain.handle('coverage:load', () => {
  const f = path.join(dataDir(), 'coverage.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
});

ipcMain.handle('app:detectCompilers', () => {
  compilerCache = detectCompilers();
  return compilerCache;
});

ipcMain.handle('compile:run', async (_event, payload) => {
  const source = String((payload && payload.source) || '');
  if (!source.trim()) {
    return {
      ok: false, stage: 'empty',
      message: '编辑器是空的 —— 先写点代码吧。',
      stdout: '', stderr: '', diagnostics: [],
    };
  }
  return compileAndRun(source, {
    compilers: getCompilers(),
    runTimeoutMs: (payload && payload.runTimeoutMs) || DEFAULT_RUN_TIMEOUT,
    stdin: (payload && payload.stdin) || '',
  });
});

ipcMain.handle('settings:save', (_event, settings) => {
  const current = readSettings();
  const merged = {
    ...current,
    ...(settings || {}),
    // 按教材合并，别把另一本教材"上次看到哪"的记录冲掉
    lastModule: { ...current.lastModule, ...((settings && settings.lastModule) || {}) },
  };
  delete merged.lastModuleId; // 旧字段，已经迁移进 lastModule.singly
  writeJson(settingsFile(), merged);
  return merged;
});

ipcMain.handle('drafts:save', (_event, drafts) => writeJson(draftsFile(), drafts || {}));

ipcMain.handle('clipboard:write', (_event, text) => {
  clipboard.writeText(String(text || ''));
  return true;
});

/**
 * 用系统默认浏览器打开外链（B 站网课）。
 * 只放行 http/https，避免将来被塞进 file: 或自定义协议。
 */
ipcMain.handle('shell:openExternal', async (_event, url) => {
  const s = String(url || '');
  if (!/^https?:\/\//i.test(s)) return false;
  await shell.openExternal(s);
  return true;
});

// ---------------------------------------------------------------------------
app.whenReady().then(() => {
  // 预热：章节树很小，读一次就好；编译器检测放到后台，不挡窗口显示
  try { getTree(); } catch (e) { console.error('章节树读取失败：', e.message); }
  setTimeout(() => { try { getCompilers(); } catch { /* 忽略 */ } }, 0);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
