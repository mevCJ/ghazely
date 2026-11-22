import { describe, expect, it } from 'vitest';
import {
  DEMO_END_MIN,
  DEMO_SPEED,
  DEMO_SNOOZE_CALM_MS,
  demoRelock,
  demoRemainingMs,
  demoSnooze,
  startDemo,
  stopDemo,
} from '../src/shared/demo';
import { elapsedMs, stageAt } from '../src/shared/engine';
import { describeClock, speedBadge } from '../src/shared/status';
import { snoozeView } from '../src/content/lock-copy';
import type { ClockState } from '../src/shared/types';

const NOON = Date.parse('2026-01-01T12:00:00');

const base: ClockState = {
  baseMs: 50 * 60_000,
  baseTime: 0,
  speed: 1,
  status: 'resting',
  snoozes: { day: '2026-01-01', count: 1 },
};

describe('demo mode', () => {
  it('runs calm to lock in 60 real seconds', () => {
    expect(DEMO_SPEED).toBe(120);
    const d = startDemo(base, 1000);
    expect(d).toMatchObject({ baseMs: 0, speed: 120, status: 'active' });
    expect(stageAt(elapsedMs(d, 1000 + 59_000) / 60_000).id).toBe('tunnel');
    expect(stageAt(elapsedMs(d, 1000 + 60_000) / 60_000).id).toBe('lock');
  });

  it('holds the lock for 20 real seconds before ending', () => {
    expect(DEMO_END_MIN).toBe(160);
    const d = startDemo(base, 0);
    expect(demoRemainingMs(d, 0)).toBeCloseTo(80_000);
    expect(stageAt(DEMO_END_MIN - 1).id).toBe('lock');
  });

  it('keeps the snooze count when starting and stopping', () => {
    expect(startDemo(base, 0).snoozes).toEqual(base.snoozes);
    expect(stopDemo(startDemo(base, 0), 5).snoozes).toEqual(base.snoozes);
  });

  it('stop returns to speed 1 and a fresh clock', () => {
    const s = stopDemo(startDemo(base, 0), 9000);
    expect(s).toMatchObject({ baseMs: 0, baseTime: 9000, speed: 1, status: 'active' });
  });

  it('knows how long until the end, even after a snooze moved the clock back', () => {
    const d = startDemo(base, 0);
    expect(demoRemainingMs(d, 0)).toBeCloseTo((DEMO_END_MIN * 60_000) / 120);
    expect(demoRemainingMs(d, 100_000)).toBe(0);
    const snoozed = { ...d, baseMs: 110 * 60_000, baseTime: 50_000 };
    expect(demoRemainingMs(snoozed, 50_000)).toBeCloseTo((50 * 60_000) / 120);
  });
});

describe('popup status', () => {
  it('reports stage, minutes and snoozes left', () => {
    const v = describeClock({ ...base, status: 'active', baseMs: 80 * 60_000, baseTime: NOON }, NOON, 3);
    expect(v).toMatchObject({ stage: 'haze', minutes: 80, snoozesLeft: 2, speed: 1 });
  });

  it('ignores snoozes from a past day', () => {
    const old = { ...base, snoozes: { day: '1999-01-01', count: 3 } };
    expect(describeClock(old, Date.now(), 3).snoozesLeft).toBe(3);
  });

  it('never goes below zero snoozes left', () => {
    expect(describeClock({ ...base, snoozes: { day: '2026-01-01', count: 9 } }, NOON, 3).snoozesLeft).toBe(0);
  });

  it('shows a badge whenever speed is not 1', () => {
    expect(speedBadge(1)).toBeUndefined();
    expect(speedBadge(120)).toBe('Demo speed 120x');
  });
});

describe('snooze delay', () => {
  it('uses the shorter delay when asked', () => {
    expect(snoozeView(0, 3, 6000, 5000)).toBe('available');
    expect(snoozeView(0, 3, 6000)).toBe('wait');
    expect(snoozeView(3, 3, 99_000, 5000)).toBe('none');
  });
});

describe('demo snooze', () => {
  const locked: ClockState = { ...startDemo(base, 0), baseMs: 125 * 60_000, snoozes: { day: '2026-01-01', count: 0 } };

  it('spends a snooze and shows calm', () => {
    const s = demoSnooze(locked, 5000, 3);
    expect(s).toMatchObject({ baseMs: 0, status: 'paused', speed: 120 });
    expect(s.snoozes.count).toBe(1);
    expect(stageAt(elapsedMs(s, 9000) / 60_000).id).toBe('calm');
  });

  it('does nothing when no snoozes are left', () => {
    const spent = { ...locked, snoozes: { day: '2026-01-01', count: 3 } };
    expect(demoSnooze(spent, 5000, 3)).toBe(spent);
  });

  it('brings the lock straight back and the demo ends 20 s later', () => {
    const r = demoRelock(demoSnooze(locked, 0, 3), DEMO_SNOOZE_CALM_MS);
    expect(r.status).toBe('active');
    expect(stageAt(elapsedMs(r, DEMO_SNOOZE_CALM_MS) / 60_000).id).toBe('lock');
    expect(demoRemainingMs(r, DEMO_SNOOZE_CALM_MS)).toBeCloseTo(20_000);
  });
});
