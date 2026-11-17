import { PALETTE } from '../../shared/scare-script';
import { mulberry32 } from '../effects/veins';
import { context, makeCanvas } from './geometry';

/**
 * The white of the eye with sphere shading, the pink inner corner, the caruncle,
 * and faint mottling. Drawn once. It never depends on the lids or the gaze.
 */
export const renderSclera = (w: number, h: number, cx: number, cy: number, a: number): HTMLCanvasElement => {
  const canvas = makeCanvas(w, h);
  const ctx = context(canvas);
  ctx.fillStyle = PALETTE.eyeWhite;
  ctx.fillRect(0, 0, w, h);

  // The eyeball is a sphere: it darkens toward the corners and the lids.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 0.62);
  const sphere = ctx.createRadialGradient(0, 0, a * 0.2, 0, 0, a * 1.08);
  sphere.addColorStop(0, 'rgba(120,100,85,0)');
  sphere.addColorStop(0.6, 'rgba(120,95,80,0.12)');
  sphere.addColorStop(0.88, 'rgba(95,70,60,0.5)');
  sphere.addColorStop(1, 'rgba(55,38,35,0.85)');
  ctx.fillStyle = sphere;
  ctx.fillRect(-w, -h * 2, w * 2, h * 4);
  ctx.restore();

  const glow = (x: number, y: number, r: number, rgba: string): void => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  glow(cx - a * 0.86, cy + 0.04 * a, a * 0.34, 'rgba(205,125,115,0.6)');
  glow(cx + a * 0.9, cy - 0.04 * a, a * 0.25, 'rgba(160,125,85,0.4)');
  // Just under the upper lid the white goes grayer and a touch yellow.
  glow(cx - a * 0.1, cy - a * 0.3, a * 0.8, 'rgba(150,130,95,0.12)');

  const rand = mulberry32(0x3ee1);
  for (let n = 0; n < 150; n++) {
    const r = a * (0.02 + rand() * 0.08);
    const x = cx + (rand() * 2 - 1) * a;
    const y = cy + (rand() * 2 - 1) * a * 0.4;
    glow(x, y, r, rand() < 0.5 ? 'rgba(170,140,100,0.07)' : 'rgba(110,100,110,0.06)');
  }

  // Wet sheen across the lower white.
  const sheen = ctx.createLinearGradient(0, cy + a * 0.1, 0, cy + a * 0.26);
  sheen.addColorStop(0, 'rgba(255,255,250,0)');
  sheen.addColorStop(0.6, 'rgba(255,255,250,0.14)');
  sheen.addColorStop(1, 'rgba(255,255,250,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(cx - a, cy + a * 0.1, a * 2, a * 0.16);

  // Caruncle: the pink bump in the inner corner.
  const kx = cx - a * 0.9;
  const ky = cy + 0.06 * a;
  ctx.save();
  ctx.translate(kx, ky);
  ctx.scale(1, 0.66);
  const k = ctx.createRadialGradient(-a * 0.01, -a * 0.015, 0, 0, 0, a * 0.1);
  k.addColorStop(0, '#d79b92');
  k.addColorStop(0.6, '#b2706a');
  k.addColorStop(1, '#6e3a38');
  ctx.fillStyle = k;
  ctx.beginPath();
  ctx.arc(0, 0, a * 0.085, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // The fold beside it.
  ctx.strokeStyle = 'rgba(140,70,68,0.55)';
  ctx.lineWidth = a * 0.008;
  ctx.beginPath();
  ctx.arc(kx + a * 0.1, ky, a * 0.06, -1.1, 1.1);
  ctx.stroke();
  return canvas;
};
