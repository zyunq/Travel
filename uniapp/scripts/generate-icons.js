// 生成 TabBar 图标 - 简洁线性风格
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 81;

// CRC32 表
const CRC_TABLE = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[n] = c;
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePNG(pixels) {
  // pixels: RGBA array [r,g,b,a, r,g,b,a, ...]
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // 添加过滤字节
  const rawData = [];
  for (let y = 0; y < SIZE; y++) {
    rawData.push(0); // filter none
    const rowStart = y * SIZE * 4;
    for (let x = 0; x < SIZE * 4; x++) {
      rawData.push(pixels[rowStart + x]);
    }
  }

  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// 颜色
const GRAY = [107, 114, 128, 255];
const TEAL = [13, 148, 136, 255];
const TRANSPARENT = [0, 0, 0, 0];

function setPixel(pixels, x, y, color) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  pixels[i] = color[0];
  pixels[i + 1] = color[1];
  pixels[i + 2] = color[2];
  pixels[i + 3] = color[3];
}

// Bresenham 画圆
function drawCircle(pixels, cx, cy, r, color, fill = false) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const dist = Math.sqrt(x * x + y * y);
      if (fill) {
        if (dist <= r) setPixel(pixels, cx + x, cy + y, color);
      } else {
        if (dist >= r - 1 && dist <= r) setPixel(pixels, cx + x, cy + y, color);
      }
    }
  }
}

// 画线
function drawLine(pixels, x1, y1, x2, y2, color, thickness = 2) {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  let x = x1, y = y1;
  while (true) {
    for (let tx = -thickness + 1; tx < thickness; tx++) {
      for (let ty = -thickness + 1; ty < thickness; ty++) {
        setPixel(pixels, x + tx, y + ty, color);
      }
    }
    if (x === x2 && y === y2) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}

// 画圆角矩形
function drawRoundRect(pixels, x, y, w, h, r, color) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      let inCorner = false;
      // 检查四个角
      if (dx < r && dy < r) inCorner = Math.sqrt((dx - r) ** 2 + (dy - r) ** 2) <= r;
      else if (dx >= w - r && dy < r) inCorner = Math.sqrt((dx - w + r) ** 2 + (dy - r) ** 2) <= r;
      else if (dx < r && dy >= h - r) inCorner = Math.sqrt((dx - r) ** 2 + (dy - h + r) ** 2) <= r;
      else if (dx >= w - r && dy >= h - r) inCorner = Math.sqrt((dx - w + r) ** 2 + (dy - h + r) ** 2) <= r;
      else inCorner = true;

      if (inCorner) setPixel(pixels, x + dx, y + dy, color);
    }
  }
}

// ====== 图标绘制 ======

// 团队图标：三个人
function drawGroupIcon(color) {
  const pixels = new Uint8Array(SIZE * SIZE * 4);

  // 中间的人（稍大）
  drawCircle(pixels, 40, 26, 9, color, true); // 头
  drawRoundRect(pixels, 26, 38, 28, 24, 6, color); // 身体

  // 左边的人
  drawCircle(pixels, 22, 30, 7, color, true);
  drawRoundRect(pixels, 12, 40, 20, 18, 5, color);

  // 右边的人
  drawCircle(pixels, 58, 30, 7, color, true);
  drawRoundRect(pixels, 48, 40, 20, 18, 5, color);

  return Buffer.from(pixels);
}

// 配置图标：齿轮
function drawConfigIcon(color) {
  const pixels = new Uint8Array(SIZE * SIZE * 4);
  const cx = 40, cy = 40;

  // 外圈齿轮（简化为六边形+齿）
  const outerR = 28;
  const innerR = 16;
  const holeR = 6;
  const teeth = 6;

  for (let angle = 0; angle < 360; angle += 1) {
    const rad = angle * Math.PI / 180;
    const toothWidth = 12; // 齿宽角度
    const isTooth = (angle % (360 / teeth)) < toothWidth;

    for (let r = innerR; r <= (isTooth ? outerR : outerR - 6); r++) {
      const x = Math.round(cx + r * Math.cos(rad));
      const y = Math.round(cy + r * Math.sin(rad));
      setPixel(pixels, x, y, color);
      // 加粗
      setPixel(pixels, x + 1, y, color);
      setPixel(pixels, x, y + 1, color);
    }
  }

  // 中心圆孔
  drawCircle(pixels, cx, cy, holeR, TRANSPARENT, true);

  return Buffer.from(pixels);
}

// ====== 主程序 ======
const outputDir = path.join(__dirname, '../src/static/tabbar');

function main() {
  // 确保目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 生成所有图标
  const icons = [
    { name: 'group', color: GRAY },
    { name: 'group-active', color: TEAL },
    { name: 'config', color: GRAY },
    { name: 'config-active', color: TEAL },
  ];

  for (const icon of icons) {
    let pixels;
    if (icon.name.startsWith('group')) {
      pixels = drawGroupIcon(icon.color);
    } else {
      pixels = drawConfigIcon(icon.color);
    }

    const png = makePNG(pixels);
    const filePath = path.join(outputDir, `${icon.name}.png`);
    fs.writeFileSync(filePath, png);
    console.log(`✓ Generated: ${filePath}`);
  }

  console.log('\n所有图标已生成！');
}

main();
