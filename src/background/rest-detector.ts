import { MIN_REST_SECONDS } from '../shared/settings';

export type IdleState = 'active' | 'idle' | 'locked';

/** The slice of the chrome APIs the detector uses, so tests can fake it. */
export type RestPlatform = {
  setDetectionInterval: (seconds: number) => void;
  onIdleChanged: (listener: (state: IdleState) => void) => void;
  queryIdle: (seconds: number) => Promise<IdleState>;
  hasAudibleTab: () => Promise<boolean>;
  startRecheck: () => void;
  stopRecheck: () => void;
};

export type RestDetectorOptions = {
  platform: RestPlatform;
  restSeconds: number;
  onRest: () => void;
  onActive: () => void;
};

export const RECHECK_ALARM = 'ghazely-rest-recheck';


export type RestDetector = {
  /** Applies a new rest length from the options page. */
  setRestSeconds: (seconds: number) => void;
  /** Call from the recheck alarm. */
  recheck: () => Promise<void>;
};

export const createRestDetector = (opts: RestDetectorOptions): RestDetector => {
  const { platform } = opts;
  let seconds = Math.max(MIN_REST_SECONDS, opts.restSeconds);
  // Remembers that idle began, so an audible tab can delay the rest and we retry later.
  let waiting = false;

  const settle = async (state: IdleState): Promise<void> => {
    if (state === 'active') {
      waiting = false;
      platform.stopRecheck();
      opts.onActive();
      return;
    }
    // A locked screen is a rest even if a tab is playing sound.
    if (state === 'idle' && (await platform.hasAudibleTab())) {
      if (!waiting) platform.startRecheck();
      waiting = true;
      return;
    }
    waiting = false;
    platform.stopRecheck();
    opts.onRest();
  };

  platform.setDetectionInterval(seconds);
  platform.onIdleChanged((state) => void settle(state));

  return {
    setRestSeconds: (next) => {
      seconds = Math.max(MIN_REST_SECONDS, next);
      platform.setDetectionInterval(seconds);
    },
    recheck: async () => {
      // No guard on `waiting`: it is lost when the worker restarts, the alarm is not.
      const state = await platform.queryIdle(seconds);
      await settle(state);
    },
  };
};
