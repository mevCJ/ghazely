import { describe, expect, it } from 'vitest';
import { BLINK_MIN_ON, BLINK_PERIOD_MS, blinkOnFraction, overlayBlinkOn } from '../src/shared/blink';

describe('blinkOnFraction', () => {
  it('starts short at the first effect and grows in a straight line to always on at lock', () => {
    expect(blinkOnFraction(45)).toBeCloseTo(BLINK_MIN_ON);
    expect(blinkOnFraction(82.5)).toBeCloseTo((BLINK_MIN_ON + 1) / 2);
    expect(blinkOnFraction(119.9)).toBeLessThan(1);
    expect(blinkOnFraction(120)).toBe(1);
    expect(blinkOnFraction(400)).toBe(1);
  });

  it('never gets shorter as time passes', () => {
    let last = 0;
    for (let m = 45; m <= 120; m += 1) {
      const f = blinkOnFraction(m);
      expect(f).toBeGreaterThanOrEqual(last);
      last = f;
    }
  });

  it('stays on before the first effect, where there is nothing to show', () => {
    expect(blinkOnFraction(10)).toBe(1);
  });

  it('adds 0.1 per snooze and stops at 1', () => {
    expect(blinkOnFraction(45, 2)).toBeCloseTo(BLINK_MIN_ON + 0.2);
    expect(blinkOnFraction(100, 3)).toBeLessThanOrEqual(1);
  });
});

describe('overlayBlinkOn', () => {
  it('is on for the first share of each cycle and off for the rest', () => {
    const on = BLINK_MIN_ON * BLINK_PERIOD_MS;
    expect(overlayBlinkOn(45, 0)).toBe(true);
    expect(overlayBlinkOn(45, on - 1)).toBe(true);
    expect(overlayBlinkOn(45, on + 1)).toBe(false);
    expect(overlayBlinkOn(45, BLINK_PERIOD_MS - 1)).toBe(false);
    expect(overlayBlinkOn(45, BLINK_PERIOD_MS)).toBe(true);
  });

  it('is the same for any tab: it depends only on the clock and wall time', () => {
    expect(overlayBlinkOn(80, 123_456)).toBe(overlayBlinkOn(80, 123_456));
  });

  it('is on at lock for any moment of the cycle', () => {
    for (let t = 0; t < BLINK_PERIOD_MS; t += 500) expect(overlayBlinkOn(125, t)).toBe(true);
  });

  it('is on longer later: more of the cycle is on at minute 100 than at minute 50', () => {
    let early = 0;
    let late = 0;
    for (let t = 0; t < BLINK_PERIOD_MS; t += 100) {
      if (overlayBlinkOn(50, t)) early++;
      if (overlayBlinkOn(100, t)) late++;
    }
    expect(late).toBeGreaterThan(early);
  });
});
