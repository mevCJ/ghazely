import { PALETTE } from '../../shared/scare-script';
import type { Effect } from './effect';

export type Segment = { x1: number; y1: number; x2: number; y2: number; width: number };

/** Small seeded PRNG, so veins look the same on every load of a page. */
export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const MAX_DEPTH = 4;
const SEED = 0x6a7a31;

/** Random-walk branches that grow inward from all four edges. */
export const buildVeins = (w: number, h: number, seed = SEED): Segment[] => {
  const rand = mulberry32(seed);
  const out: Segment[] = [];
  const reach = Math.min(w, h) * 0.38;

  const grow = (x: number, y: number, angle: number, len: number, width: number, depth: number): void => {
    let cx = x;
    let cy = y;
    let a = angle;
    const steps = Math.max(3, Math.round(len / 14));
    for (let s = 0; s < steps; s++) {
      a += (rand() - 0.5) * 0.7;
      const step = len / steps;
      const nx = cx + Math.cos(a) * step;
      const ny = cy + Math.sin(a) * step;
      out.push({ x1: cx, y1: cy, x2: nx, y2: ny, width: width * (1 - s / (steps * 1.4)) });
      cx = nx;
      cy = ny;
      if (depth < MAX_DEPTH && rand() < 0.22) {
        const side = rand() < 0.5 ? -1 : 1;
        grow(cx, cy, a + side * (0.5 + rand() * 0.6), len * 0.55, width * 0.6, depth + 1);
      }
    }
  };

  const perEdge = (length: number): number => Math.max(3, Math.round(length / 110));
  for (let n = 0; n < perEdge(w); n++) {
    const x = rand() * w;
    grow(x, 0, Math.PI / 2, reach * (0.6 + rand() * 0.6), 3.2, 0);
    grow(rand() * w, h, -Math.PI / 2, reach * (0.6 + rand() * 0.6), 3.2, 0);
  }
  for (let n = 0; n < perEdge(h); n++) {
    grow(0, rand() * h, 0, reach * (0.6 + rand() * 0.6), 3.2, 0);
    grow(w, rand() * h, Math.PI, reach * (0.6 + rand() * 0.6), 3.2, 0);
  }
  return out;
};

/** Veins sit pushed outward at low intensity and slide in as it rises. */
export const veinScale = (i: number): number => 1 + (1 - Math.min(1, Math.max(0, i))) * 0.4;
export const veinOpacity = (i: number): number => Math.min(1, Math.max(0, i) * 1.5);

const DPR_CAP = 1.5;

export const veinsEffect = (): Effect => {
  let canvas: HTMLCanvasElement | undefined;
  let resizeTimer: number | undefined;

  // Drawn once at full strength. Per frame we only touch opacity and transform.
  const draw = (): void => {
    if (!canvas) return;
    const dpr = Math.min(DPR_CAP, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Red glow in the corners and along the edges: the bloodshot white of the eye.
    const glow = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) / 2);
    glow.addColorStop(0, `${PALETTE.veins}00`);
    glow.addColorStop(1, `${PALETTE.veins}88`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.lineCap = 'round';
    ctx.strokeStyle = PALETTE.veins;
    ctx.globalAlpha = 0.85;
    for (const s of buildVeins(w, h)) {
      ctx.lineWidth = Math.max(0.6, s.width);
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
    }
  };

  const onResize = (): void => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(draw, 250);
  };

  return {
    id: 'veins',
    mount: (root) => {
      canvas = document.createElement('canvas');
      canvas.className = 'layer';
      canvas.style.cssText = 'width: 100%; height: 100%; opacity: 0; will-change: transform, opacity';
      root.append(canvas);
      draw();
      window.addEventListener('resize', onResize);
    },
    update: (i) => {
      if (!canvas) return;
      canvas.style.opacity = String(veinOpacity(i.veins));
      canvas.style.transform = `scale(${veinScale(i.veins)})`;
    },
    unmount: () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(resizeTimer);
      canvas?.remove();
      canvas = undefined;
    },
  };
};
