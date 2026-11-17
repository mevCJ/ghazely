import type { WorkerMessage } from '../shared/messages';
import { COPY, SOURCE_URL } from '../shared/scare-script';
import type { ClockState } from '../shared/types';
import { DEMO_SNOOZE_DELAY_MS } from '../shared/demo';
import { SNOOZE_DELAY_MS, restLine, snoozeLabel, snoozeView } from './lock-copy';
import { createRestCountdown, type RestCountdown } from './rest-countdown';

export type LockSettings = { restSeconds: number; snoozeLimit: number; snoozeMinutes: number };

export type LockPanel = {
  mount: (root: ShadowRoot) => void;
  /** `lock` is true while the lock stage is on screen. Called every frame. */
  update: (lock: boolean, clock: ClockState) => void;
  setSettings: (s: LockSettings) => void;
  unmount: () => void;
};

export type LockPanelDeps = {
  send: (message: WorkerMessage) => void;
  settings: LockSettings;
  /** Monotonic milliseconds. Injected so the panel never depends on the page's clock APIs. */
  now?: () => number;
};

const PAUSE_MINUTES = 60;
const FADE_IN_MS = 1200;

// The panel is the only part of the overlay that takes pointer events.
const CSS = `
.panel {
  position: fixed; left: 50%; bottom: 3vh; transform: translateX(-50%);
  width: min(860px, 100vw); box-sizing: border-box; padding: 30px clamp(16px, 12vw, 130px) 14px;
  pointer-events: auto; text-align: center;
  font: 15px/1.4 system-ui, sans-serif; color: #e8e2d8;
  background: radial-gradient(ellipse 62% 72% at 50% 60%, rgba(26,26,26,0.94) 55%, rgba(26,26,26,0) 100%);
  opacity: 0; transition: opacity ${FADE_IN_MS}ms ease;
}
.panel[data-on="1"] { opacity: 1; }
.panel[hidden] { display: none; }
.panel:focus { outline: none; }
.panel h2 { font: 600 22px/1.2 system-ui, sans-serif; margin: 0 0 4px; }
.panel p { margin: 4px 0; }
.panel .tip { color: #8a8a8a; font-size: 13px; }
.panel a { color: #e8e2d8; }
.panel .rest { font-variant-numeric: tabular-nums; margin-top: 10px; }
.panel .miss { color: #b02a2a; min-height: 1.4em; }
.panel .row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 10px; }
.panel button {
  font: inherit; color: #e8e2d8; background: #1a1a1a; border: 1px solid #7a1f1f;
  border-radius: 4px; padding: 7px 14px; cursor: pointer;
}
.panel button.link { border-color: transparent; background: none; color: #8a8a8a; text-decoration: underline; padding: 7px 8px; }
.panel button:hover, .panel button:focus-visible, .panel a:focus-visible { outline: 2px solid #b02a2a; outline-offset: 1px; }
.panel button:disabled { opacity: 0.5; cursor: default; }
`;

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  className?: string,
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};

export const createLockPanel = (deps: LockPanelDeps): LockPanel => {
  const now = deps.now ?? ((): number => performance.now());
  let settings = deps.settings;
  let root: ShadowRoot | undefined;
  let panel: HTMLDivElement | undefined;
  let restEl: HTMLParagraphElement;
  let missEl: HTMLParagraphElement;
  let snoozeBtn: HTMLButtonElement;
  let noSnoozeEl: HTMLParagraphElement;
  let countdown: RestCountdown | undefined;
  let shown = false;
  let shownAt = 0;
  let returnFocusTo: Element | null = null;
  let lastScreen = { x: NaN, y: NaN };

  const send = (m: WorkerMessage): void => {
    try {
      deps.send(m);
    } catch {
      // The extension was reloaded under this page. Nothing useful to do.
    }
  };

  const setText = (node: HTMLElement, text: string): void => {
    if (node.textContent !== text) node.textContent = text;
  };

  // Only real input resets the rest. Chrome also fires a pointermove when the page
  // moves under a still cursor, so a move to the same screen position is ignored.
  const onPointerMove = (e: PointerEvent): void => {
    if (e.screenX === lastScreen.x && e.screenY === lastScreen.y) return;
    lastScreen = { x: e.screenX, y: e.screenY };
    countdown?.touch(now());
  };
  const onInput = (): void => countdown?.touch(now());

  const focusables = (): HTMLElement[] => {
    if (!root || !panel) return [];
    const inPanel = [...panel.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')];
    // The mute control stays reachable by keyboard while the lock is up.
    const mute = [...root.querySelectorAll<HTMLElement>('.ctl:not([hidden])')];
    return [...inPanel, ...mute].filter((n) => !n.closest('[hidden]'));
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    countdown?.touch(now());
    if (e.key !== 'Tab' || !root) return;
    const list = focusables();
    const first = list[0];
    const last = list[list.length - 1];
    if (!first || !last) return;
    const current = root.activeElement;
    const idx = current ? list.indexOf(current as HTMLElement) : -1;
    if (idx === -1) {
      // Focus is on the page or on the dialog itself: pull it in.
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    } else if (e.shiftKey && idx === 0) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && idx === list.length - 1) {
      e.preventDefault();
      first.focus();
    }
  };

  const listen = (on: boolean): void => {
    const opts = { capture: true } as const;
    if (on) {
      window.addEventListener('pointermove', onPointerMove, opts);
      window.addEventListener('pointerdown', onInput, opts);
      window.addEventListener('wheel', onInput, opts);
      window.addEventListener('touchstart', onInput, opts);
      window.addEventListener('keydown', onKeyDown, opts);
    } else {
      window.removeEventListener('pointermove', onPointerMove, opts);
      window.removeEventListener('pointerdown', onInput, opts);
      window.removeEventListener('wheel', onInput, opts);
      window.removeEventListener('touchstart', onInput, opts);
      window.removeEventListener('keydown', onKeyDown, opts);
    }
  };

  const show = (): void => {
    if (!panel) return;
    shown = true;
    shownAt = now();
    countdown = createRestCountdown(settings.restSeconds, shownAt);
    snoozeBtn.disabled = false;
    returnFocusTo = document.activeElement;
    panel.hidden = false;
    // Two frames: the element must be laid out before the opacity change can animate.
    requestAnimationFrame(() => requestAnimationFrame(() => panel && (panel.dataset['on'] = '1')));
    listen(true);
    panel.focus();
  };

  const hide = (): void => {
    if (!panel) return;
    shown = false;
    listen(false);
    panel.dataset['on'] = '0';
    panel.hidden = true;
    const back = returnFocusTo;
    returnFocusTo = null;
    if (back instanceof HTMLElement && back.isConnected) back.focus({ preventScroll: true });
  };

  const render = (clock: ClockState): void => {
    if (!countdown) return;
    const t = now();
    setText(restEl, restLine(countdown.remainingSec(t)));
    setText(missEl, countdown.interrupted(t) ? COPY.restReset : '');
    const left = Math.max(0, settings.snoozeLimit - clock.snoozes.count);
    const view = snoozeView(
      clock.snoozes.count,
      settings.snoozeLimit,
      t - shownAt,
      clock.speed > 1 ? DEMO_SNOOZE_DELAY_MS : SNOOZE_DELAY_MS,
    );
    snoozeBtn.hidden = view !== 'available';
    noSnoozeEl.hidden = view !== 'none';
    if (view === 'available') setText(snoozeBtn, snoozeLabel(settings.snoozeMinutes, left));
  };

  return {
    mount: (r) => {
      root = r;
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(CSS);
      r.adoptedStyleSheets = [...r.adoptedStyleSheets, sheet];

      const p = el('div', undefined, 'panel');
      p.hidden = true;
      p.tabIndex = -1;
      p.setAttribute('role', 'dialog');
      p.setAttribute('aria-modal', 'true');
      p.setAttribute('aria-label', COPY.dialogLabel);

      const headline = el('h2', COPY.headline);
      const source = el('a', COPY.sourceLabel);
      source.href = SOURCE_URL;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      restEl = el('p', '', 'rest');
      restEl.setAttribute('role', 'timer');
      missEl = el('p', '', 'miss');
      noSnoozeEl = el('p', COPY.noSnoozes);
      noSnoozeEl.hidden = true;
      snoozeBtn = el('button');
      snoozeBtn.type = 'button';
      snoozeBtn.hidden = true;
      snoozeBtn.addEventListener('click', () => {
        snoozeBtn.disabled = true;
        send({ type: 'snooze' });
      });
      const pause = el('button', COPY.pauseLink, 'link');
      pause.type = 'button';
      pause.addEventListener('click', () => send({ type: 'pause', minutes: PAUSE_MINUTES }));
      const prefs = el('button', COPY.settingsLink, 'link');
      prefs.type = 'button';
      prefs.addEventListener('click', () => send({ type: 'openOptions' }));
      const row = el('div', undefined, 'row');
      row.append(snoozeBtn, pause, prefs);

      p.append(headline, el('p', COPY.line), el('p', COPY.tip, 'tip'), source, restEl, missEl, noSnoozeEl, row);
      r.append(p);
      panel = p;
    },
    update: (lock, clock) => {
      const want = lock && clock.status === 'active';
      if (want && !shown) show();
      else if (!want && shown) hide();
      if (shown) render(clock);
    },
    setSettings: (s) => {
      settings = s;
      countdown?.setRestSeconds(s.restSeconds);
    },
    unmount: () => {
      if (shown) hide();
      panel?.remove();
      panel = undefined;
      root = undefined;
    },
  };
};
