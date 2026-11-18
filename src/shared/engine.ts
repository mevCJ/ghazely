import {
  BLUR_CAP_BEFORE_LOCK,
  SNOOZE_INTENSITY_STEP,
  SNOOZE_TIME_CUT,
  STAGES,
} from './scare-script';
import type { ClockState, Frame, Intensities, Stage } from './types';

const MS_PER_MIN = 60_000;
const LOCK_STAGE = STAGES[STAGES.length - 1] as Stage;

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

const stageIndexAt = (elapsedMin: number): number => {
  let found = 0;
  STAGES.forEach((s, i) => {
    if (elapsedMin >= s.startMin) found = i;
  });
  return found;
};

export const stageAt = (elapsedMin: number): Stage =>
  STAGES[stageIndexAt(elapsedMin)] as Stage;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const mix = (a: Intensities, b: Intensities, t: number): Intensities => ({
  blur: lerp(a.blur, b.blur, t),
  veins: lerp(a.veins, b.veins, t),
  eyelids: lerp(a.eyelids, b.eyelids, t),
  floaters: lerp(a.floaters, b.floaters, t),
  tunnel: lerp(a.tunnel, b.tunnel, t),
  tint: lerp(a.tint, b.tint, t),
});

/** Snooze penalty added to every effect that is already active. */
export const penaltyFor = (snoozesToday: number): number =>
  Math.max(0, snoozesToday) * SNOOZE_INTENSITY_STEP;

/**
 * Eases between stage values so the page never jumps.
 * The penalty skips effects at 0, so a snooze does not blur a fresh page.
 * Blur stays under the cap until the lock stage, even with a penalty.
 */
export const intensitiesAt = (elapsedMin: number, penalty = 0): Intensities => {
  const min = Math.max(0, elapsedMin);
  const i = stageIndexAt(min);
  const from = STAGES[i] as Stage;
  const to = STAGES[i + 1];
  const base = to
    ? mix(from.levels, to.levels, (min - from.startMin) / (to.startMin - from.startMin))
    : from.levels;

  const lift = (v: number): number => (v > 0 ? clamp01(v + penalty) : 0);
  const out: Intensities = {
    blur: lift(base.blur),
    veins: lift(base.veins),
    eyelids: lift(base.eyelids),
    floaters: lift(base.floaters),
    tunnel: lift(base.tunnel),
    tint: lift(base.tint),
  };
  if (!from.lock) out.blur = Math.min(out.blur, BLUR_CAP_BEFORE_LOCK);
  return out;
};

export const frameAt = (elapsedMin: number, penalty = 0): Frame => {
  const stage = stageAt(elapsedMin);
  return {
    stage: stage.id,
    intensities: intensitiesAt(elapsedMin, penalty),
    heartbeat: stage.heartbeat,
    whisper: stage.whisper,
    eye: stage.eye,
    lock: stage.lock,
  };
};

/** Content scripts call this locally each frame. The worker never ticks. */
export const elapsedMs = (state: ClockState, now: number): number =>
  state.status === 'active'
    ? state.baseMs + Math.max(0, now - state.baseTime) * state.speed
    : state.baseMs;

/** Changing speed keeps the elapsed value, so the page does not jump. */
export const withSpeed = (state: ClockState, speed: number, now: number): ClockState => ({
  ...state,
  baseMs: elapsedMs(state, now),
  baseTime: now,
  speed,
});

export const startRest = (state: ClockState, now: number): ClockState => ({
  ...state,
  baseMs: 0,
  baseTime: now,
  status: 'resting',
});

export const resumeActive = (state: ClockState, now: number): ClockState => ({
  ...state,
  baseTime: now,
  status: 'active',
});

export const dayKey = (date: Date): string => {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
};

/** Counters reset at local midnight. */
export const rolloverSnoozes = (state: ClockState, today: string): ClockState =>
  state.snoozes.day === today ? state : { ...state, snoozes: { day: today, count: 0 } };

export type SnoozeOptions = {
  snoozeMin: number;
  limit: number;
  now: number;
};

/**
 * Sets the clock back so the lock returns after a shorter wait each time:
 * snoozeMin, then 75% of it, then 56%, and so on.
 * Returns the same state when no snoozes are left.
 */
export const applySnooze = (state: ClockState, opts: SnoozeOptions): ClockState => {
  if (state.snoozes.count >= opts.limit) return state;
  const count = state.snoozes.count + 1;
  const waitMin = opts.snoozeMin * (1 - SNOOZE_TIME_CUT) ** (count - 1);
  const backToMin = Math.max(0, LOCK_STAGE.startMin - waitMin);
  return {
    ...state,
    baseMs: backToMin * MS_PER_MIN,
    baseTime: opts.now,
    status: 'active',
    snoozes: { ...state.snoozes, count },
  };
};
