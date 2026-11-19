import { isSkipped } from '../shared/host-match';
import { getSettings, subscribeSettings, type Settings } from '../shared/settings';
import { createAudioDirector } from './audio/director';
import { startController } from './controller';
import { blurEffect } from './effects/blur';
import { eyelidsEffect } from './effects/eyelids';
import { floatersEffect } from './effects/floaters';
import { redImagesEffect } from './effects/red-images';
import { tunnelEffect } from './effects/tunnel';
import { veinsEffect } from './effects/veins';
import { createEyeLayer } from './eye/eye-layer';
import { createLockPanel, type LockSettings } from './lock-panel';
import { mediaDistortEffect } from './media-distort';
import { createOverlay } from './overlay-host';
import { setPhotosensitive } from './reduced-motion';

let teardown: (() => void) | undefined;
let applyOptions: ((s: Settings) => void) | undefined;

const lockSettings = (s: Settings): LockSettings => ({
  restSeconds: s.restSeconds,
  snoozeLimit: s.snoozeLimit,
  snoozeMinutes: s.snoozeMinutes,
});

const mount = (settings: Settings): void => {
  if (teardown) return;
  const overlay = createOverlay();
  const audio = createAudioDirector();
  const media = mediaDistortEffect();
  const red = redImagesEffect();
  const eye = createEyeLayer(settings.eyeStyle, () => void audio.playEyeFx());
  const lock = createLockPanel({
    settings: lockSettings(settings),
    send: (m) => void chrome.runtime.sendMessage(m).catch(() => undefined),
  });
  const stopController = startController({
    overlay,
    effects: [blurEffect(), tunnelEffect(), veinsEffect(), floatersEffect(), eyelidsEffect(), red, media],
    audio,
    eye,
    lock,
  });
  applyOptions = (s) => {
    audio.setEnabled(s.sound);
    media.setEnabled(s.mediaDistortion);
    red.setEnabled(s.redImages);
    eye.setStyle(s.eyeStyle);
    setPhotosensitive(s.photosensitive);
    lock.setSettings(lockSettings(s));
  };
  applyOptions(settings);
  teardown = () => {
    stopController();
    overlay.destroy();
    teardown = undefined;
    applyOptions = undefined;
  };
};

// A skipped host gets nothing: no overlay and no listeners, not even for settings.
// Changes to the skip list reach a skipped page on its next load.
void getSettings().then((s) => {
  if (isSkipped(location.hostname, s.skipList)) return;
  mount(s);
  subscribeSettings((next) => {
    if (isSkipped(location.hostname, next.skipList)) teardown?.();
    else applyOptions?.(next);
  });
});
