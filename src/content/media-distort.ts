import type { Intensities } from '../shared/types';
import type { Effect } from './effects/effect';

type Original = { filter: string; rate: number; preservesPitch: boolean };

/** One step per 0.05 of severity, so the page's media is not rewritten every frame. */
const quantize = (v: number): number => Math.round(v * 20) / 20;

export const videoFilter = (s: number): string =>
  s === 0
    ? ''
    : `saturate(${1 - 0.6 * s}) hue-rotate(${-70 * s}deg) contrast(${1 + 0.3 * s}) blur(${(0.8 * s).toFixed(2)}px)`;

/** Playback slows by up to a quarter and the pitch follows, like a tired, slurred recording. */
export const audioRate = (original: number, s: number): number => original * (1 - 0.25 * s);

export type MediaDistort = Effect & { setEnabled: (enabled: boolean) => void };

/**
 * Bonus effect. It changes only CSS filters and playbackRate, and restores both on rest.
 * It does not use createMediaElementSource: that reroutes the element for good and goes
 * silent on protected or cross-origin media, which would break the user's playback.
 */
export const mediaDistortEffect = (): MediaDistort => {
  const originals = new WeakMap<HTMLMediaElement, Original>();
  let tracked = new Set<HTMLMediaElement>();
  let observer: MutationObserver | undefined;
  let enabled = false;
  let applied = 0;

  const restore = (el: HTMLMediaElement): void => {
    const o = originals.get(el);
    if (!o) return;
    try {
      if (el instanceof HTMLVideoElement) el.style.filter = o.filter;
      el.playbackRate = o.rate;
      el.preservesPitch = o.preservesPitch;
    } catch {
      // Protected or detached media can refuse. Skipping is the right outcome.
    }
    originals.delete(el);
  };

  const apply = (el: HTMLMediaElement, s: number): void => {
    try {
      if (!originals.has(el)) {
        originals.set(el, { filter: el.style.filter, rate: el.playbackRate, preservesPitch: el.preservesPitch });
      }
      const o = originals.get(el);
      if (!o) return;
      if (el instanceof HTMLVideoElement) el.style.filter = videoFilter(s);
      el.preservesPitch = false;
      el.playbackRate = audioRate(o.rate, s);
    } catch {
      restore(el);
    }
  };

  const scan = (): void => {
    document.querySelectorAll('video, audio').forEach((el) => tracked.add(el as HTMLMediaElement));
  };

  const releaseAll = (): void => {
    tracked.forEach(restore);
    applied = 0;
  };

  return {
    id: 'media',
    mount: () => undefined,
    update: (i: Intensities) => {
      if (!enabled) return;
      const s = quantize(i.veins);
      if (s === applied) return;
      applied = s;
      scan();
      tracked.forEach((el) => (s === 0 ? restore(el) : apply(el, s)));
    },
    unmount: () => {
      observer?.disconnect();
      releaseAll();
      tracked = new Set();
    },
    setEnabled: (next) => {
      enabled = next;
      // Watch the page only while the bonus is on, so the default costs nothing.
      if (next && !observer) {
        observer = new MutationObserver(scan);
        observer.observe(document.documentElement, { childList: true, subtree: true });
      }
      if (!next) {
        observer?.disconnect();
        observer = undefined;
        releaseAll();
      }
    },
  };
};
