const Z_INDEX = '2147483647';
export const HOST_TAG = 'ghazely-overlay';
/** Used by the lock panel later. Must stay under one second so a rest clears effects fast. */
export const FADE_MS = 500;

// Constructed stylesheets are not blocked by a page's Content-Security-Policy.
const CSS = `
:host { all: initial; }
.layer { position: fixed; inset: 0; pointer-events: none; }
.ctl {
  all: initial; position: fixed; left: 12px; bottom: 12px; pointer-events: auto; cursor: pointer;
  font: 12px/1 system-ui, sans-serif; color: #8a8a8a; background: #1a1a1a; border: 1px solid #7a1f1f;
  padding: 6px 10px; border-radius: 4px; opacity: 0.85;
}
.ctl[hidden] { display: none; }
.ctl:hover, .ctl:focus-visible { opacity: 1; outline: 2px solid #b02a2a; }
`;

export type Overlay = {
  root: ShadowRoot;
  host: HTMLElement;
  /** Fades the whole overlay. Used for rest and pause. */
  setVisible: (visible: boolean) => void;
  destroy: () => void;
};

/** Fullscreen elements cover the page, so the overlay must live inside them to stay visible. */
const parentFor = (): Element => {
  const fs = document.fullscreenElement;
  // A <video> cannot hold children. In that case the overlay stays hidden.
  if (fs && !(fs instanceof HTMLVideoElement) && !(fs instanceof HTMLIFrameElement)) return fs;
  return document.documentElement;
};

export const createOverlay = (): Overlay => {
  const host = document.createElement(HOST_TAG);
  host.style.cssText = [
    'all: initial',
    'position: fixed',
    'inset: 0',
    `z-index: ${Z_INDEX}`,
    'pointer-events: none',
    'opacity: 1',
    `transition: opacity ${FADE_MS}ms linear`,
  ].join(';');
  const root = host.attachShadow({ mode: 'closed' });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(CSS);
  root.adoptedStyleSheets = [sheet];

  const attach = (): void => {
    const parent = parentFor();
    if (host.parentElement !== parent) parent.append(host);
  };
  attach();
  document.addEventListener('fullscreenchange', attach);

  return {
    root,
    host,
    setVisible: (visible) => {
      host.style.opacity = visible ? '1' : '0';
    },
    destroy: () => {
      document.removeEventListener('fullscreenchange', attach);
      host.remove();
    },
  };
};
