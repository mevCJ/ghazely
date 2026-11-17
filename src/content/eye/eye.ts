import { clamp01, context, eyeShape, makeCanvas, openingPath } from './geometry';
import { renderConjVeins } from './conj-veins';
import { renderIris, IRIS_PAD } from './iris';
import { drawLashes, drawLidShadow, drawLidSkin, drawTear } from './lids';
import { renderSclera } from './sclera';
import { renderSkin } from './skin';

export type EyeParams = {
  /** 0 shut, 1 fully open. */
  openness: number;
  /** Gaze direction, each from -1 to 1. */
  gazeX: number;
  gazeY: number;
  /** Pupil radius as a share of the iris radius. */
  pupil: number;
  /** Bloodshot strength, 0 to 1. */
  veins: number;
  /** Wetness 0 to 1. Brighter tear line and glint. Defaults to 0.5. */
  shine?: number;
};

export type Eye = {
  canvas: HTMLCanvasElement;
  draw: (p: EyeParams) => void;
};

/** Internal resolution. CSS scales the canvas to the screen. */
export const EYE_W = 1600;
export const EYE_H = 800;
const A = 620;
const IRIS_R = 0.4 * A;
const VEIN_STEP = 0.05;

/**
 * Everything that does not change per frame is drawn once into a cache. A frame only
 * composites those caches, draws the pupil, and strokes the lid curves.
 */
export const createEye = (): Eye => {
  const canvas = makeCanvas(EYE_W, EYE_H);
  const ctx = context(canvas);
  const cx = EYE_W / 2;
  const cy = EYE_H / 2;
  const skin = renderSkin(EYE_W, EYE_H);
  const sclera = renderSclera(EYE_W, EYE_H, cx, cy, A);
  const iris = renderIris(IRIS_R);
  let veins: HTMLCanvasElement | undefined;
  let veinLevel = -1;

  return {
    canvas,
    draw: (p) => {
      const openness = clamp01(p.openness);
      const shine = clamp01(p.shine ?? 0.5);
      const level = Math.round(clamp01(p.veins) / VEIN_STEP) * VEIN_STEP;
      if (level !== veinLevel) {
        veins = renderConjVeins(EYE_W, EYE_H, cx, cy, A, IRIS_R, level);
        veinLevel = level;
      }
      const s = eyeShape(cx, cy, A, openness);
      ctx.clearRect(0, 0, EYE_W, EYE_H);
      ctx.drawImage(skin, 0, 0);

      ctx.save();
      openingPath(ctx, s);
      ctx.clip();
      ctx.drawImage(sclera, 0, 0);
      if (veins) ctx.drawImage(veins, 0, 0);

      // The eyeball turns: the iris moves farther sideways than up.
      const ix = cx + p.gazeX * A * 0.3;
      const iy = cy + p.gazeY * A * 0.1;
      ctx.drawImage(iris, ix - iris.width / 2, iy - iris.height / 2);

      // Pupil: a small drift inside the iris (about 18% of its radius at most).
      const px = ix + p.gazeX * IRIS_R * 0.18;
      const py = iy + p.gazeY * IRIS_R * 0.18;
      const pr = IRIS_R * p.pupil;
      const pg = ctx.createRadialGradient(px, py, pr * 0.82, px, py, pr * 1.06);
      pg.addColorStop(0, '#030303');
      pg.addColorStop(1, 'rgba(3,3,3,0)');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(px, py, pr * 1.06, 0, Math.PI * 2);
      ctx.fill();

      // Window-shaped glint on the cornea: a rounded rectangle with a soft rim and a gray cross bar.
      const gx = ix - IRIS_R * 0.36;
      const gy = iy - IRIS_R * 0.36;
      const gw = IRIS_R * 0.27;
      const gh = IRIS_R * 0.17;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(-0.15);
      ctx.filter = 'blur(3.5px)';
      ctx.fillStyle = `rgba(255,255,255,${0.45 + 0.5 * shine})`;
      ctx.beginPath();
      ctx.roundRect(-gw / 2, -gh / 2, gw, gh, gh * 0.28);
      ctx.fill();
      ctx.filter = 'none';
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(ix + IRIS_R * 0.38, iy + IRIS_R * 0.34, IRIS_R * 0.05, 0, Math.PI * 2);
      ctx.fill();

      drawLidShadow(ctx, s);
      drawTear(ctx, s, shine);
      ctx.restore();

      drawLidSkin(ctx, s, openness);
      drawLashes(ctx, s, openness);
    },
  };
};

export const IRIS_RADIUS = IRIS_R;
export const IRIS_CANVAS_PAD = IRIS_PAD;
