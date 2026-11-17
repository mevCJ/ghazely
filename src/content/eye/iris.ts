import { PALETTE } from '../../shared/scare-script';
import { mulberry32 } from '../effects/veins';
import { context, makeCanvas } from './geometry';

export const IRIS_PAD = 4;

/**
 * The iris disc without its pupil: green-gray base, an amber ring near the pupil,
 * radial fibers, crypts, and a dark limbal ring. Drawn once per size.
 */
export const renderIris = (r: number): HTMLCanvasElement => {
  const size = Math.ceil((r + IRIS_PAD) * 2);
  const canvas = makeCanvas(size, size);
  const ctx = context(canvas);
  const c = size / 2;
  const rand = mulberry32(0x1215);

  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.clip();

  const base = ctx.createRadialGradient(c, c, 0, c, c, r);
  base.addColorStop(0, '#26301e');
  base.addColorStop(0.2, '#8b8f50');
  base.addColorStop(0.34, '#76874f');
  base.addColorStop(0.7, PALETTE.iris);
  base.addColorStop(0.92, '#38442f');
  base.addColorStop(1, '#161d14');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Uneven patches of amber and gray-blue, so the color is not a clean gradient.
  for (let n = 0; n < 34; n++) {
    const ang = rand() * Math.PI * 2;
    const rad = r * (0.3 + rand() * 0.55);
    const x = c + Math.cos(ang) * rad;
    const y = c + Math.sin(ang) * rad;
    const pr = r * (0.08 + rand() * 0.14);
    const g = ctx.createRadialGradient(x, y, 0, x, y, pr);
    const col = rand() < 0.5 ? '150,125,60' : '70,95,95';
    g.addColorStop(0, `rgba(${col},0.28)`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - pr, y - pr, pr * 2, pr * 2);
  }

  ctx.lineCap = 'round';
  for (let n = 0; n < 520; n++) {
    const ang = rand() * Math.PI * 2;
    const r1 = r * (0.16 + rand() * 0.2);
    const r2 = r * (0.55 + rand() * 0.45);
    const bend = (rand() - 0.5) * 0.14;
    const light = rand() < 0.5;
    ctx.strokeStyle = light ? `rgba(190,200,130,${0.05 + rand() * 0.13})` : `rgba(15,25,12,${0.12 + rand() * 0.22})`;
    ctx.lineWidth = 1 + rand() * 2.4;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(ang) * r1, c + Math.sin(ang) * r1);
    ctx.quadraticCurveTo(
      c + Math.cos(ang + bend) * (r1 + r2) * 0.5,
      c + Math.sin(ang + bend) * (r1 + r2) * 0.5,
      c + Math.cos(ang + bend * 1.6) * r2,
      c + Math.sin(ang + bend * 1.6) * r2,
    );
    ctx.stroke();
  }

  // Crypts: small dark pits in the mid-zone.
  for (let n = 0; n < 22; n++) {
    const ang = rand() * Math.PI * 2;
    const rad = r * (0.4 + rand() * 0.3);
    ctx.save();
    ctx.translate(c + Math.cos(ang) * rad, c + Math.sin(ang) * rad);
    ctx.rotate(ang);
    ctx.fillStyle = 'rgba(12,18,10,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * (0.02 + rand() * 0.035), r * (0.01 + rand() * 0.02), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // The collarette: a wavy ring where the fibers change texture.
  ctx.strokeStyle = 'rgba(170,160,90,0.35)';
  ctx.lineWidth = r * 0.02;
  ctx.beginPath();
  for (let k = 0; k <= 120; k++) {
    const t = (k / 120) * Math.PI * 2;
    const rr = r * (0.34 + Math.sin(t * 9) * 0.012);
    ctx[k ? 'lineTo' : 'moveTo'](c + Math.cos(t) * rr, c + Math.sin(t) * rr);
  }
  ctx.stroke();

  const limbus = ctx.createRadialGradient(c, c, r * 0.78, c, c, r);
  limbus.addColorStop(0, 'rgba(8,12,8,0)');
  limbus.addColorStop(0.7, 'rgba(8,12,8,0.45)');
  limbus.addColorStop(1, 'rgba(4,6,4,0.95)');
  ctx.fillStyle = limbus;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();
  // A touch of blur: a real iris is never razor sharp at this scale.
  const soft = makeCanvas(size, size);
  const sctx = context(soft);
  sctx.filter = 'blur(0.9px)';
  sctx.drawImage(canvas, 0, 0);
  return soft;
};
