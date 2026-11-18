import { elapsedMs, frameAt, penaltyFor } from '../shared/engine';
import { overlayBlinkOn } from '../shared/blink';
import { subscribeClock, getClock } from '../shared/storage';
import type { ClockState, Intensities } from '../shared/types';
import type { AudioDirector } from './audio/director';
import type { EyeLayer } from './eye/eye-layer';
import type { Effect } from './effects/effect';
import type { LockPanel } from './lock-panel';
import { reducedMotion } from './reduced-motion';
import { FADE_MS, type Overlay } from './overlay-host';

const MS_PER_MIN = 60_000;
/** The flicker snaps with no easing. Reduced motion gets a slow fade instead of a flicker. */
const BLINK_MS = 0;
const BLINK_MS_REDUCED = 900;
const ZERO: Intensities = { blur: 0, veins: 0, eyelids: 0, floaters: 0, tunnel: 0, tint: 0 };

export type ControllerParts = {
  overlay: Overlay;
  effects: Effect[];
  audio: AudioDirector;
  eye: EyeLayer;
  lock: LockPanel;
};

/**
 * One requestAnimationFrame loop per page. Elapsed time is computed here from the stored
 * clock, so the worker never has to tick.
 */
export const startController = ({ overlay, effects, audio, eye, lock }: ControllerParts): (() => void) => {
  let clock: ClockState | undefined;
  let raf = 0;
  let last = 0;
  let hideTimer: number | undefined;

  effects.forEach((e) => e.mount(overlay.root));
  eye.mount(overlay.root);
  lock.mount(overlay.root);
  audio.mount(overlay.root);

  const frame = (t: number): void => {
    raf = 0;
    if (!clock) return;
    const dt = last ? t - last : 0;
    last = t;
    const min = elapsedMs(clock, Date.now()) / MS_PER_MIN;
    const f = frameAt(min, penaltyFor(clock.snoozes.count));
    overlay.host.dataset['stage'] = f.stage;
    overlay.setBlink(
      overlayBlinkOn(min, Date.now(), clock.snoozes.count, reducedMotion()),
      reducedMotion() ? BLINK_MS_REDUCED : BLINK_MS,
    );
    effects.forEach((e) => e.update(f.intensities, dt));
    eye.update(f, dt);
    lock.update(f.lock, clock);
    audio.update(f, min);
    raf = requestAnimationFrame(frame);
  };

  const stop = (): void => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  };

  const run = (): void => {
    if (!raf && !document.hidden && clock?.status === 'active') raf = requestAnimationFrame(frame);
  };

  const apply = (next: ClockState): void => {
    clock = next;
    window.clearTimeout(hideTimer);
    if (next.status === 'active') {
      audio.setActive(true);
      overlay.setVisible(true);
      run();
    } else {
      // Rest or pause: fade and mute now, then clear every effect (this also gives
      // page media back its original filter and speed) and stop drawing.
      audio.setActive(false);
      lock.update(false, next);
      overlay.setVisible(false);
      hideTimer = window.setTimeout(() => {
        stop();
        effects.forEach((e) => e.update(ZERO, 0));
      }, FADE_MS + 50);
    }
  };

  const onVisibility = (): void => (document.hidden ? stop() : run());
  document.addEventListener('visibilitychange', onVisibility);
  const unsubscribe = subscribeClock(apply);
  void getClock().then((s) => {
    // A change that arrived first is newer than this read.
    if (s && !clock) apply(s);
  });

  return () => {
    stop();
    window.clearTimeout(hideTimer);
    unsubscribe();
    document.removeEventListener('visibilitychange', onVisibility);
    effects.forEach((e) => e.unmount());
    eye.unmount();
    lock.unmount();
    audio.unmount();
  };
};
