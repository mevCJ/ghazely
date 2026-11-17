import type { Frame } from '../../shared/types';
import { heartbeatBpm, normalizeGain, whisperGapSec, whisperPeak } from './schedule';

export type AudioDirector = {
  mount: (root: ShadowRoot) => void;
  update: (frame: Frame, elapsedMin: number) => void;
  /** False on rest or pause. Mutes within about half a second. */
  setActive: (active: boolean) => void;
  /** The user's sound setting. */
  setEnabled: (enabled: boolean) => void;
  unmount: () => void;
};

/** Default volume is low on purpose. */
const MASTER = 0.22;
const LOOKAHEAD = 0.25;
const RING_GAIN = 0.012;
/** Scales a synthesized whisper's peak. Noise bursts are quiet by nature. Used only if the clip cannot load. */
const WHISPER_GAIN = 0.4;
/** Bundled with the extension. Never taken from the page. */
const WHISPER_FILE = 'sfx/whisper.mp3';
const CLIP_FADE = 0.2;
const between = ([a, b]: readonly [number, number]): number => a + Math.random() * (b - a);

/**
 * All sound is generated here with the Web Audio API. Nothing is taken from the page,
 * and no tab is captured. The context starts only after the user has interacted with the page,
 * because Chrome blocks audio before that.
 */
export const createAudioDirector = (): AudioDirector => {
  let ctx: AudioContext | undefined;
  let master: GainNode | undefined;
  let ringGain: GainNode | undefined;
  let noise: AudioBuffer | undefined;
  /** The decoded clip. Stays undefined if loading fails, and the noise whisper plays instead. */
  let clip: { buffer: AudioBuffer; scale: number } | undefined;
  let button: HTMLButtonElement | undefined;
  let muted = false;
  let enabled = true;
  let active = true;
  let wanted = false;
  let nextBeat = 0;
  let nextWhisper = 0;

  const label = (): void => {
    if (!button) return;
    button.textContent = !ctx ? 'Enable sound' : muted ? 'Unmute' : 'Mute';
    button.setAttribute('aria-pressed', String(Boolean(ctx) && !muted));
  };

  const loadClip = async (context: AudioContext): Promise<void> => {
    try {
      const res = await fetch(chrome.runtime.getURL(WHISPER_FILE));
      if (!res.ok) return;
      const buffer = await context.decodeAudioData(await res.arrayBuffer());
      let max = 0;
      for (let c = 0; c < buffer.numberOfChannels; c++) {
        for (const v of buffer.getChannelData(c)) max = Math.max(max, Math.abs(v));
      }
      const scale = normalizeGain(max);
      // A closed context or a silent file keeps the noise whisper.
      if (ctx === context && scale > 0) clip = { buffer, scale };
    } catch {
      // Missing file, blocked by the page, or undecodable: the synthesized whisper stays.
    }
  };
  const start = (): void => {
    if (ctx) return;
    try {
      ctx = new AudioContext();
    } catch {
      return;
    }
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    ringGain = ctx.createGain();
    ringGain.gain.value = 0;
    const ring = ctx.createOscillator();
    ring.frequency.value = 6200;
    ring.connect(ringGain).connect(master);
    ring.start();

    const len = Math.floor(ctx.sampleRate * 1.5);
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let n = 0; n < len; n++) data[n] = Math.random() * 2 - 1;

    nextBeat = ctx.currentTime + 0.3;
    nextWhisper = ctx.currentTime + 3;
    void loadClip(ctx);
    label();
  };

  const thump = (at: number, hz: number, peak: number): void => {
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(hz * 1.4, at);
    osc.frequency.exponentialRampToValueAtTime(hz, at + 0.06);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
    osc.connect(g).connect(master);
    osc.start(at);
    osc.stop(at + 0.25);
  };

  /** Plays the bundled clip and returns how long it lasts, or 0 if it is not loaded. */
  const playClip = (at: number, peak: number): number => {
    if (!ctx || !master || !clip) return 0;
    const src = ctx.createBufferSource();
    src.buffer = clip.buffer;
    const g = ctx.createGain();
    const dur = clip.buffer.duration;
    const level = peak * clip.scale;
    // Short fades hide clicks at the cut points.
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(level, at + CLIP_FADE);
    g.gain.setValueAtTime(level, Math.max(at + CLIP_FADE, at + dur - CLIP_FADE));
    g.gain.linearRampToValueAtTime(0.0001, at + dur);
    const pan = ctx.createStereoPanner();
    pan.pan.value = (Math.random() * 2 - 1) * 0.7;
    src.connect(g).connect(pan).connect(master);
    src.start(at);
    return dur;
  };
  const whisper = (at: number, peak: number): void => {
    if (!ctx || !master || !noise) return;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1800 + Math.random() * 2600;
    band.Q.value = 1.4;
    const g = ctx.createGain();
    const dur = 0.9 + Math.random() * 0.9;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak * WHISPER_GAIN, at + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 2 - 1;
    src.connect(band).connect(g).connect(pan).connect(master);
    src.start(at, Math.random());
    src.stop(at + dur + 0.05);
  };

  const target = (gain: AudioParam, value: number, timeConstant: number): void => {
    if (ctx) gain.setTargetAtTime(value, ctx.currentTime, timeConstant);
  };

  return {
    mount: (root) => {
      button = document.createElement('button');
      button.className = 'ctl';
      button.type = 'button';
      button.hidden = true;
      button.addEventListener('click', () => {
        // The click is the user gesture that lets the context start.
        if (!ctx) start();
        else muted = !muted;
        void ctx?.resume();
        label();
      });
      label();
      root.append(button);
    },
    update: (frame, elapsedMin) => {
      wanted = frame.whisper !== 'off';
      const live = enabled && active && wanted;
      if (button) button.hidden = !live;
      if (live && !ctx && navigator.userActivation?.hasBeenActive) start();
      if (!ctx || !master || !ringGain) return;
      if (!live || muted) {
        target(master.gain, 0, 0.08);
        return;
      }
      if (ctx.state === 'suspended') void ctx.resume();
      target(master.gain, MASTER, 0.2);
      target(ringGain.gain, frame.lock ? RING_GAIN : 0, 1.5);

      const now = ctx.currentTime;
      if (frame.heartbeat) {
        const period = 60 / heartbeatBpm(elapsedMin);
        if (nextBeat < now) nextBeat = now + 0.05;
        while (nextBeat < now + LOOKAHEAD) {
          thump(nextBeat, 52, 0.9);
          thump(nextBeat + 0.27, 44, 0.6);
          nextBeat += period;
        }
      }
      const gap = whisperGapSec(frame.whisper);
      if (gap && now >= nextWhisper) {
        const peak = whisperPeak(frame.whisper);
        // The gap counts from the end of the clip, so two whispers never overlap.
        const played = playClip(now + 0.05, peak);
        if (!played) whisper(now + 0.05, peak);
        nextWhisper = now + played + between(gap);
      }
    },
    setActive: (next) => {
      active = next;
      if (!next && master) target(master.gain, 0, 0.08);
      if (!next && button) button.hidden = true;
    },
    setEnabled: (next) => {
      enabled = next;
      if (!next && master) target(master.gain, 0, 0.08);
      if (!next && button) button.hidden = true;
    },
    unmount: () => {
      button?.remove();
      button = undefined;
      void ctx?.close();
      ctx = master = ringGain = undefined;
      noise = undefined;
      clip = undefined;
    },
  };
};
