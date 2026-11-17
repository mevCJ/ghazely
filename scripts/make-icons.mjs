// Draws the Ghazely eye icon to PNG with no dependencies.
// Run: node scripts/make-icons.mjs
import { Buffer } from 'node:buffer';
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { URL } from 'node:url';

const SIZES = [16, 32, 48, 128];
const SUPER = 4;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const SHADE = hex('#1a1a1a');
const WHITE = hex('#e8e2d8');
const IRIS = hex('#5a6b4a');
const VEIN = hex('#7a1f1f');
const LID = hex('#0d0d0d');

// Veins run from the eye corners toward the iris. Coordinates are in [-1, 1].
const VEINS = [
  [-0.82, 0.02, -0.4, -0.08],
  [-0.82, 0.02, -0.45, 0.12],
  [-0.7, -0.05, -0.36, -0.2],
  [0.82, 0.02, 0.4, 0.06],
  [0.82, 0.02, 0.44, -0.12],
  [0.68, 0.06, 0.36, 0.2],
];

const distToSegment = (px, py, [x1, y1, x2, y2]) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
};

const insideRoundedSquare = (u, v) => {
  const r = 0.28;
  const qx = Math.abs(u) - (1 - r);
  const qy = Math.abs(v) - (1 - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) <= r;
};

// Returns [r, g, b, a] for one sub-sample.
const sample = (u, v, size) => {
  if (!insideRoundedSquare(u, v)) return [0, 0, 0, 0];
  const px = 2 / size; // one pixel in unit space
  const arch = 0.5 * (1 - (u / 0.9) ** 2);
  const inEye = Math.abs(u) < 0.9 && Math.abs(v) < arch;
  const edge = Math.abs(u) < 0.9 && Math.abs(v) < arch + Math.max(0.045, px * 0.9);
  if (!edge) return [...SHADE, 255];
  if (!inEye) return [...LID, 255];

  const d = Math.hypot(u, v);
  if (d < 0.13) return [8, 8, 8, 255];
  if (d < 0.3) {
    const glint = Math.hypot(u + 0.09, v + 0.09) < 0.04;
    return glint ? [255, 255, 255, 255] : [...IRIS, 255];
  }
  const veinWidth = Math.max(0.018, px * 0.55);
  if (VEINS.some((seg) => distToSegment(u, v, seg) < veinWidth)) return [...VEIN, 255];
  return [...WHITE, 255];
};

const render = (size) => {
  const out = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SUPER; sy += 1) {
        for (let sx = 0; sx < SUPER; sx += 1) {
          const u = ((x + (sx + 0.5) / SUPER) / size) * 2 - 1;
          const v = ((y + (sy + 0.5) / SUPER) / size) * 2 - 1;
          const [sr, sg, sb, sa] = sample(u, v, size);
          r += sr * sa;
          g += sg * sa;
          b += sb * sa;
          a += sa;
        }
      }
      const n = SUPER * SUPER;
      const i = (y * size + x) * 4;
      out[i] = a ? Math.round(r / a) : 0;
      out[i + 1] = a ? Math.round(g / a) : 0;
      out[i + 2] = a ? Math.round(b / a) : 0;
      out[i + 3] = Math.round(a / n);
    }
  }
  return out;
};

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = (CRC_TABLE[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const encodePng = (size, rgba) => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

const outDir = new URL('../public/icons/', import.meta.url);
mkdirSync(outDir, { recursive: true });
for (const size of SIZES) {
  writeFileSync(new URL(`icon-${size}.png`, outDir), encodePng(size, render(size)));
}
