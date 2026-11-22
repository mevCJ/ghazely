import {
  applySnooze,
  dayKey,
  elapsedMs,
  resumeActive,
  rolloverSnoozes,
  startRest,
  withSpeed,
} from '../shared/engine';
import {
  DEMO_SNOOZE_CALM_MS,
  demoRelock,
  demoRemainingMs,
  demoSnooze,
  startDemo,
  stopDemo,
} from '../shared/demo';
import { PAUSE_RANGE, SPEED_RANGE, type WorkerMessage, type WorkerReply } from '../shared/messages';
import { DEFAULT_SETTINGS, getSettings, subscribeSettings } from '../shared/settings';
import { openToContentScripts } from '../shared/last-input';
import { getClock, setClock } from '../shared/storage';
import type { ClockState } from '../shared/types';
import { chromePlatform } from './chrome-platform';
import { RECHECK_ALARM, createRestDetector } from './rest-detector';

const MIDNIGHT_ALARM = 'ghazely-midnight';
const RESUME_ALARM = 'ghazely-resume';
const DEMO_ALARM = 'ghazely-demo-end';

const initialState = (now: number): ClockState => ({
  baseMs: 0,
  baseTime: now,
  speed: 1,
  status: 'active',
  snoozes: { day: dayKey(new Date(now)), count: 0 },
});

// Every change reads storage fresh, because the worker can be killed at any time.
// The queue stops two events from overwriting each other.
let queue: Promise<unknown> = Promise.resolve();
const update = (change: (state: ClockState, now: number) => ClockState): Promise<void> => {
  const run = async (): Promise<void> => {
    const now = Date.now();
    const stored = await getClock();
    const current = rolloverSnoozes(stored ?? initialState(now), dayKey(new Date(now)));
    const next = change(current, now);
    if (!stored || next !== stored) await setClock(next);
  };
  const result = queue.then(run, run);
  queue = result.catch(() => undefined);
  return result;
};

const scheduleMidnight = (): void => {
  const next = new Date();
  next.setHours(24, 0, 1, 0);
  void chrome.alarms.create(MIDNIGHT_ALARM, { when: next.getTime() });
};

const detector = createRestDetector({
  platform: chromePlatform,
  restSeconds: DEFAULT_SETTINGS.restSeconds,
  // A paused clock stays paused. Rest only applies to an active clock.
  onRest: () => void update((s, now) => (s.status === 'active' ? startRest(s, now) : s)),
  onActive: () => void update((s, now) => (s.status === 'resting' ? resumeActive(s, now) : s)),
});

// A snooze moves the clock back, so the end is re-armed from the stored clock each time.
const armDemoEnd = async (): Promise<void> => {
  const s = await getClock();
  if (!s) return;
  await chrome.alarms.create(DEMO_ALARM, { when: Date.now() + demoRemainingMs(s, Date.now()) + 300 });
};

const handlers: Record<WorkerMessage['type'], (m: WorkerMessage) => Promise<void>> = {
  snooze: async () => {
    const cfg = await getSettings();
    const before = await getClock();
    if (before && before.speed > 1) {
      // Demo mode: a short calm beat, then the lock comes straight back. A timer is fine
      // here: the worker is awake for the whole recording, and 5 s is under the alarm minimum.
      await update((s, now) => demoSnooze(s, now, cfg.snoozeLimit));
      setTimeout(() => {
        void update((s, now) => (s.speed > 1 && s.status === 'paused' ? demoRelock(s, now) : s)).then(armDemoEnd);
      }, DEMO_SNOOZE_CALM_MS);
      return;
    }
    await update((s, now) =>
      applySnooze(s, { snoozeMin: cfg.snoozeMinutes, limit: cfg.snoozeLimit, now }),
    );
  },
  pause: async (m) => {
    const minutes = m.type === 'pause' ? m.minutes : undefined;
    if (minutes !== undefined && !(minutes >= PAUSE_RANGE.min && minutes <= PAUSE_RANGE.max)) {
      throw new Error('bad minutes');
    }
    await update((s, now) =>
      s.status === 'paused' ? s : { ...s, baseMs: elapsedMs(s, now), baseTime: now, status: 'paused' },
    );
    // An alarm survives a worker restart, a timer would not.
    if (minutes !== undefined) await chrome.alarms.create(RESUME_ALARM, { delayInMinutes: minutes });
    else await chrome.alarms.clear(RESUME_ALARM);
  },
  resume: async () => {
    await chrome.alarms.clear(RESUME_ALARM);
    await update((s, now) => (s.status === 'paused' ? resumeActive(s, now) : s));
  },
  reset: async () => {
    await chrome.alarms.clear(RESUME_ALARM);
    await update((s, now) => ({ ...s, baseMs: 0, baseTime: now, status: 'active' }));
  },
  openOptions: () => chrome.runtime.openOptionsPage(),
  startDemo: async () => {
    await update((s, now) => startDemo(s, now));
    await armDemoEnd();
  },
  stopDemo: async () => {
    await chrome.alarms.clear(DEMO_ALARM);
    await update((s, now) => stopDemo(s, now));
  },
  setSpeed: (m) => {
    const speed = m.type === 'setSpeed' ? m.speed : NaN;
    if (!(speed >= SPEED_RANGE.min && speed <= SPEED_RANGE.max)) return Promise.reject(new Error('bad speed'));
    return update((s, now) => withSpeed(s, speed, now));
  },
};

// Pages save the time of their last input to session storage. This opens it to them, and runs
// on every worker start because the setting does not outlive the worker.
void openToContentScripts().catch(() => undefined);
// Listeners must be registered at the top level, so the detector starts with defaults
// and the stored rest length is applied as soon as it loads.
const applyRestLength = (seconds: number): void => detector.setRestSeconds(seconds);
void getSettings().then((s) => applyRestLength(s.restSeconds));
subscribeSettings((s) => applyRestLength(s.restSeconds));

chrome.runtime.onInstalled.addListener(() => {
  void update((s) => s);
  scheduleMidnight();
});

chrome.runtime.onStartup.addListener(() => {
  void update((s) => s);
  scheduleMidnight();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === RECHECK_ALARM) void detector.recheck();
  if (alarm.name === DEMO_ALARM) {
    void update((s, now) => (s.speed > 1 && demoRemainingMs(s, now) === 0 ? stopDemo(s, now) : s)).then(
      async () => {
        const s = await getClock();
        if (s && s.speed > 1) await armDemoEnd();
      },
    );
  }
  if (alarm.name === RESUME_ALARM) void update((s, now) => (s.status === 'paused' ? resumeActive(s, now) : s));
  if (alarm.name === MIDNIGHT_ALARM) {
    void update((s) => s); // update() rolls the day over.
    scheduleMidnight();
  }
});

chrome.runtime.onMessage.addListener((message: WorkerMessage, _sender, reply: (r: WorkerReply) => void) => {
  const handler = handlers[message?.type];
  if (!handler) return false;
  handler(message).then(
    () => reply({ ok: true }),
    () => reply({ ok: false }),
  );
  return true;
});
