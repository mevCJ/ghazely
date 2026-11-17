import { describeClock, speedBadge } from '../shared/status';
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
const minutesEl = byId('minutes');
const snoozesEl = byId('snoozes');
const badge = byId('badge');
const demoBtn = byId<HTMLButtonElement>('demo');
const pauseBtn = byId<HTMLButtonElement>('pause');
const resumeBtn = byId<HTMLButtonElement>('resume');

let clock: ClockState | undefined;
let snoozeLimit = 3;

const render = (): void => {
  if (!clock) return;
  const v = describeClock(clock, Date.now(), snoozeLimit);
  stageEl.textContent = v.status === 'active' ? v.stage : `${v.stage} (${v.status})`;
  minutesEl.textContent = String(v.minutes);
  snoozesEl.textContent = String(v.snoozesLeft);
  const text = speedBadge(v.speed);
  badge.hidden = !text;
  badge.textContent = text ?? '';
  const demo = v.speed > 1;
  demoBtn.textContent = demo ? 'Stop demo' : 'Demo mode';
  pauseBtn.disabled = v.status === 'paused';
  resumeBtn.disabled = v.status !== 'paused';
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
// Minutes sat grows without any storage change, so redraw while the popup is open.
window.setInterval(render, 1000);
