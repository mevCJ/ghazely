import type { EyeMode } from '../../shared/types';

/** How open the eye is for each stage. Blinks dip below this. */
export const BASE_OPENNESS: Record<EyeMode, number> = { none: 0, peek: 0.3, watch: 0.6, full: 1 };
/** Pupil radius as a share of the iris. It shrinks as the stage rises, which looks worse. */
export const BASE_PUPIL: Record<EyeMode, number> = { none: 0.4, peek: 0.38, watch: 0.3, full: 0.2 };

export type EyeInput = {
  mode: EyeMode;
  /** Where the cursor is, relative to the eye center, -1 to 1 on each axis. */
  targetX: number;
  targetY: number;
  reducedMotion: boolean;
  /** Veins intensity from the engine, 0 to 1. */
  veins: number;
};

export type EyeFrame = {
  openness: number;
  gazeX: number;
  gazeY: number;
  pupil: number;
  veins: number;
  /** Wetness 0 to 1. It spikes after a blink and settles. */
  shine: number;
};

export type EyeState = { step: (dtMs: number, input: EyeInput) => EyeFrame };

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
/** Exponential approach. Frame-rate independent. */
export const approach = (cur: number, target: number, dtMs: number, tauMs: number): number =>
  cur + (target - cur) * (1 - Math.exp(-dtMs / tauMs));

/** 1 open, 0 shut. Closes fast, opens slower. `k` runs from 0 to 1 over the blink. */
export const blinkFactor = (k: number): number => {
  const x = clamp(k, 0, 1);
  const v = x < 0.4 ? 1 - x / 0.4 : (x - 0.4) / 0.6;
  return v * v * (3 - 2 * v);
};

const MAX_STEP_MS = 100;

/**
 * Pure model of the eye: no DOM and no clock. The caller feeds frame time and the cursor,
 * and passes a random source so tests are exact.
 */
export const createEyeState = (rand: () => number = Math.random): EyeState => {
  let openness = 0;
  let gazeX = 0;
  let gazeY = 0;
  let pupil = BASE_PUPIL.none;
  let shine = 0.5;
  let untilBlink = 2500;
  let blinkMs = -1;
  let blinkLen = 260;

  const gap = (mode: EyeMode, reduced: boolean): number => {
    // A slow, rare blink at lock feels worse than a quick normal one.
    const base = mode === 'full' ? 4000 + rand() * 5000 : 2500 + rand() * 4000;
    return reduced ? base * 2.5 : base;
  };

  return {
    step: (rawDt, input) => {
      const dt = clamp(rawDt, 0, MAX_STEP_MS);
      const { mode, reducedMotion } = input;

      openness = approach(openness, BASE_OPENNESS[mode], dt, reducedMotion ? 1400 : 700);
      pupil = approach(pupil, BASE_PUPIL[mode], dt, 900);

      // The pupil follows with a small lag. Reduced motion makes it drift, never snap.
      const tau = reducedMotion ? 700 : 150;
      gazeX = approach(gazeX, clamp(input.targetX, -1, 1), dt, tau);
      gazeY = approach(gazeY, clamp(input.targetY, -1, 1), dt, tau);

      let blink = 1;
      if (mode !== 'none') {
        if (blinkMs < 0) {
          untilBlink -= dt;
          if (untilBlink <= 0) {
            blinkMs = 0;
            blinkLen = reducedMotion ? 700 : mode === 'full' ? 480 : 260;
          }
        }
        if (blinkMs >= 0) {
          blinkMs += dt;
          const k = blinkMs / blinkLen;
          blink = blinkFactor(k);
          if (k >= 1) {
            blinkMs = -1;
            untilBlink = gap(mode, reducedMotion);
            shine = 1;
          }
        }
      }
      shine = approach(shine, 0.5, dt, 700);

      return {
        openness: openness * blink,
        gazeX,
        gazeY,
        pupil,
        veins: clamp(input.veins, 0, 1),
        shine,
      };
    },
  };
};
