import { mulberry32 } from '../effects/veins';
import { context, makeCanvas } from './geometry';

/** Flat, pale-gray skin with pores. Lid shape never changes it, so it is drawn once. */
export const renderSkin = (w: number, h: number): HTMLCanvasElement => {
  const canvas = makeCanvas(w, h);
  const ctx = context(canvas);
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.1, w / 2, h / 2, w * 0.62);
  g.addColorStop(0, '#6a5b54');
  g.addColorStop(0.55, '#4d413c');
  g.addColorStop(1, '#241d1b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const rand = mulberry32(0x5c1a);
  // Pores and fine grain: many tiny specks at very low alpha.
  for (let n = 0; n < 5200; n++) {
    const light = rand() < 0.5;
    ctx.fillStyle = light ? 'rgba(210,190,170,0.045)' : 'rgba(0,0,0,0.07)';
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h, 0.6 + rand() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // Slow mottling, so the skin is not a clean gradient.
  for (let n = 0; n < 90; n++) {
    const r = 40 + rand() * 120;
    const x = rand() * w;
    const y = rand() * h;
    const blot = ctx.createRadialGradient(x, y, 0, x, y, r);
    const c = rand() < 0.5 ? '120,95,85' : '30,25,30';
    blot.addColorStop(0, `rgba(${c},0.07)`);
    blot.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = blot;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return canvas;
};
