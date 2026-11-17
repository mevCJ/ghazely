import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, MIN_REST_SECONDS, validateSettings } from '../src/shared/settings';

describe('validateSettings', () => {
  it('returns defaults for junk input', () => {
    expect(validateSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(validateSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(validateSettings(null)).toEqual(DEFAULT_SETTINGS);
  });
  it('uses the spec defaults', () => {
    expect(DEFAULT_SETTINGS).toMatchObject({ restSeconds: 300, snoozeLimit: 3, snoozeMinutes: 10 });
  });
  it('clamps the rest length to the 15 second minimum', () => {
    expect(validateSettings({ restSeconds: 3 }).restSeconds).toBe(MIN_REST_SECONDS);
  });
  it('falls back on wrong types', () => {
    const s = validateSettings({ restSeconds: '60', snoozeLimit: NaN, sound: 'yes' });
    expect(s.restSeconds).toBe(300);
    expect(s.snoozeLimit).toBe(3);
    expect(s.sound).toBe(true);
  });
  it('allows zero snoozes', () => {
    expect(validateSettings({ snoozeLimit: 0 }).snoozeLimit).toBe(0);
  });
  it('cleans the skip list: trims, lowercases, drops bad entries and duplicates', () => {
    const s = validateSettings({ skipList: [' Example.COM ', 'example.com', 'a b', 'https://x.com/p', 5] });
    expect(s.skipList).toEqual(['example.com']);
  });
  it('keeps an empty skip list the user chose', () => {
    expect(validateSettings({ skipList: [] }).skipList).toEqual([]);
  });
});
