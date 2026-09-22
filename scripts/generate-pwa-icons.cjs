const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crc]);
}

function decodePngRgba(buf) {
  let pos = 8;
  const idatChunks = [];
  let width = 0, height = 0;

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    }
    pos += 12 + len;
  }

  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const pixels = new Uint8Array(width * height * 4);
  const stride = 1 + width * 4;

  for (let y = 0; y < height; y++) {
    const rowFilter = raw[y * stride];
    const prevRowOffset = (y - 1) * stride + 1;
    const curRowOffset = y * stride + 1;

    for (let x = 0; x < width * 4; x++) {
      let val = raw[curRowOffset + x];
      if (rowFilter === 1) {
        // Sub
        const a = x >= 4 ? raw[curRowOffset + x - 4] : 0;
        val = (val + a) & 0xFF;
        raw[curRowOffset + x] = val;
      } else if (rowFilter === 2) {
        // Up
        const b = y > 0 ? raw[prevRowOffset + x] : 0;
        val = (val + b) & 0xFF;
        raw[curRowOffset + x] = val;
      } else if (rowFilter === 3) {
        // Average
        const a = x >= 4 ? raw[curRowOffset + x - 4] : 0;
        const b = y > 0 ? raw[prevRowOffset + x] : 0;
        val = (val + Math.floor((a + b) / 2)) & 0xFF;
        raw[curRowOffset + x] = val;
      } else if (rowFilter === 4) {
        // Paeth
        const a = x >= 4 ? raw[curRowOffset + x - 4] : 0;
        const b = y > 0 ? raw[prevRowOffset + x] : 0;
        const c = (x >= 4 && y > 0) ? raw[prevRowOffset + x - 4] : 0;
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        let pr;
        if (pa <= pb && pa <= pc) pr = a;
        else if (pb <= pc) pr = b;
        else pr = c;
        val = (val + pr) & 0xFF;
        raw[curRowOffset + x] = val;
      }
      pixels[(y * width * 4) + x] = val;
    }
  }

  return { width, height, pixels };
}

function encodePng(width, height, getPixelRgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelRgba(x, y);
      const offset = 1 + x * 4;
      row[offset] = r;
      row[offset + 1] = g;
      row[offset + 2] = b;
      row[offset + 3] = a;
    }
    rawRows.push(row);
  }

  const idat = makeChunk('IDAT', zlib.deflateSync(Buffer.concat(rawRows)));
  const iend = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, makeChunk('IHDR', ihdr), idat, iend]);
}

// Ensure public folder
const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Load source logo
const logoSrcPath = path.resolve(process.cwd(), 'src/image/logo-ris.png');
const logoBuf = fs.readFileSync(logoSrcPath);
const logo = decodePngRgba(logoBuf);

console.log(`Loaded source logo: ${logo.width}x${logo.height}`);

function createIcon(targetSize, isMaskable = false) {
  // Safe zone calculation
  // For maskable, keep content inside 70% of size (15% padding on all sides)
  // For standard, keep content inside 82% of size
  const contentRatio = isMaskable ? 0.65 : 0.82;
  const maxContentDim = targetSize * contentRatio;

  const scale = Math.min(maxContentDim / logo.width, maxContentDim / logo.height);
  const scaledW = Math.round(logo.width * scale);
  const scaledH = Math.round(logo.height * scale);

  const startX = Math.round((targetSize - scaledW) / 2);
  const startY = Math.round((targetSize - scaledH) / 2);

  return encodePng(targetSize, targetSize, (x, y) => {
    // Background: Clean pure white with subtle soft gradient or rounded container
    const isInsideLogo = x >= startX && x < startX + scaledW && y >= startY && y < startY + scaledH;

    let bgR = 255, bgG = 255, bgB = 255, bgA = 255;

    if (!isMaskable) {
      // Subtle squircle rounded corners border or edge highlight
      const r = targetSize * 0.22;
      // Check corner distance
      const dx = Math.max(0, Math.max(r - x, x - (targetSize - r)));
      const dy = Math.max(0, Math.max(r - y, y - (targetSize - r)));
      if (dx * dx + dy * dy > r * r) {
        // Outside squircle corner - make transparent
        return [0, 0, 0, 0];
      }
    }

    if (isInsideLogo) {
      const srcX = Math.min(logo.width - 1, Math.floor((x - startX) / scale));
      const srcY = Math.min(logo.height - 1, Math.floor((y - startY) / scale));
      const idx = (srcY * logo.width + srcX) * 4;

      const lr = logo.pixels[idx];
      const lg = logo.pixels[idx + 1];
      const lb = logo.pixels[idx + 2];
      const la = logo.pixels[idx + 3] / 255;

      // Alpha composite over white
      const outR = Math.round(lr * la + bgR * (1 - la));
      const outG = Math.round(lg * la + bgG * (1 - la));
      const outB = Math.round(lb * la + bgB * (1 - la));
      return [outR, outG, outB, 255];
    }

    return [bgR, bgG, bgB, bgA];
  });
}

// 1. pwa-192x192.png
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createIcon(192, false));
console.log('Generated pwa-192x192.png');

// 2. pwa-512x512.png
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createIcon(512, false));
console.log('Generated pwa-512x512.png');

// 3. pwa-maskable-512x512.png
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createIcon(512, true));
console.log('Generated pwa-maskable-512x512.png');

// 4. apple-touch-icon.png (180x180)
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createIcon(180, true));
console.log('Generated apple-touch-icon.png');

// 5. favicon.ico / favicon.png
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createIcon(64, false));
console.log('Generated favicon.ico');

// 6. icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#ffffff"/>
  <rect x="16" y="16" width="480" height="480" rx="96" fill="none" stroke="#2563eb" stroke-width="8" opacity="0.15"/>
  <g transform="translate(56, 136) scale(0.85)">
    <!-- Stylized RIS Identity Symbol -->
    <path d="M40 180 L140 40 L240 180 Z" fill="#2563eb"/>
    <path d="M140 40 L340 40 L240 180 Z" fill="#1d4ed8"/>
    <path d="M240 180 L340 40 L440 180 Z" fill="#3b82f6"/>
    <circle cx="240" cy="110" r="32" fill="#ffffff"/>
    <text x="240" y="240" font-family="'Segoe UI', 'Inter', sans-serif" font-size="54" font-weight="900" fill="#0f172a" text-anchor="middle" letter-spacing="4">REYCOM</text>
    <text x="240" y="275" font-family="'Segoe UI', 'Inter', sans-serif" font-size="20" font-weight="700" fill="#2563eb" text-anchor="middle" letter-spacing="3">INVENTORY &amp; DEMO</text>
  </g>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
console.log('Generated icon.svg');

if (fs.existsSync(path.join(publicDir, 'test.png'))) {
  fs.unlinkSync(path.join(publicDir, 'test.png'));
}
