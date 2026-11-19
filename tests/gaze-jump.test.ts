import { describe, expect, it } from 'vitest';
import { createGazeJumpDetector } from '../src/content/eye/gaze-jump';
import { pickClip } from '../src/content/eye/eye-sfx';

describe('gaze jump detector', () => {
  it('fires on a fast sweep', () => {
    const d = createGazeJumpDetector();
    expect(d.push(-0.5, 0, 0)).toBe(false);
    expect(d.push(0.6, 0, 100)).toBe(true);
  });

  it('ignores slow drifting', () => {
    const d = createGazeJumpDetector();
    let fired = false;
    for (let i = 0; i <= 40; i++) fired ||= d.push(-1 + i * 0.05, 0, i * 100);
    expect(fired).toBe(false);
  });

  it('waits out the cooldown', () => {
    const d = createGazeJumpDetector();
    d.push(-1, 0, 0);
    expect(d.push(1, 0, 50)).toBe(true);
    expect(d.push(-1, 0, 100)).toBe(false);
    d.push(-1, 0, 700);
    expect(d.push(1, 0, 750)).toBe(true);
  });
});

describe('pickClip', () => {
  it('never repeats the last clip', () => {
    for (let last = 0; last < 4; last++) {
      for (const r of [0, 0.3, 0.6, 0.99]) expect(pickClip(4, last, () => r)).not.toBe(last);
    }
  });

  it('covers every other clip', () => {
    const seen = new Set([0, 0.34, 0.67, 0.99].map((r) => pickClip(4, 1, () => r)));
    expect([...seen].sort()).toEqual([0, 2, 3]);
  });
});
