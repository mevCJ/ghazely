import { bez, bezTangent, shift, strokeCurve, type Curve, type Shape } from './geometry';
import { mulberry32 } from '../effects/veins';

/** Soft shade the upper lid casts onto the eyeball. Built from stacked strokes, which is cheap. */
export const drawLidShadow = (ctx: CanvasRenderingContext2D, s: Shape): void => {
  ctx.lineCap = 'round';
  for (let k = 0; k < 11; k++) {
    ctx.strokeStyle = 'rgba(14,6,6,0.1)';
    ctx.lineWidth = s.a * (0.012 + k * 0.016);
    strokeCurve(ctx, shift(s.upper, 0, 0));
  }
  for (let k = 0; k < 6; k++) {
    ctx.strokeStyle = 'rgba(40,18,16,0.06)';
    ctx.lineWidth = s.a * (0.01 + k * 0.014);
    strokeCurve(ctx, s.lower);
  }
};

/** Wet tear line along the lower lid, inside the opening. */
export const drawTear = (ctx: CanvasRenderingContext2D, s: Shape, shine = 0.5): void => {
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(255,248,238,${0.06 + 0.2 * shine})`;
  ctx.lineWidth = s.a * 0.022;
  strokeCurve(ctx, shift(s.lower, 0, -s.a * 0.013));
  ctx.strokeStyle = `rgba(255,255,250,${0.25 + 0.5 * shine})`;
  ctx.lineWidth = s.a * 0.0055;
  strokeCurve(ctx, shift(s.lower, 0, -s.a * 0.017));
};

/** Skin features that follow the lids: creases, the lid edge, the waterline, under-eye shade. */
export const drawLidSkin = (ctx: CanvasRenderingContext2D, s: Shape, openness: number): void => {
  const a = s.a;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Under-eye bag: dark gray-violet, as after a night without sleep.
  const bag = shift(s.lower, 0, a * 0.1);
  for (let k = 0; k < 7; k++) {
    ctx.strokeStyle = 'rgba(40,28,48,0.07)';
    ctx.lineWidth = a * (0.04 + k * 0.03);
    strokeCurve(ctx, bag);
  }
  ctx.strokeStyle = 'rgba(15,8,10,0.12)';
  ctx.lineWidth = a * 0.012;
  strokeCurve(ctx, shift(s.lower, 0, a * (0.13 + 0.02 * openness)));

  // Upper crease: it rises as the eye opens.
  const lift = a * (0.05 + 0.13 * openness);
  const crease: Curve = [
    { x: s.ic.x + a * 0.08, y: s.ic.y - a * 0.04 },
    { x: s.upper[1].x, y: s.upper[1].y - lift },
    { x: s.upper[2].x, y: s.upper[2].y - lift },
    { x: s.oc.x - a * 0.04, y: s.oc.y - a * 0.02 },
  ];
  for (let k = 0; k < 5; k++) {
    ctx.strokeStyle = 'rgba(8,3,4,0.08)';
    ctx.lineWidth = a * (0.012 + k * 0.014);
    strokeCurve(ctx, crease);
  }
  ctx.strokeStyle = 'rgba(8,3,4,0.5)';
  ctx.lineWidth = a * 0.005;
  strokeCurve(ctx, crease);
  ctx.strokeStyle = 'rgba(200,180,160,0.04)';
  ctx.lineWidth = a * 0.05;
  strokeCurve(ctx, shift(crease, 0, -a * 0.035));

  // Lid margin: a thin dark line, and the pink waterline below.
  ctx.strokeStyle = '#0d0807';
  ctx.lineWidth = a * 0.018;
  strokeCurve(ctx, s.upper);
  ctx.strokeStyle = 'rgba(165,92,88,0.85)';
  ctx.lineWidth = a * 0.013;
  strokeCurve(ctx, shift(s.lower, 0, a * 0.004));
};

type Lash = { t: number; len: number; curl: number; w: number; jitter: number };

const buildLashes = (n: number, seed: number, from: number, to: number): Lash[] => {
  const rand = mulberry32(seed);
  return Array.from({ length: n }, (_, k) => ({
    t: from + ((to - from) * (k + rand() * 0.8)) / n,
    len: 0.6 + rand() * 0.55,
    curl: 0.6 + rand() * 0.8,
    w: 0.7 + rand() * 0.6,
    jitter: (rand() - 0.5) * 0.35,
  }));
};

const UPPER = buildLashes(150, 0x1a5e, 0.07, 0.97);
const LOWER = buildLashes(44, 0x2b9d, 0.15, 0.9);

const lash = (
  ctx: CanvasRenderingContext2D,
  curve: Curve,
  l: Lash,
  dir: 1 | -1,
  size: number,
  openness: number,
): void => {
  const base = bez(curve, l.t);
  const tan = bezTangent(curve, l.t);
  // Normal pointing away from the eye: up for the upper lid, down for the lower.
  const n = { x: tan.y * dir, y: -tan.x * dir };
  // Lashes fan outward toward the temple more as t grows.
  const fan = (l.t - 0.35) * 0.9 + l.jitter;
  const ang = Math.atan2(n.y, n.x) + fan * dir * -1 * -1;
  // Closed eyes tuck the upper lashes down along the lid.
  const tuck = dir === 1 ? (1 - openness) * 0.6 : 0;
  const len = size * Math.sin(Math.PI * Math.pow(l.t, 0.8)) * l.len * (0.5 + 0.5 * l.t) ;
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const tipx = base.x + dx * len + tan.x * len * 0.25 * l.curl;
  const tipy = base.y + dy * len + tan.y * len * 0.25 * l.curl + tuck * len;
  const midx = base.x + dx * len * 0.5 - tan.x * len * 0.05;
  const midy = base.y + dy * len * 0.5 - tan.y * len * 0.05;
  const hw = size * 0.016 * l.w;
  ctx.beginPath();
  ctx.moveTo(base.x - tan.x * hw, base.y - tan.y * hw);
  ctx.quadraticCurveTo(midx - tan.x * hw * 0.6, midy - tan.y * hw * 0.6, tipx, tipy);
  ctx.quadraticCurveTo(midx + tan.x * hw * 0.6, midy + tan.y * hw * 0.6, base.x + tan.x * hw, base.y + tan.y * hw);
  ctx.closePath();
  ctx.fill();
};

export const drawLashes = (ctx: CanvasRenderingContext2D, s: Shape, openness: number): void => {
  ctx.fillStyle = '#0c0807';
  for (const l of UPPER) lash(ctx, s.upper, l, 1, s.a * 0.17, openness);
  ctx.fillStyle = 'rgba(14,9,8,0.8)';
  for (const l of LOWER) lash(ctx, s.lower, l, -1, s.a * 0.07, openness);
};
