import { describe, expect, it } from 'vitest';
import {
  applySnooze,
  dayKey,
  elapsedMs,
  frameAt,
  intensitiesAt,
  penaltyFor,
  rolloverSnoozes,
  stageAt,
  startRest,
  withSpeed,
} from '../src/shared/engine';
import { STAGES } from '../src/shared/scare-script';
import type { ClockState } from '../src/shared/types';

const MIN = 60_000;

const clock = (over: Partial<ClockState> = {}): ClockState => ({
  baseMs: 0,
  baseTime: 1000,
  speed: 1,
  status: 'active',
  snoozes: { day: '2026-11-15', count: 0 },
  ...over,
});

describe('stageAt', () => {
  it('returns each stage at its start minute', () => {
    for (const s of STAGES) expect(stageAt(s.startMin).id).toBe(s.id);
  });

  it('stays on the earlier stage just before the next one', () => {
    expect(stageAt(19.99).id).toBe('calm');
    expect(stageAt(119.99).id).toBe('tunnel');
  });

  it('stays on lock after 120 minutes', () => {
    expect(stageAt(500).id).toBe('lock');
  });

  it('treats negative time as calm', () => {
    expect(stageAt(-5).id).toBe('calm');
  });
});

describe('intensitiesAt', () => {
  it('matches the table at stage starts', () => {
    for (const s of STAGES) expect(intensitiesAt(s.startMin)).toEqual(s.levels);
  });

  it('eases linearly between stages', () => {
    expect(intensitiesAt(10).veins).toBeCloseTo(0);
    expect(intensitiesAt(32.5).veins).toBeCloseTo(0.125);
  });

  it('never jumps across a stage boundary', () => {
    for (const s of STAGES.slice(1)) {
      const before = intensitiesAt(s.startMin - 0.001);
      const after = intensitiesAt(s.startMin);
      for (const key of Object.keys(before) as (keyof typeof before)[]) {
        // Blur at lock steps from 0.7 to 0.85 because only lock may pass 0.7.
        // The overlay smooths that step with a CSS transition.
        if (s.lock && key === 'blur') continue;
        expect(Math.abs(after[key] - before[key])).toBeLessThan(0.01);
      }
    }
  });

  it('holds the lock levels past 120 minutes', () => {
    expect(intensitiesAt(300)).toEqual(intensitiesAt(120));
  });

  it('keeps blur at 0.7 or less before lock, even with a penalty', () => {
    for (let m = 0; m < 120; m += 1) {
      expect(intensitiesAt(m, 0.3).blur).toBeLessThanOrEqual(0.7);
    }
  });

  it('starts blur at haze: none before minute 75, then rising', () => {
    expect(intensitiesAt(74.9).blur).toBe(0);
    expect(intensitiesAt(90).blur).toBeCloseTo(0.35);
    expect(intensitiesAt(105).blur).toBeCloseTo(0.7);
  });

  it('lets lock blur pass 0.7', () => {
    expect(intensitiesAt(120).blur).toBeGreaterThan(0.7);
  });

  it('adds the penalty to active effects only', () => {
    expect(intensitiesAt(0, 0.2).blur).toBe(0);
    expect(intensitiesAt(60, 0.1).veins).toBeCloseTo(intensitiesAt(60).veins + 0.1);
  });

  it('clamps at 1', () => {
    expect(intensitiesAt(120, 0.5).veins).toBe(1);
  });
});

describe('frameAt', () => {
  it('carries the stage flags', () => {
    const f = frameAt(110);
    expect(f.stage).toBe('tunnel');
    expect(f.heartbeat).toBe(true);
    expect(f.eye).toBe('watch');
    expect(f.lock).toBe(false);
    expect(frameAt(125).lock).toBe(true);
  });
});

describe('clock', () => {
  it('scales elapsed time by speed', () => {
    expect(elapsedMs(clock({ speed: 120 }), 1000 + 1000)).toBe(120_000);
  });

  it('freezes when not active', () => {
    expect(elapsedMs(clock({ baseMs: 5000, status: 'paused' }), 99_999)).toBe(5000);
  });

  it('keeps elapsed time when speed changes', () => {
    const next = withSpeed(clock({ speed: 2 }), 60, 3000);
    expect(next.baseMs).toBe(4000);
    expect(elapsedMs(next, 3000)).toBe(4000);
    expect(elapsedMs(next, 4000)).toBe(4000 + 60_000);
  });

  it('resets to zero on rest and keeps the snooze count', () => {
    const next = startRest(clock({ baseMs: 9 * MIN, snoozes: { day: 'd', count: 2 } }), 5000);
    expect(next.baseMs).toBe(0);
    expect(next.status).toBe('resting');
    expect(next.snoozes.count).toBe(2);
  });
});

describe('snooze', () => {
  const opts = { snoozeMin: 10, limit: 3, now: 5000 };

  it('sets the clock back so the lock returns after the snooze length', () => {
    const next = applySnooze(clock({ baseMs: 120 * MIN }), opts);
    expect(next.baseMs).toBe(110 * MIN);
    expect(next.snoozes.count).toBe(1);
    expect(stageAt(next.baseMs / MIN).id).toBe('tunnel');
  });

  it('cuts the wait by 25% on each later snooze', () => {
    const first = applySnooze(clock(), opts);
    const second = applySnooze(first, opts);
    const third = applySnooze(second, opts);
    expect(second.baseMs).toBe((120 - 7.5) * MIN);
    expect(third.baseMs).toBeCloseTo((120 - 5.625) * MIN);
  });

  it('does nothing when no snoozes are left', () => {
    const spent = clock({ snoozes: { day: 'd', count: 3 } });
    expect(applySnooze(spent, opts)).toBe(spent);
  });

  it('raises the penalty by 0.1 per snooze', () => {
    expect(penaltyFor(0)).toBe(0);
    expect(penaltyFor(3)).toBeCloseTo(0.3);
  });

  it('resets the count on a new local day', () => {
    const old = clock({ snoozes: { day: '2026-11-14', count: 3 } });
    expect(rolloverSnoozes(old, '2026-11-15').snoozes).toEqual({ day: '2026-11-15', count: 0 });
    expect(rolloverSnoozes(old, '2026-11-14')).toBe(old);
  });

  it('formats the local day key', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('tint', () => {
  it('stays 0 until dry, then rises to 1 at lock', () => {
    expect(intensitiesAt(45).tint).toBe(0);
    expect(intensitiesAt(60).tint).toBeGreaterThan(0);
    expect(intensitiesAt(120).tint).toBe(1);
  });
});
