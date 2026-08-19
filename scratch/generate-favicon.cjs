const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Read source PNG
const srcPath = path.join(process.cwd(), 'public', 'logo-mark.png');
const srcBuf = fs.readFileSync(srcPath);

// Let's decode the raw PNG pixels from logo-mark.png
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

const origWidth = ihdr.width;
const origHeight = ihdr.height;
const decompressed = zlib.inflateSync(Buffer.concat(idatBuffers));
const stride = 1 + origWidth * 4;

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

const rawPixels = Buffer.alloc(origWidth * origHeight * 4);

for (let y = 0; y < origHeight; y++) {
  const lineStart = y * stride;
  const filterType = decompressed[lineStart];

  for (let x = 0; x < origWidth; x++) {
    for (let c = 0; c < 4; c++) {
      const currIdx = lineStart + 1 + x * 4 + c;
      const rawIdx = (y * origWidth + x) * 4 + c;
      const rawVal = decompressed[currIdx];

      const a = (x > 0) ? rawPixels[(y * origWidth + (x - 1)) * 4 + c] : 0;
      const b = (y > 0) ? rawPixels[((y - 1) * origWidth + x) * 4 + c] : 0;
      const d = (x > 0 && y > 0) ? rawPixels[((y - 1) * origWidth + (x - 1)) * 4 + c] : 0;

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

// Bilinear resize helper
function resizeRGBA(src, sw, sh, dw, dh) {
  const dst = Buffer.alloc(dw * dh * 4);
  const xRatio = (sw - 1) / Math.max(1, dw - 1);
  const yRatio = (sh - 1) / Math.max(1, dh - 1);

  for (let dy = 0; dy < dh; dy++) {
    const sy = dy * yRatio;
    const y0 = Math.floor(sy);
    const y1 = Math.min(sh - 1, y0 + 1);
    const yDiff = sy - y0;

    for (let dx = 0; dx < dw; dx++) {
      const sx = dx * xRatio;
      const x0 = Math.floor(sx);
      const x1 = Math.min(sw - 1, x0 + 1);
      const xDiff = sx - x0;

      const dstIdx = (dy * dw + dx) * 4;

      for (let c = 0; c < 4; c++) {
        const p00 = src[(y0 * sw + x0) * 4 + c];
        const p10 = src[(y0 * sw + x1) * 4 + c];
        const p01 = src[(y1 * sw + x0) * 4 + c];
        const p11 = src[(y1 * sw + x1) * 4 + c];

        const top = p00 + (p10 - p00) * xDiff;
        const bot = p01 + (p11 - p01) * xDiff;
        dst[dstIdx + c] = Math.round(top + (bot - top) * yDiff);
      }
    }
  }
  return dst;
}

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

function encodePNG(pixels, w, h) {
  const scanlines = Buffer.alloc((1 + w * 4) * h);
  const lineLen = 1 + w * 4;
  for (let y = 0; y < h; y++) {
    scanlines[y * lineLen] = 0;
    for (let x = 0; x < w * 4; x++) {
      scanlines[y * lineLen + 1 + x] = pixels[(y * w * 4) + x];
    }
  }

  const idat = zlib.deflateSync(scanlines, { level: 9 });
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(w, 0);
  ihdrData.writeUInt32BE(h, 4);
  ihdrData[8] = 8; // 8-bit
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// Generate multi-resolution PNGs
const sizes = [16, 32, 48, 64, 128, 256];
const pngBuffers = sizes.map(sz => {
  const resized = resizeRGBA(rawPixels, origWidth, origHeight, sz, sz);
  const png = encodePNG(resized, sz, sz);
  return { size: sz, png };
});

// Build standard multi-resolution ICO file
function buildIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);     // Reserved
  header.writeUInt16LE(1, 2);     // Type = ICO
  header.writeUInt16LE(count, 4); // Image count

  const dirEntries = [];
  let currentOffset = 6 + (16 * count);

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // Width
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1); // Height
    entry.writeUInt8(0, 2);                              // Palette count
    entry.writeUInt8(0, 3);                              // Reserved
    entry.writeUInt16LE(1, 4);                           // Color planes
    entry.writeUInt16LE(32, 6);                          // Bits per pixel
    entry.writeUInt32LE(img.png.length, 8);              // Size of PNG data
    entry.writeUInt32LE(currentOffset, 12);              // Offset
    dirEntries.push(entry);
    currentOffset += img.png.length;
  }

  const icoBuf = Buffer.concat([
    header,
    ...dirEntries,
    ...images.map(img => img.png)
  ]);

  return icoBuf;
}

const multiIco = buildIco(pngBuffers);

// Write to public/ and src/app/
fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.ico'), multiIco);
fs.writeFileSync(path.join(process.cwd(), 'src', 'app', 'favicon.ico'), multiIco);

// Also write standard 32x32 favicon.png and 180x180 apple-touch-icon.png
const png32 = pngBuffers.find(p => p.size === 32).png;
fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.png'), png32);

const png180 = encodePNG(resizeRGBA(rawPixels, origWidth, origHeight, 180, 180), 180, 180);
fs.writeFileSync(path.join(process.cwd(), 'public', 'apple-touch-icon.png'), png180);
fs.writeFileSync(path.join(process.cwd(), 'src', 'app', 'apple-icon.png'), png180);

const png192 = pngBuffers.find(p => p.size === 128).png;
fs.writeFileSync(path.join(process.cwd(), 'src', 'app', 'icon.png'), png192);

// Create SVG favicon with Ingress Within Mark
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#ECEFF0" />
  <circle cx="50" cy="50" r="16" stroke="#1E2A2E" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="75 25" transform="rotate(-45 50 50)"/>
  <path d="M50 34 C58 34 64 42 64 50 C64 58 56 64 50 64 C44 64 38 58 38 50 C38 44 43 40 48 40 C52 40 55 43 55 47 C55 50 52 53 50 53" fill="none" stroke="#1E2A2E" stroke-width="2.6" stroke-linecap="round"/>
  <circle cx="50" cy="18" r="6.5" fill="#6E4B5B"/>
  <circle cx="78" cy="38" r="6.5" fill="#6E4B5B"/>
  <circle cx="74" cy="74" r="6.5" fill="#B8C9D4"/>
  <circle cx="50" cy="80" r="6" fill="#14262E"/>
  <circle cx="24" cy="72" r="6.5" fill="#1A3338"/>
  <circle cx="26" cy="36" r="6.5" fill="#2E4844"/>
</svg>`;

fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.svg'), svgContent);

console.log('Successfully generated valid multi-size favicon.ico (' + multiIco.length + ' bytes) containing [16, 32, 48, 64, 128, 256]px icons.');
console.log('Updated public/favicon.svg, public/favicon.png, public/apple-touch-icon.png, src/app/favicon.ico, src/app/icon.png, and src/app/apple-icon.png.');
