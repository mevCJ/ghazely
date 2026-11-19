export type EyeSfx = {
  /** Plays one random clip. Does nothing while a clip is still playing. Returns true if it started one. */
  play: () => boolean;
  /** Stops the current clip at once, so rest can clear the effect. */
  stop: () => void;
  setMuted: (muted: boolean) => void;
};

/** Bundled with the extension. Never taken from the page. */
export const EYE_SFX_FILES = [
  'sfx/eye-fx-1.mp3',
  'sfx/eye-fx-2.mp3',
  'sfx/eye-fx-3.mp3',
  'sfx/eye-fx-4.mp3',
] as const;

/** Low on purpose, like the rest of the sound. */
const VOLUME = 0.4;

/** Picks an index that differs from the last one, so the same clip never plays twice in a row. */
export const pickClip = (count: number, last: number, rand: () => number = Math.random): number => {
  if (count <= 1) return 0;
  const n = Math.floor(rand() * (count - 1));
  return n >= last && last >= 0 ? n + 1 : n;
};

export const createEyeSfx = (urls: readonly string[]): EyeSfx => {
  const clips = urls.map((url) => {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.volume = VOLUME;
    return audio;
  });
  let current: HTMLAudioElement | undefined;
  let last = -1;
  let muted = false;
  return {
    play: () => {
      // One at a time: a new clip never starts over a playing one.
      if (muted || (current && !current.paused && !current.ended)) return false;
      last = pickClip(clips.length, last);
      const clip = clips[last];
      if (!clip) return false;
      clip.currentTime = 0;
      current = clip;
      // Chrome rejects play() before the user has interacted with the page. That is fine: stay silent.
      clip.play().catch(() => {
        if (current === clip) current = undefined;
      });
      return true;
    },
    stop: () => {
      current?.pause();
      current = undefined;
    },
    setMuted: (value) => {
      muted = value;
      if (muted) {
        current?.pause();
        current = undefined;
      }
    },
  };
};
