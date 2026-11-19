import { buildVeins } from '../content/effects/veins';
import { PALETTE } from '../shared/scare-script';

/** The whole layer is faint, so the settings stay easy to read. */
const OPACITY = 0.5;
/** Thinner than the page effect. These are a hint, not a threat. */
const WIDTH_SCALE = 0.55;
const DPR_CAP = 1.5;

/**
 * A still canvas of veins along the window edges, behind the page. Still on purpose:
 * the settings page never flickers or moves, whatever the photosensitive setting says.
 */
export const mountEdgeVeins = (): (() => void) => {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = [
    'position: fixed',
    'inset: 0',
    'width: 100%',
    'height: 100%',
    'z-index: -1',
    'pointer-events: none',
    `opacity: ${OPACITY}`,
  ].join(';');
  document.body.prepend(canvas);

  const draw = (): void => {
    const dpr = Math.min(DPR_CAP, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    // A faint red flush toward the corners, like the white of a tired eye.
    const glow = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.hypot(w, h) / 2);
    glow.addColorStop(0, `${PALETTE.veins}00`);
    glow.addColorStop(1, `${PALETTE.veins}66`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.strokeStyle = PALETTE.veins;
    for (const s of buildVeins(w, h)) {
      ctx.lineWidth = Math.max(0.5, s.width * WIDTH_SCALE);
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
    }
  };

  let resizeTimer: number | undefined;
  const onResize = (): void => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(draw, 250);
  };
  window.addEventListener('resize', onResize);
  draw();

  return () => {
    window.removeEventListener('resize', onResize);
    window.clearTimeout(resizeTimer);
    canvas.remove();
  };
};
