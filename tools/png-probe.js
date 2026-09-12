'use strict';
/*
 * 开发辅助：直接解码 PNG，读取指定坐标的真实像素值。
 * 用来排除"看图判断颜色"的误判 —— 抓图工具偶尔会拿到旧帧或混合帧。
 *
 * 用法： node tools/png-probe.js <png 路径> [x,y ...]
 */

const fs = require('fs');
const zlib = require('zlib');

function decodePng(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('不是 PNG 文件');

  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.slice(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }

  if (bitDepth !== 8) throw new Error(`只支持 8 位色深，实际 ${bitDepth}`);
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`不支持的颜色类型 ${colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);

  // 逐行反 filter
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = raw.slice(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = out.slice(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.slice((y - 1) * stride, y * stride) : Buffer.alloc(stride);

    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      const x = src[i];
      let v;
      switch (filter) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + b; break;
        case 3: v = x + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: throw new Error(`未知 filter ${filter}`);
      }
      cur[i] = v & 0xff;
    }
  }

  return {
    width,
    height,
    channels,
    pixel(x, y) {
      if (x < 0 || y < 0 || x >= width || y >= height) return null;
      const i = y * stride + x * channels;
      return [out[i], out[i + 1], out[i + 2], channels === 4 ? out[i + 3] : 255];
    },
  };
}

const file = process.argv[2];
if (!file) {
  console.error('用法：node tools/png-probe.js <png 路径> [x,y ...]');
  process.exit(1);
}

const points = process.argv.slice(3).map((s) => s.split(',').map(Number));
if (points.length === 0) {
  points.push([200, 690], [1000, 90], [1200, 500], [700, 830]);
}

const img = decodePng(file);
console.log(`${file}  ${img.width}x${img.height}  channels=${img.channels}`);
for (const [x, y] of points) {
  const p = img.pixel(x, y);
  console.log(`  (${x},${y}) -> rgba(${p ? p.join(',') : '越界'})`);
}
