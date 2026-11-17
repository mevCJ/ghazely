import { penaltyFor } from './engine';
import { STAGES } from './scare-script';

/** One blink cycle in real time. Real time, not scaled, so a demo blinks at the same pace. */
export const BLINK_PERIOD_MS = 10_000;
/** Share of each cycle the overlay is on when the first effect appears. */
export const BLINK_MIN_ON = 0.15;

const LOCK_MIN = STAGES.find((s) => s.lock)?.startMin ?? 120;
const FIRST_EFFECT_MIN =
  STAGES.find((s) => Object.values(s.levels).some((v) => v > 0))?.startMin ?? LOCK_MIN;

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * How much of each cycle the overlay stays on. It grows in a straight line from the first
 * effect to the lock, where it stays on all the time. Each snooze today adds the same 0.1
 * as the other intensities.
 */
export const blinkOnFraction = (elapsedMin: number, snoozesToday = 0): number => {
  if (elapsedMin >= LOCK_MIN || elapsedMin < FIRST_EFFECT_MIN) return 1;
  const t = (elapsedMin - FIRST_EFFECT_MIN) / (LOCK_MIN - FIRST_EFFECT_MIN);
  return clamp01(BLINK_MIN_ON + (1 - BLINK_MIN_ON) * t + penaltyFor(snoozesToday));
};

/**
 * Whether the overlay is on at this moment. It depends only on wall-clock time and the
 * shared clock, so every tab blinks together.
 */
export const overlayBlinkOn = (elapsedMin: number, wallMs: number, snoozesToday = 0): boolean => {
  const on = blinkOnFraction(elapsedMin, snoozesToday);
  if (on >= 1) return true;
  return (wallMs % BLINK_PERIOD_MS) / BLINK_PERIOD_MS < on;
};
