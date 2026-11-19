import { createEyeSfx, EYE_SFX_FILES } from './eye-sfx';
import { createEyeState } from './eye-state';
import { createGazeJumpDetector } from './gaze-jump';
import { createPhotoEye } from './photo-eye';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const eye = await createPhotoEye({
  base: '/eye/base.png',
  closed: '/eye/eye-closed.png',
  pupil: '/eye/pupil.png',
  mask: '/eye/mask.png',
});
const state = createEyeState();
const jump = createGazeJumpDetector();
const sfx = createEyeSfx(EYE_SFX_FILES.map((f) => `/${f}`));
const stage = $('stage');
eye.canvas.style.cssText = `width:100%;aspect-ratio:${eye.canvas.width}/${eye.canvas.height};display:block`;
stage.append(eye.canvas);

const ui = {
  open: $<HTMLInputElement>('open'),
  mute: $<HTMLInputElement>('mute'),
};

// Same target math as eye-layer.ts: distance from the eye center over half the window.
let target = { x: 0, y: 0 };
window.addEventListener('pointermove', (e) => {
  const r = eye.canvas.getBoundingClientRect();
  target = {
    x: (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2),
    y: (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2),
  };
});

let last = performance.now();
const frame = (t: number): void => {
  const dt = t - last;
  last = t;
  // Blink timing and gaze smoothing come from the real eye state. A blink swaps in the closed photo.
  const f = state.step(dt, {
    mode: 'full',
    targetX: target.x,
    targetY: target.y,
    reducedMotion: false,
    veins: 0,
  });
  sfx.setMuted(ui.mute.checked);
  if (jump.push(f.gazeX, f.gazeY, t)) sfx.play();
  const t0 = performance.now();
  eye.draw({
    openness: Number(ui.open.value) * f.openness,
    gazeX: f.gazeX,
    gazeY: f.gazeY,
    pupil: 0,
    veins: 0,
    shine: f.shine,
  });
  $('ms').textContent = `${(performance.now() - t0).toFixed(1)} ms/frame`;
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
