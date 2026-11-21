/**
 * The time of the most recent user input on any page, and nothing else about it. It lives in
 * session storage, which stays in memory and is cleared when the browser closes.
 */
const KEY = 'lastInput';

export const setLastInput = (ms: number): Promise<void> => chrome.storage.session.set({ [KEY]: ms });

export const getLastInput = async (): Promise<number | undefined> => {
  const got = await chrome.storage.session.get(KEY);
  const v: unknown = got[KEY];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
};

/** Content scripts may not use session storage until the worker opens it to them. */
export const openToContentScripts = (): Promise<void> =>
  chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

/** True on the first call and then at most once per interval, so a busy mouse is one write per interval. */
export const createInputThrottle = (intervalMs: number): ((now: number) => boolean) => {
  let last = -Infinity;
  return (now) => {
    if (now - last < intervalMs) return false;
    last = now;
    return true;
  };
};
