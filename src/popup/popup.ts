import { formatMmSs } from '../content/lock-copy';
import { getLastInput } from '../shared/last-input';
import { createStageIcon } from './stage-icon';
import {
  describeClock,
  LOCK_MINUTES,
  restProgress,
  satProgress,
  snoozeCells,
  speedBadge,
} from '../shared/status';
import { sendToWorker } from '../shared/send';
import { getSettings } from '../shared/settings';
import { getClock, subscribeClock } from '../shared/storage';
import type { ClockState } from '../shared/types';

const byId = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing #${id}`);
  return node as T;
};

const stageEl = byId('stage');
const artEl = byId('art');
const minutesEl = byId('minutes');
const snoozesEl = byId('snoozes');
const snoozeBar = byId('snoozeBar');
const satBar = byId<HTMLProgressElement>('sat');
const restBar = byId<HTMLProgressElement>('rest');
const restText = byId('restText');
const badge = byId('badge');
const demoBtn = byId<HTMLButtonElement>('demo');
const pauseBtn = byId<HTMLButtonElement>('pause');
const resumeBtn = byId<HTMLButtonElement>('resume');

let clock: ClockState | undefined;
let shownStage: string | undefined;
let snoozeLimit = 3;
let restSeconds = 300;
let lastInput: number | undefined;
let audible = false;

/** A health bar: one cell per snooze allowed today, lit while it is still left. */
const renderSnoozes = (left: number): void => {
  const cells = snoozeCells(left, snoozeLimit);
  if (snoozeBar.children.length !== cells.length) {
    snoozeBar.replaceChildren(...cells.map(() => document.createElement('i')));
  }
  cells.forEach((on, i) => snoozeBar.children[i]?.classList.toggle('on', on));
  snoozeBar.hidden = cells.length === 0;
  snoozeBar.setAttribute('aria-valuemax', String(cells.length));
  snoozeBar.setAttribute('aria-valuenow', String(Math.min(left, cells.length)));
  // With no cells to show, say so in words.
  snoozesEl.hidden = cells.length > 0;
};
const renderRest = (status: ClockState['status']): void => {
  const total = formatMmSs(restSeconds);
  let label: string;
  let fraction: number;
  if (status === 'paused') {
    // Rest only counts while the clock runs.
    label = 'Paused';
    fraction = 0;
  } else if (status === 'resting') {
    label = 'Resting';
    fraction = 1;
  } else {
    const p = restProgress(lastInput, Date.now(), restSeconds);
    fraction = p.fraction;
    // A full bar does not start a rest while a tab is playing sound.
    label = fraction >= 1 && audible ? 'Media is playing' : `${formatMmSs(p.seconds)} / ${total}`;
  }
  restText.textContent = label;
  restBar.value = fraction;
  restBar.setAttribute('aria-valuetext', label);
};
const render = (): void => {
  if (!clock) return;
  const v = describeClock(clock, Date.now(), snoozeLimit);
  if (v.stage !== shownStage) {
    shownStage = v.stage;
    artEl.replaceChildren(createStageIcon(v.stage));
  }
  stageEl.textContent = v.status === 'active' ? v.stage : `${v.stage} (${v.status})`;
  minutesEl.textContent = `${v.minutes} / ${LOCK_MINUTES} min`;
  satBar.value = satProgress(v.minutes);
  satBar.setAttribute('aria-valuetext', `${v.minutes} of ${LOCK_MINUTES} minutes`);
  renderSnoozes(v.snoozesLeft);
  renderRest(v.status);
  const text = speedBadge(v.speed);
  badge.hidden = !text;
  badge.textContent = text ?? '';
  const demo = v.speed > 1;
  const demoTip = demo ? 'Stop demo' : 'Demo mode';
  demoBtn.dataset['tip'] = demoTip;
  demoBtn.setAttribute('aria-label', demoTip);
  demoBtn.setAttribute('aria-pressed', String(demo));
  pauseBtn.disabled = v.status === 'paused';
  // Only a paused clock can resume, so the button is not shown otherwise.
  resumeBtn.hidden = v.status !== 'paused';
};

const press = (id: string, send: () => Promise<boolean>): void => {
  byId(id).addEventListener('click', () => void send());
};
press('pause', () => sendToWorker({ type: 'pause', minutes: 60 }));
press('resume', () => sendToWorker({ type: 'resume' }));
press('reset', () => sendToWorker({ type: 'reset' }));
press('options', async () => {
  await chrome.runtime.openOptionsPage();
  return true;
});
demoBtn.addEventListener('click', () => {
  const demo = (clock?.speed ?? 1) > 1;
  void sendToWorker({ type: demo ? 'stopDemo' : 'startDemo' });
});

void getSettings().then((s) => {
  snoozeLimit = s.snoozeLimit;
  restSeconds = s.restSeconds;
  render();
});
void getClock().then((c) => {
  clock = c;
  render();
});
subscribeClock((c) => {
  clock = c;
  render();
});
// Both bars grow without any storage change, so read the inputs and redraw while the popup is open.
const refresh = async (): Promise<void> => {
  try {
    lastInput = await getLastInput();
  } catch {
    lastInput = undefined;
  }
  try {
    audible = (await chrome.tabs.query({ audible: true })).length > 0;
  } catch {
    audible = false;
  }
  render();
};
void refresh();
window.setInterval(() => void refresh(), 1000);
