import { describe, expect, it } from 'vitest';
import { BASE_OPENNESS, BASE_PUPIL, blinkFactor, createEyeState, type EyeInput } from '../src/content/eye/eye-state';

const input = (over: Partial<EyeInput> = {}): EyeInput => ({
  mode: 'full',
  targetX: 0,
  targetY: 0,
  reducedMotion: false,
  veins: 0.5,
  ...over,
});

/** A fixed random source keeps blink gaps exact. */
const fixed = (v: number) => () => v;

const run = (ms: number, inp: EyeInput, rand = fixed(0.5)) => {
  const s = createEyeState(rand);
  const frames = [];
  for (let t = 0; t < ms; t += 16) frames.push(s.step(16, inp));
  return frames;
};

describe('blinkFactor', () => {
  it('goes open, shut, open', () => {
    expect(blinkFactor(0)).toBe(1);
    expect(blinkFactor(0.4)).toBe(0);
    expect(blinkFactor(1)).toBe(1);
  });
  it('closes faster than it opens', () => {
    // 0.2 into the closing vs 0.2 into the opening.
    expect(1 - blinkFactor(0.2)).toBeGreaterThan(blinkFactor(0.6));
  });
});

describe('openness by stage', () => {
  it.each(['peek', 'watch', 'full'] as const)('settles at the base value for %s', (mode) => {
    const f = run(6000, input({ mode }), fixed(0.99)).at(-1)!;
    expect(f.openness).toBeCloseTo(BASE_OPENNESS[mode], 1);
  });
  it('closes the eye when the stage has no eye', () => {
    const s = createEyeState(fixed(0.5));
    for (let t = 0; t < 4000; t += 16) s.step(16, input({ mode: 'full' }));
    let f = s.step(16, input({ mode: 'none' }));
    for (let t = 0; t < 6000; t += 16) f = s.step(16, input({ mode: 'none' }));
    expect(f.openness).toBeCloseTo(0, 1);
  });
  it('eases between stages instead of jumping', () => {
    const s = createEyeState(fixed(0.99));
    for (let t = 0; t < 5000; t += 16) s.step(16, input({ mode: 'watch' }));
    const first = s.step(16, input({ mode: 'full' }));
    expect(first.openness).toBeLessThan(0.65);
  });
});

describe('pupil', () => {
  it('shrinks as the stage rises', () => {
    expect(BASE_PUPIL.full).toBeLessThan(BASE_PUPIL.watch);
    expect(BASE_PUPIL.watch).toBeLessThan(BASE_PUPIL.peek);
  });
  it('lags behind the cursor and then arrives', () => {
    const s = createEyeState(fixed(0.99));
    const first = s.step(16, input({ targetX: 1 }));
    expect(first.gazeX).toBeGreaterThan(0);
    expect(first.gazeX).toBeLessThan(0.3);
    let f = first;
    for (let t = 0; t < 2000; t += 16) f = s.step(16, input({ targetX: 1 }));
    expect(f.gazeX).toBeGreaterThan(0.99);
  });
  it('clamps a cursor far outside the eye', () => {
    const s = createEyeState(fixed(0.99));
    let f = s.step(16, input());
    for (let t = 0; t < 3000; t += 16) f = s.step(16, input({ targetX: 50, targetY: -50 }));
    expect(f.gazeX).toBeLessThanOrEqual(1);
    expect(f.gazeY).toBeGreaterThanOrEqual(-1);
  });
  it('drifts slower with reduced motion', () => {
    const fast = createEyeState(fixed(0.99)).step(100, input({ targetX: 1 }));
    const slow = createEyeState(fixed(0.99)).step(100, input({ targetX: 1, reducedMotion: true }));
    expect(slow.gazeX).toBeLessThan(fast.gazeX);
  });
});

describe('blinking', () => {
  const blinks = (frames: ReturnType<typeof run>): number => {
    let n = 0;
    // The eye starts shut, so the first opening is not a blink.
    let shut = true;
    for (const f of frames) {
      const closed = f.openness < 0.3;
      if (closed && !shut) n++;
      shut = closed;
    }
    return n;
  };
  it('blinks at gaps of a few seconds', () => {
    const n = blinks(run(60_000, input()));
    expect(n).toBeGreaterThan(5);
    expect(n).toBeLessThan(25);
  });
  it('blinks less with reduced motion', () => {
    expect(blinks(run(60_000, input({ reducedMotion: true })))).toBeLessThan(
      blinks(run(60_000, input())),
    );
  });
  it('never blinks while there is no eye', () => {
    expect(blinks(run(30_000, input({ mode: 'none' })))).toBe(0);
  });
  it('raises the shine right after a blink', () => {
    const frames = run(20_000, input());
    expect(Math.max(...frames.map((f) => f.shine))).toBeGreaterThan(0.9);
    expect(frames[0]!.shine).toBeCloseTo(0.5, 1);
  });
});

describe('veins', () => {
  it('passes the stage intensity through and clamps it', () => {
    const s = createEyeState();
    expect(s.step(16, input({ veins: 0.4 })).veins).toBe(0.4);
    expect(s.step(16, input({ veins: 4 })).veins).toBe(1);
  });
});
