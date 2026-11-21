import { elapsedMs, rolloverSnoozes, dayKey, stageAt } from './engine';
import { STAGES } from './scare-script';
import type { ClockState, ClockStatus, StageId } from './types';

export type ClockStatusView = {
  stage: StageId;
  minutes: number;
  snoozesLeft: number;
  status: ClockStatus;
  speed: number;
};

/** What the popup shows. A snooze count from yesterday counts as zero. */
export const describeClock = (clock: ClockState, now: number, snoozeLimit: number): ClockStatusView => {
  const today = rolloverSnoozes(clock, dayKey(new Date(now)));
  const min = elapsedMs(clock, now) / 60_000;
  return {
    stage: stageAt(min).id,
    minutes: Math.floor(min),
    snoozesLeft: Math.max(0, snoozeLimit - today.snoozes.count),
    status: clock.status,
    speed: clock.speed,
  };
};

/** Shown whenever speed is not 1, so a fast clock is never on by accident. */
export const speedBadge = (speed: number): string | undefined =>
  speed === 1 ? undefined : `Demo speed ${Math.round(speed)}x`;

/** Minutes of continuous screen time at which the lock stage starts. The bar is full here. */
export const LOCK_MINUTES = STAGES.find((s) => s.lock)?.startMin ?? 120;

/** How full the "minutes sat" bar is, 0 to 1. It stays full past the lock. */
export const satProgress = (minutes: number): number =>
  Math.min(1, Math.max(0, minutes / LOCK_MINUTES));

/**
 * How far along the current rest is, from the time of the last input. It estimates what the
 * worker's idle check will decide, from the input the pages have seen.
 */
export const restProgress = (
  lastInput: number | undefined,
  now: number,
  restSeconds: number,
): { seconds: number; fraction: number } => {
  const seconds = lastInput === undefined ? 0 : Math.max(0, (now - lastInput) / 1000);
  return { seconds, fraction: Math.min(1, seconds / Math.max(1, restSeconds)) };
};

/** One entry per snooze allowed today. `true` is a snooze still left, like a full cell on a health bar. */
export const snoozeCells = (left: number, limit: number): boolean[] =>
  Array.from({ length: Math.max(0, limit) }, (_, i) => i < left);
