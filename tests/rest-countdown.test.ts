import { describe, expect, it } from 'vitest';
import { createRestCountdown } from '../src/content/rest-countdown';
import { formatMmSs, restLine, snoozeLabel } from '../src/content/lock-copy';

describe('rest countdown', () => {
  it('counts down while nothing happens', () => {
    const c = createRestCountdown(300, 0);
    expect(c.remainingSec(0)).toBe(300);
    expect(c.remainingSec(60_000)).toBe(240);
    expect(c.remainingSec(400_000)).toBe(0);
  });

  it('resets on input', () => {
    const c = createRestCountdown(300, 0);
    c.touch(100_000);
    expect(c.remainingSec(100_000)).toBe(300);
    expect(c.remainingSec(130_000)).toBe(270);
  });

  it('says the rest did not count only after real stillness was broken', () => {
    const c = createRestCountdown(300, 0);
    c.touch(1000);
    expect(c.interrupted(1000)).toBe(false);
    c.touch(20_000);
    expect(c.interrupted(20_000)).toBe(true);
  });

  it('keeps the message while the user keeps moving, then clears it after 3 s of stillness', () => {
    const c = createRestCountdown(300, 0);
    c.touch(20_000);
    c.touch(20_100);
    c.touch(21_000);
    expect(c.interrupted(22_000)).toBe(true);
    expect(c.interrupted(24_001)).toBe(false);
    // Stays cleared.
    expect(c.interrupted(24_002)).toBe(false);
  });

  it('restart clears everything', () => {
    const c = createRestCountdown(300, 0);
    c.touch(20_000);
    c.restart(30_000);
    expect(c.interrupted(30_000)).toBe(false);
    expect(c.remainingSec(30_000)).toBe(300);
  });

  it('follows a new rest length', () => {
    const c = createRestCountdown(300, 0);
    c.setRestSeconds(60);
    expect(c.remainingSec(10_000)).toBe(50);
  });
});

describe('lock copy', () => {
  it('formats mm:ss and rounds up so 0:00 means done', () => {
    expect(formatMmSs(300)).toBe('05:00');
    expect(formatMmSs(59.2)).toBe('01:00');
    expect(formatMmSs(-3)).toBe('00:00');
  });

  it('fills the scare-script templates', () => {
    expect(restLine(65)).toBe('Rest for 01:05. Then I will go away.');
    expect(snoozeLabel(10, 2)).toBe('Snooze 10 min (2 left today)');
  });
});
