import { elapsedMs, rolloverSnoozes, dayKey, stageAt } from './engine';
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
