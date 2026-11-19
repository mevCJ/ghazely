import { normalizeGain } from '../audio/schedule';

export type EyeFxPlayer = {
  /** Plays one random clip. Does nothing while a clip is still playing. Returns true if it started one. */
  play: () => boolean;
  /** Stops the current clip at once, so rest can clear the effect. */
  stop: () => void;
};

/** Bundled with the extension. Never taken from the page. */
export const EYE_SFX_FILES = [
  'sfx/eye-fx-1.mp3',
  'sfx/eye-fx-2.mp3',
  'sfx/eye-fx-3.mp3',
  'sfx/eye-fx-4.mp3',
] as const;

/** Clip level before the output gain. The director's master volume keeps it low. */
const LEVEL = 0.3;

/** Picks an index that differs from the last one, so the same clip never plays twice in a row. */
export const pickClip = (count: number, last: number, rand: () => number = Math.random): number => {
  if (count <= 1) return 0;
  const n = Math.floor(rand() * (count - 1));
  return n >= last && last >= 0 ? n + 1 : n;
};

type Clip = { buffer: AudioBuffer; scale: number };

const load = async (ctx: AudioContext, url: string): Promise<Clip | undefined> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
    let max = 0;
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      for (const v of buffer.getChannelData(c)) max = Math.max(max, Math.abs(v));
    }
    const scale = normalizeGain(max);
    return scale > 0 ? { buffer, scale } : undefined;
  } catch {
    // A missing or undecodable file just means fewer clips to choose from.
    return undefined;
  }
};

/**
 * Plays through the caller's output node, so the caller's volume, mute and rest handling apply.
 * Clips load in the background. Until one is ready, `play` stays silent.
 */
export const createEyeFxPlayer = (
  ctx: AudioContext,
  out: AudioNode,
  urls: readonly string[],
): EyeFxPlayer => {
  const clips: (Clip | undefined)[] = urls.map(() => undefined);
  urls.forEach((url, i) => {
    void load(ctx, url).then((clip) => {
      clips[i] = clip;
    });
  });
  let current: AudioBufferSourceNode | undefined;
  let last = -1;
  return {
    play: () => {
      // One at a time: a new clip never starts over a playing one.
      if (current) return false;
      const ready = clips.flatMap((c, i) => (c ? [i] : []));
      const index = ready[pickClip(ready.length, ready.indexOf(last))];
      const clip = index === undefined ? undefined : clips[index];
      if (index === undefined || !clip) return false;
      last = index;
      const src = ctx.createBufferSource();
      src.buffer = clip.buffer;
      const gain = ctx.createGain();
      gain.gain.value = LEVEL * clip.scale;
      src.connect(gain).connect(out);
      src.onended = () => {
        src.disconnect();
        gain.disconnect();
        if (current === src) current = undefined;
      };
      current = src;
      src.start();
      return true;
    },
    stop: () => {
      // `onended` runs after stop and clears `current`.
      current?.stop();
    },
  };
};
