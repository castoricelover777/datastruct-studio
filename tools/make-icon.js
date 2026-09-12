'use strict';
/*
 * LinkList Studio —— 应用图标生成器
 * ---------------------------------------------------------------------------
 * 不依赖任何图形库：自己做超采样光栅化 + 输出经典 BMP 格式的 .ico。
 * 图案：蓝色圆角方块底 + 三个白色结点用指针连成一串（就是链表本身）。
 *
 * 运行： node tools/make-icon.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 256;
const SS = 4; // 超采样倍数，用来做抗锯齿
const W = SIZE * SS;

const ACCENT = [0x3B, 0x82, 0xF6];
const WHITE = [0xFF, 0xFF, 0xFF];

/** 点是否落在圆角矩形内 */
function inRoundRect(px, py, x, y, w, h, r) {
  if (px < x || py < y || px > x + w || py > y + h) return false;
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

/** 按 4 倍分辨率定义图形，之后降采样得到抗锯齿效果 */
function shape(px, py) {
  // px/py 是 0..W 的超采样坐标，换算成 0..256 的设计坐标
  const x = (px / W) * SIZE;
  const y = (py / W) * SIZE;

  // 底：圆角方块
  if (!inRoundRect(x, y, 0, 0, SIZE, SIZE, 56)) return null;

  // 三个结点
  const nodeY = 106;
  const nodeH = 44;
  const nodeW = 46;
  const nodes = [38, 105, 172];
  for (const nx of nodes) {
    if (inRoundRect(x, y, nx, nodeY, nodeW, nodeH, 11)) return WHITE;
  }

  // 连接线：结点之间的横向指针
  const barY = 107;
  const barH = 1;
  for (let i = 0; i < nodes.length - 1; i++) {
    const x0 = nodes[i] + nodeW;
    const x1 = nodes[i + 1];
    if (x >= x0 && x <= x1 && inRoundRect(x, y, x0, nodeY + nodeH / 2 - 5, x1 - x0, 10, 2)) return WHITE;
  }

  return ACCENT;
}

function rasterize() {
  const buf = Buffer.alloc(SIZE * SIZE * 4, 0); // BGRA
  const acc = new Float64Array(SIZE * SIZE * 4);
  const samples = SS * SS;

  for (let sy = 0; sy < W; sy++) {
    for (let sx = 0; sx < W; sx++) {
      const c = shape(sx + 0.5, sy + 0.5);
      const dx = (sx / SS) | 0;
      const dy = (sy / SS) | 0;
      const idx = (dy * SIZE + dx) * 4;
      if (c) {
        acc[idx] += c[0];
        acc[idx + 1] += c[1];
        acc[idx + 2] += c[2];
        acc[idx + 3] += 255;
      }
    }
  }

  for (let i = 0; i < SIZE * SIZE; i++) {
    const idx = i * 4;
    const a = acc[idx + 3] / samples;
    if (a <= 0) continue;
    // 颜色按不透明的采样点平均，避免边缘被"透明黑"拉暗
    const cover = acc[idx + 3] / 255;
    const r = acc[idx] / cover;
    const g = acc[idx + 1] / cover;
    const b = acc[idx + 2] / cover;
    buf[idx] = Math.round(b);
    buf[idx + 1] = Math.round(g);
    buf[idx + 2] = Math.round(r);
    buf[idx + 3] = Math.round(a);
  }
  return buf;
}

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })());
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** 额外产出一份 PNG，方便在网页/文档里直接用 */
function toPng(bgra) {
  const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
  for (let y = 0; y < SIZE; y++) {
    raw[y * (SIZE * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < SIZE; x++) {
      const s = (y * SIZE + x) * 4;
      const d = y * (SIZE * 4 + 1) + 1 + x * 4;
      raw[d] = bgra[s + 2];     // R
      raw[d + 1] = bgra[s + 1]; // G
      raw[d + 2] = bgra[s];     // B
      raw[d + 3] = bgra[s + 3]; // A
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * 经典 BMP 结构（BITMAPINFOHEADER）的 ICO：
 * 兼容性最好 —— electron-builder 和 Windows 各版本都认。
 */
function toIco(bgra) {
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);          // biSize
  header.writeInt32LE(SIZE, 4);         // biWidth
  header.writeInt32LE(SIZE * 2, 8);     // biHeight = XOR + AND
  header.writeUInt16LE(1, 12);          // biPlanes
  header.writeUInt16LE(32, 14);         // biBitCount
  header.writeUInt32LE(0, 16);          // biCompression = BI_RGB
  header.writeUInt32LE(SIZE * SIZE * 4, 20);

  // XOR 位图：自下而上
  const xor = Buffer.alloc(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    const src = (SIZE - 1 - y) * SIZE * 4;
    bgra.copy(xor, y * SIZE * 4, src, src + SIZE * 4);
  }

  // AND 掩码：32 位图其实用不到，但格式上必须有，按全 0 写
  const maskRow = Math.ceil(SIZE / 32) * 4;
  const andMask = Buffer.alloc(maskRow * SIZE, 0);

  const image = Buffer.concat([header, xor, andMask]);

  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry[0] = 0;  // 0 表示 256
  entry[1] = 0;
  entry[2] = 0;
  entry[3] = 0;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(image.length, 8);
  entry.writeUInt32LE(6 + 16, 12);

  return Buffer.concat([dir, entry, image]);
}

const bgra = rasterize();
const outDir = path.join(__dirname, '..', 'build');
fs.mkdirSync(outDir, { recursive: true });
const ico = toIco(bgra);
fs.writeFileSync(path.join(outDir, 'icon.ico'), ico);
fs.writeFileSync(path.join(outDir, 'icon.png'), toPng(bgra));

console.log(`icon.ico  ${(ico.length / 1024).toFixed(1)} KB`);
console.log(`icon.png  ${(fs.statSync(path.join(outDir, 'icon.png')).size / 1024).toFixed(1)} KB`);
console.log('尺寸 256x256');
