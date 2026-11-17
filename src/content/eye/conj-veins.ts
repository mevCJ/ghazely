import { PALETTE } from '../../shared/scare-script';
import { mulberry32 } from '../effects/veins';
import { context, makeCanvas } from './geometry';

type Vein = { pts: [number, number][]; width: number; rank: number };

const build = (cx: number, cy: number, a: number, irisR: number): Vein[] => {
  const rand = mulberry32(0x7e1b);
  const veins: Vein[] = [];
  const stop = irisR * 1.18;

  const grow = (x0: number, y0: number, ang0: number, len: number, width: number, rank: number, depth: number): void => {
    const pts: [number, number][] = [[x0, y0]];
    let x = x0;
    let y = y0;
    let ang = ang0;
    // Curvature wanders slowly, so a vessel meanders in smooth bends instead of a zigzag.
    let curve = (rand() - 0.5) * 0.12;
    const steps = Math.max(5, Math.round(len / 11));
    for (let s = 0; s < steps; s++) {
      // Vessels bend toward the iris and wobble a little.
      const toward = Math.atan2(cy - y, cx - x);
      let d = toward - ang;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      curve = curve * 0.8 + (rand() - 0.5) * 0.2;
      ang += d * 0.05 + curve;
      x += Math.cos(ang) * (len / steps);
      y += Math.sin(ang) * (len / steps);
      if (Math.hypot(x - cx, y - cy) < stop) break;
      pts.push([x, y]);
      if (depth < 3 && rand() < 0.16) {
        grow(x, y, ang + (rand() < 0.5 ? -1 : 1) * (0.3 + rand() * 0.45), len * 0.6, width * 0.6, rank + 0.001, depth + 1);
      }
    }
    veins.push({ pts, width, rank });
  };

  const total = 36;
  for (let n = 0; n < total; n++) {
    const rank = n / total;
    const side = rand() < 0.5 ? -1 : 1;
    // Roots sit out toward the corners and the lid edges, where real vessels enter.
    const x = cx + side * a * (0.5 + rand() * 0.5);
    const y = cy + (rand() * 2 - 1) * a * 0.34;
    const ang = Math.atan2(cy - y, cx - x) + (rand() - 0.5) * 0.7;
    grow(x, y, ang, a * (0.28 + rand() * 0.3), 1.8 + rand() * 3, rank, 0);
  }
  return veins;
};

const cache = new Map<string, Vein[]>();

/** Veins for one strength level, from 0 (a few faint ones) to 1 (the whole eye is angry). */
export const renderConjVeins = (w: number, h: number, cx: number, cy: number, a: number, irisR: number, level: number): HTMLCanvasElement => {
  const key = `${cx}|${cy}|${a}|${irisR}`;
  let veins = cache.get(key);
  if (!veins) {
    veins = build(cx, cy, a, irisR);
    cache.set(key, veins);
  }
  const canvas = makeCanvas(w, h);
  const ctx = context(canvas);

  // Overall redness first, strongest in the corners.
  const tint = (x: number, y: number, r: number, alpha: number): void => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(176,42,42,${alpha})`);
    g.addColorStop(1, 'rgba(176,42,42,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  tint(cx - a * 0.8, cy, a * 0.7, 0.45 * level);
  tint(cx + a * 0.8, cy, a * 0.7, 0.4 * level);
  tint(cx, cy - a * 0.3, a * 0.9, 0.12 * level);
  tint(cx, cy + a * 0.3, a * 0.9, 0.12 * level);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const shown = 0.1 + 0.9 * level;
  for (const v of veins) {
    if (v.rank > shown) continue;
    const w1 = v.width * (0.55 + 0.9 * level);
    const alpha = 0.28 + 0.5 * level;
    // Draw in segments that thin toward the tip, like a real vessel.
    const p = v.pts;
    const n = p.length;
    for (let i = 1; i < n; i++) {
      const taper = 1 - 0.6 * (i / n);
      const [x0, y0] = p[i - 1]!;
      const [x1, y1] = p[i]!;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = PALETTE.veins;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = w1 * taper;
      ctx.stroke();
      // A thin brighter core gives the vessel some depth.
      ctx.strokeStyle = PALETTE.drip;
      ctx.globalAlpha = alpha * 0.5;
      ctx.lineWidth = Math.max(0.5, w1 * taper * 0.4);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  return canvas;
};
