// Generate a 256x256 PNG icon from scratch using pure Node.js (no dependencies)
const fs = require('fs');
const zlib = require('zlib');

const W = 256, H = 256;
const pixels = Buffer.alloc(W * H * 4); // RGBA

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  x = Math.round(x); y = Math.round(y);
  const i = (y * W + x) * 4;
  // Alpha blend
  const srcA = a / 255;
  const dstA = pixels[i + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA > 0) {
    pixels[i] = Math.round((r * srcA + pixels[i] * dstA * (1 - srcA)) / outA);
    pixels[i + 1] = Math.round((g * srcA + pixels[i + 1] * dstA * (1 - srcA)) / outA);
    pixels[i + 2] = Math.round((b * srcA + pixels[i + 2] * dstA * (1 - srcA)) / outA);
    pixels[i + 3] = Math.round(outA * 255);
  }
}

function fillRect(x, y, w, h, r, g, b, a = 255) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      setPixel(x + dx, y + dy, r, g, b, a);
}

function fillRoundRect(x, y, w, h, rad, r, g, b, a = 255) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      let inside = true;
      // Check corners
      if (dx < rad && dy < rad) inside = Math.hypot(dx - rad, dy - rad) <= rad;
      else if (dx >= w - rad && dy < rad) inside = Math.hypot(dx - (w - rad - 1), dy - rad) <= rad;
      else if (dx < rad && dy >= h - rad) inside = Math.hypot(dx - rad, dy - (h - rad - 1)) <= rad;
      else if (dx >= w - rad && dy >= h - rad) inside = Math.hypot(dx - (w - rad - 1), dy - (h - rad - 1)) <= rad;
      if (inside) setPixel(x + dx, y + dy, r, g, b, a);
    }
  }
}

function drawLine(x0, y0, x1, y1, r, g, b, a = 255, thickness = 1) {
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy)) * 2;
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = x0 + dx * t, y = y0 + dy * t;
    for (let ty = -thickness / 2; ty <= thickness / 2; ty++)
      for (let tx = -thickness / 2; tx <= thickness / 2; tx++)
        if (tx * tx + ty * ty <= (thickness / 2) * (thickness / 2))
          setPixel(Math.round(x + tx), Math.round(y + ty), r, g, b, a);
  }
}

function fillCircle(cx, cy, rad, r, g, b, a = 255) {
  for (let dy = -rad; dy <= rad; dy++)
    for (let dx = -rad; dx <= rad; dx++)
      if (dx * dx + dy * dy <= rad * rad)
        setPixel(cx + dx, cy + dy, r, g, b, a);
}

// Background with gradient
for (let y = 0; y < H; y++) {
  const t = y / H;
  const r = Math.round(232 + (212 - 232) * t);
  const g = Math.round(228 + (207 - 228) * t);
  const b = Math.round(221 + (198 - 221) * t);
  for (let x = 0; x < W; x++) {
    const t2 = x / W;
    setPixel(x, y, r - Math.round(t2 * 4), g - Math.round(t2 * 4), b - Math.round(t2 * 4));
  }
}

// Round corners (make transparent)
const cornerRad = 48;
for (let y = 0; y < cornerRad; y++) {
  for (let x = 0; x < cornerRad; x++) {
    if (Math.hypot(x - cornerRad, y - cornerRad) > cornerRad) setPixel(x, y, 0, 0, 0, 0);
  }
  for (let x = W - cornerRad; x < W; x++) {
    if (Math.hypot(x - (W - cornerRad - 1), y - cornerRad) > cornerRad) setPixel(x, y, 0, 0, 0, 0);
  }
}
for (let y = H - cornerRad; y < H; y++) {
  for (let x = 0; x < cornerRad; x++) {
    if (Math.hypot(x - cornerRad, y - (H - cornerRad - 1)) > cornerRad) setPixel(x, y, 0, 0, 0, 0);
  }
  for (let x = W - cornerRad; x < W; x++) {
    if (Math.hypot(x - (W - cornerRad - 1), y - (H - cornerRad - 1)) > cornerRad) setPixel(x, y, 0, 0, 0, 0);
  }
}

// Book outline
const bookColor = [90, 109, 125]; // #5a6d7d
// Left page
drawLine(68, 56, 128, 72, ...bookColor, 200, 2);
drawLine(68, 56, 68, 176, ...bookColor, 200, 2);
drawLine(68, 176, 128, 192, ...bookColor, 200, 2);
// Right page
drawLine(128, 72, 188, 56, ...bookColor, 200, 2);
drawLine(188, 56, 188, 176, ...bookColor, 200, 2);
drawLine(188, 176, 128, 192, ...bookColor, 200, 2);
// Spine
drawLine(128, 72, 128, 192, ...bookColor, 180, 2);

// Text lines left page
drawLine(84, 96, 118, 102, 124, 142, 158, 130, 2);
drawLine(84, 112, 114, 117, 124, 142, 158, 100, 2);
drawLine(84, 128, 110, 132, 124, 142, 158, 70, 2);
drawLine(84, 144, 106, 147, 124, 142, 158, 50, 2);

// Text lines right page
drawLine(138, 102, 172, 96, 176, 144, 112, 130, 2);
drawLine(138, 117, 168, 112, 176, 144, 112, 100, 2);
drawLine(138, 132, 164, 128, 176, 144, 112, 70, 2);
drawLine(138, 147, 160, 144, 176, 144, 112, 50, 2);

// Quill pen
drawLine(160, 38, 156, 78, 176, 144, 112, 160, 2);
drawLine(160, 38, 178, 46, 176, 144, 112, 140, 2);
drawLine(178, 46, 156, 78, 176, 144, 112, 120, 1);
// Pen tip
fillCircle(155, 80, 2, 90, 109, 125, 180);

// "LM" text at bottom - simple pixel rendering
// L
for (let y = 210; y < 235; y++) setPixel(100, y, ...bookColor, 200);
for (let x = 100; x < 116; x++) setPixel(x, 234, ...bookColor, 200);
// Thicken L
for (let y = 210; y < 235; y++) setPixel(101, y, ...bookColor, 200);
for (let x = 100; x < 116; x++) setPixel(x, 233, ...bookColor, 200);

// M
for (let y = 210; y < 235; y++) { setPixel(130, y, ...bookColor, 200); setPixel(131, y, ...bookColor, 200); }
for (let y = 210; y < 235; y++) { setPixel(156, y, ...bookColor, 200); setPixel(157, y, ...bookColor, 200); }
// M diagonals
for (let i = 0; i < 14; i++) {
  setPixel(131 + i, 210 + i, ...bookColor, 200);
  setPixel(132 + i, 210 + i, ...bookColor, 200);
  setPixel(156 - i, 210 + i, ...bookColor, 200);
  setPixel(155 - i, 210 + i, ...bookColor, 200);
}

// Encode as PNG
function createPNG(width, height, rgbaBuffer) {
  // Filter rows (filter type 0 = None)
  const filtered = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    filtered[y * (1 + width * 4)] = 0; // filter none
    rgbaBuffer.copy(filtered, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const deflated = zlib.deflateSync(filtered, { level: 9 });

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const buf = Buffer.alloc(4 + type.length + data.length + 4);
    buf.writeUInt32BE(data.length, 0);
    buf.write(type, 4);
    data.copy(buf, 4 + type.length);
    const crcData = Buffer.concat([Buffer.from(type), data]);
    buf.writeUInt32BE(crc32(crcData), buf.length - 4);
    return buf;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const idat = deflated;

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// CRC32
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c;
}
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

const png = createPNG(W, H, pixels);
fs.writeFileSync('icon.png', png);

// Create ICO from PNG
function createICO(pngBuf) {
  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0); // reserved
  iconDir.writeUInt16LE(1, 2); // ICO type
  iconDir.writeUInt16LE(1, 4); // 1 image

  const entry = Buffer.alloc(16);
  entry[0] = 0; // width (0 = 256)
  entry[1] = 0; // height (0 = 256)
  entry[2] = 0; // color palette
  entry[3] = 0; // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuf.length, 8); // size
  entry.writeUInt32LE(22, 12); // offset (6 + 16)

  return Buffer.concat([iconDir, entry, pngBuf]);
}

const ico = createICO(png);
fs.writeFileSync('icon.ico', ico);
console.log('Icon generated: icon.png + icon.ico');
