import { createEye, EYE_H, EYE_W } from './eye';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const eye = createEye();
const stage = $('stage');
eye.canvas.style.cssText = `width:100%;aspect-ratio:${EYE_W}/${EYE_H};display:block`;
stage.append(eye.canvas);

const ui = {
  open: $<HTMLInputElement>('open'),
  veins: $<HTMLInputElement>('veins'),
  pupil: $<HTMLInputElement>('pupil'),
  auto: $<HTMLInputElement>('auto'),
};

let gazeX = 0;
let gazeY = 0;
let tx = 0;
let ty = 0;
window.addEventListener('pointermove', (e) => {
  const r = eye.canvas.getBoundingClientRect();
  tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
  ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
});

let blinkAt = performance.now() + 2500;
let blinkStart = -1;
const BLINK_MS = 260;

const frame = (t: number): void => {
  gazeX += (tx - gazeX) * 0.12;
  gazeY += (ty - gazeY) * 0.12;
  let open = Number(ui.open.value);
  if (ui.auto.checked) {
    if (blinkStart < 0 && t > blinkAt) blinkStart = t;
    if (blinkStart >= 0) {
      const k = (t - blinkStart) / BLINK_MS;
      if (k >= 1) {
        blinkStart = -1;
        blinkAt = t + 2000 + Math.random() * 4000;
      } else {
        // Closes fast, opens slower.
        open *= k < 0.4 ? 1 - k / 0.4 : (k - 0.4) / 0.6;
      }
    }
  }
  const t0 = performance.now();
  eye.draw({ openness: open, gazeX, gazeY, pupil: Number(ui.pupil.value), veins: Number(ui.veins.value) });
  $('ms').textContent = `${(performance.now() - t0).toFixed(1)} ms/frame`;
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
