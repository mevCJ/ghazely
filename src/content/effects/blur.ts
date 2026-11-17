import type { Effect } from './effect';

/** Blur at intensity 1. Intensity 0.7 gives about 4 px, which leaves text barely readable. */
const MAX_BLUR_PX = 6;
/** Changing the blur radius forces a repaint, so only do it in coarse steps. */
const STEP_PX = 0.25;

export const blurEffect = (): Effect => {
  let layer: HTMLDivElement | undefined;
  let applied = -1;
  return {
    id: 'blur',
    mount: (root) => {
      layer = document.createElement('div');
      layer.className = 'layer blur';
      root.append(layer);
    },
    update: (i) => {
      if (!layer) return;
      const px = Math.round((i.blur * MAX_BLUR_PX) / STEP_PX) * STEP_PX;
      if (px === applied) return;
      applied = px;
      const css = px === 0 ? 'none' : `blur(${px}px)`;
      layer.style.backdropFilter = css;
      layer.style.setProperty('-webkit-backdrop-filter', css);
    },
    unmount: () => {
      layer?.remove();
      layer = undefined;
      applied = -1;
    },
  };
};
