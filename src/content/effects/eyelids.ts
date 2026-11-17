import { PALETTE } from '../../shared/scare-script';
import { reducedMotion } from '../reduced-motion';
import type { Effect } from './effect';

/** Share of each half of the screen a lid covers. At lock (0.7) that is 42%, so the middle stays open. */
const MAX_COVER = 0.6;

export const lidCover = (i: number): number => Math.min(1, Math.max(0, i)) * MAX_COVER;

/** Slow heaviness, about one swell per 6 seconds. Skipped for reduced motion. */
const droop = (ms: number): number => 0.02 * Math.sin(ms / 950);

export const eyelidsEffect = (): Effect => {
  let top: HTMLDivElement | undefined;
  let bottom: HTMLDivElement | undefined;
  let clock = 0;
  const lid = (edge: 'top' | 'bottom'): HTMLDivElement => {
    const el = document.createElement('div');
    el.className = 'layer';
    const dir = edge === 'top' ? 'to bottom' : 'to top';
    el.style.cssText = [
      `${edge === 'top' ? 'bottom' : 'top'}: 50%`,
      `background: linear-gradient(${dir}, ${PALETTE.shade} 0%, ${PALETTE.shade} 82%, transparent 100%)`,
      'will-change: transform',
      'transform: translateY(-101%)',
    ].join(';');
    return el;
  };
  return {
    id: 'eyelids',
    mount: (root) => {
      top = lid('top');
      bottom = lid('bottom');
      root.append(top, bottom);
    },
    update: (i, dtMs) => {
      if (!top || !bottom) return;
      clock += dtMs;
      const cover = lidCover(i.eyelids);
      // Zero stays fully hidden: the swell only applies once a lid shows.
      const swell = cover > 0 && !reducedMotion() ? droop(clock) : 0;
      const shown = Math.max(0, cover + swell);
      // Each lid is 50% of the viewport tall, so 100% of itself is the full half.
      top.style.transform = `translateY(${(shown - 1.01) * 100}%)`;
      bottom.style.transform = `translateY(${(1.01 - shown) * 100}%)`;
    },
    unmount: () => {
      top?.remove();
      bottom?.remove();
      top = bottom = undefined;
      clock = 0;
    },
  };
};
