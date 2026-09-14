/* ==========================================================================
   DataStruct Studio —— 动画播放器
   ---------------------------------------------------------------------------
   PRD 4.2 的核心组件。设计要点：

   1. **动画数据仍是 SVG 内联 SMIL**（所以同一份文件放进 README 用 <img>
      还能自动播放），播放器做的是把它内联进 DOM，然后用 SVG 原生的
      pauseAnimations() / setCurrentTime(t) 做随机访问 —— 拖动进度条就是
      连续调用 setCurrentTime，画面自然实时跟随。

   2. 时间由播放器自己按 rAF 推进（而不是让 SVG 自己跑），这样变速、单步、
      循环、拖动全都统一成「改一个 time 变量再 apply()」。

   3. 关键帧来自 data/animations/*.json 的 steps：每个关键帧带 t（时间点）、
      name（进度条圆点的悬停名）、line（对应源码第几行，供代码联动）。
   ========================================================================== */
(function (global) {
  'use strict';

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const fmt = (t) => `${t.toFixed(1)}s`;

  function createPlayer(opts) {
    const root = opts.container;
    const canvasHost = opts.canvas || root;   // 动画画面放这里（可以是代码区旁边的那块）
    const onTick = opts.onTick || function () {};      // (time, stepIndex)
    const onStateChange = opts.onStateChange || function () {};

    let svg = null;
    let steps = [];
    let total = 8;
    let time = 0;
    let rate = 1;
    let playing = false;
    let loop = true;
    let raf = null;
    let lastTs = 0;
    let dragging = false;
    let stepIndex = 0;

    // ---------------------------------------------------------------- DOM
    root.innerHTML = `
      <div class="pl-row">
        <button type="button" class="pl-btn pl-play" data-act="play" title="播放 / 暂停（空格）">
          <span class="pl-icon">▶</span>
        </button>
        <button type="button" class="pl-btn" data-act="prev" title="上一个关键帧（,）">⏮</button>
        <button type="button" class="pl-btn" data-act="next" title="下一个关键帧（.）">⏭</button>
        <span class="pl-time"><b data-el="cur">0.0s</b> / <span data-el="total">0.0s</span></span>
        <span class="pl-step" data-el="step">—</span>
        <span class="pl-spacer"></span>
        <span class="pl-rates" data-el="rates">
          <button type="button" data-rate="0.5">0.5x</button>
          <button type="button" data-rate="1" class="is-active">1.0x</button>
          <button type="button" data-rate="1.5">1.5x</button>
          <button type="button" data-rate="2">2.0x</button>
        </span>
        <button type="button" class="pl-btn pl-toggle is-active" data-act="loop" title="播完自动重播">循环</button>
        <button type="button" class="pl-btn pl-toggle" data-act="stepMode" title="每点一次前进一个关键帧">单步</button>
      </div>
      <div class="pl-track" data-el="track">
        <div class="pl-rail"></div>
        <div class="pl-fill" data-el="fill"></div>
        <div class="pl-marks" data-el="marks"></div>
        <div class="pl-thumb" data-el="thumb"></div>
      </div>`;

    const q = (sel) => root.querySelector(sel);
    const el = {
      play: q('[data-act="play"]'), icon: q('.pl-icon'),
      cur: q('[data-el="cur"]'), totalEl: q('[data-el="total"]'),
      step: q('[data-el="step"]'), track: q('[data-el="track"]'),
      fill: q('[data-el="fill"]'), marks: q('[data-el="marks"]'), thumb: q('[data-el="thumb"]'),
      rates: q('[data-el="rates"]'),
      loopBtn: q('[data-act="loop"]'), stepModeBtn: q('[data-act="stepMode"]'),
    };

    // ---------------------------------------------------------------- 内部
    /** 当前时间落在第几个关键帧区间 */
    function indexAt(t) {
      let idx = 0;
      for (let i = 0; i < steps.length; i++) {
        if (t + 1e-6 >= steps[i].t) idx = i; else break;
      }
      return idx;
    }

    function apply(notify = true) {
      if (svg && svg.setCurrentTime) {
        // SMIL 的随机访问：设到哪个时刻，画面就跳到哪个时刻的状态
        try { svg.setCurrentTime(time); } catch { /* 忽略 */ }
      }
      const pct = total > 0 ? Math.min(100, Math.max(0, (time / total) * 100)) : 0;
      el.cur.textContent = fmt(time);
      el.fill.style.width = pct + '%';
      el.thumb.style.left = pct + '%';

      const idx = indexAt(time);
      if (idx !== stepIndex) {
        stepIndex = idx;
        const s = steps[idx];
        el.step.textContent = s ? `${idx + 1}/${steps.length}  ${s.name}` : '—';
      } else if (!el.step.textContent || el.step.textContent === '—') {
        const s = steps[idx];
        el.step.textContent = s ? `${idx + 1}/${steps.length}  ${s.name}` : '—';
      }
      if (notify) onTick(time, idx);
    }

    function tick(ts) {
      if (!playing) return;
      const dt = Math.min(0.1, (ts - lastTs) / 1000);   // 夹一下，防止切后台回来跳一大步
      lastTs = ts;
      time += dt * rate;
      if (time >= total) {
        if (loop) {
          time = 0;
        } else {
          time = total;
          playing = false;
          paintPlay();
        }
      }
      apply();
      if (playing) raf = requestAnimationFrame(tick);
    }

    function play() {
      if (playing || total <= 0) return;
      if (time >= total - 1e-6) time = 0;   // 播完了再点播放就从头开始
      playing = true;
      lastTs = performance.now();
      paintPlay();
      raf = requestAnimationFrame(tick);
      onStateChange({ playing });
    }

    function pause() {
      if (!playing) return;
      playing = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      paintPlay();
      onStateChange({ playing });
    }

    function paintPlay() {
      el.icon.textContent = playing ? '❚❚' : '▶';
      el.play.classList.toggle('is-playing', playing);
    }

    function seek(t, notify = true) {
      time = Math.min(total, Math.max(0, t));
      apply(notify);
    }

    /** 上一个 / 下一个关键帧 */
    function stepBy(dir) {
      if (!steps.length) return;
      const eps = 0.02;
      if (dir > 0) {
        const next = steps.find((s) => s.t > time + eps);
        seek(next ? next.t : total);
      } else {
        const prev = [...steps].reverse().find((s) => s.t < time - eps);
        seek(prev ? prev.t : 0);
      }
    }

    function setRate(r) {
      rate = r;
      el.rates.querySelectorAll('button').forEach((b) => {
        b.classList.toggle('is-active', Number(b.dataset.rate) === r);
      });
    }

    // ---------------------------------------------------------------- 事件
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const act = b.dataset.act;
      if (b.dataset.rate) { setRate(Number(b.dataset.rate)); return; }
      if (act === 'play') { playing ? pause() : play(); return; }
      if (act === 'prev') { pause(); stepBy(-1); return; }
      if (act === 'next') { pause(); stepBy(1); return; }
      if (act === 'loop') {
        loop = !loop;
        el.loopBtn.classList.toggle('is-active', loop);
        return;
      }
      if (act === 'stepMode') {
        // 单步模式 = 暂停 + 之后每次 ⏭ 走一个关键帧
        const on = !el.stepModeBtn.classList.contains('is-active');
        el.stepModeBtn.classList.toggle('is-active', on);
        if (on) { pause(); stepBy(1); }
        return;
      }
    });

    /** 拖动进度条：按下即跳、移动实时跟随，不必等松手 */
    function posToTime(clientX) {
      const r = el.track.getBoundingClientRect();
      const ratio = r.width > 0 ? (clientX - r.left) / r.width : 0;
      return Math.min(total, Math.max(0, ratio * total));
    }

    el.track.addEventListener('pointerdown', (e) => {
      dragging = true;
      el.track.setPointerCapture(e.pointerId);
      el.track.classList.add('is-dragging');
      pause();
      seek(posToTime(e.clientX));
      e.preventDefault();
    });
    el.track.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      seek(posToTime(e.clientX));
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      el.track.classList.remove('is-dragging');
      try { el.track.releasePointerCapture(e.pointerId); } catch { /* 忽略 */ }
    };
    el.track.addEventListener('pointerup', endDrag);
    el.track.addEventListener('pointercancel', endDrag);

    // ---------------------------------------------------------------- 对外
    return {
      /** 装载一段动画：SVG 文本 + 关键帧 + 总时长 */
      load(svgText, newSteps, newTotal) {
        pause();
        steps = Array.isArray(newSteps) ? newSteps.slice().sort((a, b) => a.t - b.t) : [];
        total = Number(newTotal) || 8;
        time = 0;
        stepIndex = -1;
        el.totalEl.textContent = fmt(total);
        el.step.textContent = '—';

        // 关键帧圆点：悬停显示步骤名（PRD 4.2）
        // 注意：CSP 是 style-src 'self' file:（不含 unsafe-inline），
        // 所以不能用 innerHTML 塞 style="..."，改用 CSSOM 赋值。
        el.marks.innerHTML = steps.map(() => '<span class="pl-mark"></span>').join('');
        el.marks.querySelectorAll('.pl-mark').forEach((m, i) => {
          m.style.left = ((steps[i].t / total) * 100).toFixed(2) + '%';
          m.title = steps[i].name;
          m.dataset.step = String(i);
        });

        // 画布放在 canvasHost（阅读模式下是代码区左边那块），控件留在这里
        canvasHost.innerHTML = '';
        svg = null;
        if (svgText) {
          const holder = document.createElement('div');
          holder.className = 'pl-canvas';
          holder.innerHTML = svgText;
          canvasHost.appendChild(holder);
          svg = holder.querySelector('svg');
          if (svg) {
            svg.pauseAnimations();
            svg.removeAttribute('width');
            svg.removeAttribute('height');
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          }
        }
        apply();
      },

      play, pause,
      toggle() { playing ? pause() : play(); },
      isPlaying: () => playing,
      seek,
      stepBy,
      setRate,
      getRate: () => rate,
      getTotal: () => total,
      getTime: () => time,
      getSteps: () => steps.slice(),

      /** 跳到指定关键帧（代码↔动画联动的入口） */
      goToStep(i) {
        const s = steps[i];
        if (s) seek(s.t);
      },

      /** 键盘：空格播放/暂停，←/→ 前后 5 秒，,/. 单步 */
      handleKey(e) {
        const jump = Math.min(5, total / 3);
        if (e.key === ' ') { e.preventDefault(); playing ? pause() : play(); return true; }
        if (e.key === 'ArrowRight') { e.preventDefault(); pause(); seek(time + jump); return true; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); pause(); seek(time - jump); return true; }
        if (e.key === '.') { e.preventDefault(); pause(); stepBy(1); return true; }
        if (e.key === ',') { e.preventDefault(); pause(); stepBy(-1); return true; }
        return false;
      },

      destroy() {
        pause();
        root.innerHTML = '';
        svg = null;
      },
    };
  }

  global.LS = global.LS || {};
  global.LS.createPlayer = createPlayer;
})(window);
