export type GazeJumpOptions = {
  /** Gaze distance, in gaze units (-1 to 1 per axis), that counts as a huge movement. */
  distance: number;
  /** The distance must be covered within this many ms. */
  windowMs: number;
  /** After a jump, ignore further jumps for this long. */
  cooldownMs: number;
};

export const DEFAULT_GAZE_JUMP: GazeJumpOptions = { distance: 0.9, windowMs: 300, cooldownMs: 600 };

export type GazeJumpDetector = {
  /** Feed one frame. Returns true on the frame a huge movement is detected. */
  push: (gazeX: number, gazeY: number, nowMs: number) => boolean;
  reset: () => void;
};

type Sample = { x: number; y: number; t: number };

/**
 * Pure detector: no DOM and no clock. It compares the newest gaze with every sample inside
 * the window, so one fast sweep across the screen counts and slow drifting does not.
 */
export const createGazeJumpDetector = (opts: GazeJumpOptions = DEFAULT_GAZE_JUMP): GazeJumpDetector => {
  let samples: Sample[] = [];
  let quietUntil = -Infinity;
  return {
    push: (x, y, t) => {
      samples.push({ x, y, t });
      samples = samples.filter((s) => t - s.t <= opts.windowMs);
      if (t < quietUntil) return false;
      for (const s of samples) {
        if (Math.hypot(x - s.x, y - s.y) >= opts.distance) {
          quietUntil = t + opts.cooldownMs;
          samples = [{ x, y, t }];
          return true;
        }
      }
      return false;
    },
    reset: () => {
      samples = [];
      quietUntil = -Infinity;
    },
  };
};
