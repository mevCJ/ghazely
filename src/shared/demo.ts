import { elapsedMs } from './engine';
import { STAGES } from './scare-script';
import type { ClockState } from './types';

const LOCK_START_MIN = STAGES[STAGES.length - 1]?.startMin ?? 120;
/** Real seconds from calm to the end of the demo. */
export const DEMO_SECONDS = 60;
/** 120 min * 60 s / 60 s = 120x, so the lock stage starts 60 real seconds in. */
export const DEMO_SPEED = (LOCK_START_MIN * 60) / DEMO_SECONDS;
/** Real seconds the lock stays up before the demo ends. Under 5 s a viewer cannot read it or see Snooze. */
export const DEMO_LOCK_HOLD_SECONDS = 20;
export const DEMO_END_MIN = LOCK_START_MIN + (DEMO_LOCK_HOLD_SECONDS * DEMO_SPEED) / 60;
/** Demo-only exception: the lock panel shows Snooze after 5 s so a recording stays short. */
export const DEMO_SNOOZE_DELAY_MS = 5_000;

export const startDemo = (state: ClockState, now: number): ClockState => ({
  ...state,
  baseMs: 0,
  baseTime: now,
  speed: DEMO_SPEED,
  status: 'active',
});

/** Back to normal speed with a fresh clock. */
export const stopDemo = (state: ClockState, now: number): ClockState => ({
  ...state,
  baseMs: 0,
  baseTime: now,
  speed: 1,
  status: 'active',
});

/** Real milliseconds until the demo reaches its end, or 0 if it already has. */
export const demoRemainingMs = (state: ClockState, now: number): number => {
  const leftScaled = DEMO_END_MIN * 60_000 - elapsedMs(state, now);
  return leftScaled <= 0 ? 0 : leftScaled / Math.max(1, state.speed);
};
