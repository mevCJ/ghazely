import type { ClockState } from './types';

const KEY = 'clock';

export const getClock = async (): Promise<ClockState | undefined> => {
  const got = await chrome.storage.local.get(KEY);
  return got[KEY] as ClockState | undefined;
};

export const setClock = (state: ClockState): Promise<void> =>
  chrome.storage.local.set({ [KEY]: state });

/** Returns an unsubscribe function. Content scripts use this to follow the worker. */
export const subscribeClock = (listener: (state: ClockState) => void): (() => void) => {
  const onChanged = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ): void => {
    const change = changes[KEY];
    if (area === 'local' && change?.newValue) listener(change.newValue as ClockState);
  };
  chrome.storage.onChanged.addListener(onChanged);
  return () => chrome.storage.onChanged.removeListener(onChanged);
};
