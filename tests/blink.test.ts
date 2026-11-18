import { describe, expect, it } from 'vitest';
import {
  BLINK_MIN_ON,
  BLINK_PERIOD_MS,
  FLICKER_MS,
  blinkOnFraction,
  overlayBlinkOn,
} from '../src/shared/blink';

const samples = (min: number, from = 0, to = BLINK_PERIOD_MS, step = 10): boolean[] => {
  const out: boolean[] = [];
  for (let t = from; t < to; t += step) out.push(overlayBlinkOn(min, t));
  return out;
};
const flips = (xs: boolean[]): number => xs.filter((v, i) => i > 0 && v !== xs[i - 1]).length;

describe('blinkOnFraction', () => {
  it('starts short at haze and grows in a straight line to always on at lock', () => {
    expect(blinkOnFraction(75)).toBeCloseTo(BLINK_MIN_ON);
    expect(blinkOnFraction(97.5)).toBeCloseTo((BLINK_MIN_ON + 1) / 2);
    expect(blinkOnFraction(119.9)).toBeLessThan(1);
    expect(blinkOnFraction(120)).toBe(1);
    expect(blinkOnFraction(400)).toBe(1);
  });
  it('never gets shorter as time passes', () => {
    let last = 0;
    for (let m = 75; m <= 120; m += 1) {
      const f = blinkOnFraction(m);
      expect(f).toBeGreaterThanOrEqual(last);
      last = f;
    }
  });
  it('adds 0.1 per snooze and stops at 1', () => {
    expect(blinkOnFraction(75, 2)).toBeCloseTo(BLINK_MIN_ON + 0.2);
    expect(blinkOnFraction(100, 3)).toBeLessThanOrEqual(1);
  });
});

describe('overlayBlinkOn', () => {
  it('stays on while there is nothing to show (calm)', () => {
    expect(samples(10).every(Boolean)).toBe(true);
  });
  it.each([30, 60])('only flickers at minute %i: several flips early in the cycle, then off', (min) => {
    const early = samples(min, 0, FLICKER_MS, 5);
    expect(early.some(Boolean)).toBe(true);
    expect(flips(early)).toBeGreaterThanOrEqual(4);
    expect(samples(min, FLICKER_MS, BLINK_PERIOD_MS).some(Boolean)).toBe(false);
  });
  it('flickers, then stays on, from haze', () => {
    const start = (1 - BLINK_MIN_ON) * BLINK_PERIOD_MS;
    expect(samples(75, 0, start).some(Boolean)).toBe(false);
    const burst = samples(75, start, start + FLICKER_MS, 5);
    expect(flips(burst)).toBeGreaterThanOrEqual(4);
    expect(samples(75, start + FLICKER_MS, BLINK_PERIOD_MS).every(Boolean)).toBe(true);
  });
  it('stays on longer later: more of the cycle is on at minute 110 than at minute 80', () => {
    const count = (m: number): number => samples(m, 0, BLINK_PERIOD_MS, 50).filter(Boolean).length;
    expect(count(110)).toBeGreaterThan(count(80));
  });
  it('is on at lock for any moment of the cycle', () => {
    expect(samples(125, 0, BLINK_PERIOD_MS, 50).every(Boolean)).toBe(true);
  });
  it('is the same for any tab: it depends only on the clock and wall time', () => {
    expect(overlayBlinkOn(80, 123_456)).toBe(overlayBlinkOn(80, 123_456));
  });
  it('has no flicker under reduced motion: one slow stretch in strain, a plain stay from haze', () => {
    const reducedSamples = (min: number): boolean[] => {
      const out: boolean[] = [];
      for (let t = 0; t < BLINK_PERIOD_MS; t += 10) out.push(overlayBlinkOn(min, t, 0, true));
      return out;
    };
    expect(flips(reducedSamples(30))).toBe(1);
    expect(flips(reducedSamples(80))).toBe(1);
  });
});
