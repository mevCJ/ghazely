import type { EyeStyle } from '../../shared/settings';
import type { EyeMode, Frame } from '../../shared/types';
import { reducedMotion } from '../reduced-motion';
import { createEye, type Eye } from './eye';
import { createEyeState, type EyeState } from './eye-state';
import { createGazeJumpDetector } from './gaze-jump';
import { createPhotoEye } from './photo-eye';

export type EyeLayer = {
  mount: (root: ShadowRoot) => void;
  update: (frame: Frame, dtMs: number) => void;
  /** Swaps the eye. The photo eye loads in the background, and the old eye stays until it is ready. */
  setStyle: (style: EyeStyle) => void;
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
/** Bundled images, listed in web_accessible_resources. Never taken from the page. */
const photoUrls = (): { base: string; closed: string; pupil: string; mask: string } => ({
  base: chrome.runtime.getURL('eye/base.png'),
  closed: chrome.runtime.getURL('eye/eye-closed.png'),
  pupil: chrome.runtime.getURL('eye/pupil.png'),
  mask: chrome.runtime.getURL('eye/mask.png'),
});
const CENTER = { x: 0.5, y: 0.5 };

/** No cursor yet: the eye stares straight ahead. */
const IDLE = { x: 0, y: 0 };

/** `onGazeJump` runs when the eye whips across the screen. The caller decides what to do, such as a sound. */
export const createEyeLayer = (initial: EyeStyle = 'photo', onGazeJump?: () => void): EyeLayer => {
  const jump = createGazeJumpDetector();
  let clockMs = 0;
  let eye: Eye | undefined;
  let state: EyeState | undefined;
  let canvas: HTMLCanvasElement | undefined;
  let scrim: HTMLDivElement | undefined;
  let root: ShadowRoot | undefined;
  /** The style asked for. It differs from `style` while the photo is still loading. */
  let wanted: EyeStyle | undefined;
  /** Where the iris rests in the canvas. The photo eye is not centered in its image. */
  let center = CENTER;
  /** Bumped on every style change, so a slow photo load cannot replace a newer choice. */
  let token = 0;
  let mode: EyeMode = 'none';
  let lastShown = 0;
  let pointer: { x: number; y: number } | undefined;

  const onMove = (e: PointerEvent): void => {
    pointer = { x: e.clientX, y: e.clientY };
  };

  const place = (m: EyeMode): void => {
    if (!canvas || !scrim) return;
    canvas.style.transition = `opacity ${FADE_MS}ms ease`;
    canvas.style.transform = `translate(calc(${POS.x} - ${center.x * 100}%), calc(${POS.y} - ${center.y * 100}%))`;
    canvas.style.opacity = String(OPACITY[m]);
    scrim.style.opacity = String(SCRIM[m]);
  };

  const install = (next: Eye, anchor: { x: number; y: number }, nextStyle: EyeStyle): void => {
    if (!root || !scrim) return;
    canvas?.remove();
    eye = next;
    center = anchor;
    canvas = next.canvas;
    canvas.className = 'eye';
    canvas.setAttribute('aria-hidden', 'true');
    const mask = 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 76%, transparent 100%)';
    // The width is capped by height too, so the eye never grows taller than the screen on tall windows.
    // The photo is 3:2 and already dark at its edges, so it is sized to the screen height.
    const width = nextStyle === 'photo' ? 'min(100vw, 150vh)' : 'min(116vw, 190vh)';
    canvas.style.cssText = [
      'position: fixed',
      'left: 0',
      'top: 0',
      `width: ${width}`,
      `aspect-ratio: ${canvas.width} / ${canvas.height}`,
      'pointer-events: none',
      'opacity: 0',
      'will-change: transform, opacity',
      `mask-image: ${mask}`,
      `-webkit-mask-image: ${mask}`,
    ].join(';');
    // Right after the scrim, so it stays under the lock panel that mounts later.
    scrim.after(canvas);
    place(mode);
  };
  const drawn = (): void => install(createEye(), CENTER, 'drawn');
  const setStyle = (next: EyeStyle): void => {
    if (!root || next === wanted) return;
    wanted = next;
    const mine = ++token;
    if (next === 'drawn') {
      drawn();
      return;
    }
    createPhotoEye(photoUrls())
      .then((photo) => {
        if (mine === token) install(photo, photo.center, 'photo');
      })
      .catch(() => {
        // The images could not load. A drawn eye is better than none.
        if (mine === token && !eye) drawn();
      });
  };
  return {
    mount: (shadow) => {
      root = shadow;
      state = createEyeState();
      scrim = document.createElement('div');
      scrim.className = 'layer';
      scrim.style.cssText = [
        'background: radial-gradient(ellipse at 50% 38%, rgba(26,26,26,0.55) 0%, rgba(26,26,26,0.94) 70%)',
        'opacity: 0',
        `transition: opacity ${FADE_MS}ms ease`,
      ].join(';');
      root.append(scrim);
      window.addEventListener('pointermove', onMove, { passive: true });
      setStyle(initial);
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
          x: (pointer.x - (r.left + r.width * center.x)) / (window.innerWidth / 2),
          y: (pointer.y - (r.top + r.height * center.y)) / (window.innerHeight / 2),
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
      clockMs += dtMs;
      // Watch the cursor, not the eased gaze. With reduced motion the gaze eases over 700 ms, so
      // it never covers the jump distance inside the detector's window, and the sound never plays.
      const sx = Math.min(1, Math.max(-1, target.x));
      const sy = Math.min(1, Math.max(-1, target.y));
      if (mode !== 'none' && jump.push(sx, sy, clockMs)) onGazeJump?.();
    },
    setStyle,
    unmount: () => {
      window.removeEventListener('pointermove', onMove);
      canvas?.remove();
      scrim?.remove();
      token++;
      canvas = scrim = undefined;
      root = wanted = undefined;
      center = CENTER;
      eye = undefined;
      state = undefined;
    },
  };
};
