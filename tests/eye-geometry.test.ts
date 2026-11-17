import { describe, expect, it } from 'vitest';
import { bez, eyeShape } from '../src/content/eye/geometry';

describe('eyeShape', () => {
  it('is exactly shut at openness 0: both lids are the same curve', () => {
    const s = eyeShape(800, 400, 600, 0);
    expect(s.upper).toEqual(s.lower);
  });
  it('opens upward more than downward', () => {
    const s = eyeShape(800, 400, 600, 1);
    const mid = 0.5;
    const up = 400 - bez(s.upper, mid).y;
    const down = bez(s.lower, mid).y - 400;
    expect(up).toBeGreaterThan(down);
  });
  it('keeps the corners fixed while opening', () => {
    const shut = eyeShape(800, 400, 600, 0);
    const open = eyeShape(800, 400, 600, 1);
    expect(shut.ic).toEqual(open.ic);
    expect(shut.oc).toEqual(open.oc);
  });
  it('opens wider as openness grows', () => {
    const gap = (o: number): number => {
      const s = eyeShape(800, 400, 600, o);
      return bez(s.lower, 0.5).y - bez(s.upper, 0.5).y;
    };
    expect(gap(0.8)).toBeGreaterThan(gap(0.4));
    expect(gap(0)).toBeCloseTo(0);
  });
});
