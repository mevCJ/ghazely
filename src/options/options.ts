import { SPEED_RANGE } from '../shared/messages';
import { DEFAULT_SKIP_LIST } from '../shared/scare-script';
import { sendToWorker } from '../shared/send';
import {
  cleanPattern,
  getSettings,
  setSettings,
  validateSettings,
  type Settings,
} from '../shared/settings';
import { getClock, subscribeClock } from '../shared/storage';

const byId = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing #${id}`);
  return node as T;
};

const restSeconds = byId<HTMLInputElement>('restSeconds');
const snoozeLimit = byId<HTMLInputElement>('snoozeLimit');
const snoozeMinutes = byId<HTMLInputElement>('snoozeMinutes');
const sound = byId<HTMLInputElement>('sound');
const mediaDistortion = byId<HTMLInputElement>('mediaDistortion');
const listEl = byId<HTMLUListElement>('skipList');
const statusEl = byId<HTMLParagraphElement>('status');
const newHost = byId<HTMLInputElement>('newHost');

let current: Settings;
let clearStatus: number | undefined;

const say = (text: string): void => {
  statusEl.textContent = text;
  window.clearTimeout(clearStatus);
  clearStatus = window.setTimeout(() => (statusEl.textContent = ''), 2500);
};

const save = async (next: Settings): Promise<void> => {
  current = validateSettings(next);
  try {
    await setSettings(current);
    say('Saved.');
  } catch {
    say('Could not save. Try again.');
  }
  fill(current);
};

const fill = (s: Settings): void => {
  restSeconds.value = String(s.restSeconds);
  snoozeLimit.value = String(s.snoozeLimit);
  snoozeMinutes.value = String(s.snoozeMinutes);
  sound.checked = s.sound;
  mediaDistortion.checked = s.mediaDistortion;
  listEl.replaceChildren(
    ...s.skipList.map((host) => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = host;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'link';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove ${host}`);
      remove.addEventListener('click', () => {
        void save({ ...current, skipList: current.skipList.filter((h) => h !== host) });
      });
      li.append(name, remove);
      return li;
    }),
  );
};

const readForm = (): Settings => ({
  ...current,
  // validateSettings clamps anything out of range.
  restSeconds: Number(restSeconds.value),
  snoozeLimit: Number(snoozeLimit.value),
  snoozeMinutes: Number(snoozeMinutes.value),
  sound: sound.checked,
  mediaDistortion: mediaDistortion.checked,
});

for (const input of [restSeconds, snoozeLimit, snoozeMinutes, sound, mediaDistortion]) {
  input.addEventListener('change', () => void save(readForm()));
}

byId<HTMLFormElement>('addForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const raw = newHost.value;
  // Accept a pasted address, but keep only the host. The path is never stored.
  const host = cleanPattern(raw.replace(/^[a-z]+:\/\//i, '').split(/[/?#]/)[0] ?? '');
  if (!host) {
    say('That is not a valid host. Use letters, digits, dots, dashes and *.');
    return;
  }
  newHost.value = '';
  void save({ ...current, skipList: [...new Set([...current.skipList, host])] });
});

byId('restore').addEventListener('click', () => {
  void save({ ...current, skipList: [...DEFAULT_SKIP_LIST] });
});

// Hidden demo slider: five clicks on the version text.
const version = byId('version');
version.textContent = `Version ${chrome.runtime.getManifest().version}`;
const demoBox = byId('demoBox');
const speed = byId<HTMLInputElement>('speed');
const speedOut = byId<HTMLOutputElement>('speedOut');
speed.min = String(SPEED_RANGE.min);
speed.max = String(SPEED_RANGE.max);
let clicks = 0;
let clickTimer: number | undefined;
const reveal = (): void => {
  clicks += 1;
  window.clearTimeout(clickTimer);
  // Slow clicking does not count, so it cannot open by accident.
  clickTimer = window.setTimeout(() => (clicks = 0), 2000);
  if (clicks >= 5) demoBox.hidden = false;
};
version.addEventListener('click', reveal);
version.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    reveal();
  }
});
speed.addEventListener('input', () => {
  speedOut.textContent = speed.value;
});
speed.addEventListener('change', () => {
  void sendToWorker({ type: 'setSpeed', speed: Number(speed.value) }).then((ok) => {
    if (!ok) say('Could not change the speed.');
  });
});
const showSpeed = (v: number): void => {
  speed.value = String(v);
  speedOut.textContent = String(Math.round(v));
};
void getClock().then((c) => c && showSpeed(c.speed));
subscribeClock((c) => showSpeed(c.speed));

void getSettings().then((s) => {
  current = s;
  fill(s);
});
