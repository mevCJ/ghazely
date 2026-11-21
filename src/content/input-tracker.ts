import { createInputThrottle, setLastInput } from '../shared/last-input';

/** Keeps the saved time at most this stale. Small next to the 15 second minimum rest. */
const WRITE_EVERY_MS = 3000;
const EVENTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

/**
 * Notes when the user last touched this page, for the popup's rest bar. It saves one number,
 * the time. It never reads which key or where the pointer was.
 */
export const trackInput = (): (() => void) => {
  const due = createInputThrottle(WRITE_EVERY_MS);
  const onInput = (e: Event): void => {
    // A page script can fire fake events. Only real input breaks a rest.
    if (!e.isTrusted) return;
    const now = Date.now();
    if (!due(now)) return;
    try {
      void setLastInput(now).catch(() => undefined);
    } catch {
      // Session storage is not open to this script yet. The bar just shows less.
    }
  };
  const opts = { passive: true, capture: true } as const;
  for (const type of EVENTS) window.addEventListener(type, onInput, opts);
  return () => {
    for (const type of EVENTS) window.removeEventListener(type, onInput, opts);
  };
};
