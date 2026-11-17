import { describe, expect, it } from 'vitest';
import { heartbeatBpm, normalizeGain, whisperGapSec, whisperPeak } from '../src/content/audio/schedule';
import { audioRate, videoFilter } from '../src/content/media-distort';

describe('heartbeatBpm', () => {
  it('is 60 at the start of tunnel and 90 at lock', () => {
    expect(heartbeatBpm(105)).toBe(60);
    expect(heartbeatBpm(120)).toBe(90);
  });
  it('rises linearly in between and holds after lock', () => {
    expect(heartbeatBpm(112.5)).toBe(75);
    expect(heartbeatBpm(300)).toBe(90);
  });
});

describe('whispers', () => {
  it('are off before dry', () => {
    expect(whisperGapSec('off')).toBeUndefined();
    expect(whisperPeak('off')).toBe(0);
  });
  it('are sparser and quieter when faint', () => {
    expect(whisperGapSec('faint')![0]).toBeGreaterThan(whisperGapSec('on')![0]);
    expect(whisperPeak('faint')).toBeLessThan(whisperPeak('on'));
  });
});

describe('bundled clip level', () => {
  it('scales a quiet clip up and a loud one down to the same peak', () => {
    expect(0.3 * normalizeGain(0.3)).toBeCloseTo(0.9);
    expect(1 * normalizeGain(1)).toBeCloseTo(0.9);
  });
  it('leaves a silent clip silent', () => {
    expect(normalizeGain(0)).toBe(0);
  });
});

describe('media distortion', () => {
  it('leaves media alone at 0', () => {
    expect(videoFilter(0)).toBe('');
    expect(audioRate(1, 0)).toBe(1);
  });
  it('slows playback by a quarter at full strength and keeps the page speed as the base', () => {
    expect(audioRate(1, 1)).toBeCloseTo(0.75);
    expect(audioRate(1.5, 1)).toBeCloseTo(1.125);
  });
  it('desaturates, shifts the hue and blurs by severity', () => {
    expect(videoFilter(1)).toContain('saturate(0.4)');
    expect(videoFilter(1)).toContain('hue-rotate(-70deg)');
    expect(videoFilter(0.5)).toContain('blur(0.40px)');
  });
});
