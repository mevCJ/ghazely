import { PALETTE } from '../../shared/scare-script';
import { reducedMotion } from '../reduced-motion';
import { mulberry32 } from './veins';
import type { Effect } from './effect';

const COUNT = 9;
const NS = 'http://www.w3.org/2000/svg';

type Floater = {
  el: SVGSVGElement;
  /** Start position as a share of the viewport. */
  x: number;
  y: number;
  /** Drift phase and speed. Floaters lag behind the eye, so they are slow. */
  phase: number;
  speed: number;
  reach: number;
};

/** How many floaters show at this intensity. */
export const visibleFloaters = (i: number): number => Math.round(Math.min(1, Math.max(0, i)) * COUNT);

const shape = (kind: number): SVGSVGElement => {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 60 40');
  svg.setAttribute('width', String(40 + kind * 14));
  svg.setAttribute('height', String(28 + kind * 9));
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('fill', 'none');
  g.setAttribute('stroke', PALETTE.shade);
  g.setAttribute('stroke-linecap', 'round');
  g.setAttribute('opacity', '0.55');
  if (kind % 3 === 0) {
    // A strand with beads.
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', 'M4 28 C 16 4, 30 38, 44 12 S 54 8, 56 14');
    p.setAttribute('stroke-width', '2.2');
    g.append(p);
    for (const [cx, cy] of [[16, 14], [32, 24], [48, 10]] as const) {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', String(cx));
      c.setAttribute('cy', String(cy));
      c.setAttribute('r', '3');
      c.setAttribute('fill', PALETTE.shade);
      g.append(c);
    }
  } else if (kind % 3 === 1) {
    // A cluster of specks.
    for (const [cx, cy, r] of [[18, 20, 6], [32, 14, 3.5], [40, 26, 4.5], [26, 28, 2.5]] as const) {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', String(cx));
      c.setAttribute('cy', String(cy));
      c.setAttribute('r', String(r));
      c.setAttribute('fill', PALETTE.shade);
      g.append(c);
    }
  } else {
    // A translucent ring.
    const e = document.createElementNS(NS, 'ellipse');
    e.setAttribute('cx', '30');
    e.setAttribute('cy', '20');
    e.setAttribute('rx', '16');
    e.setAttribute('ry', '9');
    e.setAttribute('stroke-width', '3');
    g.append(e);
  }
  svg.append(g);
  return svg;
};

export const floatersEffect = (): Effect => {
  let wrap: HTMLDivElement | undefined;
  let floaters: Floater[] = [];
  let clock = 0;
  return {
    id: 'floaters',
    mount: (root) => {
      wrap = document.createElement('div');
      wrap.className = 'layer';
      root.append(wrap);
      const rand = mulberry32(0x5eed);
      floaters = Array.from({ length: COUNT }, (_, n) => {
        const el = shape(n);
        // A soft blur makes them read as out-of-focus shapes inside the eye.
        el.style.cssText = 'position: absolute; left: 0; top: 0; opacity: 0; filter: blur(1.2px); will-change: transform, opacity';
        wrap?.append(el);
        return { el, x: 0.1 + rand() * 0.8, y: 0.1 + rand() * 0.8, phase: rand() * 6.28, speed: 0.6 + rand() * 0.8, reach: 20 + rand() * 40 };
      });
    },
    update: (i, dtMs) => {
      if (!wrap) return;
      const calm = reducedMotion();
      // Reduced motion: floaters hold still and only fade in and out.
      clock += calm ? 0 : dtMs;
      const shown = visibleFloaters(i.floaters);
      const w = window.innerWidth;
      const h = window.innerHeight;
      floaters.forEach((f, n) => {
        const on = n < shown;
        f.el.style.opacity = on ? '1' : '0';
        if (!on) return;
        const t = clock / 1000 * f.speed + f.phase;
        // Slow figure-eight drift with a downward sink, like a real floater.
        const dx = Math.sin(t * 0.5) * f.reach;
        const dy = Math.sin(t * 0.33) * f.reach * 0.6 + Math.sin(t * 0.17) * f.reach;
        f.el.style.transform = `translate(${f.x * w + dx}px, ${f.y * h + dy}px) rotate(${Math.sin(t * 0.2) * 25}deg)`;
      });
    },
    unmount: () => {
      wrap?.remove();
      wrap = undefined;
      floaters = [];
      clock = 0;
    },
  };
};
