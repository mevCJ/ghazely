import { DEFAULT_SKIP_LIST } from './scare-script';

export type Settings = {
  restSeconds: number;
  snoozeLimit: number;
  snoozeMinutes: number;
  skipList: string[];
  sound: boolean;
  mediaDistortion: boolean;
  redImages: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  restSeconds: 300,
  snoozeLimit: 3,
  snoozeMinutes: 10,
  skipList: [...DEFAULT_SKIP_LIST],
  sound: true,
  mediaDistortion: false,
  redImages: true,
};

/** Chrome's idle API refuses anything under 15 seconds. */
export const MIN_REST_SECONDS = 15;
const MAX_REST_SECONDS = 4 * 3600;
const MAX_PATTERNS = 200;
const PATTERN = /^[a-z0-9*.-]{1,100}$/;

const int = (v: unknown, min: number, max: number, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v)
    ? Math.min(max, Math.max(min, Math.round(v)))
    : fallback;

const flag = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);

export const cleanPattern = (raw: string): string | undefined => {
  const p = raw.trim().toLowerCase();
  return PATTERN.test(p) ? p : undefined;
};

const skipList = (v: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(v)) return fallback;
  const seen = new Set<string>();
  for (const item of v) {
    const p = typeof item === 'string' ? cleanPattern(item) : undefined;
    if (p) seen.add(p);
  }
  return [...seen].slice(0, MAX_PATTERNS);
};

/** Fills defaults and clamps. Anything bad falls back, so a corrupt store never breaks the page. */
export const validateSettings = (raw: unknown): Settings => {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;
  return {
    restSeconds: int(r['restSeconds'], MIN_REST_SECONDS, MAX_REST_SECONDS, d.restSeconds),
    snoozeLimit: int(r['snoozeLimit'], 0, 10, d.snoozeLimit),
    snoozeMinutes: int(r['snoozeMinutes'], 1, 60, d.snoozeMinutes),
    skipList: skipList(r['skipList'], [...d.skipList]),
    sound: flag(r['sound'], d.sound),
    mediaDistortion: flag(r['mediaDistortion'], d.mediaDistortion),
    redImages: flag(r['redImages'], d.redImages),
  };
};

const KEY = 'settings';

export const getSettings = async (): Promise<Settings> => {
  const got = await chrome.storage.sync.get(KEY);
  return validateSettings(got[KEY]);
};

export const setSettings = (s: Settings): Promise<void> =>
  chrome.storage.sync.set({ [KEY]: validateSettings(s) });

export const subscribeSettings = (listener: (s: Settings) => void): (() => void) => {
  const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string): void => {
    const change = changes[KEY];
    if (area === 'sync' && change) listener(validateSettings(change.newValue));
  };
  chrome.storage.onChanged.addListener(onChanged);
  return () => chrome.storage.onChanged.removeListener(onChanged);
};
