export type Pt = { x: number; y: number };
export type Curve = readonly [Pt, Pt, Pt, Pt];

export type Shape = {
  cx: number;
  cy: number;
  /** Half the width of the eye opening, in canvas pixels. */
  a: number;
  ic: Pt;
  oc: Pt;
  upper: Curve;
  lower: Curve;
};

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * The opening between the lids as two cubic curves from the inner to the outer corner.
 * At openness 0 both curves are the same curve, so the eye is exactly shut.
 * The upper lid peaks a little toward the nose, like a real eye.
 */
export const eyeShape = (cx: number, cy: number, a: number, openness: number): Shape => {
  const o = clamp01(openness);
  const ic = { x: cx - a, y: cy + 0.05 * a };
  const oc = { x: cx + a, y: cy - 0.04 * a };
  const lowerPeak = lerp(0.07 * a, 0.23 * a, o);
  const upperPeak = lerp(lowerPeak, -0.37 * a, o);
  // A cubic reaches 3/4 of its control offset, so scale by 4/3 to land on the peak.
  const curve = (peak: number): Curve => [
    ic,
    { x: cx - 0.4 * a, y: ic.y + (peak * 4) / 3 },
    { x: cx + 0.32 * a, y: oc.y + (peak * 4) / 3 },
    oc,
  ];
  return { cx, cy, a, ic, oc, upper: curve(upperPeak), lower: curve(lowerPeak) };
};

export const bez = (c: Curve, t: number): Pt => {
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t] as const;
  return {
    x: w[0] * c[0].x + w[1] * c[1].x + w[2] * c[2].x + w[3] * c[3].x,
    y: w[0] * c[0].y + w[1] * c[1].y + w[2] * c[2].y + w[3] * c[3].y,
  };
};

/** Unit tangent along the curve, pointing from the inner to the outer corner. */
export const bezTangent = (c: Curve, t: number): Pt => {
  const u = 1 - t;
  const x = 3 * u * u * (c[1].x - c[0].x) + 6 * u * t * (c[2].x - c[1].x) + 3 * t * t * (c[3].x - c[2].x);
  const y = 3 * u * u * (c[1].y - c[0].y) + 6 * u * t * (c[2].y - c[1].y) + 3 * t * t * (c[3].y - c[2].y);
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
};

export const shift = (c: Curve, dx: number, dy: number): Curve =>
  c.map((p) => ({ x: p.x + dx, y: p.y + dy })) as unknown as Curve;

export const strokeCurve = (ctx: CanvasRenderingContext2D, c: Curve): void => {
  ctx.beginPath();
  ctx.moveTo(c[0].x, c[0].y);
  ctx.bezierCurveTo(c[1].x, c[1].y, c[2].x, c[2].y, c[3].x, c[3].y);
  ctx.stroke();
};

export const openingPath = (ctx: CanvasRenderingContext2D, s: Shape): void => {
  ctx.beginPath();
  ctx.moveTo(s.ic.x, s.ic.y);
  ctx.bezierCurveTo(s.upper[1].x, s.upper[1].y, s.upper[2].x, s.upper[2].y, s.oc.x, s.oc.y);
  ctx.bezierCurveTo(s.lower[2].x, s.lower[2].y, s.lower[1].x, s.lower[1].y, s.ic.x, s.ic.y);
  ctx.closePath();
};

export const makeCanvas = (w: number, h: number): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

export const context = (c: HTMLCanvasElement): CanvasRenderingContext2D => {
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2d canvas is not available');
  return ctx;
};
