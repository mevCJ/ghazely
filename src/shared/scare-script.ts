import type { Stage } from './types';

// Mirrors .kiro/steering/scare-script.md. Change the steering file first.

export const STAGES: readonly Stage[] = [
  {
    id: 'calm',
    startMin: 0,
    levels: { blur: 0, veins: 0, eyelids: 0, floaters: 0, tunnel: 0, tint: 0 },
    heartbeat: false,
    whisper: 'off',
    eye: 'none',
    lock: false,
  },
  {
    id: 'strain',
    startMin: 21,
    levels: { blur: 0, veins: 0, eyelids: 0, floaters: 0, tunnel: 0, tint: 0 },
    heartbeat: false,
    whisper: 'off',
    eye: 'none',
    lock: false,
  },
  {
    id: 'dry',
    startMin: 45,
    levels: { blur: 0, veins: 0.25, eyelids: 0.2, floaters: 0, tunnel: 0, tint: 0 },
    heartbeat: false,
    whisper: 'faint',
    eye: 'none',
    lock: false,
  },
  {
    id: 'haze',
    startMin: 75,
    levels: { blur: 0, veins: 0.45, eyelids: 0.35, floaters: 0.5, tunnel: 0.2, tint: 0.4 },
    heartbeat: false,
    whisper: 'on',
    eye: 'peek',
    lock: false,
  },
  {
    id: 'tunnel',
    startMin: 105,
    levels: { blur: 0.7, veins: 0.7, eyelids: 0.5, floaters: 0.8, tunnel: 0.6, tint: 0.7 },
    heartbeat: true,
    whisper: 'on',
    eye: 'watch',
    lock: false,
  },
  {
    id: 'lock',
    startMin: 120,
    levels: { blur: 0.85, veins: 1, eyelids: 0.7, floaters: 1, tunnel: 0.9, tint: 1 },
    heartbeat: true,
    whisper: 'on',
    eye: 'full',
    lock: true,
  },
];

/** Only the lock stage may blur past this. Text must stay barely readable before it. */
export const BLUR_CAP_BEFORE_LOCK = 0.7;

/** Each snooze raises every active intensity by this much. */
export const SNOOZE_INTENSITY_STEP = 0.1;

/** Each snooze shortens the next calm stretch by this share. */
export const SNOOZE_TIME_CUT = 0.25;

export const HEARTBEAT_BPM = { tunnel: 60, lock: 90 } as const;

export const PALETTE = {
  shade: '#1a1a1a',
  fog: '#8a8a8a',
  veins: '#7a1f1f',
  drip: '#b02a2a',
  eyeWhite: '#e8e2d8',
  iris: '#5a6b4a',
} as const;

/** American Optometric Association, digital eye strain page (the page was opened and read). */
export const SOURCE_URL =
  'https://www.aoa.org/healthy-eyes/eye-and-vision-conditions/computer-vision-syndrome';

export const COPY = {
  headline: 'This is how your eyes feel.',
  line: 'Not permanent. Rest fixes it.',
  tip: 'Every 20 minutes, look 20 feet away for 20 seconds.',
  sourceLabel: 'American Optometric Association: digital eye strain',
  restCountdown: 'Rest for {mm:ss}. Then I will go away.',
  snoozeButton: 'Snooze {n} min ({left} left today)',
  restReset: 'You moved. That did not count.',
  noSnoozes: 'No snoozes left today.',
  pauseLink: 'Pause Ghazely for 1 hour',
  settingsLink: 'Settings',
  dialogLabel: 'Time to rest your eyes',
} as const;

/**
 * Hosts Ghazely never touches. `*` matches any run of characters.
 * Host-only on purpose: reading the path would break the no-URL rule.
 */
export const DEFAULT_SKIP_LIST: readonly string[] = [
  'meet.google.com',
  'zoom.us',
  '*.zoom.us',
  'teams.microsoft.com',
  'teams.live.com',
  'bank*',
  '*.bank*',
  'paypal.com',
  '*.paypal.com',
  'stripe.com',
  '*.stripe.com',
];
