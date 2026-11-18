import type { Intensities } from '../../shared/types';
import type { Effect } from './effect';

const VAR = '--ghazely-tint';
/** Zero specificity, so a page that styles its own image filters keeps them. */
const RULE = `:where(img, video) { filter: var(${VAR}, none); }`;

/** One step per 0.05, so the page is not restyled every frame. */
const quantize = (v: number): number => Math.round(Math.min(1, Math.max(0, v)) * 20) / 20;

/** Sepia gives a base hue, the rotation moves it to red, and the dimming keeps it dark, not bright. */
export const tintFilter = (t: number): string =>
  t === 0
    ? ''
    : `sepia(${t}) saturate(${(1 + 3 * t).toFixed(2)}) hue-rotate(${(-50 * t).toFixed(0)}deg) brightness(${(1 - 0.3 * t).toFixed(2)})`;

export type RedImages = Effect & { setEnabled: (enabled: boolean) => void };

/**
 * Turns page images and video red through one stylesheet and one CSS variable on <html>.
 * New images are covered with no scanning. It reads nothing from the page.
 */
export const redImagesEffect = (): RedImages => {
  let enabled = true;
  let applied = 0;
  let sheet: CSSStyleSheet | undefined;
  let styleEl: HTMLStyleElement | undefined;

  const install = (): void => {
    if (sheet || styleEl) return;
    try {
      // A constructed sheet is not blocked by the page's Content-Security-Policy.
      sheet = new CSSStyleSheet();
      sheet.replaceSync(RULE);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    } catch {
      sheet = undefined;
      styleEl = document.createElement('style');
      styleEl.textContent = RULE;
      document.head.append(styleEl);
    }
  };

  const clear = (): void => {
    document.documentElement.style.removeProperty(VAR);
    applied = 0;
  };

  const uninstall = (): void => {
    clear();
    if (sheet) {
      const s = sheet;
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter((x) => x !== s);
    }
    styleEl?.remove();
    sheet = undefined;
    styleEl = undefined;
  };

  return {
    id: 'red-images',
    mount: () => undefined,
    update: (i: Intensities) => {
      if (!enabled) return;
      const t = quantize(i.tint);
      if (t === applied) return;
      applied = t;
      if (t === 0) {
        uninstall();
        return;
      }
      install();
      document.documentElement.style.setProperty(VAR, tintFilter(t));
    },
    unmount: uninstall,
    setEnabled: (next) => {
      enabled = next;
      if (!next) uninstall();
    },
  };
};
