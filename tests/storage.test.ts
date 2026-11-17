import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getClock, setClock, subscribeClock } from '../src/shared/storage';
import type { ClockState } from '../src/shared/types';

const state: ClockState = {
  baseMs: 5,
  baseTime: 10,
  speed: 1,
  status: 'active',
  snoozes: { day: '2026-11-15', count: 0 },
};

let data: Record<string, unknown> = {};
let listeners: Array<(c: Record<string, { newValue?: unknown }>, area: string) => void> = [];

beforeEach(() => {
  data = {};
  listeners = [];
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: async (k: string) => (k in data ? { [k]: data[k] } : {}),
        set: async (o: Record<string, unknown>) => {
          Object.assign(data, o);
        },
      },
      onChanged: {
        addListener: (l: (typeof listeners)[number]) => listeners.push(l),
        removeListener: (l: (typeof listeners)[number]) => {
          listeners = listeners.filter((x) => x !== l);
        },
      },
    },
  });
});

describe('clock storage', () => {
  it('returns undefined before the first write', async () => {
    expect(await getClock()).toBeUndefined();
  });

  it('round-trips the state', async () => {
    await setClock(state);
    expect(await getClock()).toEqual(state);
  });

  it('notifies on local changes only, and can unsubscribe', () => {
    const seen = vi.fn();
    const off = subscribeClock(seen);
    listeners.forEach((l) => l({ clock: { newValue: state } }, 'local'));
    listeners.forEach((l) => l({ clock: { newValue: state } }, 'sync'));
    expect(seen).toHaveBeenCalledOnce();
    off();
    expect(listeners).toHaveLength(0);
  });
});
