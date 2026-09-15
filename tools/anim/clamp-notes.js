'use strict';
/**
 * 把标注文字钉在"格子区"和"字幕"之间那一条空白带上。
 *
 * 画布纵向布局是固定的（画布高 340）：
 *
 *     104 ~ 150   格子
 *     ~165        格子下方的下标数字
 *     210         标注（这里）
 *     250         字幕（每一步的说明）
 *     276         代码行
 *     308         进度条
 *
 * 所以标注只有 186 ~ 214 这一条可用 —— 只放得下一行。
 * 因此这里不做"分行"，只把 y 统一钉到这一行上；
 * 同时可见的多条标注由 normalize.js 里的 unstackNotes 用**时间**串开。
 */
const NOTE_Y = 210;

function clampNotes(scene) {
  const notes = scene.notes || [];
  if (!notes.length) return 0;
  let fixed = 0;
  for (const n of notes) {
    if (n.y === undefined) continue;
    if (n.y !== NOTE_Y) {
      n.y = NOTE_Y;
      fixed++;
    }
  }
  return fixed;
}

module.exports = { clampNotes, NOTE_Y };
