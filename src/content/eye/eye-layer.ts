import type { EyeMode, Frame } from '../../shared/types';
import { reducedMotion } from '../reduced-motion';
import { createEye, EYE_H, EYE_W, type Eye } from './eye';
import { createEyeState, type EyeState } from './eye-state';

export type EyeLayer = {
  mount: (root: ShadowRoot) => void;
  update: (frame: Frame, dtMs: number) => void;
  unmount: () => void;
};

/**
 * The eye sits in one place at every stage: large, in the upper middle of the screen, with
 * the lock panel below it. The whole overlay blinks on and off (see `blink.ts`), so the eye
 * itself only needs a fixed strength per stage. The lock size spans about 90% of the screen width.
 */
const POS = { x: '50vw', y: '40vh' };
/** Before the lock the eye stays a little see-through so the page can still be read. */
const OPACITY: Record<EyeMode, number> = { none: 0, peek: 0.7, watch: 0.7, full: 1 };

/** A dark backing so the page does not show through the soft edge of the lock eye. */
const SCRIM: Record<EyeMode, number> = { none: 0, peek: 0, watch: 0, full: 1 };

const FADE_MS = 1600;

/** No cursor yet: the eye stares straight ahead. */
const IDLE = { x: 0, y: 0 };

export const createEyeLayer = (): EyeLayer => {
  let eye: Eye | undefined;
  let state: EyeState | undefined;
  let canvas: HTMLCanvasElement | undefined;
  let scrim: HTMLDivElement | undefined;
  let mode: EyeMode = 'none';
  let lastShown = 0;
  let pointer: { x: number; y: number } | undefined;

  const onMove = (e: PointerEvent): void => {
    pointer = { x: e.clientX, y: e.clientY };
  };

  const place = (m: EyeMode): void => {
    if (!canvas || !scrim) return;
    canvas.style.transition = `opacity ${FADE_MS}ms ease`;
    canvas.style.transform = `translate(calc(${POS.x} - 50%), calc(${POS.y} - 50%))`;
    canvas.style.opacity = String(OPACITY[m]);
    scrim.style.opacity = String(SCRIM[m]);
  };

  return {
    mount: (root) => {
      eye = createEye();
      state = createEyeState();
      scrim = document.createElement('div');
      scrim.className = 'layer';
      scrim.style.cssText = [
        'background: radial-gradient(ellipse at 50% 38%, rgba(26,26,26,0.55) 0%, rgba(26,26,26,0.94) 70%)',
        'opacity: 0',
        `transition: opacity ${FADE_MS}ms ease`,
      ].join(';');
      canvas = eye.canvas;
      canvas.className = 'eye';
      canvas.setAttribute('aria-hidden', 'true');
      // The width is capped by height too, so the eye never grows taller than the screen on tall windows.
      const mask = 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 76%, transparent 100%)';
      canvas.style.cssText = [
        'position: fixed',
        'left: 0',
        'top: 0',
        'width: min(116vw, 190vh)',
        `aspect-ratio: ${EYE_W} / ${EYE_H}`,
        'pointer-events: none',
        'opacity: 0',
        'will-change: transform, opacity',
        `mask-image: ${mask}`,
        `-webkit-mask-image: ${mask}`,
      ].join(';');
      root.append(scrim, canvas);
      place('none');
      window.addEventListener('pointermove', onMove, { passive: true });
    },
    update: (frame, dtMs) => {
      if (!eye || !state || !canvas) return;
      if (frame.eye !== mode) {
        mode = frame.eye;
        place(mode);
      }
      if (mode !== 'none') lastShown = 0;
      else lastShown += dtMs;
      // Once the fade-out has finished there is nothing to draw.
      if (mode === 'none' && lastShown > FADE_MS + 200) return;

      let target = IDLE;
      if (pointer) {
        const r = canvas.getBoundingClientRect();
        target = {
          x: (pointer.x - (r.left + r.width / 2)) / (window.innerWidth / 2),
          y: (pointer.y - (r.top + r.height / 2)) / (window.innerHeight / 2),
        };
      }
      const f = state.step(dtMs, {
        mode,
        targetX: target.x,
        targetY: target.y,
        reducedMotion: reducedMotion(),
        veins: frame.intensities.veins,
      });
      eye.draw(f);
    },
    unmount: () => {
      window.removeEventListener('pointermove', onMove);
      canvas?.remove();
      scrim?.remove();
      canvas = scrim = undefined;
      eye = undefined;
      state = undefined;
    },
  };
};
