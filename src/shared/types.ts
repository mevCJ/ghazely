export type StageId = 'calm' | 'strain' | 'dry' | 'haze' | 'tunnel' | 'lock';

export type WhisperLevel = 'off' | 'faint' | 'on';
export type EyeMode = 'none' | 'peek' | 'watch' | 'full';

/** Effect strengths from 0 to 1. These are the values every effect module reads. */
export type Intensities = {
  blur: number;
  veins: number;
  eyelids: number;
  floaters: number;
  tunnel: number;
};

export type Stage = {
  id: StageId;
  startMin: number;
  levels: Intensities;
  heartbeat: boolean;
  whisper: WhisperLevel;
  eye: EyeMode;
  lock: boolean;
};

/** What the content script needs for one frame. */
export type Frame = {
  stage: StageId;
  intensities: Intensities;
  heartbeat: boolean;
  whisper: WhisperLevel;
  eye: EyeMode;
  lock: boolean;
};

export type ClockStatus = 'active' | 'resting' | 'paused';

export type SnoozeCount = {
  /** Local date, YYYY-MM-DD. */
  day: string;
  count: number;
};

/** Kept in chrome.storage.local. Content scripts derive elapsed time from it. */
export type ClockState = {
  /** Scaled elapsed milliseconds at baseTime. */
  baseMs: number;
  /** Date.now() when baseMs was set. */
  baseTime: number;
  speed: number;
  status: ClockStatus;
  snoozes: SnoozeCount;
};
