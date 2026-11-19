import type { Eye, EyeParams } from './eye';
import { clamp01, context, makeCanvas } from './geometry';

export type PhotoEyeUrls = { base: string; closed: string; pupil: string; mask: string };

/** Same gaze logic as the drawn eye: the iris moves farther sideways than up. */
const GAZE_X = 1.4;
const GAZE_Y = 0.8;
const IRIS_R_OVER_A = 0.5;
/** Iris and pupil pixels are darker than this (0 to 255). The halo around them is lighter. */
const IRIS_MAX_LUM = 140;
const MASK_EDGE = 24;
/** Below this openness the closed photo replaces the whole image. */
const CLOSED_BELOW = 0.5;
/** Vignette: clear inside this share of the half-diagonal, then darkens to the edge. */
const VIGNETTE_START = 0;
const VIGNETTE_STRENGTH = 0.85;
/** The palette shade, so the vignette matches the lock scrim. */
const VIGNETTE_RGB = '26,26,26';

/**
 * Fetch, then decode from a blob. An image loaded straight from a chrome-extension:// URL counts
 * as another origin on a web page and taints the canvas, which blocks reading its pixels.
 */
const loadImage = async (url: string): Promise<ImageBitmap> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url}`);
  return createImageBitmap(await res.blob());
};

export type PhotoEye = Eye & {
  /** Where the iris rests, as a share of the canvas width and height. */
  center: { x: number; y: number };
};

/** Turns the black-is-open mask into an alpha mask, and finds the opening's bounds. */
const buildAlphaMask = (
  mask: ImageBitmap,
): { canvas: HTMLCanvasElement; cx: number; cy: number; a: number } => {
  const w = mask.width;
  const h = mask.height;
  const canvas = makeCanvas(w, h);
  const ctx = context(canvas);
  ctx.drawImage(mask, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  let minX = w;
  let maxX = 0;
  let minY = h;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const px = data.data;
      const alpha = 255 - (px[i] ?? 0);
      px[i] = px[i + 1] = px[i + 2] = 0;
      px[i + 3] = alpha;
      // The mask has a gray frame on its right and bottom edges. It is not part of the opening.
      if (alpha > 128 && x > MASK_EDGE && y > MASK_EDGE && x < w - MASK_EDGE && y < h - MASK_EDGE) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  ctx.putImageData(data, 0, 0);
  return { canvas, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, a: (maxX - minX) / 2 };
};

/**
 * Center and radius of the iris, from the dark pixels only. The image has a pale, uneven halo
 * around the iris that is opaque, so its alpha would pull the center off.
 */
const measureIris = (img: ImageBitmap): { x: number; y: number; r: number } => {
  const w = img.width;
  const h = img.height;
  const c = makeCanvas(w, h);
  const ctx = context(c);
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, w, h).data;
  let sum = 0;
  let sx = 0;
  let sy = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const lum = ((px[i] ?? 0) + (px[i + 1] ?? 0) + (px[i + 2] ?? 0)) / 3;
      if (lum < IRIS_MAX_LUM && (px[i + 3] ?? 0) > 128) {
        sum++;
        sx += x;
        sy += y;
      }
    }
  }
  return { x: sx / sum, y: sy / sum, r: Math.sqrt(sum / Math.PI) };
};

/**
 * A photo-based eye with the same `draw` contract as `createEye`. Layers: the base photo
 * (face and bare sclera), the iris clipped to the opening, and a photo of the closed eye that
 * replaces the whole image when the eye shuts. It replaces a drawn lid, so a blink is a photo swap.
 */
export const createPhotoEye = async (urls: PhotoEyeUrls): Promise<PhotoEye> => {
  const [base, closed, pupilImg, maskImg] = await Promise.all([
    loadImage(urls.base),
    loadImage(urls.closed),
    loadImage(urls.pupil),
    loadImage(urls.mask),
  ]);
  const w = base.width;
  const h = base.height;
  const canvas = makeCanvas(w, h);
  const ctx = context(canvas);
  const { canvas: alpha, cx, cy, a } = buildAlphaMask(maskImg);
  const iris = measureIris(pupilImg);
  const irisR = a * IRIS_R_OVER_A;
  const scale = irisR / iris.r;
  // Drawn once. It sits over the open and the closed photo alike.
  const vignette = makeCanvas(w, h);
  const vctx = context(vignette);
  const reach = Math.hypot(w, h) / 2;
  const vg = vctx.createRadialGradient(w / 2, h / 2, reach * VIGNETTE_START, w / 2, h / 2, reach);
  vg.addColorStop(0, `rgba(${VIGNETTE_RGB},0)`);
  vg.addColorStop(1, `rgba(${VIGNETTE_RGB},${VIGNETTE_STRENGTH})`);
  vctx.fillStyle = vg;
  vctx.fillRect(0, 0, w, h);
  const layer = makeCanvas(w, h);
  const layerCtx = context(layer);

  return {
    canvas,
    center: { x: cx / w, y: cy / h },
    draw: (p: EyeParams) => {
      const openness = clamp01(p.openness);
      const shine = clamp01(p.shine ?? 0.5);
      const ix = cx + p.gazeX * a * GAZE_X;
      const iy = cy + p.gazeY * a * GAZE_Y;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(base, 0, 0);

      // Iris and glint, clipped to the opening.
      layerCtx.globalCompositeOperation = 'source-over';
      layerCtx.clearRect(0, 0, w, h);
      layerCtx.drawImage(
        pupilImg,
        ix - iris.x * scale,
        iy - iris.y * scale,
        pupilImg.width * scale,
        pupilImg.height * scale,
      );
      layerCtx.save();
      layerCtx.translate(ix - irisR * 0.36, iy - irisR * 0.36);
      layerCtx.rotate(-0.15);
      layerCtx.filter = 'blur(2px)';
      layerCtx.fillStyle = `rgba(255,255,255,${0.35 + 0.45 * shine})`;
      const gw = irisR * 0.27;
      const gh = irisR * 0.17;
      layerCtx.beginPath();
      layerCtx.roundRect(-gw / 2, -gh / 2, gw, gh, gh * 0.28);
      layerCtx.fill();
      layerCtx.restore();
      layerCtx.globalCompositeOperation = 'destination-in';
      layerCtx.drawImage(alpha, 0, 0);
      ctx.drawImage(layer, 0, 0);

      // A hard swap, no fade. The closed photo has its own size, so it is scaled to the canvas.
      if (openness < CLOSED_BELOW) {
        ctx.drawImage(closed, 0, 0, w, h);
      }
      ctx.drawImage(vignette, 0, 0);
    },
  };
};
