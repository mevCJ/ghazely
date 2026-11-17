import { PALETTE } from '../../shared/scare-script';
import type { Effect } from './effect';

/**
 * The layer is twice the viewport, so at scale 0.5 its edge sits exactly on the screen.
 * Scaling it down closes the dark ring in. Only transform and opacity change per frame.
 */
export const tunnelScale = (i: number): number => 1 - 0.5 * Math.min(1, Math.max(0, i));
export const tunnelOpacity = (i: number): number => Math.min(1, Math.max(0, i) * 2);

export const tunnelEffect = (): Effect => {
  let layer: HTMLDivElement | undefined;
  return {
    id: 'tunnel',
    mount: (root) => {
      layer = document.createElement('div');
      layer.className = 'layer';
      layer.style.cssText = [
        'inset: -50%',
        `background: radial-gradient(circle closest-side, transparent 35%, ${PALETTE.shade}d9 80%, ${PALETTE.shade} 100%)`,
        'opacity: 0',
        'will-change: transform, opacity',
      ].join(';');
      root.append(layer);
    },
    update: (i) => {
      if (!layer) return;
      layer.style.opacity = String(tunnelOpacity(i.tunnel));
      layer.style.transform = `scale(${tunnelScale(i.tunnel)})`;
    },
    unmount: () => {
      layer?.remove();
      layer = undefined;
    },
  };
};
