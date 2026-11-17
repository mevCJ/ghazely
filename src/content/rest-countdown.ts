/**
 * Counts how long this page has seen no input. It stores only timestamps, never what
 * was typed or where the pointer went. The worker still decides when the rest really
 * starts (chrome.idle); this only shows the user how far along they are.
 */
export type RestCountdown = {
  /** Call on real user input. */
  touch: (now: number) => void;
  remainingSec: (now: number) => number;
  /** True while the "that did not count" message should show. */
  interrupted: (now: number) => boolean;
  setRestSeconds: (seconds: number) => void;
  /** Starts a fresh count, for example when the lock panel appears. */
  restart: (now: number) => void;
};

/** Stillness shorter than this is ordinary use, not a rest that got broken. */
const REAL_REST_MS = 5000;
/** The message stays until the user has been still this long. */
const CALM_MS = 3000;

export const createRestCountdown = (restSeconds: number, now: number): RestCountdown => {
  let total = restSeconds;
  let lastInput = now;
  let broke = false;
  return {
    touch: (t) => {
      // Only a rest that had really started counts as broken.
      if (t - lastInput >= REAL_REST_MS) broke = true;
      lastInput = t;
    },
    remainingSec: (t) => Math.max(0, total - (t - lastInput) / 1000),
    interrupted: (t) => {
      if (broke && t - lastInput >= CALM_MS) broke = false;
      return broke;
    },
    setRestSeconds: (s) => {
      total = s;
    },
    restart: (t) => {
      lastInput = t;
      broke = false;
    },
  };
};
