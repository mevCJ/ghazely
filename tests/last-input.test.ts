import { describe, expect, it } from 'vitest';
import { createInputThrottle } from '../src/shared/last-input';
import { restProgress } from '../src/shared/status';

describe('createInputThrottle', () => {
  it('lets the first input through and then one per interval', () => {
    const due = createInputThrottle(3000);
    expect(due(1000)).toBe(true);
    expect(due(2000)).toBe(false);
    expect(due(3999)).toBe(false);
    expect(due(4000)).toBe(true);
  });
});

describe('restProgress', () => {
  it('counts seconds since the last input against the rest length', () => {
    expect(restProgress(10_000, 40_000, 300)).toEqual({ seconds: 30, fraction: 0.1 });
  });

  it('is full at the rest length and stays full', () => {
    expect(restProgress(0, 300_000, 300).fraction).toBe(1);
    expect(restProgress(0, 900_000, 300).fraction).toBe(1);
  });

  it('is empty when no input has been seen, or the time is in the future', () => {
    expect(restProgress(undefined, 5000, 300)).toEqual({ seconds: 0, fraction: 0 });
    expect(restProgress(9000, 5000, 300).seconds).toBe(0);
  });
});
