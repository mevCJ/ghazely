import { describe, expect, it } from 'vitest';
import { LOCK_MINUTES, satProgress, snoozeCells } from '../src/shared/status';

describe('satProgress', () => {
  it('runs from empty to full at the lock stage', () => {
    expect(satProgress(0)).toBe(0);
    expect(satProgress(LOCK_MINUTES / 2)).toBe(0.5);
    expect(satProgress(LOCK_MINUTES)).toBe(1);
  });

  it('stays inside 0 to 1', () => {
    expect(satProgress(-5)).toBe(0);
    expect(satProgress(LOCK_MINUTES * 3)).toBe(1);
  });
});

describe('snoozeCells', () => {
  it('lights one cell per snooze left, out of the daily limit', () => {
    expect(snoozeCells(2, 3)).toEqual([true, true, false]);
    expect(snoozeCells(0, 3)).toEqual([false, false, false]);
    expect(snoozeCells(3, 3)).toEqual([true, true, true]);
  });

  it('has no cells when snoozing is off', () => {
    expect(snoozeCells(0, 0)).toEqual([]);
  });

  it('never lights more cells than the limit', () => {
    expect(snoozeCells(9, 2)).toEqual([true, true]);
  });
});
