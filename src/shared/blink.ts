import { penaltyFor } from './engine';
import { STAGES } from './scare-script';

/** One blink cycle in real time. Real time, not scaled, so a demo blinks at the same pace. */
export const BLINK_PERIOD_MS = 10_000;
/** Share of each cycle the overlay stays on, after its flicker, when haze begins. */
export const BLINK_MIN_ON = 0.15;
/** The flicker at the start of a burst: on-pulses as [from, to) in ms. The gaps are off. */
export const FLICKER_PULSES: readonly (readonly [number, number])[] = [
  [0, 60],
  [120, 170],
  [250, 320],
];
/** Length of the flicker. Before haze it is the whole show. From haze it leads into solid on. */
export const FLICKER_MS = 400;
/** Reduced motion gets one slow on-stretch in place of the flicker. */
const REDUCED_ON_MS = 1500;

const stageStart = (id: string, fallback: number): number =>
  STAGES.find((s) => s.id === id)?.startMin ?? fallback;
const FLICKER_MIN = stageStart('strain', 20);
const HAZE_MIN = stageStart('haze', 75);
const LOCK_MIN = STAGES.find((s) => s.lock)?.startMin ?? 120;

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * Share of each cycle the overlay stays on once it settles. It grows in a straight line from
 * haze to the lock, where it stays on all the time. Each snooze today adds the same 0.1 as
 * the other intensities.
 */
export const blinkOnFraction = (elapsedMin: number, snoozesToday = 0): number => {
  if (elapsedMin >= LOCK_MIN) return 1;
  const t = clamp01((elapsedMin - HAZE_MIN) / (LOCK_MIN - HAZE_MIN));
  return clamp01(BLINK_MIN_ON + (1 - BLINK_MIN_ON) * t + penaltyFor(snoozesToday));
};

const inFlicker = (ms: number): boolean => FLICKER_PULSES.some(([from, to]) => ms >= from && ms < to);

/**
 * Whether the overlay is on at this moment. It depends only on wall-clock time and the
 * shared clock, so every tab agrees.
 *
 * - Before strain there is nothing to show, so it stays on.
 * - In strain and dry it only flickers, once per cycle.
 * - From haze it flickers, then stays on until the cycle ends. The stay grows with time.
 */
export const overlayBlinkOn = (
  elapsedMin: number,
  wallMs: number,
  snoozesToday = 0,
  reduced = false,
): boolean => {
  if (elapsedMin < FLICKER_MIN) return true;
  const phase = wallMs % BLINK_PERIOD_MS;
  if (elapsedMin < HAZE_MIN) return reduced ? phase < REDUCED_ON_MS : inFlicker(phase);
  const on = blinkOnFraction(elapsedMin, snoozesToday);
  if (on >= 1) return true;
  const t = phase - (1 - on) * BLINK_PERIOD_MS;
  if (t < 0) return false;
  if (reduced) return true;
  return t >= FLICKER_MS || inFlicker(t);
};
