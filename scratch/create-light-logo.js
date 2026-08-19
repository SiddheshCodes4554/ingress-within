const fs = require('fs');
const zlib = require('zlib');

function createCrcTable() {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  return crcTable;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.slice(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

const srcBuf = fs.readFileSync('public/logo-mark-transparent.png');
let offset = 8;
let ihdr = null;
let idatBuffers = [];

while (offset < srcBuf.length) {
  const length = srcBuf.readUInt32BE(offset);
  const type = srcBuf.toString('ascii', offset + 4, offset + 8);
  const data = srcBuf.slice(offset + 8, offset + 8 + length);
  if (type === 'IHDR') {
    ihdr = {
      width: data.readUInt32BE(0),
      height: data.readUInt32BE(4),
      bitDepth: data[8],
      colorType: data[9],
      raw: data
    };
  } else if (type === 'IDAT') {
    idatBuffers.push(data);
  }
  offset += 12 + length;
}

const width = ihdr.width;
const height = ihdr.height;
const decompressed = zlib.inflateSync(Buffer.concat(idatBuffers));

// Scanline length = 1 (filter byte) + width * 4 (RGBA)
const stride = 1 + width * 4;

// Create unfilter buffer
const uncompressed = Buffer.from(decompressed);

// Unfilter scanlines (supports sub, up, average, paeth)
function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

const rawPixels = Buffer.alloc(width * height * 4);

for (let y = 0; y < height; y++) {
  const lineStart = y * stride;
  const filterType = uncompressed[lineStart];
  const prevLineStart = (y - 1) * stride;

  for (let x = 0; x < width; x++) {
    for (let c = 0; c < 4; c++) {
      const currIdx = lineStart + 1 + x * 4 + c;
      const rawIdx = (y * width + x) * 4 + c;
      const rawVal = uncompressed[currIdx];

      const a = (x > 0) ? rawPixels[(y * width + (x - 1)) * 4 + c] : 0;
      const b = (y > 0) ? rawPixels[((y - 1) * width + x) * 4 + c] : 0;
      const d = (x > 0 && y > 0) ? rawPixels[((y - 1) * width + (x - 1)) * 4 + c] : 0;

      let val = 0;
      if (filterType === 0) val = rawVal;
      else if (filterType === 1) val = (rawVal + a) & 0xFF;
      else if (filterType === 2) val = (rawVal + b) & 0xFF;
      else if (filterType === 3) val = (rawVal + Math.floor((a + b) / 2)) & 0xFF;
      else if (filterType === 4) val = (rawVal + paethPredictor(a, b, d)) & 0xFF;

      rawPixels[rawIdx] = val;
    }
  }
}

// Now transform rawPixels for light mode on dark background!
const outPixels = Buffer.alloc(width * height * 4);
const filteredScanlines = Buffer.alloc(stride * height);

for (let i = 0; i < width * height; i++) {
  const r = rawPixels[i * 4];
  const g = rawPixels[i * 4 + 1];
  const b = rawPixels[i * 4 + 2];
  const a = rawPixels[i * 4 + 3];

  if (a === 0) {
    outPixels[i * 4] = 0;
    outPixels[i * 4 + 1] = 0;
    outPixels[i * 4 + 2] = 0;
    outPixels[i * 4 + 3] = 0;
    continue;
  }

  // Calculate luminance / darkness
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;

  let newR = r;
  let newG = g;
  let newB = b;
  let newA = a;

  // 1. Dark center spiral (very dark navy/black, lum < 45)
  if (lum < 48 && r < 40 && g < 40 && b < 50) {
    // Map to luminous off-white / mint cream (#F4F7F6)
    const factor = (48 - lum) / 48;
    newR = Math.round(r + (244 - r) * factor);
    newG = Math.round(g + (247 - g) * factor);
    newB = Math.round(b + (246 - b) * factor);
  }
  // 2. Dark green / deep teal nodes (lum between 40 and 80, g >= r && g >= b)
  else if (lum < 85 && g > r && b < 70) {
    // Brighten into luminous sage (#8DBFB4 / #A8D1C7)
    newR = Math.min(255, Math.round(r * 2.6 + 40));
    newG = Math.min(255, Math.round(g * 2.8 + 60));
    newB = Math.min(255, Math.round(b * 2.8 + 60));
  }
  // 3. Dark slate / navy nodes (lum < 85, b > g)
  else if (lum < 85 && b > r) {
    // Brighten into soft celestial slate (#A8C0CC)
    newR = Math.min(255, Math.round(r * 2.8 + 70));
    newG = Math.min(255, Math.round(g * 2.8 + 90));
    newB = Math.min(255, Math.round(b * 2.8 + 110));
  }
  // 4. Mauve / terracotta nodes (r > g) - slightly brighten for dark background
  else if (r > g && lum < 140) {
    newR = Math.min(255, Math.round(r * 1.35 + 25));
    newG = Math.min(255, Math.round(g * 1.35 + 20));
    newB = Math.min(255, Math.round(b * 1.35 + 20));
  }

  outPixels[i * 4] = newR;
  outPixels[i * 4 + 1] = newG;
  outPixels[i * 4 + 2] = newB;
  outPixels[i * 4 + 3] = newA;
}

// Convert outPixels back to filtered scanlines (filterType = 0 for simplicity)
for (let y = 0; y < height; y++) {
  filteredScanlines[y * stride] = 0; // None filter
  for (let x = 0; x < width * 4; x++) {
    filteredScanlines[y * stride + 1 + x] = outPixels[(y * width * 4) + x];
  }
}

const compressed = zlib.deflateSync(filteredScanlines, { level: 9 });

const outPngChunks = [
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG signature
  makeChunk('IHDR', ihdr.raw),
  makeChunk('IDAT', compressed),
  makeChunk('IEND', Buffer.alloc(0))
];

const finalPng = Buffer.concat(outPngChunks);
fs.writeFileSync('public/logo-mark-light.png', finalPng);
console.log('Successfully generated public/logo-mark-light.png, size:', finalPng.length);
