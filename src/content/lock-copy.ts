import { COPY } from '../shared/scare-script';

export const formatMmSs = (totalSeconds: number): string => {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

export const restLine = (remainingSeconds: number): string =>
  COPY.restCountdown.replace('{mm:ss}', formatMmSs(remainingSeconds));

export const snoozeLabel = (minutes: number, left: number): string =>
  COPY.snoozeButton.replace('{n}', String(minutes)).replace('{left}', String(left));

/** The Snooze button waits this long after the lock appears. Real time, not scaled by demo speed. */
export const SNOOZE_DELAY_MS = 30_000;

export type SnoozeView = 'wait' | 'available' | 'none';

/** No button once the daily limit is used up. Before that, it shows after the delay. */
export const snoozeView = (
  used: number,
  limit: number,
  sinceLockMs: number,
  delayMs: number = SNOOZE_DELAY_MS,
): SnoozeView => {
  if (used >= limit) return 'none';
  return sinceLockMs >= delayMs ? 'available' : 'wait';
};
