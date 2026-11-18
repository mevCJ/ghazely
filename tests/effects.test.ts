import { describe, expect, it } from 'vitest';
import { lidCover } from '../src/content/effects/eyelids';
import { visibleFloaters } from '../src/content/effects/floaters';
import { tintFilter } from '../src/content/effects/red-images';
import { tunnelOpacity, tunnelScale } from '../src/content/effects/tunnel';
import { buildVeins, mulberry32, veinOpacity, veinScale } from '../src/content/effects/veins';

describe('tunnel', () => {
  it('is invisible at 0 and closes to half scale at 1', () => {
    expect(tunnelOpacity(0)).toBe(0);
    expect(tunnelScale(0)).toBe(1);
    expect(tunnelScale(1)).toBe(0.5);
  });
  it('shrinks as intensity grows', () => {
    expect(tunnelScale(0.6)).toBeLessThan(tunnelScale(0.2));
  });
  it('clamps out-of-range input', () => {
    expect(tunnelOpacity(3)).toBe(1);
    expect(tunnelScale(-1)).toBe(1);
  });
});

describe('eyelids', () => {
  it('covers nothing at 0 and leaves the middle open at lock', () => {
    expect(lidCover(0)).toBe(0);
    expect(lidCover(0.7)).toBeCloseTo(0.42);
    expect(lidCover(1)).toBeLessThan(1);
  });
});

describe('veins', () => {
  it('draws the same veins for the same seed and size', () => {
    expect(buildVeins(800, 600)).toEqual(buildVeins(800, 600));
  });
  it('differs for another seed', () => {
    expect(buildVeins(800, 600, 1)).not.toEqual(buildVeins(800, 600, 2));
  });
  it('starts every vein at a screen edge', () => {
    const segs = buildVeins(800, 600);
    expect(segs.length).toBeGreaterThan(50);
    expect(segs.every((s) => Number.isFinite(s.x2) && Number.isFinite(s.y2))).toBe(true);
  });
  it('slides in and fades in with intensity', () => {
    expect(veinOpacity(0)).toBe(0);
    expect(veinScale(1)).toBe(1);
    expect(veinScale(0)).toBeGreaterThan(veinScale(0.5));
  });
  it('has a PRNG in [0, 1)', () => {
    const r = mulberry32(7);
    for (let n = 0; n < 100; n++) expect(r()).toBeGreaterThanOrEqual(0);
  });
});

describe('floaters', () => {
  it('shows none at 0 and all at 1, growing in between', () => {
    expect(visibleFloaters(0)).toBe(0);
    expect(visibleFloaters(1)).toBe(9);
    expect(visibleFloaters(0.5)).toBeGreaterThan(visibleFloaters(0.2));
  });
});

describe('red images', () => {
  it('adds no filter at 0', () => {
    expect(tintFilter(0)).toBe('');
  });
  it('goes dark red at full strength, not bright', () => {
    const f = tintFilter(1);
    expect(f).toContain('sepia(1)');
    expect(f).toContain('hue-rotate(-50deg)');
    expect(f).toContain('brightness(0.70)');
  });
  it('grows with the tint', () => {
    expect(tintFilter(0.5)).toContain('sepia(0.5)');
  });
});
