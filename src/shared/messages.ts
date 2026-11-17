/** Messages sent to the service worker by the popup and content scripts. */
export type WorkerMessage =
  | { type: 'snooze' }
  /** Without `minutes` the pause lasts until the user resumes. */
  | { type: 'pause'; minutes?: number }
  | { type: 'resume' }
  | { type: 'reset' }
  /** Content scripts cannot open the options page themselves. */
  | { type: 'openOptions' }
  | { type: 'setSpeed'; speed: number }
  | { type: 'startDemo' }
  | { type: 'stopDemo' };

export type WorkerReply = { ok: boolean };

/** The worker rejects speeds outside this range. 120 is demo mode. */
export const SPEED_RANGE = { min: 1, max: 240 } as const;

/** The worker rejects timed pauses outside this range, in minutes. */
export const PAUSE_RANGE = { min: 1, max: 480 } as const;
