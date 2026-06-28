const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 81;

// CRC32 查找表
const CRC_TABLE = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPNG(pixels) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdr);

  const raw = [];
  for (let y = 0; y < SIZE; y++) {
    raw.push(0);
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      raw.push(pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]);
    }
  }

  const compressed = zlib.deflateSync(Buffer.from(raw));
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function setPixel(pixels, x, y, color) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  pixels[i] = color[0];
  pixels[i + 1] = color[1];
  pixels[i + 2] = color[2];
  pixels[i + 3] = color[3];
}

function fillCircle(pixels, cx, cy, r, color) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        setPixel(pixels, cx + dx, cy + dy, color);
      }
    }
  }
}

function fillRect(pixels, rx, ry, rw, rh, color) {
  for (let y = ry; y < ry + rh; y++) {
    for (let x = rx; x < rx + rw; x++) {
      setPixel(pixels, x, y, color);
    }
  }
}

function fillRoundRect(pixels, rx, ry, rw, rh, rad, color) {
  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      let inRect = true;
      const px = rx + x;
      const py = ry + y;

      if (x < rad && y < rad) {
        inRect = (x - rad) * (x - rad) + (y - rad) * (y - rad) <= rad * rad;
      } else if (x >= rw - rad && y < rad) {
        inRect = (x - rw + rad) * (x - rw + rad) + (y - rad) * (y - rad) <= rad * rad;
      } else if (x < rad && y >= rh - rad) {
        inRect = (x - rad) * (x - rad) + (y - rh + rad) * (y - rh + rad) <= rad * rad;
      } else if (x >= rw - rad && y >= rh - rad) {
        inRect = (x - rw + rad) * (x - rw + rad) + (y - rh + rad) * (y - rh + rad) <= rad * rad;
      }

      if (inRect) setPixel(pixels, px, py, color);
    }
  }
}

// 颜色定义
const GRAY = [107, 114, 128, 255];
const TEAL = [13, 148, 136, 255];
const TRANS = [0, 0, 0, 0];

// 团队图标：三个人
function drawGroup(color) {
  const px = new Uint8Array(SIZE * SIZE * 4);

  // 中间人
  fillCircle(px, 40, 22, 10, color);
  fillRoundRect(px, 25, 35, 30, 26, 8, color);

  // 左边人
  fillCircle(px, 20, 28, 8, color);
  fillRoundRect(px, 8, 40, 24, 20, 6, color);

  // 右边人
  fillCircle(px, 60, 28, 8, color);
  fillRoundRect(px, 48, 40, 24, 20, 6, color);

  return Buffer.from(px);
}

// 配置图标：齿轮
function drawConfig(color) {
  const px = new Uint8Array(SIZE * SIZE * 4);
  const cx = 40, cy = 40;
  const teeth = 6;
  const outerR = 28;
  const innerR = 14;
  const holeR = 7;

  for (let a = 0; a < 360; a++) {
    const rad = a * Math.PI / 180;
    const toothAngle = 360 / teeth;
    const inTooth = (a % toothAngle) < 12;

    const maxR = inTooth ? outerR : outerR - 10;

    for (let r = innerR; r <= maxR; r++) {
      const x = Math.round(cx + r * Math.cos(rad));
      const y = Math.round(cy + r * Math.sin(rad));
      setPixel(px, x, y, color);
      setPixel(px, x + 1, y, color);
      setPixel(px, x, y + 1, color);
    }
  }

  // 中心孔
  fillCircle(px, cx, cy, holeR, TRANS);

  return Buffer.from(px);
}

// 主函数
const outDir = path.join(__dirname, '../src/static/tabbar');

fs.mkdirSync(outDir, { recursive: true });

const files = [
  ['group', GRAY, drawGroup],
  ['group-active', TEAL, drawGroup],
  ['config', GRAY, drawConfig],
  ['config-active', TEAL, drawConfig],
];

files.forEach(([name, color, draw]) => {
  const pixels = draw(color);
  const png = createPNG(pixels);
  const fpath = path.join(outDir, `${name}.png`);
  fs.writeFileSync(fpath, png);
  console.log(`Created: ${fpath}`);
});

console.log('Done!');
